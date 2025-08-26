// MongoDB Quick Start Example
// This shows you how to tell the package to use MongoDB

import express from 'express';
import { MongoClient } from 'mongodb';
import { 
  SecureEmailOtp, 
  MongoDbAdapter,           // ← This tells the package to use MongoDB
  NodemailerAdapter, 
  MemoryRateLimiterAdapter 
} from 'secure-email-otp';

const app = express();
app.use(express.json());

async function startServer() {
  // 1. Connect to MongoDB
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  console.log('Connected to MongoDB');

  // 2. Initialize OTP service with MongoDB adapter
  const otpService = new SecureEmailOtp(
    new MongoDbAdapter({           // ← This is how you specify MongoDB
      client,                      // MongoDB client
      dbName: 'myapp',            // Your database name
      collectionName: 'otps',     // Collection name (optional, defaults to 'otps')
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
    console.log(`MongoDB: Connected to database 'myapp', collection 'otps'`);
  });
}

startServer().catch(console.error);
