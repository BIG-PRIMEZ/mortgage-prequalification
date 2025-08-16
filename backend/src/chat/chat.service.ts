import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { SendMessageDto } from '../shared/dto/send-message.dto';
import { ConversationState, Message, ConversationPhase } from '../shared/interfaces/conversation.interface';
import { CalculationService } from '../calculation/calculation.service';
import { VerificationService } from '../verification/verification.service';
import { UserService } from '../user/user.service';
import { ChatGateway } from './chat.gateway';
import { DataExtractorService } from './data-extractor.service';

@Injectable()
export class ChatService {
  private openai: OpenAI;
  
  /**
   * System prompt that defines the AI assistant's behavior and conversation flow.
   * This prompt ensures the AI follows a structured process for collecting mortgage information.
   */
  private systemPrompt = `You are a professional mortgage pre-qualification assistant. Your job is to collect financial information through natural conversation.

CONVERSATION FLOW:
1. Intent Classification: Ask if they want to purchase or refinance
2. Information Collection: Gather ALL required data:
   - For PURCHASE: annual income, monthly debts, purchase price, down payment amount
   - For REFINANCE: annual income, monthly debts, property value, desired loan amount
3. Contact Information: Collect full name, email, and phone number
4. Verification: Inform them about SMS verification (email is collected but not verified)
5. Results: Calculate and present borrowing capacity

IMPORTANT RULES:
- Be conversational and professional
- Extract multiple data points from natural responses
- You MUST collect ALL required financial data before moving to contact info
- When summarizing collected data, use the EXACT amounts mentioned to ensure accuracy
- Never skip verification before showing results
- Format currency amounts properly (e.g., $80,000)
- Acknowledge each piece of information collected
- If data is missing, specifically ask for it`;

  constructor(
    private configService: ConfigService,
    private calculationService: CalculationService,
    private verificationService: VerificationService,
    private userService: UserService,
    private chatGateway: ChatGateway,
    private dataExtractor: DataExtractorService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  /**
   * Main entry point for processing user messages.
   * Handles the entire conversation flow from intent classification to results.
   * 
   * @param dto - Contains the user's message content
   * @param session - Express session object storing conversation state
   * @returns Updated conversation state with AI response and any results
   */
  async processMessage(dto: SendMessageDto, session: Record<string, any>) {
    const { content } = dto;
    
    // Initialize session state if needed - first time user interacts
    if (!session.conversationState) {
      session.conversationState = {
        phase: 'intent',
        intent: null,
        collectedData: {},
        verificationStatus: { sms: false, email: false },
        messages: [],
      };
    }

    // Add user message to history
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };
    session.conversationState.messages.push(userMessage);

    // Process user message with OpenAI to generate appropriate response
    const aiResponse = await this.getAIResponse(content, session.conversationState);
    
    // Extract financial data from both user message and AI response, then update state
    const updatedState = await this.updateConversationState(
      session.conversationState,
      content,
      aiResponse,
    );
    
    session.conversationState = updatedState;

    // Create agent message
    const agentMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: aiResponse,
      sender: 'agent',
      timestamp: new Date(),
    };
    
    // Emit via WebSocket
    this.chatGateway.sendMessage(agentMessage);

    // Check if we need to trigger verification
    // This happens when all required data is collected and we haven't sent codes yet
    if (updatedState.phase === 'verification' && 
        updatedState.collectedData.email && 
        updatedState.collectedData.phone &&
        !updatedState.verificationStatus.sms) {
      console.log('📱 Triggering verification for:');
      console.log('Email:', updatedState.collectedData.email);
      console.log('Phone:', updatedState.collectedData.phone);
      console.log('Phone type:', typeof updatedState.collectedData.phone);
      console.log('Phone length:', updatedState.collectedData.phone.length);
      
      await this.verificationService.sendVerificationCodes(
        updatedState.collectedData.email,
        updatedState.collectedData.phone,
      );
    }

    // Calculate borrowing capacity once SMS verification is complete
    // This is the final step where we determine how much the user can borrow
    if (updatedState.phase === 'results' && 
        updatedState.verificationStatus.sms) {
      const results = await this.calculationService.calculateBorrowingCapacity(
        updatedState.collectedData,
        updatedState.intent,
      );
      
      // Send email with results
      if (updatedState.collectedData.email) {
        await this.userService.sendResultsEmail(
          updatedState.collectedData.email,
          results,
          updatedState.collectedData,
        );
      }
      
      return {
        ...updatedState,
        results,
      };
    }

