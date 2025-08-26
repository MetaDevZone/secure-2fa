# Secure Email OTP

A secure, developer-friendly Node.js package for email-based OTP (2FA) with strong security controls, built in TypeScript.

## 🚀 Features

- **🔒 Secure OTP Generation**: Cryptographically secure OTPs with HMAC protection
- **📧 Multiple Email Providers**: Support for Nodemailer, SendGrid, and custom providers
- **🗄️ Flexible Database**: Works with any database via adapter pattern (Prisma, Mongoose, etc.)
- **⚡ Rate Limiting**: Built-in rate limiting with configurable windows
- **🛡️ Security Controls**: Context binding, replay prevention, audit logging
- **📱 TypeScript First**: Full TypeScript support with comprehensive types
- **🎯 Event System**: Webhook-style events for monitoring and analytics
- **🧪 Tested**: Comprehensive test suite with high coverage

## 📦 Installation

```bash
npm install secure-email-otp
```

## 🏃‍♂️ Quick Start

### Basic Setup

```typescript
import {
  SecureEmailOtp,
  MemoryDatabaseAdapter,
  NodemailerAdapter,
  MemoryRateLimiterAdapter,
} from "secure-email-otp";

// Initialize adapters
const dbAdapter = new MemoryDatabaseAdapter();
const emailProvider = new NodemailerAdapter({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "your-email@gmail.com",
    pass: "your-app-password",
  },
});
const rateLimiter = new MemoryRateLimiterAdapter();

// Create OTP service
const otpService = new SecureEmailOtp(
  dbAdapter,
  emailProvider,
  rateLimiter,
  "your-very-long-server-secret-key-here",
  {
    otpLength: 6,
    expiryMs: 2 * 60 * 1000, // 2 minutes
    maxRetries: 5,
    strictMode: true,
  }
);

// Generate OTP
const result = await otpService.generate({
  email: "user@example.com",
  context: "login",
  requestMeta: {
    ip: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
    deviceId: "device-123",
  },
});

// Verify OTP
const verification = await otpService.verify({
  email: "user@example.com",
  clientHash: "123456",
  context: "login",
  sessionId: result.sessionId,
  requestMeta: {
    ip: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
    deviceId: "device-123",
  },
});
```

### Choose Your Database

```typescript
import {
  SecureEmailOtp,
  MemoryDatabaseAdapter, // For development/testing
  MongoDbAdapter, // For MongoDB (native driver)
  MongooseAdapter, // For MongoDB (Mongoose ODM)
  PrismaDatabaseAdapter, // For PostgreSQL/MySQL/SQLite
  NodemailerAdapter,
  MemoryRateLimiterAdapter,
} from "secure-email-otp";

// Development (Memory)
const dbAdapter = new MemoryDatabaseAdapter();

// Production (MongoDB - native driver)
const dbAdapter = new MongoDbAdapter({
  client: mongoClient,
  dbName: "myapp",
  collectionName: "otps",
});

// Production (MongoDB - Mongoose ODM)
const dbAdapter = new MongooseAdapter({
  connection: mongoose.connection,
  collectionName: "otps",
});

// Production (PostgreSQL/MySQL with Prisma)
const dbAdapter = new PrismaDatabaseAdapter(prismaClient);
```

**📖 See [DATABASE_ADAPTERS.md](docs/DATABASE_ADAPTERS.md) for detailed database setup guides.**

## 🔧 Configuration

### Basic Configuration

```typescript
const config = {
  otpLength: 6, // OTP length (4-10 digits)
  expiryMs: 2 * 60 * 1000, // OTP expiry time (2 minutes)
  maxRetries: 5, // Max verification attempts
  strictMode: true, // Enable strict context binding
  rateLimit: {
    maxPerWindow: 3, // Max OTPs per window
    windowMs: 15 * 60 * 1000, // Rate limit window (15 minutes)
  },
  templates: {
    subject: "Your Verification Code",
    senderName: "Your App",
    senderEmail: "noreply@yourdomain.com",
  },
  events: {
    onRequest: async (event) => {
      /* ... */
    },
    onSend: async (event) => {
      /* ... */
    },
    onVerify: async (event) => {
      /* ... */
    },
    onFail: async (event) => {
      /* ... */
    },
  },
};
```

### Email Providers

#### Nodemailer (SMTP)

```typescript
import { NodemailerAdapter } from "secure-email-otp";

const emailProvider = new NodemailerAdapter({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "your-email@gmail.com",
    pass: "your-app-password",
  },
  from: "noreply@yourdomain.com",
});
```

#### SendGrid

