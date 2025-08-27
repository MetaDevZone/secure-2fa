import express from 'express';
import mongoose from 'mongoose';
import { 
  SecureEmailOtp, 
  MongooseAdapter,
  ConsoleAdapter, 
  MemoryRateLimiterAdapter 
} from '../src';

const app = express();
app.use(express.json());

async function startServer() {
  try {
    // 1. Connect to MongoDB with Mongoose
    await mongoose.connect('mongodb://localhost:27017/otpservice', {
      // Mongoose 8.x connection options
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB with Mongoose');

    // 2. Initialize OTP service with Mongoose adapter
    const otpService = new SecureEmailOtp(
      new MongooseAdapter({
        connection: mongoose.connection,
        collectionName: 'otps',
      }),
      new ConsoleAdapter(), // Use console adapter for testing
      new MemoryRateLimiterAdapter(),
      process.env.SERVER_SECRET || 'your-very-long-server-secret-key-here-at-least-32-chars'
    );

    // 3. Health check endpoint
    app.get('/api/health', async (req, res) => {
      try {
        const health = await otpService.healthCheck();
        res.json({ success: true, health });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 4. Generate OTP endpoint
    app.post('/api/otp/generate', async (req, res) => {
      try {
        const { email, context } = req.body;
        
        if (!email || !context) {
          return res.status(400).json({ 
            error: 'Email and context are required' 
          });
        }

        console.log(`Generating OTP for ${email} with context ${context}`);
        
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
        });

        console.log('✅ OTP generated successfully:', {
          sessionId: result.sessionId,
          expiresAt: result.expiresAt,
          isResent: result.isResent
        });

        res.json({
          success: true,
          sessionId: result.sessionId,
          expiresAt: result.expiresAt,
          isResent: result.isResent,
        });
      } catch (error) {
        console.error('❌ OTP generation failed:', error);
        res.status(400).json({ 
          error: error.message,
          code: error.code || 'UNKNOWN_ERROR'
        });
      }
    });

    // 5. Verify OTP endpoint
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

    // 6. Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Mongoose: Connected to database 'otpservice', collection 'otps'`);
      console.log(`🔧 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📧 Generate OTP: POST http://localhost:${PORT}/api/otp/generate`);
      console.log(`✅ Verify OTP: POST http://localhost:${PORT}/api/otp/verify`);
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
