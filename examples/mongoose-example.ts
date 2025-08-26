// Mongoose Example
// This shows you how to use the OTP package with Mongoose ODM

import express from 'express';
import mongoose from 'mongoose';
import { 
  SecureEmailOtp, 
  MongooseAdapter,           // ← This tells the package to use Mongoose
  NodemailerAdapter, 
  MemoryRateLimiterAdapter 
} from 'secure-email-otp';

const app = express();
app.use(express.json());

async function startServer() {
  // 1. Connect to MongoDB with Mongoose
  await mongoose.connect('mongodb://localhost:27017/otpservice');
  console.log('Connected to MongoDB with Mongoose');

  // 2. Initialize OTP service with Mongoose adapter
  const otpService = new SecureEmailOtp(
    new MongooseAdapter({           // ← This is how you specify Mongoose
      connection: mongoose.connection,
      collectionName: 'otps',       // Optional: defaults to 'otps'
    }),
    new NodemailerAdapter({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    }),
    new MemoryRateLimiterAdapter(),
    process.env.SERVER_SECRET!
  );

  // 3. Your API routes
  app.post('/api/otp/generate', async (req, res) => {
    try {
      const { email, context } = req.body;
      
      const result = await otpService.generate({
        email,
        context,
        requestMeta: {
          ip: req.ip,
          userAgent: req.get('User-Agent') || 'Unknown',
        },
      });

      res.json({
        success: true,
        sessionId: result.sessionId,
        expiresAt: result.expiresAt,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/otp/verify', async (req, res) => {
    try {
      const { email, otp, context, sessionId } = req.body;
      
      const result = await otpService.verify({
        email,
        clientHash: otp,
        context,
        sessionId,
        requestMeta: {
          ip: req.ip,
          userAgent: req.get('User-Agent') || 'Unknown',
        },
      });

      res.json({
        success: true,
        verified: result.verified,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // 4. Start server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Mongoose: Connected to database 'otpservice', collection 'otps'`);
  });
}

startServer().catch(console.error);
