// Test SendGrid email functionality with proper error handling

const sgMail = require('@sendgrid/mail');

// Check if API key is set
if (!process.env.SENDGRID_API_KEY) {
  console.error('Error: SENDGRID_API_KEY environment variable is not set');
  console.log('\nTo fix this:');
  console.log('1. Get your SendGrid API key from https://app.sendgrid.com/settings/api_keys');
  console.log('2. Run the test with: SENDGRID_API_KEY=your-api-key node test-mail-with-check.js');
  console.log('   OR');
  console.log('3. Add SENDGRID_API_KEY to your .env file in the backend directory');
  process.exit(1);
}

// Validate API key format
if (!process.env.SENDGRID_API_KEY.startsWith('SG.')) {
  console.error('Error: Invalid SendGrid API key format. API key should start with "SG."');
  process.exit(1);
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'obayomiabraham@gmail.com',
  from: process.env.SENDGRID_FROM_EMAIL || 'obayomidaniel8@gmail.com', // Use env var if available
  subject: 'SendGrid Test Email',
  text: 'This is a test email from the mortgage pre-qualification system',
  html: '<strong>This is a test email from the mortgage pre-qualification system</strong>',
};

console.log('Sending email to:', msg.to);
console.log('From:', msg.from);

sgMail
  .send(msg)
  .then(() => {
    console.log('✅ Email sent successfully!');
  })
  .catch((error) => {
    console.error('❌ Error sending email:');
    console.error(error.message);
    
    if (error.response) {
      console.error('\nResponse details:');
      console.error('Status:', error.code);
      console.error('Body:', JSON.stringify(error.response.body, null, 2));
      
      // Common error explanations
      if (error.code === 401) {
        console.log('\n💡 This usually means your API key is invalid or expired.');
      } else if (error.code === 403) {
        console.log('\n💡 This might mean the sender email is not verified in SendGrid.');
        console.log('   Verify your sender at: https://app.sendgrid.com/settings/sender_auth');
      }
    }
  });