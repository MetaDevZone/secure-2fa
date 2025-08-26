import { 
  SecureEmailOtp, 
  BrevoAdapter, 
  MemoryDatabaseAdapter, 
  MemoryRateLimiterAdapter,
  EmailTemplates 
} from '../src';

// Example: Using Brevo (Sendinblue) for email delivery
async function brevoExample() {
  // 1. Configure Brevo adapter
  const brevoAdapter = new BrevoAdapter({
    apiKey: process.env.BREVO_API_KEY || 'your-brevo-api-key',
    from: 'noreply@yourdomain.com',
    senderName: 'Your App Name'
  });

  // 2. Configure database and rate limiter (using memory for this example)
  const databaseAdapter = new MemoryDatabaseAdapter();
  const rateLimiterAdapter = new MemoryRateLimiterAdapter();

  // 3. Configure email templates
  const emailTemplates: EmailTemplates = {
    subject: 'Your OTP Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your OTP Code</h2>
        <p>Hello,</p>
        <p>Your OTP code is: <strong style="font-size: 24px; color: #007bff;">{{otp}}</strong></p>
        <p>This code will expire in {{expiryMinutes}} minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated message from Your App Name.
        </p>
      </div>
    `,
    text: `
      Your OTP Code
      
      Hello,
      
      Your OTP code is: {{otp}}
      
      This code will expire in {{expiryMinutes}} minutes.
      
      If you didn't request this code, please ignore this email.
      
      ---
      This is an automated message from Your App Name.
    `,
    senderName: 'Your App Name',
    senderEmail: 'noreply@yourdomain.com'
  };

  // 4. Create SecureEmailOtp instance
  const otpService = new SecureEmailOtp(
    databaseAdapter,
    brevoAdapter,
    rateLimiterAdapter,
    'your-very-long-server-secret-key-here', // Replace with your actual secret
    {
      templates: emailTemplates,
      otpLength: 6,
      expiryMs: 10 * 60 * 1000, // 10 minutes
      maxRetries: 3,
      strictMode: true,
      rateLimit: {
        maxPerWindow: 5,
        windowMs: 15 * 60 * 1000 // 15 minutes
      }
    }
  );

  // 5. Example: Generate OTP
  let sessionId: string;
  try {
    const result = await otpService.generate({
      email: 'user@example.com',
      context: 'login',
      requestMeta: {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        deviceId: 'device-123',
        platform: 'web',
        browser: 'Chrome',
        os: 'Windows'
      }
    });

    sessionId = result.sessionId;
    console.log('OTP generated successfully:', {
      sessionId: result.sessionId,
      expiresAt: result.expiresAt,
      isResent: result.isResent
    });
  } catch (error) {
    console.error('Failed to generate OTP:', error);
    return; // Exit early if generation fails
  }

  // 6. Example: Verify OTP
  try {
    const verificationResult = await otpService.verify({
      email: 'user@example.com',
      context: 'login',
      clientHash: '123456', // User-provided OTP
      sessionId: sessionId, // Use sessionId from generate result
      requestMeta: {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        deviceId: 'device-123',
        platform: 'web',
        browser: 'Chrome',
        os: 'Windows'
      }
    });

    if (verificationResult.success) {
      console.log('OTP verified successfully:', {
        sessionId: verificationResult.sessionId,
        email: verificationResult.email,
        context: verificationResult.context
      });
    } else {
      console.log('OTP verification failed');
    }
  } catch (error) {
    console.error('Failed to verify OTP:', error);
  }

  // 7. Example: Verify Brevo connection
  try {
    const isConnected = await brevoAdapter.verifyConnection();
    console.log('Brevo connection status:', isConnected ? 'Connected' : 'Failed');
  } catch (error) {
    console.error('Failed to verify Brevo connection:', error);
  }
}

// Run the example
if (require.main === module) {
  brevoExample().catch(console.error);
}

export { brevoExample };
