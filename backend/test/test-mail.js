// Load environment variables from .env file
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const sgMail = require('@sendgrid/mail');

// Check if API key is set
if (!process.env.SENDGRID_API_KEY) {
  console.error('Error: SENDGRID_API_KEY environment variable is not set');
  process.exit(1);
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'abrahamoba78@gmail.com', // Change to your recipient
  from: process.env.SENDGRID_FROM_EMAIL || 'obayomidaniel8@gmail.com', // Use from .env
  subject: 'Sending with SendGrid is Fun',
  text: 'and easy to do anywhere, even with Node.js',
  html: '<strong>and easy to do anywhere, even with Node.js</strong>',
};

console.log('Sending email...');
console.log('To:', msg.to);
console.log('From:', msg.from);

sgMail
  .send(msg)
  .then(() => {
    console.log('Email sent successfully!');
  })
  .catch((error) => {
    console.error('Error sending email:', error.message);
    if (error.response) {
      console.error('Response body:', error.response.body);
    }
  });