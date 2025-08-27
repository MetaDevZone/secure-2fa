import { 
  SecureEmailOtp, 
  MongooseAdapter,
  ConsoleEmailAdapter, 
  MemoryRateLimiterAdapter,
  EmailTemplates 
} from '../src';
import mongoose from 'mongoose';

/**
 * Example demonstrating the PRIMARY APPROACH:
 * Templates are passed directly to the generate() function
 */

// Define templates for different purposes
const templates = {
  login: {
    subject: '🔐 Login Verification Code',
    html: '<h1>Login Code: {{otp}}</h1>',
    text: 'Login Code: {{otp}}',
    senderName: 'Security Team',
    senderEmail: 'security@company.com'
  },
  
  registration: {
    subject: '🎉 Welcome! Verify Your Email',
    html: '<h1>Welcome! Your code: {{otp}}</h1>',
    text: 'Welcome! Your code: {{otp}}',
    senderName: 'Welcome Team',
    senderEmail: 'welcome@company.com'
  },
  
  passwordReset: {
    subject: '🔒 Password Reset Code',
    html: '<h1>Reset Code: {{otp}}</h1>',
    text: 'Reset Code: {{otp}}',
    senderName: 'Security Team',
    senderEmail: 'security@company.com'
  }
};

async function demonstrateTemplateAtGeneration() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/otpservice');
    console.log('✅ Connected to MongoDB');

    // Initialize OTP service with minimal config
    // Note: No global templates configured - templates are passed at generation time
    const otpService = new SecureEmailOtp(
      new MongooseAdapter({ connection: mongoose.connection }),
      new ConsoleEmailAdapter(), // Will log emails to console
      new MemoryRateLimiterAdapter(),
      'your-server-secret-key-here'
    );

    console.log('\n🚀 Demonstrating Template at Generation Time Approach\n');

    // Example 1: Generate OTP with login template
    console.log('📧 Example 1: Login OTP with login template');
    const loginResult = await otpService.generate({
      email: 'user@example.com',
      context: 'login',
      requestMeta: { ip: '127.0.0.1', userAgent: 'Mozilla/5.0...' },
      template: templates.login // Template passed here!
    });
    console.log('✅ Login OTP generated with login template');

    // Example 2: Generate OTP with registration template
    console.log('\n📧 Example 2: Registration OTP with registration template');
    const registrationResult = await otpService.generate({
      email: 'newuser@example.com',
      context: 'registration',
      requestMeta: { ip: '127.0.0.1', userAgent: 'Mozilla/5.0...' },
      template: templates.registration // Different template passed here!
    });
    console.log('✅ Registration OTP generated with registration template');

    // Example 3: Generate OTP with password reset template
    console.log('\n📧 Example 3: Password Reset OTP with password reset template');
    const resetResult = await otpService.generate({
      email: 'user@example.com',
      context: 'password-reset',
      requestMeta: { ip: '127.0.0.1', userAgent: 'Mozilla/5.0...' },
      template: templates.passwordReset // Another different template!
    });
    console.log('✅ Password Reset OTP generated with password reset template');

    // Example 4: Generate OTP without template (uses default fallback)
    console.log('\n📧 Example 4: OTP without template (uses default fallback)');
    const defaultResult = await otpService.generate({
      email: 'user@example.com',
      context: 'custom',
      requestMeta: { ip: '127.0.0.1', userAgent: 'Mozilla/5.0...' }
      // No template specified - will use default fallback
    });
    console.log('✅ Default OTP generated with fallback template');

    // Example 5: Dynamic template based on runtime logic
    console.log('\n📧 Example 5: Dynamic template selection based on runtime logic');
    const userType = 'premium'; // This could come from database, request, etc.
    
    const dynamicTemplate = userType === 'premium' 
      ? {
          subject: '🌟 Premium User Verification',
          html: '<h1>🌟 Premium Code: {{otp}}</h1>',
          text: '🌟 Premium Code: {{otp}}',
          senderName: 'Premium Support',
          senderEmail: 'premium@company.com'
        }
      : templates.login;

    const dynamicResult = await otpService.generate({
      email: 'premium@example.com',
      context: 'premium-login',
      requestMeta: { ip: '127.0.0.1', userAgent: 'Mozilla/5.0...' },
      template: dynamicTemplate // Template selected at runtime!
    });
    console.log('✅ Dynamic OTP generated with runtime-selected template');

    console.log('\n🎉 All examples completed successfully!');
    console.log('\n💡 Key Points:');
    console.log('   - Templates are passed directly to generate() function');
    console.log('   - Different templates for different use cases');
    console.log('   - Dynamic template selection based on runtime logic');
    console.log('   - No global template configuration needed');
    console.log('   - Maximum flexibility and control');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the demonstration
demonstrateTemplateAtGeneration();