    return updatedState;
  }

  /**
   * Generates AI response using OpenAI's GPT model.
   * Includes conversation history for context-aware responses.
   * 
   * @param userMessage - The user's current message
   * @param state - Current conversation state including history
   * @returns AI-generated response text
   */
  private async getAIResponse(userMessage: string, state: ConversationState): Promise<string> {
    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...state.messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: userMessage },
    ];

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0].message.content || '';
  }

  /**
   * Updates conversation state based on extracted data and determines next phase.
   * This method implements the revalidation feature - it extracts data from both
   * user input AND AI response to ensure accuracy.
   * 
   * @param currentState - Current conversation state
   * @param userMessage - User's message to extract data from
   * @param aiResponse - AI's response which may contain corrected/summarized data
   * @returns Updated conversation state with new phase and collected data
   */
  private async updateConversationState(
    currentState: ConversationState,
    userMessage: string,
    aiResponse: string,
  ): Promise<ConversationState> {
    // Extract data from user message based on current phase
    const extractedData = this.extractDataFromMessage(userMessage, currentState.phase, currentState.collectedData);
    
    // REVALIDATION: Also extract data from AI response
    // This allows the AI to correct values (e.g., "your income is $78,000" corrects user's "80k")
    const aiExtractedData = this.extractDataFromMessage(aiResponse, currentState.phase, currentState.collectedData);
    
    // Merge data with priority: AI extracted data > user extracted data > existing data
    // This ensures AI summaries can correct/update previously collected data
    const updatedData = {
      ...currentState.collectedData,
      ...extractedData,
      ...aiExtractedData,
    };
    
    // Log any differences for debugging
    this.logDataUpdates(currentState.collectedData, updatedData, aiResponse);

    // Determine next phase based on what data we have
    // Phase flow: intent -> collection -> verification -> results
    let nextPhase = currentState.phase;
    
    // Move to collection phase once we know if it's purchase or refinance
    if (currentState.phase === 'intent' && (extractedData.intent || aiExtractedData.intent)) {
      nextPhase = 'collection';
    } 
    // Move to verification once all required financial data is collected
    else if (currentState.phase === 'collection' && this.hasRequiredData(updatedData)) {
      nextPhase = 'verification';
    } 
    // Move to results after successful SMS verification
    else if (currentState.phase === 'verification' && 
               currentState.verificationStatus.sms) {
      nextPhase = 'results';
    }

    return {
      ...currentState,
      phase: nextPhase as ConversationPhase,
      intent: extractedData.intent || aiExtractedData.intent || currentState.intent,
      collectedData: updatedData,
    };
  }

  private extractDataFromMessage(message: string, phase: string, existingData?: any): any {
    // Use the new DataExtractorService for robust extraction
    return this.dataExtractor.extractData(message, phase, existingData);
  }

  /**
   * Checks if all required fields have been collected based on the user's intent.
   * Different fields are required for purchase vs refinance.
   * 
   * @param data - Collected user data
   * @returns true if all required fields are present
   */
  private hasRequiredData(data: any): boolean {
    // Base fields required for all users
    const requiredFields = ['grossAnnualIncome', 'monthlyDebts', 'fullName', 'email', 'phone'];
    
    // Additional fields for home purchase
    if (data.intent === 'purchase') {
      requiredFields.push('purchasePrice', 'downPayment');
    } 
    // Additional fields for refinancing
    else if (data.intent === 'refinance') {
      requiredFields.push('propertyValue', 'desiredLoanAmount');
    }

    // Log missing fields for debugging
    const missingFields = requiredFields.filter(field => data[field] === undefined);
    if (missingFields.length > 0) {
      console.log('📋 Missing required fields:', missingFields);
    }

    return requiredFields.every(field => data[field] !== undefined);
  }

  /**
   * Logs any data fields that were updated or corrected by the AI response.
   * This helps track when the revalidation system makes corrections.
   * 
   * @param oldData - Previous data state
   * @param newData - New data state after extraction
   * @param aiResponse - AI response that contained the updates
   */
  private logDataUpdates(oldData: any, newData: any, aiResponse: string): void {
    const updatedFields: string[] = [];
    
    // Check for updated/corrected fields
    Object.keys(newData).forEach(key => {
      if (oldData[key] !== newData[key] && newData[key] !== undefined) {
        updatedFields.push(key);
        console.log(`🔄 Field updated: ${key}`);
        console.log(`   Old value: ${oldData[key]}`);
        console.log(`   New value: ${newData[key]}`);
      }
    });
    
    if (updatedFields.length > 0) {
      console.log(`📝 AI Response contained updates for: ${updatedFields.join(', ')}`);
      console.log(`📝 AI Response excerpt: "${aiResponse.substring(0, 200)}..."`);
    }
  }
}