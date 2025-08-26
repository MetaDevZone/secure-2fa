const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testOtpFlow() {
  try {
    const email = 'ghulammohiodin.me@gmail.com';
    
    console.log('=== Testing OTP Flow ===');
    console.log('Email:', email);
    console.log('');

    // Step 1: Generate OTP
    console.log('1. Generating OTP...');
    const generateResponse = await axios.post(`${BASE_URL}/api/otp/generate`, {
      email,
      context: 'login'
    });

    const { sessionId, debug } = generateResponse.data;
    const otp = debug.otp;

    console.log('Session ID:', sessionId);
    console.log('OTP:', otp);
    console.log('');

    // Step 2: Verify OTP
    console.log('2. Verifying OTP...');
    const verifyResponse = await axios.post(`${BASE_URL}/api/otp/verify`, {
      email,
      otp,
      context: 'login',
      sessionId
    });

    console.log('Verification successful:', verifyResponse.data);
    console.log('');

  } catch (error) {
    if (error.response) {
      console.error('Error response:', {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function testInvalidOtp() {
  try {
    const email = 'ghulammohiodin.me@gmail.com';
    
    console.log('=== Testing Invalid OTP ===');
    console.log('Email:', email);
    console.log('');

    // Step 1: Generate OTP
    console.log('1. Generating OTP...');
    const generateResponse = await axios.post(`${BASE_URL}/api/otp/generate`, {
      email,
      context: 'login'
    });

    const { sessionId } = generateResponse.data;

    console.log('Session ID:', sessionId);
    console.log('');

    // Step 2: Try to verify with wrong OTP
    console.log('2. Verifying with wrong OTP...');
    const verifyResponse = await axios.post(`${BASE_URL}/api/otp/verify`, {
      email,
      otp: '000000', // Wrong OTP
      context: 'login',
      sessionId
    });

    console.log('Verification successful:', verifyResponse.data);
    console.log('');

  } catch (error) {
    if (error.response) {
      console.error('Error response:', {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run tests
async function runTests() {
  console.log('Starting OTP tests...\n');
  
  await testOtpFlow();
  console.log('---');
  await testInvalidOtp();
  
  console.log('Tests completed!');
}

// Check if axios is available
try {
  require('axios');
  runTests();
} catch (error) {
  console.error('Please install axios first: npm install axios');
  console.error('Or use curl/Postman to test the endpoints manually.');
}

