import { 
  SecureEmailOtp, 
  PostmarkAdapter, 
  MemoryDatabaseAdapter, 
  MemoryRateLimiterAdapter,
  EmailTemplates 
} from '../src';

// Example: Using Postmark for email delivery
async function postmarkExample() {
  // 1. Configure Postmark adapter
  const postmarkAdapter = new PostmarkAdapter({
    serverToken: process.env.POSTMARK_SERVER_TOKEN || 'your-postmark-server-token',
    from: 'noreply@yourdomain.com'
  });

  // 2. Configure database and rate limiter (using memory for this example)
  const databaseAdapter = new MemoryDatabaseAdapter();
  const rateLimiterAdapter = new MemoryRateLimiterAdapter();

  // 3. Configure email templates
  const emailTemplates: EmailTemplates = {
    subject: 'Your Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Verification Code</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hello,</p>
          <p style="font-size: 16px; color: #333; margin-bottom: 30px;">
            Your verification code is:
          </p>
          <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 4px;">{{otp}}</span>
          </div>
          <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
            This code will expire in <strong>{{expiryMinutes}} minutes</strong>.
          </p>
          <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="font-size: 12px; color: #495057; margin: 0;">
              <strong>Security Notice:</strong> If you didn't request this code, please ignore this email and ensure your account is secure.
            </p>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px;">
          <p style="font-size: 12px; color: #6c757d;">
            © 2024 Your App Name. All rights reserved.
          </p>
        </div>
      </div>
    `,
    text: `
      Verification Code
      ================
      
      Hello,
      
      Your verification code is: {{otp}}
      
      This code will expire in {{expiryMinutes}} minutes.
      
      Security Notice: If you didn't request this code, please ignore this email and ensure your account is secure.
      
      ---
      © 2024 Your App Name. All rights reserved.
    `,
    senderName: 'Your App Name',
    senderEmail: 'noreply@yourdomain.com'
  };

  // 4. Create SecureEmailOtp instance
  const otpService = new SecureEmailOtp({
    databaseAdapter,
    emailProvider: postmarkAdapter,
    rateLimiterAdapter,
    templates: emailTemplates,
    otpLength: 6,
    expiryMs: 15 * 60 * 1000, // 15 minutes
    maxRetries: 5,
    strictMode: true,
    rateLimit: {
      maxPerWindow: 3,
      windowMs: 30 * 60 * 1000 // 30 minutes
    },
    events: {
      onRequest: async (event) => {
        console.log('OTP Request:', {
          email: event.email,
          context: event.context,
          timestamp: event.timestamp
        });
      },
      onSend: async (event) => {
        console.log('OTP Sent:', {
          email: event.email,
          context: event.context,
          timestamp: event.timestamp
        });
      },
      onVerify: async (event) => {
        console.log('OTP Verified:', {
          email: event.email,
          context: event.context,
          timestamp: event.timestamp
        });
      },
      onFail: async (event) => {
        console.log('OTP Failed:', {
          email: event.email,
          context: event.context,
          error: event.error?.message,
          timestamp: event.timestamp
        });
      }
    }
  });

  // 5. Example: Generate OTP
  try {
    const result = await otpService.generateOtp({
      email: 'user@example.com',
      context: 'email-verification',
      requestMeta: {
        ip: '203.0.113.1',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        deviceId: 'mac-device-456',
        platform: 'web',
        browser: 'Safari',
        os: 'macOS'
      }
    });

    console.log('OTP generated successfully:', {
      sessionId: result.sessionId,
      expiresAt: result.expiresAt,
      isResent: result.isResent
    });
  } catch (error) {
    console.error('Failed to generate OTP:', error);
  }

  // 6. Example: Verify OTP
  try {
    const verificationResult = await otpService.verifyOtp({
      email: 'user@example.com',
      context: 'email-verification',
      otp: '789012', // User-provided OTP
      requestMeta: {
        ip: '203.0.113.1',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        deviceId: 'mac-device-456',
        platform: 'web',
        browser: 'Safari',
        os: 'macOS'
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

  // 7. Example: Verify Postmark connection
  try {
    const isConnected = await postmarkAdapter.verifyConnection();
    console.log('Postmark connection status:', isConnected ? 'Connected' : 'Failed');
  } catch (error) {
    console.error('Failed to verify Postmark connection:', error);
  }
}

// Run the example
if (require.main === module) {
  postmarkExample().catch(console.error);
}

export { postmarkExample };
