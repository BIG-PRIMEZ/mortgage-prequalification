import * as dotenv from 'dotenv';
import * as path from 'path';
import * as twilio from 'twilio';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

async function testSMS(): Promise<void> {
  // Check if Twilio credentials are set
  const config: TwilioConfig = {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || ''
  };

  if (!config.accountSid || !config.authToken || !config.phoneNumber) {
    console.error('❌ Error: Missing Twilio credentials in environment variables');
    console.error('Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER');
    console.error('\nCurrent status:');
    console.error('TWILIO_ACCOUNT_SID:', config.accountSid ? '✓ Found' : '✗ Missing');
    console.error('TWILIO_AUTH_TOKEN:', config.authToken ? '✓ Found' : '✗ Missing');
    console.error('TWILIO_PHONE_NUMBER:', config.phoneNumber ? '✓ Found' : '✗ Missing');
    process.exit(1);
  }

  const client = new twilio.Twilio(config.accountSid, config.authToken);
  const recipientPhone = '+2348108616884'; // Nigerian phone number

  console.log('📱 SMS Test Configuration:');
  console.log('From:', config.phoneNumber);
  console.log('To:', recipientPhone);
  console.log('-------------------\n');

  try {
    console.log('📤 Sending SMS...');
    
    const message = await client.messages.create({
      body: 'Your mortgage pre-qualification verification code is: 123456',
      from: config.phoneNumber,
      to: recipientPhone
    });

    console.log('✅ SMS sent successfully!');
    console.log('Message SID:', message.sid);
    console.log('Status:', message.status);
    console.log('Date Created:', message.dateCreated);
    console.log('Direction:', message.direction);
    console.log('Price:', message.price, message.priceUnit);
    
  } catch (error: any) {
    console.error('❌ Error sending SMS:', error.message);
    
    if (error.code) {
      console.error('\n📋 Error Details:');
      console.error('Error Code:', error.code);
      console.error('More Info:', error.moreInfo);
      
      // Common Twilio error explanations
      switch (error.code) {
        case 20003:
          console.log('\n💡 Solution: Authentication error. Check your Account SID and Auth Token.');
          console.log('   Make sure they are copied correctly from your Twilio console.');
          break;
        case 21211:
          console.log('\n💡 Solution: Invalid "To" phone number.');
          console.log('   - Ensure the number is in E.164 format: +[country code][number]');
          console.log('   - For Nigeria: +234XXXXXXXXXX');
          console.log('   - Remove any leading zeros from the local number');
          break;
        case 21606:
          console.log('\n💡 Solution: The "From" phone number is not a valid Twilio number.');
          console.log('   - Verify the number in your Twilio console');
          console.log('   - Make sure it\'s SMS-capable');
          break;
        case 21408:
          console.log('\n💡 Solution: Permission to send SMS to this region may be disabled.');
          console.log('   - Check your Twilio Geographic Permissions at:');
          console.log('   https://console.twilio.com/us1/develop/sms/settings/geo-permissions');
          console.log('   - Enable SMS for Nigeria (or your target country)');
          break;
        case 21610:
          console.log('\n💡 Solution: The message body is invalid.');
          console.log('   - Ensure the message is not empty');
          console.log('   - Check for any special characters');
          break;
        default:
          console.log('\n💡 Check Twilio error reference:');
          console.log(`   https://www.twilio.com/docs/api/errors/${error.code}`);
      }
    }
    
    // Log full error object for debugging
    console.error('\n🔍 Full error object:', JSON.stringify(error, null, 2));
  }
}

// Run the test
console.log('🚀 Starting Twilio SMS Test...\n');
testSMS()
  .then(() => {
    console.log('\n✨ Test completed');
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error);
  });