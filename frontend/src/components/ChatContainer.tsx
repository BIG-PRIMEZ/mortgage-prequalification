import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import VerificationModal from './VerificationModal';
import ResultsDisplay from './ResultsDisplay';
import type { ConversationState, Message, BorrowingCapacityResult } from '../types';
import { chatService } from '../services/chatService';
import { socketService } from '../services/socketService';

const ChatContainer: React.FC = () => {
  const [conversationState, setConversationState] = useState<ConversationState>({
    phase: 'intent',
    intent: null,
    collectedData: {},
    verificationStatus: { sms: false, email: false },
    messages: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [results, setResults] = useState<BorrowingCapacityResult | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    // Add initial welcome message
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

    socketService.connect();
    socketService.onMessage((message: Message) => {
      setConversationState(prev => ({
        ...prev,
        messages: [...prev.messages, message]
      }));
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationState.messages]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    };

    setConversationState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    setIsLoading(true);
    // Simulate typing indicator delay
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1500);
    try {
      const response = await chatService.sendMessage(content, conversationState);
      
      if (response.phase === 'verification' && !showVerification) {
        setShowVerification(true);
      }
      
      setConversationState(prev => ({
        ...prev,
        phase: response.phase,
        intent: response.intent || prev.intent,
        collectedData: { ...prev.collectedData, ...response.collectedData }
      }));
      
      // If we have results, store them
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

  const handleVerificationComplete = async () => {
    setShowVerification(false);
    setConversationState(prev => ({
      ...prev,
      verificationStatus: { sms: true, email: false },
      phase: 'results'
    }));
    
    // Trigger calculation after verification
    try {
      const response = await chatService.calculateBorrowingCapacity(conversationState.collectedData);
      setResults(response);
    } catch (error) {
      console.error('Error calculating results:', error);
    }
  };
  
  const handleNewCalculation = async () => {
    // Clear all state first
    setResults(null);
    setShowVerification(false);
    setIsLoading(false);
    setIsTyping(false);
    
    // Clear backend session
    try {
      await chatService.resetSession();
    } catch (error) {
      console.error('Error resetting session:', error);
    }
    
    // Clear frontend state with fresh conversation
    setConversationState({
      phase: 'intent',
      intent: null,
      collectedData: {},
      verificationStatus: { sms: false, email: false },
      messages: [{
        id: 'welcome-' + Date.now(), // Unique ID to force re-render
        content: 'Welcome back! Are you looking to purchase a property or refinance an existing mortgage?',
        sender: 'agent',
        timestamp: new Date()
      }]
    });
    
    // Force a re-render by scrolling to top
    window.scrollTo(0, 0);
  };

  // Show results display if we have results
  if (conversationState.phase === 'results' && results) {
    return (
      <Container maxWidth="md" sx={{ minHeight: '100vh', py: 4 }}>
        <ResultsDisplay
          result={results}
          userData={conversationState.collectedData}
          onNewCalculation={handleNewCalculation}
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