import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Fade,
  CircularProgress,
  IconButton
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import { chatService } from '../services/chatService';

interface VerificationModalProps {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
  email?: string;
  phone?: string;
}

const VerificationModal: React.FC<VerificationModalProps> = ({
  open,
  onClose,
  onVerified,
  email: _email,
  phone
}) => {
  const [smsCode, setSmsCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  const handleVerifySMS = async () => {
    setIsLoading(true);
    setError('');
    try {
      const isValid = await chatService.verifySMS(smsCode);
      if (isValid) {
        setVerificationSuccess(true);
        setTimeout(() => {
          onVerified();
        }, 1000);
      } else {
        setError('Invalid SMS code. Please try again.');
      }
    } catch (err) {
      setError('Error verifying SMS code. Please try again.');
    }
    setIsLoading(false);
  };

  const maskPhone = (phoneNumber?: string) => {
    if (!phoneNumber) return '';
    return phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  };

  return (
    <Dialog 
      open={open} 
      onClose={() => {}} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Typography variant="h6" component="div">
          Verify Your Phone Number
        </Typography>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label="close"
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Alert severity="info">
            We've sent a verification code to your phone number.
          </Alert>
        </Box>

        <Fade in={true} timeout={300}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PhoneIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body1">
                We've sent a 6-digit code to {maskPhone(phone)}
              </Typography>
            </Box>
            <TextField
              fullWidth
              label="SMS Verification Code"
              value={smsCode}
              onChange={(e) => setSmsCode(e.target.value)}
              placeholder="Enter 6-digit code"
              disabled={isLoading}
              inputProps={{ maxLength: 6 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: verificationSuccess ? 'success.main' : 'primary.main',
                    },
                  },
                },
              }}
            />
            {verificationSuccess && (
              <Fade in={true}>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, color: 'success.main' }}>
                  <CheckCircleIcon sx={{ mr: 0.5, fontSize: 20 }} />
                  <Typography variant="body2">Phone verified successfully!</Typography>
                </Box>
              </Fade>
            )}

            {error && (
              <Fade in={true}>
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              </Fade>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              Verification codes expire after 10 minutes. Please check your SMS messages.
            </Typography>
          </Box>
        </Fade>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={onClose} 
          disabled={isLoading}
          sx={{
            '&:hover': {
              backgroundColor: 'grey.100',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleVerifySMS}
          disabled={isLoading || smsCode.length !== 6}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{
            minWidth: 120,
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          {isLoading ? 'Verifying...' : 'Verify'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VerificationModal;