import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Button,
  Grid,
  Chip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmailIcon from '@mui/icons-material/Email';
import type { BorrowingCapacityResult, UserData } from '../types';

interface ResultsDisplayProps {
  result: BorrowingCapacityResult;
  userData: UserData;
  onNewCalculation: () => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  result,
  userData,
  onNewCalculation
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Your Borrowing Capacity
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Based on the information you provided
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Estimated Range
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
          <Chip
            label={`Min: ${formatCurrency(result.minAmount)}`}
            color="primary"
            size="medium"
            sx={{ fontSize: '1.1rem', p: 2 }}
          />
          <Typography variant="h6" sx={{ alignSelf: 'center' }}>
            to
          </Typography>
          <Chip
            label={`Max: ${formatCurrency(result.maxAmount)}`}
            color="primary"
            size="medium"
            sx={{ fontSize: '1.1rem', p: 2 }}
          />
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Summary of Your Information
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={6}>
          <Typography variant="body2" color="text.secondary">
            Annual Income
          </Typography>
          <Typography variant="body1">
            {formatCurrency(userData.grossAnnualIncome || 0)}
          </Typography>
        </Grid>
        <Grid size={6}>
          <Typography variant="body2" color="text.secondary">
            Monthly Debts
          </Typography>
          <Typography variant="body1">
            {formatCurrency(userData.monthlyDebts || 0)}
          </Typography>
        </Grid>
        {userData.purchasePrice && (
          <Grid size={6}>
            <Typography variant="body2" color="text.secondary">
              Purchase Price
            </Typography>
            <Typography variant="body1">
              {formatCurrency(userData.purchasePrice)}
            </Typography>
          </Grid>
        )}
        {userData.downPayment && (
          <Grid size={6}>
            <Typography variant="body2" color="text.secondary">
              Down Payment
            </Typography>
            <Typography variant="body1">
              {formatCurrency(userData.downPayment)}
            </Typography>
          </Grid>
        )}
        {userData.propertyValue && (
          <Grid size={6}>
            <Typography variant="body2" color="text.secondary">
              Property Value
            </Typography>
            <Typography variant="body1">
              {formatCurrency(userData.propertyValue)}
            </Typography>
          </Grid>
        )}
        {userData.desiredLoanAmount && (
          <Grid size={6}>
            <Typography variant="body2" color="text.secondary">
              Desired Loan Amount
            </Typography>
            <Typography variant="body1">
              {formatCurrency(userData.desiredLoanAmount)}
            </Typography>
          </Grid>
        )}
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <EmailIcon color="primary" />
        <Typography variant="body2">
          A detailed report has been sent to {userData.email}
        </Typography>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
        * This is a preliminary estimate based on the information provided. 
        Actual borrowing capacity may vary based on complete financial assessment, 
        credit history, and lender requirements. Please consult with a licensed 
        mortgage professional for a formal application.
      </Typography>

      <Button
        variant="contained"
        fullWidth
        onClick={onNewCalculation}
        sx={{ mt: 2 }}
      >
        Start New Calculation
      </Button>
    </Paper>
  );
};

export default ResultsDisplay;