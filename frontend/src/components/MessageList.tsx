import React from 'react';
import { Box, Typography, CircularProgress, Fade, keyframes } from '@mui/material';
import type { Message } from '../types';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  isTyping?: boolean;
}

// Define animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
`;

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, isTyping }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isTyping]);

  return (
    <Box 
      ref={scrollRef}
      sx={{ 
        flex: 1, 
        overflow: 'auto', 
        p: 2,
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#bbb',
          borderRadius: '4px',
          '&:hover': {
            background: '#999',
          },
        },
      }}
    >
      {messages.map((message, index) => (
        <Fade in={true} timeout={300} key={message.id}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
              mb: 2,
              animation: `${fadeIn} 0.3s ease-out`,
              animationDelay: `${index * 0.05}s`,
              animationFillMode: 'both',
            }}
          >
            <Box
              sx={{
                maxWidth: { xs: '85%', sm: '70%' },
                p: 2,
                borderRadius: message.sender === 'user' 
                  ? '16px 16px 4px 16px' 
                  : '16px 16px 16px 4px',
                backgroundColor: message.sender === 'user' 
                  ? 'primary.main' 
                  : 'background.paper',
                color: message.sender === 'user' 
                  ? 'primary.contrastText' 
                  : 'text.primary',
                boxShadow: message.sender === 'user' 
                  ? '0 2px 8px rgba(46, 125, 50, 0.3)'
                  : '0 2px 8px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: message.sender === 'user' 
                    ? '0 4px 12px rgba(46, 125, 50, 0.4)'
                    : '0 4px 12px rgba(0, 0, 0, 0.15)',
                },
              }}
            >
              <Typography 
                variant="body1" 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word' 
                }}
              >
                {message.content}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  opacity: 0.7,
                  display: 'block',
                  mt: 0.5,
                  fontSize: '0.75rem'
                }}
              >
                {new Date(message.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Typography>
            </Box>
          </Box>
        </Fade>
      ))}
      
      {(isLoading || isTyping) && (
        <Fade in={true} timeout={300}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
            <Box 
              sx={{ 
                p: 2,
                backgroundColor: 'background.paper',
                borderRadius: '16px 16px 16px 4px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              {isTyping ? (
                <>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'text.secondary',
                      animation: `${pulse} 1.4s infinite ease-in-out`,
                    }}
                  />
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'text.secondary',
                      animation: `${pulse} 1.4s infinite ease-in-out`,
                      animationDelay: '0.2s',
                    }}
                  />
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'text.secondary',
                      animation: `${pulse} 1.4s infinite ease-in-out`,
                      animationDelay: '0.4s',
                    }}
                  />
                </>
              ) : (
                <CircularProgress size={20} thickness={3} />
              )}
            </Box>
          </Box>
        </Fade>
      )}
    </Box>
  );
};

export default MessageList;