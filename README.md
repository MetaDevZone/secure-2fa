# 🚀 Secure 2FA - Multi-Template OTP System

A production-ready, secure, and flexible Two-Factor Authentication (2FA) system with dynamic email templates, built with TypeScript and MongoDB.

## ✅ **Production Ready**

**Status**: 🚀 **READY FOR PRODUCTION DEPLOYMENT**

- ✅ **100% Test Success Rate** (79/79 tests passing)
- ✅ **Multi-Template Support** with dynamic template selection
- ✅ **Rate Limiting** per email address
- ✅ **Robust Date Validation** for MongoDB compatibility
- ✅ **Comprehensive Error Handling**
- ✅ **TypeScript Support** with full type safety
- ✅ **Health Monitoring** and built-in checks

---

## 🎯 Key Features

### 🔐 **Security First**

- **Secure OTP Generation**: Cryptographically secure random OTP codes
- **Rate Limiting**: Configurable rate limiting per email (3 requests per 15 minutes)
- **HMAC Validation**: Cryptographic integrity checks
- **Session Management**: Proper session ID handling
- **Input Validation**: Comprehensive parameter validation

### 📧 **Dynamic Email Templates**

- **Template at Generation Time**: Pass templates directly to `generate()` function
- **Multiple Template Types**: Login, registration, password reset, 2FA
- **Custom Templates**: Create your own templates for specific needs
- **Template Variables**: Support for dynamic content (OTP, expiry time, etc.)
- **HTML & Text Support**: Both rich HTML and plain text email formats

### 🏗️ **Flexible Architecture**

- **Adapter Pattern**: Pluggable database, email, and rate limiter adapters
- **MongoDB Integration**: Robust database adapter with date validation
- **Multiple Email Providers**: Console, Brevo, Mailgun, Postmark, custom
- **Memory Rate Limiter**: In-memory rate limiting for development/testing
- **Event System**: Comprehensive event handling and monitoring

### 🔧 **Developer Experience**

- **TypeScript**: Full type safety and IntelliSense support
- **Comprehensive Testing**: 79 tests covering all functionality
- **Error Handling**: Detailed error messages and logging
- **Health Checks**: Built-in health monitoring
- **Documentation**: Complete guides and examples

---

## 🚀 Quick Start

### Installation

```bash
npm install secure-2fa
```

### Basic Usage

```typescript
import {
  SecureEmailOtp,
  MongooseAdapter,
  ConsoleEmailAdapter,
  MemoryRateLimiterAdapter,
} from "secure-2fa";
import mongoose from "mongoose";

// Connect to MongoDB
await mongoose.connect("mongodb://localhost:27017/your-database");

// Initialize OTP service
const otpService = new SecureEmailOtp(
  new MongooseAdapter({ connection: mongoose.connection }),
  new ConsoleEmailAdapter(), // Use console for development
  new MemoryRateLimiterAdapter(),
  "your-server-secret-key-here-at-least-32-chars-long"
);

// Generate OTP with custom template
const result = await otpService.generate({
  email: "user@example.com",
  context: "login",
  requestMeta: { ip: "127.0.0.1", userAgent: "Mozilla/5.0..." },
  template: {
    subject: "🔐 Your Login Code",
    html: "<h1>Code: {{otp}}</h1>",
    text: "Code: {{otp}}",
  },
});

console.log("OTP sent! Session ID:", result.sessionId);
```

### Verify OTP

```typescript
// Client sends hashed OTP
const clientHash = hashOtp("123456"); // Client-side hashing

const verification = await otpService.verify({
  email: "user@example.com",
  clientHash,
  context: "login",
  sessionId: result.sessionId,
  requestMeta: { ip: "127.0.0.1", userAgent: "Mozilla/5.0..." },
});

if (verification.success) {
  console.log("OTP verified successfully!");
}
```

---

## 📧 Multi-Template System

### Template at Generation Time

Templates are passed directly to the `generate()` function for maximum flexibility:

```typescript
// Define templates for different purposes
const templates = {
  login: {
    subject: "🔐 Login Verification Code",
    html: "<h1>Login Code: {{otp}}</h1>",
    text: "Login Code: {{otp}}",
    senderName: "Security Team",
    senderEmail: "security@company.com",
  },

  registration: {
    subject: "🎉 Welcome! Verify Your Email",
    html: "<h1>Welcome! Your code: {{otp}}</h1>",
    text: "Welcome! Your code: {{otp}}",
    senderName: "Welcome Team",
    senderEmail: "welcome@company.com",
  },
};

// Use different templates based on context
const context = "login";
const template = templates[context];

const result = await otpService.generate({
  email: "user@example.com",
  context,
  requestMeta: { ip: "127.0.0.1", userAgent: "Mozilla/5.0..." },
  template,
});
```

### Template Variables

All templates support dynamic variables:

| Variable            | Description          | Example                 |
| ------------------- | -------------------- | ----------------------- |
| `{{otp}}`           | The actual OTP code  | `123456`                |
| `{{email}}`         | User's email address | `user@example.com`      |
| `{{context}}`       | OTP context          | `login`, `registration` |
| `{{expiryMinutes}}` | Expiration time      | `2 minutes`             |
| `{{companyName}}`   | Company name         | `Your Company`          |
| `{{supportEmail}}`  | Support email        | `support@company.com`   |

---

## 🔧 Configuration

### Rate Limiting

```typescript
const otpService = new SecureEmailOtp(
  dbAdapter,
  emailProvider,
  rateLimiter,
  serverSecret,
  {
    rateLimit: {
      maxPerWindow: 3, // 3 requests per window
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
  }
);
```

### OTP Settings

