/**
 * Simple test to debug the 500 error
 */

const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

async function testBasicFlow() {
  console.log('=== Simple Backend Test ===\n');
  
  try {
    // Create axios with cookie support
    const jar = new CookieJar();
    const api = wrapper(axios.create({
      baseURL: 'http://localhost:3000',
      jar: jar,
      withCredentials: true,
    }));

    // 1. Get session
    console.log('1. Getting session...');
    const sessionResponse = await api.get('/chat/session');
    console.log('Session ID:', sessionResponse.data.sessionId);
    console.log('Session data:', sessionResponse.data);
    
    // 2. Send a message
    console.log('\n2. Sending message...');
    try {
      const messageResponse = await api.post('/chat/message', {
        content: 'I want to purchase a home'
      });
      console.log('Response:', messageResponse.data);
    } catch (error) {
      console.error('Error sending message:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testBasicFlow();