import { 
  SecureEmailOtp, 
  MailgunAdapter, 
  MemoryDatabaseAdapter, 
  MemoryRateLimiterAdapter,
  EmailTemplates 
} from '../src';

// Example: Using Mailgun for email delivery
async function mailgunExample() {
  // 1. Configure Mailgun adapter
  const mailgunAdapter = new MailgunAdapter({
    apiKey: process.env.MAILGUN_API_KEY || 'your-mailgun-api-key',
    domain: process.env.MAILGUN_DOMAIN || 'your-domain.com',
    from: 'noreply@your-domain.com',
    region: 'us' // or 'eu' for European region
  });

  // 2. Configure database and rate limiter (using memory for this example)
  const databaseAdapter = new MemoryDatabaseAdapter();
  const rateLimiterAdapter = new MemoryRateLimiterAdapter();

  // 3. Configure email templates
  const emailTemplates: EmailTemplates = {
    subject: 'Your Security Code',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Security Code</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(45deg, #ff6b6b, #ee5a24); color: white; padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 32px; font-weight: 300;">🔐 Security Code</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Two-Factor Authentication</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <p style="font-size: 18px; color: #2c3e50; margin-bottom: 30px; line-height: 1.6;">
              Hello there! 👋
            </p>
            
            <p style="font-size: 16px; color: #34495e; margin-bottom: 25px; line-height: 1.6;">
              We received a request to access your account. Please use the security code below to complete the verification:
            </p>
            
            <!-- OTP Display -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
              <div style="background: white; border-radius: 8px; padding: 25px; display: inline-block; min-width: 200px;">
                <span style="font-size: 36px; font-weight: bold; color: #2c3e50; letter-spacing: 6px; font-family: 'Courier New', monospace;">{{otp}}</span>
              </div>
            </div>
            
            <!-- Expiry Info -->
            <div style="background-color: #ecf0f1; border-left: 4px solid #3498db; padding: 15px; margin: 25px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; font-size: 14px; color: #2c3e50;">
                ⏰ <strong>This code expires in {{expiryMinutes}} minutes</strong>
              </p>
            </div>
            
            <!-- Security Warning -->
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <p style="margin: 0; font-size: 14px; color: #856404; line-height: 1.5;">
                🛡️ <strong>Security Notice:</strong> If you didn't request this code, please ignore this email and consider changing your password immediately.
              </p>
            </div>
            
            <p style="font-size: 14px; color: #7f8c8d; margin-top: 30px; line-height: 1.6;">
              For security reasons, this code can only be used once and will expire automatically.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #2c3e50; color: white; padding: 30px; text-align: center;">
            <p style="margin: 0; font-size: 14px; opacity: 0.8;">
              © 2024 Your App Name. All rights reserved.
            </p>
            <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.6;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      🔐 Security Code - Two-Factor Authentication
      ============================================
      
      Hello there! 👋
      
      We received a request to access your account. Please use the security code below to complete the verification:
      
      Your security code is: {{otp}}
      
      ⏰ This code expires in {{expiryMinutes}} minutes
      
      🛡️ Security Notice: If you didn't request this code, please ignore this email and consider changing your password immediately.
      
      For security reasons, this code can only be used once and will expire automatically.
      
      ---
      © 2024 Your App Name. All rights reserved.
      This is an automated message. Please do not reply to this email.
    `,
    senderName: 'Your App Name',
    senderEmail: 'noreply@your-domain.com'
  };

  // 4. Create SecureEmailOtp instance
  const otpService = new SecureEmailOtp({
    databaseAdapter,
    emailProvider: mailgunAdapter,
    rateLimiterAdapter,
    templates: emailTemplates,
    otpLength: 6,
    expiryMs: 20 * 60 * 1000, // 20 minutes
    maxRetries: 3,
    strictMode: true,
    rateLimit: {
      maxPerWindow: 4,
      windowMs: 60 * 60 * 1000 // 1 hour
    }
  });

  // 5. Example: Generate OTP
  try {
    const result = await otpService.generateOtp({
      email: 'user@example.com',
      context: '2fa-login',
      requestMeta: {
        ip: '198.51.100.1',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        deviceId: 'linux-device-789',
        platform: 'web',
        browser: 'Firefox',
        os: 'Linux'
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
      context: '2fa-login',
      otp: '456789', // User-provided OTP
      requestMeta: {
        ip: '198.51.100.1',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        deviceId: 'linux-device-789',
        platform: 'web',
        browser: 'Firefox',
        os: 'Linux'
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

  // 7. Example: Verify Mailgun connection
  try {
    const isConnected = await mailgunAdapter.verifyConnection();
    console.log('Mailgun connection status:', isConnected ? 'Connected' : 'Failed');
  } catch (error) {
    console.error('Failed to verify Mailgun connection:', error);
  }
}

// Run the example
if (require.main === module) {
  mailgunExample().catch(console.error);
}

export { mailgunExample };