```typescript
const otpService = new SecureEmailOtp(
  dbAdapter,
  emailProvider,
  rateLimiter,
  serverSecret,
  {
    otpLength: 6, // 6-digit OTP
    expiryMs: 2 * 60 * 1000, // 2 minutes
    maxRetries: 5, // 5 verification attempts
    strictMode: true, // Strict metadata checking
  }
);
```

### Email Providers

#### Console (Development)

```typescript
import { ConsoleEmailAdapter } from "secure-2fa";

const emailProvider = new ConsoleEmailAdapter();
```

#### Brevo (Production)

```typescript
import { BrevoAdapter } from "secure-2fa";

const emailProvider = new BrevoAdapter({
  apiKey: "your-brevo-api-key",
  senderEmail: "noreply@yourcompany.com",
  senderName: "Your Company",
});
```

#### Mailgun (Production)

```typescript
import { MailgunAdapter } from "secure-2fa";

const emailProvider = new MailgunAdapter({
  apiKey: "your-mailgun-api-key",
  domain: "your-domain.com",
  senderEmail: "noreply@yourdomain.com",
});
```

---

## 🧪 Testing

### Run Tests

```bash
npm test
```

### Test Coverage

- ✅ **OTP Generation**: Secure OTP creation and validation
- ✅ **Email Templates**: Template rendering and variable substitution
- ✅ **Rate Limiting**: Rate limit enforcement and reset
- ✅ **Database Operations**: MongoDB integration and date validation
- ✅ **Error Handling**: Comprehensive error scenarios
- ✅ **Health Checks**: System health monitoring

### Test Results

```
Test Suites: 7 passed, 7 total
Tests:       79 passed, 79 total
Snapshots:   0 total
Time:        19.111 s
```

---

## 📚 Documentation

### 📖 **Complete Documentation**

- **[Multi-Template Guide](MULTI_TEMPLATE_README.md)** - Comprehensive template system documentation
- **[Mongoose Fix Guide](MONGOOSE_FIX_README.md)** - Date validation and MongoDB compatibility
- **[Production Readiness Report](PRODUCTION_READINESS_REPORT.md)** - Production deployment guide

### 🎯 **Examples**

- **[Multi-Template Example](examples/multi-template-example.ts)** - Full Express server with multiple templates
- **[Template at Generation Example](examples/template-at-generation-example.ts)** - Simple usage demonstration
- **[Brevo Integration](examples/brevo-example.ts)** - Production email provider setup

### 🔧 **API Reference**

- **[Types](src/types/index.ts)** - Complete TypeScript type definitions
- **[Core Service](src/core/secure-email-otp.ts)** - Main OTP service implementation
- **[Adapters](src/adapters/)** - Database, email, and rate limiter adapters

---

## 🚀 Production Deployment

### ✅ **Pre-Deployment Checklist**

- [x] All tests passing (79/79)
- [x] Rate limiting configured
- [x] Email provider configured
- [x] Database connection stable
- [x] Error handling implemented
- [x] Monitoring configured
- [x] Health checks working

### 🔧 **Deployment Steps**

1. **Install Dependencies**

   ```bash
   npm install secure-2fa
   ```

2. **Configure Email Provider**

   ```typescript
   // Use production email provider
   const emailProvider = new BrevoAdapter({
     apiKey: process.env.BREVO_API_KEY,
     senderEmail: "noreply@yourcompany.com",
   });
   ```

3. **Set Up Monitoring**

   ```typescript
   // Health check endpoint
   app.get("/health", async (req, res) => {
     const health = await otpService.healthCheck();
     res.json(health);
   });
   ```

4. **Deploy and Monitor**
   - Monitor OTP generation success rates
   - Track rate limiting effectiveness
   - Watch for date validation errors
   - Monitor email delivery success

---

## 🔒 Security Features

### ✅ **Implemented Security Measures**

- **Rate Limiting**: Prevents abuse and spam
- **OTP Hashing**: Secure bcrypt hashing of OTPs
- **HMAC Validation**: Cryptographic integrity checks
- **Session Management**: Proper session ID handling
- **Input Validation**: Comprehensive parameter validation
- **Error Sanitization**: No sensitive data in error messages
- **Date Validation**: Robust MongoDB date handling

### 🛡️ **Best Practices**

- Use HTTPS in production
- Implement proper error handling
- Monitor for suspicious activity
- Regular security audits
- Keep dependencies updated

---

## 🤝 Contributing

### Development Setup

```bash
git clone <repository>
cd secure-2fa
npm install
npm run build
npm test
```

### Code Quality

- TypeScript for type safety
- Jest for testing
- ESLint for code quality
- Prettier for formatting

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

### Getting Help

1. **Documentation**: Check the comprehensive documentation
2. **Examples**: Review the example files
3. **Tests**: Run the test suite to verify functionality
4. **Issues**: Report bugs and feature requests

### Common Issues

| Issue                  | Solution                                                |
| ---------------------- | ------------------------------------------------------- |
| Date validation errors | Check [Mongoose Fix Guide](MONGOOSE_FIX_README.md)      |
| Template not working   | Review [Multi-Template Guide](MULTI_TEMPLATE_README.md) |
| Rate limiting issues   | Check rate limit configuration                          |
| Email not sending      | Verify email provider setup                             |

---

## 🎉 **Production Ready**

The Secure 2FA system is **production ready** with:

- ✅ **100% Test Success Rate**
- ✅ **Comprehensive Error Handling**
- ✅ **Robust Rate Limiting**
- ✅ **Flexible Template System**
- ✅ **Production-Grade Security**
- ✅ **Complete Documentation**

**Status**: 🚀 **READY FOR PRODUCTION DEPLOYMENT**
