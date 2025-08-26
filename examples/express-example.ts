import express from 'express';
import { 
  SecureEmailOtp, 
  MemoryDatabaseAdapter, 
  NodemailerAdapter, 
  MemoryRateLimiterAdapter,
  OtpError,
  OtpErrorCode 
} from '../src';

const app = express();
app.use(express.json());

// Initialize OTP service
const dbAdapter = new MemoryDatabaseAdapter();
const emailProvider = new NodemailerAdapter({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env['EMAIL_USER'] || 'ahsant670@gmail.com',
    pass: process.env['EMAIL_PASS'] || 'mzmdcuuewysgtgul',
  },
  from: 'noreply@yourdomain.com',
});
const rateLimiter = new MemoryRateLimiterAdapter();

const otpService = new SecureEmailOtp(
  dbAdapter,
  emailProvider,
  rateLimiter,
  process.env['SERVER_SECRET'] || 'your-very-long-server-secret-key-here',
  {
    otpLength: 6,
    expiryMs: 10 * 60 * 1000, // 10 minutes (increased from 2 minutes)
    maxRetries: 5,
    strictMode: false, // Disabled for easier testing
    rateLimit: {
      maxPerWindow: 3,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
    events: {
      onRequest: async (event) => {
        console.log('OTP requested:', event.email, event.context);
      },
      onSend: async (event) => {
        console.log('OTP sent:', event.email, event.sessionId);
      },
      onVerify: async (event) => {
        console.log('OTP verified:', event.email, event.sessionId);
      },
      onFail: async (event) => {
        console.log('OTP failed:', event.email, event.error?.message);
      },
    },
    templates: {
      subject: 'Your OTP for login',
      html: `
        <p>Hi&nbsp; {{email}}</p>
<p>We received a request to reset your password for your account. If you did not make this request, you can safely ignore this email.</p>
<p>To reset your password, please use <span style="color: var(--editor-text-color); font-size: 1em; background-color: var(--editor-background-color); text-align: var(--bs-body-text-align);"> <strong>&nbsp;{{otp}}&nbsp;</strong></span> <span style="background-color: var(--editor-background-color); color: var(--editor-text-color); font-size: 1em; font-weight: var(--bs-body-font-weight); text-align: var(--bs-body-text-align);">to verify your email and reset password.</span></p>
<p><span style="background-color: var(--editor-background-color); color: var(--editor-text-color); font-size: 1em; font-weight: var(--bs-body-font-weight); text-align: var(--bs-body-text-align);">Regards,</span></p>
<p><span style="background-color: var(--editor-background-color); color: var(--editor-text-color); font-size: 1em; font-weight: var(--bs-body-font-weight); text-align: var(--bs-body-text-align);">Dynamite Lifestyle Team</span></p>
      `,
      text: `
        Hi {{email}}
        We received a request to reset your password for your account. If you did not make this request, you can safely ignore this email.
        To reset your password, please use {{otp}} to verify your email and reset password.
        Regards,
        Dynamite Lifestyle Team
      `,
      senderName: 'Dynamite Lifestyle',
      senderEmail: 'info@dynamitelifestyle.com',
    },

  }


);

// Helper function to extract request metadata
function getRequestMeta(req: express.Request) {
  return {
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    deviceId: req.get('X-Device-ID') || 'unknown',
    platform: req.get('X-Platform') || 'web',
    browser: req.get('X-Browser') || 'unknown',
    os: req.get('X-OS') || 'unknown',
  };
}

// Generate OTP endpoint
app.post('/api/otp/generate', async (req, res) => {
  try {
    const { email, context = 'login' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('Generating OTP for:', { email, context });

    const requestMeta = getRequestMeta(req);
    
    const result = await otpService.generate({
      email,
      context,
      requestMeta,
    });

    // For debugging: Include OTP in response (remove in production)
    const debugOtp = result.otp || 'OTP sent via email';

    console.log('OTP generated successfully:', {
      email,
      sessionId: result.sessionId,
      expiresAt: result.expiresAt,
      isResent: result.isResent,
      debugOtp
    });

    return res.json({
      success: true,
      sessionId: result.sessionId,
      expiresAt: result.expiresAt,
      isResent: result.isResent,
      message: result.isResent 
        ? 'OTP resent successfully' 
        : 'OTP sent successfully',
      debug: {
        otp: debugOtp,
        note: 'This is for debugging only. Remove in production.'
      }
    });
  } catch (error) {
    console.error('OTP generation error:', error);
    
    if (error instanceof OtpError) {
      switch (error.code) {
        case OtpErrorCode.RATE_LIMITED:
          return res.status(429).json({ 
            error: 'Too many requests. Please try again later.',
            retryAfter: 900, // 15 minutes
          });
        case OtpErrorCode.EMAIL_SEND_FAILED:
          return res.status(500).json({ 
            error: 'Failed to send OTP. Please try again.',
          });
        default:
          return res.status(400).json({ error: error.message });
      }
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify OTP endpoint
app.post('/api/otp/verify', async (req, res) => {
  try {
    const { email, otp, context = 'login', sessionId } = req.body;

    if (!email || !otp || !sessionId) {
      return res.status(400).json({ 
        error: 'Email, OTP, and sessionId are required' 
      });
    }

    console.log('Verifying OTP:', { email, otp, context, sessionId });

    const requestMeta = getRequestMeta(req);
    
    const result = await otpService.verify({
      email,
      clientHash: otp,
      context,
      sessionId,
      requestMeta,
    });

    console.log('OTP verification successful:', { email, sessionId });

    return res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        email: result.email,
        context: result.context,
        sessionId: result.sessionId,
      },
    });
  } catch (error) {
    console.error('OTP verification error details:', {
      error: error instanceof OtpError ? error.code : 'Unknown',
      message: error instanceof OtpError ? error.message : (error as Error).message,
      email: req.body.email,
      sessionId: req.body.sessionId,
      context: req.body.context
    });

    if (error instanceof OtpError) {
      switch (error.code) {
        case OtpErrorCode.EXPIRED:
          return res.status(400).json({ 
            error: 'OTP has expired. Please request a new one.',
            code: 'EXPIRED'
          });
        case OtpErrorCode.INVALID:
          return res.status(400).json({ 
            error: 'Invalid OTP. Please check and try again.',
            code: 'INVALID'
          });
        case OtpErrorCode.ATTEMPTS_EXCEEDED:
          return res.status(400).json({ 
            error: 'Too many failed attempts. OTP is now locked.',
            code: 'ATTEMPTS_EXCEEDED'
          });
        case OtpErrorCode.ALREADY_USED:
          return res.status(400).json({ 
            error: 'OTP has already been used.',
            code: 'ALREADY_USED'
          });
        case OtpErrorCode.META_MISMATCH:
          return res.status(400).json({ 
            error: 'Request context mismatch.',
            code: 'META_MISMATCH'
          });
        default:
          return res.status(400).json({ 
            error: error.message,
            code: error.code
          });
      }
    }
    
    console.error('OTP verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Cleanup endpoint (for maintenance)
app.post('/api/otp/cleanup', async (_req, res) => {
  try {
    await otpService.cleanup();
    res.json({ success: true, message: 'Cleanup completed' });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  });
});

const PORT = process.env['PORT'] || 3000;
app.listen(PORT, () => {
  console.log(`OTP service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

export default app;
