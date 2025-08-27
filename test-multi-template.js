const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test different template types
const testCases = [
  {
    name: 'Login OTP',
    email: 'user@example.com',
    context: 'login',
    templateType: 'login'
  },
  {
    name: 'Registration OTP',
    email: 'newuser@example.com',
    context: 'registration',
    templateType: 'registration'
  },
  {
    name: 'Password Reset OTP',
    email: 'user@example.com',
    context: 'password-reset',
    templateType: 'passwordReset'
  },
  {
    name: 'Two-Factor Authentication OTP',
    email: 'user@example.com',
    context: '2fa',
    templateType: 'twoFactor'
  },
  {
    name: 'Default Template OTP',
    email: 'user@example.com',
    context: 'custom',
    templateType: null // Will use default template
  }
];

async function testMultiTemplateOTP() {
  console.log('🧪 Testing Multi-Template OTP System\n');

  try {
    // First, check available templates
    console.log('📋 Checking available templates...');
    const templatesResponse = await axios.get(`${BASE_URL}/api/templates`);
    console.log('✅ Available templates:', templatesResponse.data.templates);
    console.log('');

    // Test each template type
    for (const testCase of testCases) {
      console.log(`🔍 Testing: ${testCase.name}`);
      console.log(`   Email: ${testCase.email}`);
      console.log(`   Context: ${testCase.context}`);
      console.log(`   Template: ${testCase.templateType || 'default'}`);

      try {
        const response = await axios.post(`${BASE_URL}/api/otp/generate`, {
          email: testCase.email,
          context: testCase.context,
          templateType: testCase.templateType
        });

        console.log('   ✅ OTP Generated Successfully!');
        console.log(`   📧 Session ID: ${response.data.sessionId}`);
        console.log(`   ⏰ Expires At: ${response.data.expiresAt}`);
        console.log(`   📝 Template Used: ${response.data.templateUsed}`);
        console.log('');

        // Simulate OTP verification (using a dummy OTP for testing)
        console.log('   🔐 Testing OTP verification...');
        try {
          const verifyResponse = await axios.post(`${BASE_URL}/api/otp/verify`, {
            email: testCase.email,
            otp: '123456', // Dummy OTP for testing
            context: testCase.context,
            sessionId: response.data.sessionId
          });

          if (verifyResponse.data.success) {
            console.log('   ✅ OTP Verification Successful!');
          } else {
            console.log('   ❌ OTP Verification Failed (expected with dummy OTP)');
          }
        } catch (verifyError) {
          console.log('   ❌ OTP Verification Error (expected with dummy OTP):', verifyError.response?.data?.error || verifyError.message);
        }

      } catch (error) {
        console.log('   ❌ OTP Generation Failed:', error.response?.data?.error || error.message);
      }

      console.log('   ' + '─'.repeat(50));
      console.log('');
    }

    // Test health check
    console.log('🏥 Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Health check passed:', healthResponse.data.health.status);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the server is running on http://localhost:3000');
      console.log('   Run: npm run build && node examples/multi-template-example.ts');
    }
  }
}

// Run the test
testMultiTemplateOTP();
