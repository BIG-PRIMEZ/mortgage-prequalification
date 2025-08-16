import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';
import { BorrowingCapacityResult, UserData } from '../shared/interfaces/conversation.interface';

@Injectable()
export class UserService {
  constructor(private configService: ConfigService) {
    const sendGridKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (sendGridKey) {
      sgMail.setApiKey(sendGridKey);
    }
  }

  async sendResultsEmail(
    email: string,
    results: BorrowingCapacityResult,
    userData: UserData,
  ): Promise<void> {
    const msg = {
      to: email,
      from: this.configService.get<string>('SENDGRID_FROM_EMAIL') || 'noreply@mortgage-app.com',
      subject: 'Your Mortgage Pre-Qualification Results',
      html: this.generateResultsEmailTemplate(results, userData),
    };

    try {
      await sgMail.send(msg);
    } catch (error) {
      console.error('Failed to send results email:', error);
    }
  }

  private generateResultsEmailTemplate(
    results: BorrowingCapacityResult,
    userData: UserData,
  ): string {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1976d2; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; margin-top: 20px; }
          .results-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .amount { font-size: 24px; color: #1976d2; font-weight: bold; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
          .info-item { background-color: white; padding: 15px; border-radius: 5px; }
          .label { color: #666; font-size: 14px; }
          .value { font-size: 18px; font-weight: bold; margin-top: 5px; }
          .disclaimer { font-size: 12px; color: #666; margin-top: 30px; padding: 20px; background-color: #fff3cd; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Mortgage Pre-Qualification Results</h1>
          </div>
          
          <div class="content">
            <p>Dear ${userData.fullName || 'Valued Customer'},</p>
            
            <p>Thank you for using our mortgage pre-qualification service. Based on the information you provided, here are your results:</p>
            
            <div class="results-box">
              <h2 style="text-align: center; margin-bottom: 20px;">Your Estimated Borrowing Capacity</h2>
              <div style="text-align: center;">
                <span class="amount">${formatCurrency(results.minAmount)}</span>
                <span style="font-size: 20px; margin: 0 10px;">to</span>
                <span class="amount">${formatCurrency(results.maxAmount)}</span>
              </div>
            </div>
            
            <h3>Information Summary</h3>
            <div class="info-grid">
              <div class="info-item">
                <div class="label">Annual Income</div>
                <div class="value">${formatCurrency(userData.grossAnnualIncome || 0)}</div>
              </div>
              <div class="info-item">
                <div class="label">Monthly Debts</div>
                <div class="value">${formatCurrency(userData.monthlyDebts || 0)}</div>
              </div>
              ${userData.purchasePrice ? `
                <div class="info-item">
                  <div class="label">Purchase Price</div>
                  <div class="value">${formatCurrency(userData.purchasePrice)}</div>
                </div>
              ` : ''}
              ${userData.downPayment ? `
                <div class="info-item">
                  <div class="label">Down Payment</div>
                  <div class="value">${formatCurrency(userData.downPayment)}</div>
                </div>
              ` : ''}
              ${userData.propertyValue ? `
                <div class="info-item">
                  <div class="label">Property Value</div>
                  <div class="value">${formatCurrency(userData.propertyValue)}</div>
                </div>
              ` : ''}
              ${userData.desiredLoanAmount ? `
                <div class="info-item">
                  <div class="label">Desired Loan Amount</div>
                  <div class="value">${formatCurrency(userData.desiredLoanAmount)}</div>
                </div>
              ` : ''}
            </div>
            
            <div class="disclaimer">
              <strong>Important Disclaimer:</strong> This is a preliminary estimate based on the information provided. Actual borrowing capacity may vary based on complete financial assessment, credit history, property appraisal, and specific lender requirements. This is not a loan approval or commitment. Please consult with a licensed mortgage professional for a formal application and accurate quotes.
            </div>
            
            <p style="margin-top: 30px;">If you have any questions or would like to proceed with a formal mortgage application, please contact our team.</p>
            
            <p>Best regards,<br>The Mortgage Pre-Qualification Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}