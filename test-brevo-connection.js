const { BrevoAdapter } = require('./dist/adapters/email/brevo-adapter');

async function testBrevoConnection() {
  console.log('🔧 Testing Brevo Email Connection...\n');

  // Replace with your actual Brevo configuration
  const brevoConfig = {
    apiKey: process.env.BREVO_API_KEY || 'your-api-key-here',
    from: process.env.BREVO_FROM_EMAIL || 'your-verified-email@yourdomain.com',
    senderName: process.env.BREVO_SENDER_NAME || 'Test Sender'
  };

  console.log('📋 Configuration:');
  console.log('  API Key:', brevoConfig.apiKey ? '✅ Set' : '❌ Missing');
  console.log('  From Email:', brevoConfig.from);
  console.log('  Sender Name:', brevoConfig.senderName);
  console.log('');

  const brevoAdapter = new BrevoAdapter(brevoConfig);

  // Step 1: Test connection
  console.log('🔌 Step 1: Testing API Connection...');
  try {
    const isConnected = await brevoAdapter.verifyConnection();
    console.log('  Status:', isConnected ? '✅ Connected' : '❌ Failed');
    
    if (!isConnected) {
      console.log('  ❌ Connection failed. Check your API key and account status.');
      return;
    }
  } catch (error) {
    console.log('  ❌ Connection error:', error.message);
    return;
  }

  // Step 2: Test email sending
  console.log('\n📧 Step 2: Testing Email Sending...');
  const testEmail = process.env.TEST_EMAIL || 'your-test-email@gmail.com';
  
  try {
    await brevoAdapter.sendEmail({
      to: testEmail,
      subject: 'Test Email from Brevo - ' + new Date().toISOString(),
      html: `
        <h1>Test Email from Brevo</h1>
        <p>This is a test email sent at: ${new Date().toISOString()}</p>
        <p>If you receive this, your Brevo setup is working correctly!</p>
      `,
      text: `Test Email from Brevo\n\nThis is a test email sent at: ${new Date().toISOString()}\n\nIf you receive this, your Brevo setup is working correctly!`
    });
    
    console.log('  ✅ Test email sent successfully!');
    console.log('  📬 Check your email inbox (and spam folder) at:', testEmail);
    console.log('  📊 Check Brevo dashboard for delivery status');
    
  } catch (error) {
    console.log('  ❌ Failed to send test email:', error.message);
    
    // Provide specific guidance based on error
    if (error.message.includes('Invalid API key')) {
      console.log('  💡 Solution: Check your API key in Brevo dashboard');
    } else if (error.message.includes('Sender not verified')) {
      console.log('  💡 Solution: Verify your sender domain in Brevo');
    } else if (error.message.includes('Rate limit')) {
      console.log('  💡 Solution: Wait a few minutes and try again');
    } else {
      console.log('  💡 Check Brevo dashboard for detailed error information');
    }
  }

  console.log('\n📋 Next Steps:');
  console.log('  1. Check your email inbox and spam folder');
  console.log('  2. Log into Brevo dashboard: https://app.brevo.com/');
  console.log('  3. Go to Activity Log to see delivery status');
  console.log('  4. Verify your sender domain is properly configured');
}

// Run the test
testBrevoConnection().catch(console.error);
