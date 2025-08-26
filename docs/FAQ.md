# Frequently Asked Questions

Common questions and solutions for Secure Email OTP.

## 📋 Table of Contents

- [General Questions](#general-questions)
- [Installation & Setup](#installation--setup)
- [Database Questions](#database-questions)
- [Email Configuration](#email-configuration)
- [Security Questions](#security-questions)
- [Troubleshooting](#troubleshooting)
- [Performance & Scaling](#performance--scaling)
- [Customization](#customization)

## ❓ General Questions

### Q: What is Secure Email OTP?

**A:** Secure Email OTP is a Node.js package that provides enterprise-grade email-based OTP (One-Time Password) functionality. It includes:

- Cryptographically secure OTP generation
- Multiple database adapters (MongoDB, PostgreSQL, Memory)
- Multiple email providers (Nodemailer, SendGrid)
- Built-in rate limiting and security controls
- Complete event system for monitoring
- TypeScript support with full type safety

### Q: How is this different from other OTP packages?

**A:** Secure Email OTP stands out with:

- **Adapter Pattern**: Works with any database or email provider
- **Enterprise Security**: HMAC protection, context binding, audit logging
- **Production Ready**: Comprehensive testing, error handling, monitoring
- **Developer Friendly**: TypeScript-first, clear APIs, extensive documentation
- **Flexible**: Customizable templates, events, rate limiting

### Q: What databases are supported?

**A:** The package supports multiple databases through adapters:

- **Memory**: For development and testing
- **MongoDB**: Native driver and Mongoose ODM
- **PostgreSQL/MySQL**: Through Prisma ORM
- **Custom**: Create your own adapter for any database

### Q: What email providers are supported?

**A:** Multiple email providers are supported:

- **Nodemailer**: Any SMTP provider (Gmail, Outlook, custom)
- **SendGrid**: High-volume transactional emails
- **Brevo (Sendinblue)**: European market, marketing automation
- **Postmark**: High deliverability transactional emails
- **Mailgun**: Custom domains, flexible routing
- **Custom**: Create your own adapter for any email service

## 🔧 Installation & Setup

### Q: How do I install the package?

**A:** Install with npm:

```bash
npm install secure-email-otp
```

For specific database or email providers:

```bash
# For MongoDB
npm install mongodb mongoose

# For PostgreSQL with Prisma
npm install @prisma/client

# For email providers
npm install nodemailer
# OR
npm install @sendgrid/mail
# OR
npm install @getbrevo/brevo
# OR
npm install postmark
# OR
npm install mailgun.js
```

### Q: How do I set up the basic configuration?

**A:** Here's a minimal setup:

```typescript
import {
  SecureEmailOtp,
  MemoryDatabaseAdapter,
  NodemailerAdapter,
} from "secure-email-otp";

const otpService = new SecureEmailOtp(
  new MemoryDatabaseAdapter(),
  new NodemailerAdapter({
    host: "smtp.gmail.com",
    port: 587,
    auth: {
      user: "your-email@gmail.com",
      pass: "your-app-password",
    },
  }),
  new MemoryRateLimiterAdapter(),
  "your-server-secret"
);
```

### Q: What's the minimum server secret length?

**A:** The server secret must be at least 32 characters long. For production, we recommend 64+ characters:

```typescript
// Generate a secure server secret
import crypto from "crypto";
const serverSecret = crypto.randomBytes(64).toString("hex");
```

### Q: How do I configure environment variables?

**A:** Set up your environment variables:

```bash
# .env file
SERVER_SECRET=your-very-long-random-secret-key-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
DATABASE_URL=mongodb://localhost:27017/myapp
```

## 🗄️ Database Questions

### Q: Can I use this with my existing MongoDB setup?

**A:** Yes! You can use either the native MongoDB driver or Mongoose:

**Native MongoDB:**

```typescript
import { MongoClient } from "mongodb";
import { MongoDbAdapter } from "secure-email-otp";

const client = new MongoClient("mongodb://localhost:27017");
await client.connect();

const dbAdapter = new MongoDbAdapter({
  client,
  dbName: "myapp",
  collectionName: "otps",
});
```

**Mongoose:**

```typescript
import mongoose from "mongoose";
import { MongooseAdapter } from "secure-email-otp";

await mongoose.connect("mongodb://localhost:27017/myapp");

const dbAdapter = new MongooseAdapter({
  connection: mongoose.connection,
  collectionName: "otps",
});
```

### Q: How do I set up with PostgreSQL and Prisma?

**A:** First, add the OTP model to your Prisma schema:

```prisma
model Otp {
  id               String   @id @default(cuid())
  email            String
  context          String
  sessionId        String
  otpHash          String
  hmac             String
  requestMeta      Json
  expiresAt        DateTime
  attempts         Int      @default(0)
  maxAttempts      Int      @default(5)
  isUsed           Boolean  @default(false)
  isLocked         Boolean  @default(false)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@unique([email, context, sessionId])
  @@index([email, context, expiresAt])
  @@index([expiresAt])
}
```

Then use the Prisma adapter:

```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaDatabaseAdapter } from "secure-email-otp";

const prisma = new PrismaClient();
const dbAdapter = new PrismaDatabaseAdapter(prisma);
```

### Q: Can I create a custom database adapter?

**A:** Yes! Implement the `DatabaseAdapter` interface:

```typescript
import { DatabaseAdapter, OtpRecord } from "secure-email-otp";

class MyCustomDatabaseAdapter implements DatabaseAdapter {
  async createOtp(
    otp: Omit<OtpRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<OtpRecord> {
    // Your implementation
  }

  async findOtp(
    email: string,
    context: string,
    sessionId: string
  ): Promise<OtpRecord | null> {
    // Your implementation
  }

  // Implement other required methods...
}
```

### Q: How do I handle database migrations?

**A:** The package doesn't handle migrations directly. Use your database's migration tools:

**MongoDB:** No migrations needed, collections are created automatically
**Prisma:** Use `prisma migrate dev` and `prisma migrate deploy`
**Custom:** Use your database's migration system

## 📧 Email Configuration

### Q: How do I set up Gmail SMTP?

**A:** Use Gmail with an App Password:

```typescript
const emailProvider = new NodemailerAdapter({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "your-email@gmail.com",
    pass: "your-app-password", // Use App Password, not regular password
  },
});
```

**To get an App Password:**

1. Enable 2FA on your Google account
2. Go to Google Account settings
3. Generate an App Password for your application

### Q: How do I set up SendGrid?

**A:** Use SendGrid with an API key:

```typescript
import { SendGridAdapter } from "secure-email-otp";

const emailProvider = new SendGridAdapter({
  apiKey: "your-sendgrid-api-key",
  from: "noreply@yourdomain.com",
});
```

### Q: How do I set up Brevo (Sendinblue)?

**A:** Use Brevo with an API key:

```typescript
import { BrevoAdapter } from "secure-email-otp";

const emailProvider = new BrevoAdapter({
  apiKey: "your-brevo-api-key",
  from: "noreply@yourdomain.com",
  senderName: "Your App Name",
});
```

### Q: How do I set up Postmark?

**A:** Use Postmark with a server token:

```typescript
import { PostmarkAdapter } from "secure-email-otp";

const emailProvider = new PostmarkAdapter({
  serverToken: "your-postmark-server-token",
  from: "noreply@yourdomain.com",
});
```

### Q: How do I set up Mailgun?

**A:** Use Mailgun with an API key and domain:

```typescript
import { MailgunAdapter } from "secure-email-otp";

const emailProvider = new MailgunAdapter({
  apiKey: "your-mailgun-api-key",
  domain: "your-domain.com",
  from: "noreply@your-domain.com",
  region: "us", // or "eu"
});
```

### Q: How do I create a custom email adapter?

**A:** Use the built-in CustomAdapter:

```typescript
import { CustomAdapter } from "secure-email-otp";

const emailProvider = new CustomAdapter({
  sendFunction: async (params) => {
    // Your email sending logic here
    console.log("Sending email:", params);
  },
  verifyFunction: async () => {
    // Optional: Verify your email service is working
    return true;
  },
});
```

### Q: Can I customize email templates?

**A:** Yes! Configure custom templates:

```typescript
const otpService = new SecureEmailOtp(
  dbAdapter,
  emailProvider,
  rateLimiter,
  serverSecret,
  {
    templates: {
      subject: "Your Verification Code - {companyName}",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Your Verification Code</h2>
          <p>Your code is: <strong>{otp}</strong></p>
          <p>Expires in: {expiryMinutes} minutes</p>
        </div>
      `,
      text: `
        Your Verification Code
        
        Your code is: {otp}
        Expires in: {expiryMinutes} minutes
      `,
    },
  }
);
```

**Available template variables:**

- `{otp}` - The generated OTP
- `{expiryMinutes}` - Expiry time in minutes
- `{companyName}` - Company name
- `{supportEmail}` - Support email address

### Q: How do I handle email delivery failures?

**A:** Use the event system to handle failures:

```typescript
const otpService = new SecureEmailOtp(
  dbAdapter,
  emailProvider,
  rateLimiter,
  serverSecret,
  {
    events: {
      onFail: async (event) => {
        if (event.error?.message?.includes("email")) {
          // Handle email delivery failure
          await logEmailFailure(event);
          await sendAlert("Email delivery failed", event);
        }
      },
    },
  }
);
```

## 🔒 Security Questions

### Q: How secure are the generated OTPs?

**A:** OTPs are cryptographically secure:

- **Generation**: Uses `crypto.randomBytes()` for true randomness
- **Storage**: Hashed with bcrypt (12 salt rounds)
- **Protection**: Signed with HMAC-SHA256
- **Context**: Bound to specific request metadata
- **Usage**: Single-use with immediate invalidation

### Q: What is context binding and why is it important?

**A:** Context binding prevents OTP reuse across different contexts:

```typescript
// OTP is bound to specific metadata
const requestMeta = {
  ip: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
  deviceId: "device-123",
};

// Verification must match exactly
const result = await otpService.verify({
  email: "user@example.com",
  clientHash: "123456",
  context: "login",
  sessionId: "session-123",
  requestMeta, // Must match generation metadata
});
```

This prevents:

- Cross-device OTP reuse
- Session hijacking
- Man-in-the-middle attacks

### Q: How do I configure rate limiting?

**A:** Configure rate limits in the OTP service:

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
    maxRetries: 5, // Max 5 verification attempts
  }
);
```

### Q: How do I enable strict mode?

**A:** Enable strict mode for maximum security:

```typescript
const otpService = new SecureEmailOtp(
  dbAdapter,
  emailProvider,
  rateLimiter,
  serverSecret,
  {
    strictMode: true, // All request metadata must match exactly
  }
);
```

**Strict mode requires:**

- Exact IP address match
- Exact User-Agent match
- Exact device ID match (if provided)
- Exact platform/browser/OS match (if provided)

## 🔧 Troubleshooting

### Q: I'm getting "OTP expired" errors

**A:** Check your expiry configuration:

```typescript
const otpService = new SecureEmailOtp(
  dbAdapter,
  emailProvider,
  rateLimiter,
  serverSecret,
  {
    expiryMs: 5 * 60 * 1000, // 5 minutes (default is 2 minutes)
  }
);
```

**Common causes:**

- Default 2-minute expiry is too short
- Clock synchronization issues
- Network delays in email delivery

### Q: I'm getting "Rate limit exceeded" errors

**A:** Adjust your rate limiting configuration:

```typescript
const otpService = new SecureEmailOtp(
  dbAdapter,
  emailProvider,
  rateLimiter,
  serverSecret,
  {
    rateLimit: {
      maxPerWindow: 5, // Increase from default 3
      windowMs: 30 * 60 * 1000, // Increase window to 30 minutes
    },
  }
);
```

### Q: I'm getting "Request context mismatch" errors

**A:** This happens when request metadata doesn't match. Check:

1. **IP Address**: Ensure the same IP is used for generation and verification
2. **User-Agent**: Ensure the same browser/device is used
3. **Device ID**: Ensure consistent device identification

**For development/testing:**

```typescript
// Use consistent metadata for testing
const testMeta = {
  ip: "127.0.0.1",
  userAgent: "Test-Agent",
  deviceId: "test-device",
};
```

### Q: Email delivery is failing

**A:** Check your email configuration:

**Gmail issues:**

- Use App Password instead of regular password
- Enable "Less secure app access" (not recommended)
- Check if 2FA is enabled

**SMTP issues:**

- Verify host and port
- Check authentication credentials
- Ensure SSL/TLS is configured correctly

**SendGrid issues:**

- Verify API key is correct
- Check sender domain verification
- Review SendGrid logs

### Q: Database connection errors

**A:** Check your database configuration:

**MongoDB:**

```typescript
// Check connection
const client = new MongoClient("mongodb://localhost:27017");
try {
  await client.connect();
  console.log("MongoDB connected");
} catch (error) {
  console.error("MongoDB connection failed:", error);
}
```

**PostgreSQL/Prisma:**

```bash
# Test Prisma connection
npx prisma db push
npx prisma generate
```

## ⚡ Performance & Scaling

### Q: How do I scale to multiple instances?

**A:** Use Redis for rate limiting and shared state:

```typescript
import Redis from "ioredis";
import { RedisRateLimiterAdapter } from "secure-email-otp";

const redis = new Redis("redis://localhost:6379");
const rateLimiter = new RedisRateLimiterAdapter(redis);

const otpService = new SecureEmailOtp(
  dbAdapter,
  emailProvider,
  rateLimiter, // Shared across instances
  serverSecret
);
```

### Q: How do I handle high traffic?

**A:** Optimize for high traffic:

```typescript
// Use connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://user:pass@localhost:5432/db?connection_limit=20",
    },
  },
});

// Use efficient rate limiting
const rateLimiter = new RedisRateLimiterAdapter(redis);

// Enable event batching
const eventBatcher = new EventBatcher();
```

### Q: How do I monitor performance?

**A:** Use the event system for monitoring:

```typescript
const otpService = new SecureEmailOtp(
  dbAdapter,
  emailProvider,
  rateLimiter,
  serverSecret,
  {
    events: {
      onRequest: async (event) => {
        await incrementMetric("otp_requests_total");
        await recordLatency(
          "otp_request",
          Date.now() - event.timestamp.getTime()
        );
      },
      onSend: async (event) => {
        await incrementMetric("otp_sent_total");
      },
      onVerify: async (event) => {
        await incrementMetric("otp_verified_total");
      },
    },
  }
);
```

## 🎨 Customization

### Q: How do I create custom email templates?

**A:** Create custom templates with your branding:

```typescript
const otpService = new SecureEmailOtp(
  dbAdapter,
  emailProvider,
  rateLimiter,
  serverSecret,
  {
    templates: {
      subject: "🔐 Your {companyName} Verification Code",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Verification Code</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h1 style="color: #333; text-align: center;">🔐 Verification Code</h1>
            <p>Hello,</p>
            <p>Your verification code is:</p>
            <div style="background: #fff; padding: 20px; text-align: center; border-radius: 4px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 4px;">{otp}</span>
            </div>
            <p>This code will expire in <strong>{expiryMinutes} minutes</strong>.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px; text-align: center;">
              {companyName} | {supportEmail}
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        🔐 Verification Code
        
        Your verification code is: {otp}
        This code will expire in {expiryMinutes} minutes.
        
        If you didn't request this code, please ignore this email.
        
        {companyName} | {supportEmail}
      `,
    },
  }
);
```

### Q: How do I extend for SMS or WhatsApp OTP?

**A:** Create a custom email adapter for SMS/WhatsApp:

```typescript
import { EmailProvider, EmailParams } from "secure-email-otp";

class SmsAdapter implements EmailProvider {
  async sendEmail(params: EmailParams): Promise<void> {
    const { to, text } = params;

    // Extract phone number from email (e.g., user@phone.com -> phone)
    const phoneNumber = to.split("@")[0];

    // Send SMS using your SMS provider
    await sendSms(phoneNumber, text);
  }
}

// Use with phone number as email
const result = await otpService.generate({
  email: "1234567890@phone.com", // Phone number as email
  context: "login",
  requestMeta: { ip: "192.168.1.1", userAgent: "Mobile App" },
});
```

### Q: How do I add custom validation?

**A:** Add validation before OTP generation:

```typescript
app.post("/api/otp/generate", async (req, res) => {
  const { email, context } = req.body;

  // Custom validation
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (!isAllowedContext(context)) {
    return res.status(400).json({ error: "Invalid context" });
  }

  if (await isUserBlocked(email)) {
    return res.status(403).json({ error: "User is blocked" });
  }

  // Generate OTP
  const result = await otpService.generate({
    email,
    context,
    requestMeta: { ip: req.ip, userAgent: req.get("User-Agent") || "Unknown" },
  });

  res.json({ success: true, sessionId: result.sessionId });
});
```

### Q: How do I implement custom error handling?

**A:** Create custom error handlers:

```typescript
const otpService = new SecureEmailOtp(
  dbAdapter,
  emailProvider,
  rateLimiter,
  serverSecret,
  {
    events: {
      onFail: async (event) => {
        // Custom error handling
        switch (event.error?.code) {
          case "EXPIRED":
            await sendNotification(
              event.email,
              "OTP expired, please request a new one"
            );
            break;
          case "ATTEMPTS_EXCEEDED":
            await lockUserAccount(event.email);
            await sendSecurityAlert(event);
            break;
          case "RATE_LIMITED":
            await logRateLimitViolation(event);
            break;
          default:
            await logUnknownError(event);
        }
      },
    },
  }
);
```

---

**Still have questions?** Check out our [Usage Guide](./USAGE.md) for detailed examples or [open an issue](https://github.com/yourusername/secure-email-otp/issues) on GitHub.