```typescript
import { SendGridAdapter } from "secure-email-otp";

const emailProvider = new SendGridAdapter({
  apiKey: "your-sendgrid-api-key",
  from: "noreply@yourdomain.com",
});
```

### Database Adapters

#### Memory (Development/Testing)

```typescript
import { MemoryDatabaseAdapter } from "secure-email-otp";

const dbAdapter = new MemoryDatabaseAdapter();
```

#### Prisma (Production)

```typescript
import { PrismaDatabaseAdapter } from "secure-email-otp";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const dbAdapter = new PrismaDatabaseAdapter(prisma);
```

## 🔒 Security Features

### OTP Security

- **Cryptographically Secure**: Uses Node.js `crypto.randomBytes()` for OTP generation
- **Hashed Storage**: OTPs are stored as bcrypt hashes, never in plain text
- **HMAC Protection**: Each OTP is signed with HMAC to prevent tampering
- **Session Binding**: OTPs are bound to specific sessions and contexts

### Context Binding

- **Request Metadata**: Binds OTPs to IP, User-Agent, device info
- **Session Isolation**: Each OTP is tied to a unique session ID
- **Replay Prevention**: OTPs are invalidated immediately after use
- **Strict Mode**: Optional strict context validation

### Rate Limiting

- **Per-User Limits**: Configurable rate limits per email/context
- **Time Windows**: Sliding window rate limiting
- **Automatic Cleanup**: Expired OTPs are automatically cleaned up

## 📊 Event System

Monitor OTP lifecycle with event handlers:

```typescript
const otpService = new SecureEmailOtp(/* ... */, {
  events: {
    onRequest: async (event) => {
      console.log('OTP requested:', event.email, event.context);
      // Log to analytics, audit trail, etc.
    },
    onSend: async (event) => {
      console.log('OTP sent:', event.email, event.sessionId);
      // Track delivery success
    },
    onVerify: async (event) => {
      console.log('OTP verified:', event.email, event.sessionId);
      // Update user status, log success
    },
    onFail: async (event) => {
      console.log('OTP failed:', event.email, event.error?.message);
      // Alert on suspicious activity
    },
  },
});
```

## 🚨 Error Handling

The package provides specific error types for different failure scenarios:

```typescript
import { OtpError, OtpErrorCode } from "secure-email-otp";

try {
  await otpService.verify(/* ... */);
} catch (error) {
  if (error instanceof OtpError) {
    switch (error.code) {
      case OtpErrorCode.EXPIRED:
        // OTP has expired
        break;
      case OtpErrorCode.INVALID:
        // Invalid OTP
        break;
      case OtpErrorCode.ATTEMPTS_EXCEEDED:
        // Too many failed attempts
        break;
      case OtpErrorCode.RATE_LIMITED:
        // Rate limit exceeded
        break;
      case OtpErrorCode.META_MISMATCH:
        // Request context mismatch
        break;
    }
  }
}
```

## 🧪 Testing

Run the test suite:

```bash
npm test
npm run test:coverage
```

## 📚 Examples

See the `examples/` directory for complete implementation examples:

- [Express.js Example](./examples/express-example.ts)
- [Next.js Integration](./examples/nextjs-example.ts)
- [Custom Email Provider](./examples/custom-email-provider.ts)

## 🔧 API Reference

### SecureEmailOtp

#### Constructor

```typescript
new SecureEmailOtp(
  dbAdapter: DatabaseAdapter,
  emailProvider: EmailProvider,
  rateLimiter: RateLimiterAdapter,
  serverSecret: string,
  config?: OtpConfig
);
```

##### generate(params)

Generate and send an OTP.

```typescript
const result = await otpService.generate({
  email: string,
  context: string,
  requestMeta: RequestMeta,
});
```

Returns: `Promise<OtpGenerationResult>`

##### verify(params)

Verify an OTP.

```typescript
const result = await otpService.verify({
  email: string,
  clientHash: string,
  context: string,
  sessionId: string,
  requestMeta: RequestMeta,
});
```

Returns: `Promise<OtpVerificationResult>`

##### cleanup()

Clean up expired OTPs.

```typescript
await otpService.cleanup();
```

## 🆘 Support

- 📖 [Documentation](./docs/)
- 🐛 [Issues](https://github.com/yourusername/secure-email-otp/issues)
- 💬 [Discussions](https://github.com/yourusername/secure-email-otp/discussions)

## 🔗 Related

- [Prisma](https://prisma.io/) - Database toolkit
- [Nodemailer](https://nodemailer.com/) - Email sending
- [SendGrid](https://sendgrid.com/) - Email delivery
- [bcrypt](https://github.com/dcodeIO/bcrypt.js) - Password hashing

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.
