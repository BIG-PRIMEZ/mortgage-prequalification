import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import VerificationModal from './VerificationModal';
import ResultsDisplay from './ResultsDisplay';
import type { ConversationState, Message, BorrowingCapacityResult } from '../types';
import { chatService } from '../services/chatService';
import { socketService } from '../services/socketService';

/**
 * Main chat container component that manages the entire conversation flow.
 * Handles state management, message sending, verification, and results display.
 */
const ChatContainer: React.FC = () => {
  // Core conversation state tracking the phase, collected data, and messages
  const [conversationState, setConversationState] = useState<ConversationState>({
    phase: 'intent',
    intent: null,
    collectedData: {},
    verificationStatus: { sms: false, email: false },
    messages: []
  });
  // UI state flags
  const [isLoading, setIsLoading] = useState(false);  // Shows when waiting for AI response
  const [isTyping, setIsTyping] = useState(false);    // Shows typing indicator
  const [showVerification, setShowVerification] = useState(false);  // Controls verification modal
  const [results, setResults] = useState<BorrowingCapacityResult | null>(null);  // Stores calculation results
  const messagesEndRef = useRef<null | HTMLDivElement>(null);  // For auto-scrolling to latest message

  /**
   * Initialize chat on component mount.
   * Sets up welcome message and WebSocket connection for real-time messaging.
   */
  useEffect(() => {
    // Clear session on page reload
    const clearSessionAndInitialize = async () => {
      // Only reset if this is a fresh page load (not a React re-render)
      const isPageReload = !sessionStorage.getItem('chat-initialized');
      
      if (isPageReload) {
        // Mark that we've initialized to prevent multiple resets
        sessionStorage.setItem('chat-initialized', 'true');
        
        // Clear localStorage
        localStorage.removeItem('mortgage-session-id');
        
        // Reset session on backend
        try {
          await chatService.resetSession();
        } catch (error) {
          console.error('Error resetting session:', error);
        }
      }
      
      // Initialize session (will use existing or create new)
      await chatService.initializeSession();
      
      // Add initial welcome message asking about intent (purchase vs refinance)
      const welcomeMessage: Message = {
        id: 'welcome',
        content: 'Welcome to the Mortgage Pre-Qualification Assistant! Are you looking to purchase a property or refinance an existing mortgage?',
        sender: 'agent',
        timestamp: new Date()
      };
      setConversationState(prev => ({
        ...prev,
        messages: [welcomeMessage]
      }));

      // Establish WebSocket connection for real-time communication
      // Reconnect if we reset the session
      if (!socketService.isConnected() || isPageReload) {
        socketService.connect();
      }
      // Listen for incoming messages from the server
      socketService.onMessage((message: Message) => {
        setConversationState(prev => ({
          ...prev,
          messages: [...prev.messages, message]
        }));
      });
    };
    
    clearSessionAndInitialize();

    // Cleanup: disconnect WebSocket when component unmounts
    return () => {
      socketService.disconnect();
    };
  }, []);

  /**
   * Auto-scroll to bottom when new messages arrive.
   * Ensures user always sees the latest message.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationState.messages]);

  /**
   * Handles user message submission.
   * Adds message to chat, sends to backend, and processes response.
   * 
   * @param content - The user's message text
   */
  const handleSendMessage = async (content: string) => {
    // Create user message object
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    };

    // Add user message to chat immediately for responsive UI
    setConversationState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    setIsLoading(true);
    // Show typing indicator for 1.5 seconds to simulate AI thinking
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1500);
    try {
      // Send message to backend and wait for AI response
      const response = await chatService.sendMessage(content, conversationState);
      
      // Show verification modal when all data is collected
      if (response.phase === 'verification' && !showVerification) {
        setShowVerification(true);
      }
      
      // Update conversation state with new phase and collected data
      setConversationState(prev => ({
        ...prev,
        phase: response.phase,
        intent: response.intent || prev.intent,
        collectedData: { ...prev.collectedData, ...response.collectedData }
      }));
      
      // Store calculation results if provided
      if (response.results) {
        setResults(response.results);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message to chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        sender: 'agent',
        timestamp: new Date()
      };
      setConversationState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles successful SMS verification.
   * Updates state to show results phase - calculation happens on backend.
   */
  const handleVerificationComplete = async () => {
    setShowVerification(false);
    setConversationState(prev => ({
      ...prev,
      verificationStatus: { sms: true, email: false },
      phase: 'results'
    }));
    
    // Send a message to trigger results calculation
    // The backend needs a message to calculate and return results
    try {
      await handleSendMessage("Yes, I've verified my phone number");
    } catch (error) {
      console.error('Error triggering results calculation:', error);
    }
  };
  
  /**
   * Resets entire application for a new calculation.
   * Clears both frontend state and backend session to prevent data contamination.
   */
  const handleNewCalculation = async () => {
    // Clear all frontend state
    setResults(null);
    setShowVerification(false);
    setIsLoading(false);
    setIsTyping(false);
    
    // IMPORTANT: Clear backend session to prevent old data from persisting
    try {
      await chatService.resetSession();
    } catch (error) {
      console.error('Error resetting session:', error);
    }
    
    // Reset to initial conversation state with new welcome message
    setConversationState({
      phase: 'intent',
      intent: null,
      collectedData: {},
      verificationStatus: { sms: false, email: false },
      messages: [{
        id: 'welcome-' + Date.now(), // Unique ID ensures React re-renders
        content: 'Welcome back! Are you looking to purchase a property or refinance an existing mortgage?',
        sender: 'agent',
        timestamp: new Date()
      }]
    });
    
    // Scroll to top for fresh start
    window.scrollTo(0, 0);
  };

  // Render results page when calculation is complete
  if (conversationState.phase === 'results' && results) {
    return (
      <Container maxWidth="md" sx={{ minHeight: '100vh', py: 4 }}>
        <ResultsDisplay
          result={results}
          userData={conversationState.collectedData}
          onNewCalculation={handleNewCalculation}  // Allow user to start over
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      py: { xs: 0, sm: 2 },
      px: { xs: 0, sm: 3 } 
    }}>
      <Paper elevation={3} sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        borderRadius: { xs: 0, sm: 2 },
        height: { xs: '100vh', sm: 'auto' }
      }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h5" component="h1">
            Mortgage Pre-Qualification Assistant
          </Typography>
        </Box>
        
        <MessageList 
          messages={conversationState.messages} 
          isLoading={isLoading}
          isTyping={isTyping}
        />
        <div ref={messagesEndRef} />
        
        <MessageInput 
          onSendMessage={handleSendMessage}
          disabled={isLoading || showVerification}
        />
      </Paper>

      <VerificationModal
        open={showVerification}
        onClose={() => setShowVerification(false)}
        onVerified={handleVerificationComplete}
        email={conversationState.collectedData.email}
        phone={conversationState.collectedData.phone}
      />
    </Container>
  );
};

export default ChatContainer;