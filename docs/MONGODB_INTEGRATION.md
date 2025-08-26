# MongoDB Integration Guide

This guide shows you how to integrate the Secure Email OTP package with your MongoDB Node.js Express backend.

## 📦 Installation

First, install the package and MongoDB driver:

```bash
npm install secure-email-otp mongodb
npm install --save-dev @types/mongodb
```

## 🗄️ MongoDB Setup

### 1. Database Schema

The MongoDB adapter will automatically create the necessary indexes. Your OTP collection will have this structure:

```javascript
{
  _id: ObjectId,
  email: String,
  context: String, 
  sessionId: String,
  otpHash: String,
  hmac: String,
  requestMetaHash: String,
  expiresAt: Date,
  used: Boolean,
  attemptCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Indexes Created Automatically

- `{ email: 1, context: 1, sessionId: 1 }` - For finding specific OTPs
- `{ email: 1, context: 1, expiresAt: 1 }` - For finding active OTPs
- `{ expiresAt: 1 }` - TTL index for automatic cleanup
- `{ expiresAt: 1 }` - For manual cleanup operations

## 🚀 Basic Integration

### 1. Environment Variables

Create a `.env` file:

```bash
# MongoDB
MONGODB_URL=mongodb://localhost:27017
DB_NAME=your_database_name

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@yourdomain.com

# Security
SERVER_SECRET=your-very-long-cryptographically-secure-secret-key-at-least-32-characters

# Server
PORT=3000
```

### 2. Basic Express Setup

```typescript
import express from 'express';
import { MongoClient } from 'mongodb';
import { 
  SecureEmailOtp, 
  MongoDbAdapter, 
  NodemailerAdapter, 
  MemoryRateLimiterAdapter 
} from 'secure-email-otp';

const app = express();
app.use(express.json());

// MongoDB connection
const client = new MongoClient(process.env.MONGODB_URL!);
await client.connect();

// Initialize OTP service
const otpService = new SecureEmailOtp(
  new MongoDbAdapter({
    client,
    dbName: process.env.DB_NAME!,
    collectionName: 'otps'
  }),
  new NodemailerAdapter({
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT!),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
    from: process.env.FROM_EMAIL!,
  }),
  new MemoryRateLimiterAdapter(),
  process.env.SERVER_SECRET!
);
```

## 🔧 API Endpoints

### Generate OTP

```typescript
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
    // Handle errors...
  }
});
```

### Verify OTP

```typescript
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
    // Handle errors...
  }
});
```

## 🛡️ Security Best Practices

### 1. Environment Variables

Never hardcode sensitive information. Use environment variables:

```typescript
// ❌ Bad
const serverSecret = 'my-secret';

// ✅ Good
const serverSecret = process.env.SERVER_SECRET!;
```

### 2. Request Metadata

Always include request metadata for security:

```typescript
const requestMeta = {
  ip: req.ip || req.connection.remoteAddress,
  userAgent: req.get('User-Agent'),
  deviceId: req.get('X-Device-ID'), // If available
  platform: req.get('X-Platform'),  // If available
};
```

### 3. Error Handling

Handle specific OTP errors:

```typescript
import { OtpError, OtpErrorCode } from 'secure-email-otp';

try {
  await otpService.verify(params);
} catch (error) {
  if (error instanceof OtpError) {
    switch (error.code) {
      case OtpErrorCode.EXPIRED:
        return res.status(410).json({ error: 'OTP expired' });
      case OtpErrorCode.ATTEMPTS_EXCEEDED:
        return res.status(429).json({ error: 'Too many attempts' });
      case OtpErrorCode.RATE_LIMITED:
        return res.status(429).json({ error: 'Rate limited' });
      default:
        return res.status(400).json({ error: 'Invalid OTP' });
    }
  }
  // Handle other errors...
}
```

## 📝 Complete Example

See `examples/express-mongodb-example.ts` for a complete working example with:
- MongoDB connection and error handling
- Comprehensive API endpoints
- Security middleware
- Error handling
- Graceful shutdown
- Environment variable configuration

## 🔄 Advanced Configuration

### Custom MongoDB Collections

```typescript
const otpService = new SecureEmailOtp(
  new MongoDbAdapter({
    client,
    dbName: 'myapp',
    collectionName: 'user_otps', // Custom collection name
  }),
  // ... other adapters
);
```

### Event Handling

```typescript
const otpService = new SecureEmailOtp(
  // ... adapters
  {
    events: {
      onRequest: async (event) => {
        console.log(`OTP requested: ${event.email}`);
        // Log to your analytics service
      },
      onSend: async (event) => {
        console.log(`OTP sent: ${event.sessionId}`);
        // Track delivery metrics
      },
      onVerify: async (event) => {
        console.log(`OTP verified: ${event.email}`);
        // Update user status
      },
      onFail: async (event) => {
        console.log(`OTP failed: ${event.error?.message}`);
        // Alert on suspicious activity
      },
    },
  }
);
```

### Rate Limiting Configuration

```typescript
const otpService = new SecureEmailOtp(
  // ... adapters
  {
    rateLimit: {
      maxPerWindow: 5,           // Max 5 OTPs
      windowMs: 15 * 60 * 1000,  // per 15 minutes
    },
    maxRetries: 3,               // Max 3 verification attempts
    expiryMs: 10 * 60 * 1000,    // 10 minute expiry
  }
);
```

## 🧪 Testing

### Test with MongoDB Memory Server

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('OTP Service', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    client = new MongoClient(mongoServer.getUri());
    await client.connect();
  });

  afterAll(async () => {
    await client.close();
    await mongoServer.stop();
  });

  // Your tests...
});
```

## 🚀 Deployment

### Docker Setup

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URL=mongodb://mongo:27017
      - DB_NAME=otpservice
    depends_on:
      - mongo

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## 🔍 Monitoring

### Health Check

```typescript
app.get('/health', async (req, res) => {
  try {
    // Test MongoDB connection
    await client.db().admin().ping();
    
    res.json({
      status: 'healthy',
      mongodb: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});
```

### Cleanup Job

Set up a cron job to cleanup expired OTPs:

```typescript
import cron from 'node-cron';

// Run cleanup every hour
cron.schedule('0 * * * *', async () => {
  try {
    await otpService.cleanup();
    console.log('OTP cleanup completed');
  } catch (error) {
    console.error('OTP cleanup failed:', error);
  }
});
```

## 🤝 Support

For issues and questions:
- Check the main [README.md](../README.md)
- Review [SECURITY.md](./SECURITY.md) for security considerations
- Open an issue on GitHub

## 📚 Additional Resources

- [MongoDB Node.js Driver](https://mongodb.github.io/node-mongodb-native/)
- [Express.js Documentation](https://expressjs.com/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
