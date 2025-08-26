# Secure Email OTP

[![npm version](https://badge.fury.io/js/secure-email-otp.svg)](https://badge.fury.io/js/secure-email-otp)
[![Build Status](https://github.com/yourusername/secure-email-otp/workflows/CI/badge.svg)](https://github.com/yourusername/secure-email-otp/actions)
[![Test Coverage](https://codecov.io/gh/yourusername/secure-email-otp/branch/main/graph/badge.svg)](https://codecov.io/gh/yourusername/secure-email-otp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)

A secure, developer-friendly Node.js package for email-based OTP (2FA) with enterprise-grade security controls, built in TypeScript.

## 🚀 Features

- **🔒 Cryptographically Secure**: HMAC-protected OTPs with bcrypt hashing
- **📧 Multi-Provider Email**: Nodemailer, SendGrid, Brevo, Postmark, Mailgun, Mailcub and custom adapters
- **🗄️ Database Agnostic**: Memory, MongoDB, PostgreSQL, MySQL via adapter pattern
- **⚡ Built-in Rate Limiting**: Configurable windows with Redis support
- **🛡️ Context Binding**: IP, User-Agent, device fingerprinting for security
- **📱 TypeScript First**: Full type safety with comprehensive interfaces
- **🎯 Event System**: Webhook-style events for monitoring and analytics
- **🧪 Production Ready**: Comprehensive test suite with 100% coverage

## 📦 Installation

```bash
npm install secure-email-otp
```

## ⚡ Quick Start

### Zero-Config Demo Mode

Get started instantly with demo mode (logs emails to console):

```typescript
import { createDemoInstance } from "secure-email-otp";

const otpService = createDemoInstance();

// Generate OTP (emails logged to console)
const result = await otpService.generate({
  email: "user@example.com",
  context: "login",
  requestMeta: { ip: "192.168.1.1", userAgent: "Mozilla/5.0..." },
});

// Verify OTP
const verified = await otpService.verify({
  email: "user@example.com",
  clientHash: "123456",
  context: "login",
  sessionId: result.sessionId,
  requestMeta: { ip: "192.168.1.1", userAgent: "Mozilla/5.0..." },
});
```

### Production Setup

Configure with your preferred database and email provider:

```typescript
import {
  SecureEmailOtp,
  MemoryDatabaseAdapter,
  NodemailerAdapter,
  MemoryRateLimiterAdapter,
} from "secure-email-otp";

const otpService = new SecureEmailOtp(
  new MemoryDatabaseAdapter(),
  new NodemailerAdapter({
    host: "smtp.gmail.com",
    port: 587,
    auth: { user: "your@email.com", pass: "app-password" },
  }),
  new MemoryRateLimiterAdapter(),
  "your-32-character-server-secret"
);

// Generate OTP
const result = await otpService.generate({
  email: "user@example.com",
  context: "login",
  requestMeta: { ip: "192.168.1.1", userAgent: "Mozilla/5.0..." },
});

// Verify OTP
const verified = await otpService.verify({
  email: "user@example.com",
  clientHash: "123456",
  context: "login",
  sessionId: result.sessionId,
  requestMeta: { ip: "192.168.1.1", userAgent: "Mozilla/5.0..." },
});
```

## 📚 Documentation

### Getting Started

- **[Usage Guide](./USAGE.md)** - Step-by-step tutorial with Express.js example
- **[API Reference](./API.md)** - Complete function documentation
- **[Adapters Guide](./ADAPTERS.md)** - Database, Email, and Rate Limiter adapters

### Advanced Topics

- **[Event System](./EVENTS.md)** - Webhook events and monitoring
- **[Security Model](./SECURITY.md)** - Security features and best practices
- **[FAQ](./FAQ.md)** - Common questions and solutions

## 🎯 Use Cases

- **User Authentication**: Email verification during signup
- **Password Reset**: Secure password recovery flows
- **Two-Factor Authentication**: Additional security layer
- **Account Recovery**: Device verification and account access
- **Transaction Verification**: High-value operation confirmation

## 🔧 Database Support

Choose your database with a single line change:

```typescript
// Memory (Development)
const dbAdapter = new MemoryDatabaseAdapter();

// MongoDB (Production)
const dbAdapter = new MongoDbAdapter({ client: mongoClient, dbName: "myapp" });

// PostgreSQL (Production)
const dbAdapter = new PrismaDatabaseAdapter(prismaClient);

// Mongoose (Production)
const dbAdapter = new MongooseAdapter({ connection: mongoose.connection });
```

## 📧 Email Providers

Send emails through your preferred provider:

```typescript
// Nodemailer (SMTP)
const emailProvider = new NodemailerAdapter({
  host: "smtp.gmail.com",
  port: 587,
  auth: { user: "your@email.com", pass: "app-password" },
});

// SendGrid
const emailProvider = new SendGridAdapter({ apiKey: "your-sendgrid-key" });

// Custom Provider
const emailProvider = new CustomEmailAdapter({
  sendEmail: async (to, subject, html) => {
    /* your logic */
  },
});
```

## 🔒 Security Features

- **Cryptographic OTPs**: Generated using `crypto.randomBytes()`
- **Hashed Storage**: OTPs stored as bcrypt hashes, never plaintext
- **HMAC Protection**: Each OTP signed to prevent tampering
- **Context Binding**: Bound to IP, User-Agent, device fingerprint
- **Rate Limiting**: Configurable per-user limits with time windows
- **Replay Prevention**: OTPs invalidated immediately after use
- **Audit Logging**: Complete event system for monitoring

## 🚀 Production Ready

- **TypeScript**: Full type safety with strict mode
- **Testing**: Comprehensive test suite with 100% coverage
- **Error Handling**: Specific error types for different scenarios
- **Performance**: Optimized for high-throughput applications
- **Monitoring**: Built-in event system for observability
- **Documentation**: Complete guides and API reference

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](./)
- 🐛 [Issues](https://github.com/yourusername/secure-email-otp/issues)
- 💬 [Discussions](https://github.com/yourusername/secure-email-otp/discussions)
- 📧 [Email Support](mailto:support@yourdomain.com)

---

**Ready to secure your application?** Start with the [Usage Guide](./USAGE.md) or jump straight to the [API Reference](./API.md).
