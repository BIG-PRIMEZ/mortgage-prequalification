import * as dotenv from 'dotenv';
import * as path from 'path';
import * as twilio from 'twilio';
import sgMail from '@sendgrid/mail';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

interface TestConfig {
  twilio: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
  };
  sendgrid: {
    apiKey: string;
    fromEmail: string;
  };
  recipient: {
    phone: string;
    email: string;
  };
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testSMS(config: TestConfig): Promise<boolean> {
  console.log('\n📱 Testing SMS with Twilio...');
  
  if (!config.twilio.accountSid || !config.twilio.authToken || !config.twilio.phoneNumber) {
    console.error('❌ Missing Twilio credentials');
    return false;
  }

  const client = twilio(config.twilio.accountSid, config.twilio.authToken);
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    const message = await client.messages.create({
      body: `Your mortgage pre-qualification verification code is: ${code}`,
      from: config.twilio.phoneNumber,
      to: config.recipient.phone
    });

    console.log('✅ SMS sent successfully!');
    console.log('   Code:', code);
    console.log('   SID:', message.sid);
    console.log('   Status:', message.status);
    return true;
  } catch (error: any) {
    console.error('❌ SMS failed:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    return false;
  }
}

async function testEmail(config: TestConfig): Promise<boolean> {
  console.log('\n📧 Testing Email with SendGrid...');
  
  if (!config.sendgrid.apiKey) {
    console.error('❌ Missing SendGrid API key');
    return false;
  }

  sgMail.setApiKey(config.sendgrid.apiKey);
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const msg = {
    to: config.recipient.email,
    from: config.sendgrid.fromEmail,
    subject: 'Your Mortgage Pre-Qualification Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verification Code</h2>
        <p>Your verification code is:</p>
        <h1 style="background-color: #f0f0f0; padding: 20px; text-align: center; letter-spacing: 5px;">
          ${code}
        </h1>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log('✅ Email sent successfully!');
    console.log('   Code:', code);
    console.log('   To:', config.recipient.email);
    return true;
  } catch (error: any) {
    console.error('❌ Email failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.body);
    }
    return false;
  }
}

async function runTests(): Promise<void> {
  console.log('🚀 Verification Service Test Suite\n');
  
  const config: TestConfig = {
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || ''
    },
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY || '',
      fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@mortgage-app.com'
    },
    recipient: {
      phone: process.env.TEST_PHONE || '+2348108616884',
      email: process.env.TEST_EMAIL || 'obayomiabraham@gmail.com'
    }
  };

  console.log('📋 Configuration:');
  console.log('Twilio SID:', config.twilio.accountSid ? '✓ Found' : '✗ Missing');
  console.log('Twilio Token:', config.twilio.authToken ? '✓ Found' : '✗ Missing');
  console.log('Twilio Phone:', config.twilio.phoneNumber || '✗ Missing');
  console.log('SendGrid Key:', config.sendgrid.apiKey ? '✓ Found' : '✗ Missing');
  console.log('From Email:', config.sendgrid.fromEmail);
  console.log('Test Phone:', config.recipient.phone);
  console.log('Test Email:', config.recipient.email);

  // Run tests
  const smsResult = await testSMS(config);
  await delay(1000); // Small delay between tests
  const emailResult = await testEmail(config);

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('SMS Test:', smsResult ? '✅ Passed' : '❌ Failed');
  console.log('Email Test:', emailResult ? '✅ Passed' : '❌ Failed');

  if (!smsResult || !emailResult) {
    console.log('\n💡 Troubleshooting Tips:');
    if (!smsResult) {
      console.log('\nFor SMS issues:');
      console.log('1. Verify Twilio credentials at https://console.twilio.com');
      console.log('2. Check Geographic Permissions for your target country');
      console.log('3. Ensure your Twilio phone number supports SMS');
      console.log('4. Check your account balance');
    }
    if (!emailResult) {
      console.log('\nFor Email issues:');
      console.log('1. Verify SendGrid API key at https://app.sendgrid.com');
      console.log('2. Ensure sender email is verified in SendGrid');
      console.log('3. Check SendGrid sending limits');
    }
  }
}

// Run the tests
runTests()
  .then(() => {
    console.log('\n✨ Test suite completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  });