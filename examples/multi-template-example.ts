import express from 'express';
import { 
  SecureEmailOtp, 
  MongooseAdapter,
  ConsoleEmailAdapter, 
  MemoryRateLimiterAdapter,
  EmailTemplates 
} from '../src';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());

// Define multiple email templates for different purposes
const emailTemplates = {
  // Login template
  login: {
    subject: '🔐 Your Login Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; text-align: center;">🔐 Login Verification</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello!</h2>
          <p style="color: #666; line-height: 1.6;">We received a login request for your account. To complete the login process, please use the verification code below:</p>
          
          <div style="background: #fff; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px;">{{otp}}</div>
            <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Verification Code</p>
          </div>
          
          <p style="color: #666; line-height: 1.6;">This code will expire in <strong>{{expiryMinutes}}</strong> minutes.</p>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>⚠️ Security Notice:</strong> If you didn't request this login verification, please ignore this email and consider changing your password.
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            This is an automated message from {{companyName}}. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
    text: `
🔐 Login Verification

Hello!

We received a login request for your account. To complete the login process, please use the verification code below:

Verification Code: {{otp}}

This code will expire in {{expiryMinutes}} minutes.

⚠️ Security Notice: If you didn't request this login verification, please ignore this email and consider changing your password.

---
This is an automated message from {{companyName}}. Please do not reply to this email.
    `,
    senderName: 'Security Team',
    senderEmail: 'security@yourcompany.com'
  },

  // Registration template
  registration: {
    subject: '🎉 Welcome! Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; text-align: center;">🎉 Welcome to {{companyName}}!</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Welcome aboard!</h2>
          <p style="color: #666; line-height: 1.6;">Thank you for joining {{companyName}}! To complete your registration and activate your account, please verify your email address using the code below:</p>
          
          <div style="background: #fff; border: 2px dashed #4facfe; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <div style="font-size: 32px; font-weight: bold; color: #4facfe; letter-spacing: 8px;">{{otp}}</div>
            <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Email Verification Code</p>
          </div>
          
          <p style="color: #666; line-height: 1.6;">This verification code will expire in <strong>{{expiryMinutes}}</strong> minutes.</p>
          
          <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="color: #155724; margin: 0; font-size: 14px;">
              <strong>✨ What's next?</strong> Once verified, you'll have full access to all our features and services.
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            Welcome to {{companyName}}! We're excited to have you on board.
          </p>
        </div>
      </div>
    `,
    text: `
🎉 Welcome to {{companyName}}!

Welcome aboard!

Thank you for joining {{companyName}}! To complete your registration and activate your account, please verify your email address using the code below:

Email Verification Code: {{otp}}

This verification code will expire in {{expiryMinutes}} minutes.

✨ What's next? Once verified, you'll have full access to all our features and services.

---
Welcome to {{companyName}}! We're excited to have you on board.
    `,
    senderName: 'Welcome Team',
    senderEmail: 'welcome@yourcompany.com'
  },

  // Password reset template
  passwordReset: {
    subject: '🔒 Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; text-align: center;">🔒 Password Reset</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
          <p style="color: #666; line-height: 1.6;">We received a request to reset your password. To proceed with the password reset, please use the verification code below:</p>
          
          <div style="background: #fff; border: 2px dashed #fa709a; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <div style="font-size: 32px; font-weight: bold; color: #fa709a; letter-spacing: 8px;">{{otp}}</div>
            <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Password Reset Code</p>
          </div>
          
          <p style="color: #666; line-height: 1.6;">This code will expire in <strong>{{expiryMinutes}}</strong> minutes.</p>
          
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="color: #721c24; margin: 0; font-size: 14px;">
              <strong>⚠️ Important:</strong> If you didn't request a password reset, please ignore this email and ensure your account is secure.
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            This is a security message from {{companyName}}. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
    text: `
🔒 Password Reset Request

Password Reset Request

We received a request to reset your password. To proceed with the password reset, please use the verification code below:

Password Reset Code: {{otp}}

This code will expire in {{expiryMinutes}} minutes.

⚠️ Important: If you didn't request a password reset, please ignore this email and ensure your account is secure.

---
This is a security message from {{companyName}}. Please do not reply to this email.
    `,
    senderName: 'Security Team',
    senderEmail: 'security@yourcompany.com'
  },

  // Two-factor authentication template
  twoFactor: {
    subject: '🔐 Two-Factor Authentication Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; text-align: center;">🔐 2FA Verification</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Two-Factor Authentication</h2>
          <p style="color: #666; line-height: 1.6;">Your account is protected with two-factor authentication. To complete your login, please enter the verification code below:</p>
          
          <div style="background: #fff; border: 2px dashed #a8edea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <div style="font-size: 32px; font-weight: bold; color: #a8edea; letter-spacing: 8px;">{{otp}}</div>
            <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">2FA Code</p>
          </div>
          
          <p style="color: #666; line-height: 1.6;">This code will expire in <strong>{{expiryMinutes}}</strong> minutes.</p>
          
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="color: #0c5460; margin: 0; font-size: 14px;">
              <strong>🔒 Security:</strong> This extra layer of protection helps keep your account secure.
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            This is a security message from {{companyName}}. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
    text: `
🔐 Two-Factor Authentication Code

Two-Factor Authentication

Your account is protected with two-factor authentication. To complete your login, please enter the verification code below:

2FA Code: {{otp}}

This code will expire in {{expiryMinutes}} minutes.

🔒 Security: This extra layer of protection helps keep your account secure.

---
This is a security message from {{companyName}}. Please do not reply to this email.
    `,
    senderName: 'Security Team',
    senderEmail: 'security@yourcompany.com'
  }
};

async function startServer() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/otpservice', {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Initialize OTP service with minimal default templates (fallback only)
    const otpService = new SecureEmailOtp(
      new MongooseAdapter({
        connection: mongoose.connection,
        collectionName: 'otps',
      }),
      new ConsoleEmailAdapter(), // Use console adapter for testing
      new MemoryRateLimiterAdapter(),
      process.env.SERVER_SECRET || 'your-very-long-server-secret-key-here-at-least-32-chars',
      {
        // Minimal default templates (only used as fallback)
        templates: {
          subject: 'Your Verification Code',
          html: '<h1>Your verification code is: {{otp}}</h1>',
          text: 'Your verification code is: {{otp}}',
          senderName: 'Your App',
          senderEmail: 'noreply@yourapp.com'
        }
      }
    );

    // Health check endpoint
    app.get('/api/health', async (req, res) => {
      try {
        const health = await otpService.healthCheck();
        res.json({ success: true, health });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Generate OTP with template passed directly to generate function
    app.post('/api/otp/generate', async (req, res) => {
      try {
        const { email, context, templateType } = req.body;
        
        if (!email || !context) {
          return res.status(400).json({ 
            error: 'Email and context are required' 
          });
        }

        // Get template based on templateType - this is the key approach!
        let template: EmailTemplates | undefined;
        if (templateType && emailTemplates[templateType as keyof typeof emailTemplates]) {
          template = emailTemplates[templateType as keyof typeof emailTemplates];
          console.log(`📧 Using ${templateType} template for ${email}`);
        } else {
          console.log(`📧 No template specified for ${email}, will use default fallback`);
        }

        console.log(`Generating OTP for ${email} with context ${context}`);
        
        // Template is passed directly to the generate function
        const result = await otpService.generate({
          email,
          context,
          requestMeta: {
            ip: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'Unknown',
            deviceId: req.get('X-Device-ID') || 'unknown',
            platform: req.get('X-Platform') || 'web',
            browser: req.get('X-Browser') || 'unknown',
            os: req.get('X-OS') || 'unknown',
          },
          template // Template passed here - this is the primary approach!
        });

        console.log('✅ OTP generated successfully:', {
          sessionId: result.sessionId,
          expiresAt: result.expiresAt,
          isResent: result.isResent,
          templateUsed: templateType || 'default'
        });

        res.json({
          success: true,
          sessionId: result.sessionId,
          expiresAt: result.expiresAt,
          isResent: result.isResent,
          templateUsed: templateType || 'default'
        });
      } catch (error) {
        console.error('❌ OTP generation failed:', error);
        res.status(400).json({ 
          error: error.message,
          code: error.code || 'UNKNOWN_ERROR'
        });
      }
    });

    // Verify OTP endpoint
    app.post('/api/otp/verify', async (req, res) => {
      try {
        const { email, otp, context, sessionId } = req.body;
        
        if (!email || !otp || !context || !sessionId) {
          return res.status(400).json({ 
            error: 'Email, OTP, context, and sessionId are required' 
          });
        }

        console.log(`Verifying OTP for ${email} with context ${context}`);
        
        const result = await otpService.verify({
          email,
          clientHash: otp,
          context,
          sessionId,
          requestMeta: {
            ip: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'Unknown',
            deviceId: req.get('X-Device-ID') || 'unknown',
            platform: req.get('X-Platform') || 'web',
            browser: req.get('X-Browser') || 'unknown',
            os: req.get('X-OS') || 'unknown',
          },
        });

        if (result.success) {
          console.log('✅ OTP verified successfully:', {
            sessionId: result.sessionId,
            email: result.email,
            context: result.context
          });
          
          res.json({
            success: true,
            verified: true,
            sessionId: result.sessionId,
          });
        } else {
          console.log('❌ OTP verification failed');
          res.json({
            success: false,
            verified: false,
            message: 'Invalid OTP'
          });
        }
      } catch (error) {
        console.error('❌ OTP verification failed:', error);
        res.status(400).json({ 
          error: error.message,
          code: error.code || 'UNKNOWN_ERROR'
        });
      }
    });

    // Get available templates endpoint
    app.get('/api/templates', (req, res) => {
      const availableTemplates = Object.keys(emailTemplates);
      res.json({
        success: true,
        templates: availableTemplates,
        description: 'Available email template types for OTP generation'
      });
    });

    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Multi-Template OTP Server running on port ${PORT}`);
      console.log(`📊 Mongoose: Connected to database 'otpservice', collection 'otps'`);
      console.log(`🔧 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📧 Generate OTP: POST http://localhost:${PORT}/api/otp/generate`);
      console.log(`✅ Verify OTP: POST http://localhost:${PORT}/api/otp/verify`);
      console.log(`📋 Available templates: http://localhost:${PORT}/api/templates`);
      console.log(`\n📝 Template Types Available:`);
      console.log(`   - login: Login verification template`);
      console.log(`   - registration: Welcome/registration template`);
      console.log(`   - passwordReset: Password reset template`);
      console.log(`   - twoFactor: 2FA verification template`);
      console.log(`   - default: Fallback template (when no template specified)`);
      console.log(`\n💡 Key Point: Templates are passed directly to generate() function!`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
  process.exit(0);
});

startServer().catch(console.error);
