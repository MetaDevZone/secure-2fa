# Security Model

Complete guide to the security features and best practices in Secure Email OTP.

## 📋 Table of Contents

- [Security Overview](#security-overview)
- [Cryptographic Security](#cryptographic-security)
- [Context Binding](#context-binding)
- [Rate Limiting](#rate-limiting)
- [Replay Prevention](#replay-prevention)
- [Audit Logging](#audit-logging)
- [Production Security](#production-security)
- [Security Best Practices](#security-best-practices)

## 🔒 Security Overview

Secure Email OTP implements enterprise-grade security controls to protect against common OTP vulnerabilities:

- **Cryptographic OTP Generation**: Cryptographically secure random OTPs
- **Hashed Storage**: OTPs stored as bcrypt hashes, never plaintext
- **HMAC Protection**: Each OTP signed to prevent tampering
- **Context Binding**: OTPs bound to specific request metadata
- **Rate Limiting**: Configurable rate limits to prevent abuse
- **Replay Prevention**: OTPs invalidated immediately after use
- **Audit Logging**: Complete event system for monitoring

## 🔐 Cryptographic Security

### OTP Generation

OTPs are generated using cryptographically secure random numbers:

```typescript
// Uses Node.js crypto.randomBytes() for secure random generation
const otp = crypto.randomBytes(3).readUIntBE(0, 3) % Math.pow(10, 6);
```

**Security Features:**

- ✅ Uses `crypto.randomBytes()` (cryptographically secure)
- ✅ Generates 6-digit OTPs by default (configurable 4-10 digits)
- ✅ No predictable patterns or sequences
- ✅ Each OTP is statistically unique

### OTP Storage

OTPs are never stored in plaintext. Instead, they're hashed using bcrypt:

```typescript
// OTP is hashed with bcrypt before storage
const otpHash = await bcrypt.hash(otp, 12); // 12 salt rounds
```

**Security Features:**

- ✅ bcrypt hashing with 12 salt rounds
- ✅ Salt is automatically generated and stored
- ✅ Resistant to rainbow table attacks
- ✅ Adaptive hashing (can be increased for future security)

### HMAC Protection

Each OTP is signed with HMAC to prevent tampering:

```typescript
// HMAC signature using server secret
const hmac = crypto
  .createHmac("sha256", serverSecret)
  .update(`${otp}${sessionId}${context}`)
  .digest("hex");
```

**Security Features:**

- ✅ SHA-256 HMAC for integrity
- ✅ Server secret used as HMAC key
- ✅ Binds OTP to session and context
- ✅ Prevents OTP manipulation

## 🛡️ Context Binding

### Request Metadata Binding

OTPs are bound to specific request metadata to prevent cross-context attacks:

```typescript
interface RequestMeta {
  ip: string; // Client IP address
  userAgent: string; // User-Agent header
  deviceId?: string; // Device identifier
  platform?: string; // Platform (web, ios, android)
  browser?: string; // Browser name
  os?: string; // Operating system
}
```

**Security Features:**

- ✅ IP address binding prevents cross-device attacks
- ✅ User-Agent binding prevents browser spoofing
- ✅ Device ID binding for mobile apps
- ✅ Platform/browser/OS binding for additional security

### Strict Mode

Enable strict context validation for maximum security:

```typescript
const otpService = new SecureEmailOtp(
  dbAdapter,
  emailProvider,
  rateLimiter,
  serverSecret,
  {
    strictMode: true, // Enable strict context binding
  }
);
```

**Strict Mode Features:**

- ✅ All request metadata must match exactly
- ✅ Prevents OTP reuse across different contexts
- ✅ Blocks potential session hijacking attempts
- ✅ Recommended for high-security applications

### Context Validation

During verification, the system validates that request metadata matches:

```typescript
// During verification
const requestMetaHash = crypto
  .createHash("sha256")
  .update(JSON.stringify(requestMeta))
  .digest("hex");

if (otpRecord.requestMetaHash !== requestMetaHash) {
  throw new OtpError("Request context mismatch", OtpErrorCode.META_MISMATCH);
}
```

## ⚡ Rate Limiting

### Built-in Rate Limiting

Configurable rate limits prevent OTP abuse:

```typescript
const otpService = new SecureEmailOtp(
  dbAdapter,
  emailProvider,
  rateLimiter,
  serverSecret,
  {
    rateLimit: {
      maxPerWindow: 3, // Max 3 OTPs per window
      windowMs: 15 * 60 * 1000, // 15-minute window
    },
  }
);
```

**Rate Limiting Features:**

- ✅ Per-email rate limiting
- ✅ Per-context rate limiting
- ✅ Configurable time windows
- ✅ Sliding window implementation
- ✅ Automatic cleanup of expired limits

### Rate Limiter Adapters

Choose the appropriate rate limiter for your deployment:

```typescript
// Memory rate limiter (single instance)
const rateLimiter = new MemoryRateLimiterAdapter();

// Redis rate limiter (multi-instance)
const rateLimiter = new RedisRateLimiterAdapter(redis);
```

**Rate Limiter Comparison:**

| Adapter | Use Case        | Features                            |
| ------- | --------------- | ----------------------------------- |
| Memory  | Single instance | Fast, no external dependencies      |
| Redis   | Multi-instance  | Shared across instances, persistent |

## 🔄 Replay Prevention

### Single-Use OTPs

OTPs are invalidated immediately after successful verification:

```typescript
// After successful verification
await dbAdapter.updateOtp(otpRecord.id, {
  isUsed: true,
  updatedAt: new Date(),
});
```

**Replay Prevention Features:**

- ✅ OTPs can only be used once
- ✅ Immediate invalidation after verification
- ✅ Prevents replay attacks
- ✅ Session-specific OTPs

### Attempt Tracking

Failed verification attempts are tracked and limited:

```typescript
// Track failed attempts
await dbAdapter.updateOtp(otpRecord.id, {
  attempts: otpRecord.attempts + 1,
  isLocked: otpRecord.attempts + 1 >= maxAttempts,
  updatedAt: new Date(),
});
```

**Attempt Tracking Features:**

- ✅ Configurable max attempts (default: 5)
- ✅ Automatic locking after max attempts
- ✅ Prevents brute force attacks
- ✅ Temporary account protection

## 📊 Audit Logging

### Event System

Complete audit trail through the event system:

```typescript
const otpService = new SecureEmailOtp(
  dbAdapter,
  emailProvider,
  rateLimiter,
  serverSecret,
  {
    events: {
      onRequest: async (event) => {
        await logToAuditTrail({
          action: "OTP_REQUESTED",
          email: event.email,
          ip: event.requestMeta.ip,
          timestamp: event.timestamp,
        });
      },
      onVerify: async (event) => {
        await logToAuditTrail({
          action: "OTP_VERIFIED",
          email: event.email,
          ip: event.requestMeta.ip,
          timestamp: event.timestamp,
        });
      },
      onFail: async (event) => {
        await logToAuditTrail({
          action: "OTP_FAILED",
          email: event.email,
          error: event.error?.message,
          timestamp: event.timestamp,
        });
      },
    },
  }
);
```

**Audit Logging Features:**

- ✅ Complete OTP lifecycle tracking
- ✅ Request metadata logging
- ✅ Error tracking and alerting
- ✅ Compliance-ready audit trails
- ✅ Real-time security monitoring

## 🚀 Production Security

### Server Secret Management

Use a strong, randomly generated server secret:

```typescript
// Generate a strong server secret
const serverSecret = crypto.randomBytes(64).toString("hex");
// Store securely in environment variables
process.env.SERVER_SECRET = serverSecret;
```

**Server Secret Requirements:**

- ✅ Minimum 32 characters (recommended: 64+)
- ✅ Cryptographically random
- ✅ Stored securely (environment variables)
- ✅ Rotated periodically
- ✅ Never committed to version control

### Environment Variables

Secure configuration management:

```bash
# Production environment variables
SERVER_SECRET=your-very-long-random-secret-key-here
NODE_ENV=production

# Email configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Database configuration
DATABASE_URL=mongodb://localhost:27017/myapp

# Rate limiting
REDIS_URL=redis://localhost:6379
```

### Database Security

Secure your database configuration:

```typescript
// MongoDB with authentication
const client = new MongoClient(
  "mongodb://user:password@localhost:27017/myapp?authSource=admin"
);

// PostgreSQL with SSL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://user:password@localhost:5432/myapp?sslmode=require",
    },
  },
});
```

**Database Security Features:**

- ✅ Use authentication for all database connections
- ✅ Enable SSL/TLS for database connections
- ✅ Use dedicated database users with minimal privileges
- ✅ Regular database backups
- ✅ Monitor database access logs

### Email Security

Secure email configuration:

```typescript
// Gmail with App Password
const emailProvider = new NodemailerAdapter({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "your-email@gmail.com",
    pass: "your-app-password", // Use App Password, not regular password
  },
});

// Custom SMTP with SSL
const emailProvider = new NodemailerAdapter({
  host: "mail.yourdomain.com",
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: "noreply@yourdomain.com",
    pass: "your-smtp-password",
  },
});
```

**Email Security Features:**

- ✅ Use App Passwords for Gmail
- ✅ Enable SSL/TLS for SMTP
- ✅ Use dedicated email accounts
- ✅ Monitor email delivery logs
- ✅ Implement SPF/DKIM/DMARC

## 🛡️ Security Best Practices

### 1. Server Secret Management

```typescript
// Generate a strong server secret
import crypto from "crypto";

const generateServerSecret = (): string => {
  return crypto.randomBytes(64).toString("hex");
};

// Store in environment variables
const serverSecret = process.env.SERVER_SECRET;
if (!serverSecret || serverSecret.length < 32) {
  throw new Error("SERVER_SECRET must be at least 32 characters long");
}
```

### 2. Rate Limiting Configuration

```typescript
// Conservative rate limiting for production
const otpService = new SecureEmailOtp(
  dbAdapter,
  emailProvider,
  rateLimiter,
  serverSecret,
  {
    rateLimit: {
      maxPerWindow: 3, // Max 3 OTPs per window
      windowMs: 15 * 60 * 1000, // 15-minute window
    },
    maxRetries: 3, // Max 3 verification attempts
    strictMode: true, // Enable strict context binding
  }
);
```

### 3. Security Monitoring

```typescript
const securityMonitor = {
  onRequest: async (event: OtpEvent) => {
    // Check for suspicious activity
    const suspiciousActivity = await checkSuspiciousActivity(event);
    if (suspiciousActivity) {
      await sendSecurityAlert(event);
    }
  },

  onFail: async (event: OtpEvent) => {
    // Alert on repeated failures
    if (event.error?.message?.includes("ATTEMPTS_EXCEEDED")) {
      await sendSecurityAlert(event);
    }

    // Alert on context mismatch
    if (event.error?.message?.includes("META_MISMATCH")) {
      await sendSecurityAlert(event);
    }
  },
};
```

### 4. Audit Logging

```typescript
const auditLogger = {
  onRequest: async (event: OtpEvent) => {
    await logToAuditTrail({
      action: "OTP_REQUESTED",
      email: event.email,
      context: event.context,
      ip: event.requestMeta.ip,
      userAgent: event.requestMeta.userAgent,
      timestamp: event.timestamp,
      sessionId: event.sessionId,
    });
  },

  onVerify: async (event: OtpEvent) => {
    await logToAuditTrail({
      action: "OTP_VERIFIED",
      email: event.email,
      context: event.context,
      ip: event.requestMeta.ip,
      timestamp: event.timestamp,
      sessionId: event.sessionId,
    });
  },

  onFail: async (event: OtpEvent) => {
    await logToAuditTrail({
      action: "OTP_FAILED",
      email: event.email,
      context: event.context,
      error: event.error?.message,
      ip: event.requestMeta.ip,
      timestamp: event.timestamp,
      sessionId: event.sessionId,
    });
  },
};
```

### 5. Error Handling

```typescript
// Secure error handling - don't expose sensitive information
try {
  const result = await otpService.verify({
    email: "user@example.com",
    clientHash: "123456",
    context: "login",
    sessionId: "session-123",
    requestMeta: { ip: "192.168.1.1", userAgent: "Mozilla/5.0..." },
  });
} catch (error) {
  if (error instanceof OtpError) {
    // Log detailed error for debugging
    console.error("OTP verification failed:", {
      code: error.code,
      message: error.message,
      email: "user@example.com", // Don't log the actual email in production
    });

    // Return generic error to client
    return {
      success: false,
      error: "Verification failed. Please try again.",
    };
  }
}
```

### 6. HTTPS and TLS

```typescript
// Ensure HTTPS in production
if (process.env.NODE_ENV === "production") {
  if (!process.env.HTTPS_ENABLED) {
    throw new Error("HTTPS must be enabled in production");
  }
}

// Express.js with HTTPS
import https from "https";
import fs from "fs";

const httpsOptions = {
  key: fs.readFileSync("/path/to/private-key.pem"),
  cert: fs.readFileSync("/path/to/certificate.pem"),
};

https.createServer(httpsOptions, app).listen(443);
```

### 7. Security Headers

```typescript
// Add security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  res.setHeader("Content-Security-Policy", "default-src 'self'");
  next();
});
```

### 8. Input Validation

```typescript
// Validate email format
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate OTP format
const validateOtp = (otp: string): boolean => {
  const otpRegex = /^\d{6}$/; // 6 digits
  return otpRegex.test(otp);
};

// Use in your API endpoints
app.post("/api/otp/generate", async (req, res) => {
  const { email, context } = req.body;

  if (!validateEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (!context || typeof context !== "string") {
    return res.status(400).json({ error: "Invalid context" });
  }

  // Proceed with OTP generation
});
```

## 🔍 Security Checklist

### Pre-Production Checklist

- [ ] Strong server secret (64+ characters)
- [ ] HTTPS enabled
- [ ] Database authentication configured
- [ ] Email provider secured (App Passwords, SSL)
- [ ] Rate limiting configured
- [ ] Audit logging enabled
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] Security headers configured
- [ ] Environment variables secured

### Production Monitoring Checklist

- [ ] Security event monitoring
- [ ] Rate limit violation alerts
- [ ] Failed verification alerts
- [ ] Database access monitoring
- [ ] Email delivery monitoring
- [ ] Error rate monitoring
- [ ] Performance monitoring
- [ ] Regular security audits
- [ ] Backup verification
- [ ] Incident response plan

---

**Need help with security?** Check out our [FAQ](./FAQ.md) for common security questions or the [Event System](./EVENTS.md) guide for security monitoring.
