import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, InputAdornment } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HomeIcon from '@mui/icons-material/Home';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount for better UX
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  // Handle keyboard events for better mobile experience
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit} 
      sx={{ 
        p: 2, 
        borderTop: 1, 
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        position: 'relative',
        // Ensure input is visible on mobile keyboards
        paddingBottom: {
          xs: 'env(safe-area-inset-bottom, 16px)',
          sm: 2
        }
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <TextField
          ref={inputRef}
          fullWidth
          variant="outlined"
          placeholder={isFocused ? "Type your response..." : "Type your message..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          size="small"
          multiline
          maxRows={4}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start" sx={{ display: { xs: 'none', sm: 'flex' } }}>
                {message.includes('$') || message.match(/\d{4,}/) ? (
                  <AttachMoneyIcon color="action" fontSize="small" />
                ) : message.toLowerCase().includes('property') || message.toLowerCase().includes('home') ? (
                  <HomeIcon color="action" fontSize="small" />
                ) : null}
              </InputAdornment>
            ),
            sx: {
              borderRadius: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              },
              '&.Mui-focused': {
                boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)',
              },
            }
          }}
        />
        <IconButton 
          type="submit" 
          color="primary" 
          disabled={disabled || !message.trim()}
          sx={{
            backgroundColor: disabled || !message.trim() ? 'action.disabledBackground' : 'primary.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'primary.dark',
              transform: 'scale(1.05)',
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
            transition: 'all 0.2s ease',
            boxShadow: disabled || !message.trim() ? 'none' : '0 2px 8px rgba(46, 125, 50, 0.3)',
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default MessageInput;