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
  private systemPrompt = `You are a professional mortgage pre-qualification assistant. Your job is to collect financial information through natural conversation.

CONVERSATION FLOW:
1. Intent Classification: Ask if they want to purchase or refinance
2. Information Collection: Gather ALL required data:
   - For PURCHASE: annual income, monthly debts, purchase price, down payment amount
   - For REFINANCE: annual income, monthly debts, property value, desired loan amount
3. Lead Capture: Collect full name, email, and phone number
4. Verification: Inform them about SMS verification (email is collected but not verified)
5. Results: Calculate and present borrowing capacity

IMPORTANT RULES:
- Be conversational and professional
- Extract multiple data points from natural responses
- You MUST collect ALL required financial data before moving to contact info
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

  async processMessage(dto: SendMessageDto, session: Record<string, any>) {
    const { content } = dto;
    
    // Initialize session state if needed
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

    // Process with AI
    const aiResponse = await this.getAIResponse(content, session.conversationState);
    
    // Extract data and update state
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

    // Calculate results if SMS verified
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

  private async updateConversationState(
    currentState: ConversationState,
    userMessage: string,
    aiResponse: string,
  ): Promise<ConversationState> {
    // Extract data from user message based on current phase
    const extractedData = this.extractDataFromMessage(userMessage, currentState.phase, currentState.collectedData);
    
    // Update collected data
    const updatedData = {
      ...currentState.collectedData,
      ...extractedData,
    };

    // Determine next phase
    let nextPhase = currentState.phase;
    
    if (currentState.phase === 'intent' && extractedData.intent) {
      nextPhase = 'collection';
    } else if (currentState.phase === 'collection' && this.hasRequiredData(updatedData)) {
      nextPhase = 'verification';
    } else if (currentState.phase === 'verification' && 
               currentState.verificationStatus.sms) {
      nextPhase = 'results';
    }

    return {
      ...currentState,
      phase: nextPhase as ConversationPhase,
      intent: extractedData.intent || currentState.intent,
      collectedData: updatedData,
    };
  }

  private extractDataFromMessage(message: string, phase: string, existingData?: any): any {
    // Use the new DataExtractorService for robust extraction
    return this.dataExtractor.extractData(message, phase, existingData);
  }

  private hasRequiredData(data: any): boolean {
    const requiredFields = ['grossAnnualIncome', 'monthlyDebts', 'email', 'phone'];
    
    if (data.intent === 'purchase') {
      requiredFields.push('purchasePrice', 'downPayment');
    } else if (data.intent === 'refinance') {
      requiredFields.push('propertyValue', 'desiredLoanAmount');
    }

    // Log missing fields for debugging
    const missingFields = requiredFields.filter(field => data[field] === undefined);
    if (missingFields.length > 0) {
      console.log('📋 Missing required fields:', missingFields);
    }

    return requiredFields.every(field => data[field] !== undefined);
  }
}