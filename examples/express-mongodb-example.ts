import express, { Request, Response } from 'express';
import { MongoClient } from 'mongodb';
import { 
  SecureEmailOtp, 
  MongoDbAdapter, 
  NodemailerAdapter, 
  MemoryRateLimiterAdapter,
  OtpError,
  OtpErrorCode,
  RequestMeta
} from '../src';

// Types for request bodies
interface GenerateOtpRequest {
  email: string;
  context: string;
}

interface VerifyOtpRequest {
  email: string;
  otp: string;
  context: string;
  sessionId: string;
}

// Helper function to extract request metadata
function extractRequestMeta(req: Request): RequestMeta {
  return {
    ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
    userAgent: req.get('User-Agent') || 'Unknown',
    deviceId: req.get('X-Device-ID') || 'unknown',
    platform: req.get('X-Platform') || 'web',
    browser: req.get('X-Browser') || 'unknown',
    os: req.get('X-OS') || 'unknown',
  };
}

async function createApp() {
  const app = express();
  app.use(express.json());
  app.set('trust proxy', true); // For proper IP extraction

  // MongoDB connection
  const mongoUrl = process.env['MONGODB_URL'] || 'mongodb://localhost:27017';
  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }

  // Initialize adapters
  const dbAdapter = new MongoDbAdapter({
    client,
    dbName: process.env['DB_NAME'] || 'otpservice',
    collectionName: 'otps',
  });

  const emailProvider = new NodemailerAdapter({
    host: process.env['SMTP_HOST'] || 'localhost',
    port: parseInt(process.env['SMTP_PORT'] || '587'),
    secure: process.env['SMTP_SECURE'] === 'true',
    auth: {
      user: process.env['SMTP_USER'] || '',
      pass: process.env['SMTP_PASS'] || '',
    },
    from: process.env['FROM_EMAIL'] || 'noreply@yourdomain.com',
  });

  const rateLimiter = new MemoryRateLimiterAdapter();

  // Initialize OTP service
  const otpService = new SecureEmailOtp(
    dbAdapter,
    emailProvider,
    rateLimiter,
    process.env['SERVER_SECRET'] || 'your-very-long-server-secret-key-here',
    {
      otpLength: 6,
      expiryMs: 5 * 60 * 1000, // 5 minutes
      maxRetries: 5,
      strictMode: true,
      rateLimit: {
        maxPerWindow: 3,
        windowMs: 15 * 60 * 1000, // 15 minutes
      },
      templates: {
        subject: 'Your Verification Code',
        senderName: 'Your App',
        senderEmail: process.env['FROM_EMAIL'] || 'noreply@yourdomain.com',
      },
      events: {
        onRequest: async (event) => {
          console.log(`[${new Date().toISOString()}] OTP requested for ${event.email} (context: ${event.context})`);
        },
        onSend: async (event) => {
          console.log(`[${new Date().toISOString()}] OTP sent to ${event.email} (session: ${event.sessionId})`);
        },
        onVerify: async (event) => {
          console.log(`[${new Date().toISOString()}] OTP verified for ${event.email} (session: ${event.sessionId})`);
        },
        onFail: async (event) => {
          console.log(`[${new Date().toISOString()}] OTP failed for ${event.email}: ${event.error?.message}`);
        },
      },
    }
  );

  // Routes
  
  /**
   * Generate OTP endpoint
   * POST /api/otp/generate
   * Body: { email: string, context: string }
   */
  app.post('/api/otp/generate', async (req: Request, res: Response) => {
    try {
      const { email, context }: GenerateOtpRequest = req.body;

      if (!email || !context) {
        return res.status(400).json({
          success: false,
          error: 'Email and context are required',
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format',
        });
      }

      const requestMeta = extractRequestMeta(req);

      const result = await otpService.generate({
        email,
        context,
        requestMeta,
      });

      res.status(200).json({
        success: true,
        data: {
          sessionId: result.sessionId,
          expiresAt: result.expiresAt,
          message: 'OTP sent successfully',
        },
      });

    } catch (error) {
      console.error('Generate OTP error:', error);

      if (error instanceof OtpError) {
        let statusCode = 400;
        let message = error.message;

        switch (error.code) {
          case OtpErrorCode.RATE_LIMITED:
            statusCode = 429;
            message = 'Rate limit exceeded. Please try again later.';
            break;
          case OtpErrorCode.INVALID:
            statusCode = 400;
            message = 'Invalid request parameters.';
            break;
          default:
            statusCode = 400;
        }

        return res.status(statusCode).json({
          success: false,
          error: message,
          code: error.code,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  /**
   * Verify OTP endpoint
   * POST /api/otp/verify
   * Body: { email: string, otp: string, context: string, sessionId: string }
   */
  app.post('/api/otp/verify', async (req: Request, res: Response) => {
    try {
      const { email, otp, context, sessionId }: VerifyOtpRequest = req.body;

      if (!email || !otp || !context || !sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Email, OTP, context, and sessionId are required',
        });
      }

      const requestMeta = extractRequestMeta(req);

      const result = await otpService.verify({
        email,
        clientHash: otp,
        context,
        sessionId,
        requestMeta,
      });

      res.status(200).json({
        success: true,
        data: {
          success: result.success,
          message: 'OTP verified successfully',
        },
      });

    } catch (error) {
      console.error('Verify OTP error:', error);

      if (error instanceof OtpError) {
        let statusCode = 400;
        let message = error.message;

        switch (error.code) {
          case OtpErrorCode.EXPIRED:
            statusCode = 410;
            message = 'OTP has expired. Please request a new one.';
            break;
          case OtpErrorCode.INVALID:
            statusCode = 400;
            message = 'Invalid OTP code.';
            break;
          case OtpErrorCode.ATTEMPTS_EXCEEDED:
            statusCode = 429;
            message = 'Too many failed attempts. Please request a new OTP.';
            break;
          case OtpErrorCode.META_MISMATCH:
            statusCode = 403;
            message = 'Request context mismatch. Security violation detected.';
            break;
          case OtpErrorCode.INVALID:
            statusCode = 404;
            message = 'OTP not found or already used.';
            break;
          default:
            statusCode = 400;
        }

        return res.status(statusCode).json({
          success: false,
          error: message,
          code: error.code,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  /**
   * Cleanup expired OTPs endpoint
   * POST /api/otp/cleanup
   */
  app.post('/api/otp/cleanup', async (req: Request, res: Response) => {
    try {
      await otpService.cleanup();
      
      res.status(200).json({
        success: true,
        message: 'Expired OTPs cleaned up successfully',
      });
    } catch (error) {
      console.error('Cleanup error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to cleanup expired OTPs',
      });
    }
  });

  /**
   * Health check endpoint
   * GET /api/health
   */
  app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'OTP service is healthy',
      timestamp: new Date().toISOString(),
    });
  });

  // Error handling middleware
  app.use((error: Error, req: Request, res: Response, next: any) => {
    console.error('Unhandled error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await client.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await client.close();
    process.exit(0);
  });

  return app;
}

// Start the server
async function startServer() {
  try {
    const app = await createApp();
    const PORT = process.env['PORT'] || 3000;
    
    app.listen(PORT, () => {
      console.log(`OTP service running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Only start server if this file is run directly
if (require.main === module) {
  startServer();
}

export { createApp };
