// Load environment variables from .env file
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// Check if Twilio credentials are set
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
  console.error('Error: Missing Twilio credentials in environment variables');
  console.error('Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER');
  process.exit(1);
}

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

const phoneNumber = '+2348108616884'; // Nigerian phone number

console.log('Sending SMS...');
console.log('From:', process.env.TWILIO_PHONE_NUMBER);
console.log('To:', phoneNumber);

client.messages
  .create({
    body: 'Your mortgage pre-qualification verification code is: 123456',
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber
  })
  .then(message => {
    console.log('SMS sent successfully!');
    console.log('Message SID:', message.sid);
    console.log('Status:', message.status);
  })
  .catch(error => {
    console.error('Error sending SMS:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
      
      // Common Twilio error explanations
      if (error.code === 20003) {
        console.log('\n💡 Authentication error. Check your Account SID and Auth Token.');
      } else if (error.code === 21211) {
        console.log('\n💡 Invalid "To" phone number. Make sure the number is in E.164 format (+[country code][number]).');
      } else if (error.code === 21606) {
        console.log('\n💡 The "From" phone number is not a valid Twilio number.');
      } else if (error.code === 21408) {
        console.log('\n💡 Permission to send SMS to this region may be disabled. Check your Twilio console.');
      }
    }
  });