import { 
  SecureEmailOtp, 
  CustomAdapter, 
  MemoryDatabaseAdapter, 
  MemoryRateLimiterAdapter,
  EmailTemplates,
  EmailParams 
} from '../src';

// Example: Using Custom Email Provider for email delivery
async function customEmailExample() {
  // 1. Define your custom email sending function
  const customSendEmail = async (params: EmailParams): Promise<void> => {
    // This is where you would integrate with your custom email service
    // Examples: AWS SES, custom SMTP server, webhook-based service, etc.
    
    console.log('📧 Custom Email Service - Sending email:');
    console.log('  To:', params.to);
    console.log('  From:', params.from);
    console.log('  Subject:', params.subject);
    console.log('  HTML Content Length:', params.html?.length || 0);
    console.log('  Text Content Length:', params.text?.length || 0);
    
    // Simulate API call to your custom email service
    // Replace this with your actual implementation
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
    
    // Example: AWS SES integration
    // const ses = new AWS.SES();
    // await ses.sendEmail({
    //   Source: params.from,
    //   Destination: { ToAddresses: [params.to] },
    //   Message: {
    //     Subject: { Data: params.subject },
    //     Body: {
    //       Html: { Data: params.html || '' },
    //       Text: { Data: params.text || '' }
    //     }
    //   }
    // }).promise();
    
    // Example: Custom SMTP server
    // const transporter = nodemailer.createTransport({
    //   host: 'your-smtp-server.com',
    //   port: 587,
    //   secure: false,
    //   auth: { user: 'your-username', pass: 'your-password' }
    // });
    // await transporter.sendMail({
    //   from: params.from,
    //   to: params.to,
    //   subject: params.subject,
    //   html: params.html,
    //   text: params.text
    // });
    
    // Example: Webhook-based service
    // await fetch('https://your-webhook-url.com/send-email', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     to: params.to,
    //     from: params.from,
    //     subject: params.subject,
    //     html: params.html,
    //     text: params.text
    //   })
    // });
    
    console.log('✅ Email sent successfully via custom service');
  };

  // 2. Define your custom connection verification function (optional)
  const customVerifyConnection = async (): Promise<boolean> => {
    // This is where you would verify your custom email service is working
    // Examples: Check API health, test SMTP connection, etc.
    
    console.log('🔍 Verifying custom email service connection...');
    
    try {
      // Simulate connection check
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Example: Check API health endpoint
      // const response = await fetch('https://your-email-service.com/health');
      // return response.ok;
      
      // Example: Test SMTP connection
      // const transporter = nodemailer.createTransporter({...});
      // await transporter.verify();
      // return true;
      
      console.log('✅ Custom email service connection verified');
      return true;
    } catch (error) {
      console.log('❌ Custom email service connection failed:', error);
      return false;
    }
  };

  // 3. Configure Custom adapter
  const customAdapter = new CustomAdapter({
    sendFunction: customSendEmail,
    verifyFunction: customVerifyConnection
  });

  // 4. Configure database and rate limiter (using memory for this example)
  const databaseAdapter = new MemoryDatabaseAdapter();
  const rateLimiterAdapter = new MemoryRateLimiterAdapter();

  // 5. Configure email templates
  const emailTemplates: EmailTemplates = {
    subject: 'Your Access Code',
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">🔑 Access Code</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Secure Authentication</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <p style="font-size: 18px; color: #2c3e50; margin-bottom: 25px; line-height: 1.6;">
            Hi there! 👋
          </p>
          
          <p style="font-size: 16px; color: #34495e; margin-bottom: 30px; line-height: 1.6;">
            You've requested access to your account. Please use the code below to complete the authentication process:
          </p>
          
          <!-- Code Display -->
          <div style="background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
            <div style="background: white; border-radius: 8px; padding: 20px; display: inline-block; min-width: 180px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
              <span style="font-size: 32px; font-weight: bold; color: #495057; letter-spacing: 4px; font-family: 'Courier New', monospace; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);">{{otp}}</span>
            </div>
          </div>
          
          <!-- Info Boxes -->
          <div style="display: flex; gap: 15px; margin: 30px 0;">
            <div style="flex: 1; background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; font-size: 14px; color: #1565c0;">
                ⏱️ <strong>Expires in {{expiryMinutes}} minutes</strong>
              </p>
            </div>
            <div style="flex: 1; background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; font-size: 14px; color: #e65100;">
                🔒 <strong>One-time use only</strong>
              </p>
            </div>
          </div>
          
          <!-- Security Notice -->
          <div style="background: #fff8e1; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <p style="margin: 0; font-size: 14px; color: #f57c00; line-height: 1.5;">
              🛡️ <strong>Security Alert:</strong> If you didn't request this access code, please ignore this email and contact our support team immediately.
            </p>
          </div>
          
          <p style="font-size: 14px; color: #6c757d; margin-top: 30px; line-height: 1.6;">
            This code is generated for your security and can only be used once. It will automatically expire after the time limit.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #dee2e6;">
          <p style="margin: 0; font-size: 14px; color: #6c757d;">
            © 2024 Your App Name. All rights reserved.
          </p>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #adb5bd;">
            This is an automated security message. Please do not reply.
          </p>
        </div>
      </div>
    `,
    text: `
      🔑 Access Code - Secure Authentication
      =====================================
      
      Hi there! 👋
      
      You've requested access to your account. Please use the code below to complete the authentication process:
      
      Your access code is: {{otp}}
      
      ⏱️ Expires in {{expiryMinutes}} minutes
      🔒 One-time use only
      
      🛡️ Security Alert: If you didn't request this access code, please ignore this email and contact our support team immediately.
      
      This code is generated for your security and can only be used once. It will automatically expire after the time limit.
      
      ---
      © 2024 Your App Name. All rights reserved.
      This is an automated security message. Please do not reply.
    `,
    senderName: 'Your App Name',
    senderEmail: 'security@yourdomain.com'
  };

  // 6. Create SecureEmailOtp instance
  const otpService = new SecureEmailOtp(
    databaseAdapter,
    customAdapter,
    rateLimiterAdapter,
    'your-very-long-server-secret-key-here', // Replace with your actual secret
    {
      templates: emailTemplates,
      otpLength: 6,
      expiryMs: 25 * 60 * 1000, // 25 minutes
      maxRetries: 3,
      strictMode: true,
      rateLimit: {
        maxPerWindow: 3,
        windowMs: 45 * 60 * 1000 // 45 minutes
      }
    }
  );

  // 7. Example: Generate OTP
  let sessionId: string;
  try {
    const result = await otpService.generate({
      email: 'user@example.com',
      context: 'account-access',
      requestMeta: {
        ip: '203.0.113.42',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
        deviceId: 'iphone-device-123',
        platform: 'mobile',
        browser: 'Safari',
        os: 'iOS'
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

  // 8. Example: Verify OTP
  try {
    const verificationResult = await otpService.verify({
      email: 'user@example.com',
      context: 'account-access',
      clientHash: '123456', // User-provided OTP
      sessionId: sessionId, // Use sessionId from generate result
      requestMeta: {
        ip: '203.0.113.42',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
        deviceId: 'iphone-device-123',
        platform: 'mobile',
        browser: 'Safari',
        os: 'iOS'
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

  // 9. Example: Verify Custom Email Service connection
  try {
    const isConnected = await customAdapter.verifyConnection();
    console.log('Custom email service connection status:', isConnected ? 'Connected' : 'Failed');
  } catch (error) {
    console.error('Failed to verify custom email service connection:', error);
  }
}

// Run the example
if (require.main === module) {
  customEmailExample().catch(console.error);
}

export { customEmailExample };
