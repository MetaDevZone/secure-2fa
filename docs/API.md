# API Reference

Complete documentation for all Secure Email OTP functions, classes, and interfaces.

## 📋 Table of Contents

- [Core Classes](#core-classes)
- [Database Adapters](#database-adapters)
- [Email Adapters](#email-adapters)
- [Rate Limiter Adapters](#rate-limiter-adapters)
- [Types and Interfaces](#types-and-interfaces)
- [Error Handling](#error-handling)

## 🔧 Core Classes

### SecureEmailOtp

The main class for OTP generation and verification.

#### Constructor

```typescript
new SecureEmailOtp(
  dbAdapter: DatabaseAdapter,
  emailProvider: EmailProvider,
  rateLimiter: RateLimiterAdapter,
  serverSecret: string,
  config?: OtpConfig
)
```

**Parameters:**

| Parameter       | Type                 | Required | Description                                     |
| --------------- | -------------------- | -------- | ----------------------------------------------- |
| `dbAdapter`     | `DatabaseAdapter`    | Yes      | Database adapter for storing OTP records        |
| `emailProvider` | `EmailProvider`      | Yes      | Email provider for sending OTP emails           |
| `rateLimiter`   | `RateLimiterAdapter` | Yes      | Rate limiter for preventing abuse               |
| `serverSecret`  | `string`             | Yes      | Secret key for HMAC signing (min 32 characters) |
| `config`        | `OtpConfig`          | No       | Optional configuration object                   |

**Example:**

```typescript
import {
  SecureEmailOtp,
  MemoryDatabaseAdapter,
  NodemailerAdapter,
} from "secure-email-otp";

const otpService = new SecureEmailOtp(
  new MemoryDatabaseAdapter(),
  new NodemailerAdapter({ host: "smtp.gmail.com", port: 587 }),
  new MemoryRateLimiterAdapter(),
  "your-very-long-server-secret-key-here",
  {
    otpLength: 6,
    expiryMs: 2 * 60 * 1000,
    maxRetries: 5,
    strictMode: true,
  }
);
```

#### Methods

##### generate(params)

Generate and send an OTP to the specified email.

```typescript
async generate(params: OtpGenerationParams): Promise<OtpGenerationResult>
```

**Parameters:**

| Parameter     | Type          | Required | Description                                  |
| ------------- | ------------- | -------- | -------------------------------------------- |
| `email`       | `string`      | Yes      | Email address to send OTP to                 |
| `context`     | `string`      | Yes      | Context for the OTP (e.g., 'login', 'reset') |
| `requestMeta` | `RequestMeta` | Yes      | Request metadata for security binding        |

**Returns:** `Promise<OtpGenerationResult>`

**Example:**

```typescript
const result = await otpService.generate({
  email: "user@example.com",
  context: "login",
  requestMeta: {
    ip: "192.168.1.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    deviceId: "device-123",
    platform: "web",
    browser: "chrome",
    os: "windows",
  },
});

console.log("OTP generated:", {
  sessionId: result.sessionId,
  expiresAt: result.expiresAt,
});
```

##### verify(params)

Verify an OTP submitted by the user.

```typescript
async verify(params: OtpVerificationParams): Promise<OtpVerificationResult>
```

**Parameters:**

| Parameter     | Type          | Required | Description                                 |
| ------------- | ------------- | -------- | ------------------------------------------- |
| `email`       | `string`      | Yes      | Email address associated with the OTP       |
| `clientHash`  | `string`      | Yes      | The OTP entered by the user                 |
| `context`     | `string`      | Yes      | Context for the OTP (must match generation) |
| `sessionId`   | `string`      | Yes      | Session ID returned from generate()         |
| `requestMeta` | `RequestMeta` | Yes      | Request metadata (must match generation)    |

**Returns:** `Promise<OtpVerificationResult>`

**Example:**

```typescript
const result = await otpService.verify({
  email: "user@example.com",
  clientHash: "123456",
  context: "login",
  sessionId: "session-123",
  requestMeta: {
    ip: "192.168.1.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    deviceId: "device-123",
    platform: "web",
    browser: "chrome",
    os: "windows",
  },
});

if (result.verified) {
  console.log("OTP verified successfully!");
} else {
  console.log("Verification failed:", result.reason);
}
```

##### cleanup()

Clean up expired OTP records from the database.

```typescript
async cleanup(): Promise<void>
```

**Example:**

```typescript
// Clean up expired OTPs
await otpService.cleanup();

// Set up periodic cleanup (recommended for production)
setInterval(async () => {
  await otpService.cleanup();
}, 60 * 60 * 1000); // Every hour
```

## 🗄️ Database Adapters

### MemoryDatabaseAdapter

In-memory database adapter for development and testing.

```typescript
new MemoryDatabaseAdapter();
```

**Example:**

```typescript
import { MemoryDatabaseAdapter } from "secure-email-otp";

const dbAdapter = new MemoryDatabaseAdapter();
```

### MongoDbAdapter

MongoDB adapter using the native MongoDB driver.

```typescript
new MongoDbAdapter(config: MongoDbConfig)
```

**Configuration:**

| Parameter        | Type          | Required | Description                          |
| ---------------- | ------------- | -------- | ------------------------------------ |
| `client`         | `MongoClient` | Yes      | MongoDB client instance              |
| `dbName`         | `string`      | Yes      | Database name                        |
| `collectionName` | `string`      | No       | Collection name (defaults to 'otps') |

**Example:**

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

### MongooseAdapter

MongoDB adapter using Mongoose ODM.

```typescript
new MongooseAdapter(config: MongooseConfig)
```

**Configuration:**

| Parameter        | Type                  | Required | Description                          |
| ---------------- | --------------------- | -------- | ------------------------------------ |
| `connection`     | `mongoose.Connection` | Yes      | Mongoose connection instance         |
| `collectionName` | `string`              | No       | Collection name (defaults to 'otps') |

**Example:**

```typescript
import mongoose from "mongoose";
import { MongooseAdapter } from "secure-email-otp";

await mongoose.connect("mongodb://localhost:27017/myapp");

const dbAdapter = new MongooseAdapter({
  connection: mongoose.connection,
  collectionName: "otps",
});
```

### PrismaDatabaseAdapter

Prisma adapter for PostgreSQL, MySQL, SQLite, and other databases.

```typescript
new PrismaDatabaseAdapter(prismaClient: PrismaClient)
```

**Example:**

```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaDatabaseAdapter } from "secure-email-otp";

const prisma = new PrismaClient();
const dbAdapter = new PrismaDatabaseAdapter(prisma);
```

## 📧 Email Adapters

### NodemailerAdapter

Email adapter using Nodemailer for SMTP.

```typescript
new NodemailerAdapter(config: NodemailerConfig)
```

**Configuration:**

| Parameter | Type                             | Required | Description                     |
| --------- | -------------------------------- | -------- | ------------------------------- |
| `host`    | `string`                         | Yes      | SMTP host                       |
| `port`    | `number`                         | Yes      | SMTP port                       |
| `secure`  | `boolean`                        | No       | Use SSL/TLS (defaults to false) |
| `auth`    | `{ user: string, pass: string }` | Yes      | SMTP authentication             |
| `from`    | `string`                         | No       | From email address              |

**Example:**

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

### SendGridAdapter

Email adapter using SendGrid API.

```typescript
new SendGridAdapter(config: SendGridConfig)
```

**Configuration:**

| Parameter | Type     | Required | Description        |
| --------- | -------- | -------- | ------------------ |
| `apiKey`  | `string` | Yes      | SendGrid API key   |
| `from`    | `string` | No       | From email address |

**Example:**

```typescript
import { SendGridAdapter } from "secure-email-otp";

const emailProvider = new SendGridAdapter({
  apiKey: "your-sendgrid-api-key",
  from: "noreply@yourdomain.com",
});
```

### BrevoAdapter

Email adapter using Brevo (formerly Sendinblue) API.

```typescript
new BrevoAdapter(config: BrevoConfig)
```

**Configuration:**

| Parameter    | Type     | Required | Description            |
| ------------ | -------- | -------- | ---------------------- |
| `apiKey`     | `string` | Yes      | Brevo API key          |
| `from`       | `string` | No       | From email address     |
| `senderName` | `string` | No       | Sender name for emails |

**Example:**

```typescript
import { BrevoAdapter } from "secure-email-otp";

const emailProvider = new BrevoAdapter({
  apiKey: "your-brevo-api-key",
  from: "noreply@yourdomain.com",
  senderName: "Your App Name",
});
```

### PostmarkAdapter

Email adapter using Postmark API.

```typescript
new PostmarkAdapter(config: PostmarkConfig)
```

**Configuration:**

| Parameter     | Type     | Required | Description           |
| ------------- | -------- | -------- | --------------------- |
| `serverToken` | `string` | Yes      | Postmark server token |
| `from`        | `string` | No       | From email address    |

**Example:**

```typescript
import { PostmarkAdapter } from "secure-email-otp";

const emailProvider = new PostmarkAdapter({
  serverToken: "your-postmark-server-token",
  from: "noreply@yourdomain.com",
});
```

### MailgunAdapter

Email adapter using Mailgun API.

```typescript
new MailgunAdapter(config: MailgunConfig)
```

**Configuration:**

| Parameter | Type     | Required | Description                          |
| --------- | -------- | -------- | ------------------------------------ |
| `apiKey`  | `string` | Yes      | Mailgun API key                      |
| `domain`  | `string` | Yes      | Mailgun domain                       |
| `from`    | `string` | No       | From email address                   |
| `region`  | `string` | No       | Region ('us' or 'eu', default: 'us') |

**Example:**

```typescript
import { MailgunAdapter } from "secure-email-otp";

const emailProvider = new MailgunAdapter({
  apiKey: "your-mailgun-api-key",
  domain: "your-domain.com",
  from: "noreply@your-domain.com",
  region: "us",
});
```

### CustomAdapter

Email adapter for custom email services.

```typescript
new CustomAdapter(config: CustomEmailConfig)
```

**Configuration:**

| Parameter        | Type       | Required | Description                   |
| ---------------- | ---------- | -------- | ----------------------------- |
| `sendFunction`   | `function` | Yes      | Function to send emails       |
| `verifyFunction` | `function` | No       | Function to verify connection |

**Example:**

```typescript
import { CustomAdapter } from "secure-email-otp";

const emailProvider = new CustomAdapter({
  sendFunction: async (params) => {
    // Your email sending logic here
    console.log("Sending email:", params);
  },
  verifyFunction: async () => {
    // Your connection verification logic here
    return true;
  },
});
```

## ⚡ Rate Limiter Adapters

### MemoryRateLimiterAdapter

In-memory rate limiter for development and single-instance applications.

```typescript
new MemoryRateLimiterAdapter();
```

**Example:**

```typescript
import { MemoryRateLimiterAdapter } from "secure-email-otp";

const rateLimiter = new MemoryRateLimiterAdapter();
```

## 📝 Types and Interfaces

### OtpConfig

Configuration object for the SecureEmailOtp class.

```typescript
interface OtpConfig {
  otpLength?: number; // OTP length (4-10, default: 6)
  expiryMs?: number; // OTP expiry time in milliseconds (default: 2 minutes)
  maxRetries?: number; // Max verification attempts (default: 5)
  strictMode?: boolean; // Enable strict context binding (default: true)
  rateLimit?: RateLimitConfig; // Rate limiting configuration
  templates?: EmailTemplates; // Email template configuration
  events?: EventHandlers; // Event handlers
}
```

**Default Values:**

```typescript
const defaultConfig: OtpConfig = {
  otpLength: 6,
  expiryMs: 2 * 60 * 1000, // 2 minutes
  maxRetries: 5,
  strictMode: true,
  rateLimit: {
    maxPerWindow: 3,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  templates: {
    subject: "Your Verification Code",
    html: "...", // Default HTML template
    text: "...", // Default text template
  },
};
```

### RequestMeta

Request metadata for security binding.

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

### OtpGenerationParams

Parameters for OTP generation.

```typescript
interface OtpGenerationParams {
  email: string; // Email address
  context: string; // OTP context
  requestMeta: RequestMeta; // Request metadata
}
```

### OtpGenerationResult

Result of OTP generation.

```typescript
interface OtpGenerationResult {
  sessionId: string; // Unique session ID
  expiresAt: Date; // Expiry timestamp
}
```

### OtpVerificationParams

Parameters for OTP verification.

```typescript
interface OtpVerificationParams {
  email: string; // Email address
  clientHash: string; // OTP entered by user
  context: string; // OTP context
  sessionId: string; // Session ID from generation
  requestMeta: RequestMeta; // Request metadata
}
```

### OtpVerificationResult

Result of OTP verification.

```typescript
interface OtpVerificationResult {
  verified: boolean; // Whether verification succeeded
  reason?: string; // Reason for failure (if any)
}
```

### RateLimitConfig

Rate limiting configuration.

```typescript
interface RateLimitConfig {
  maxPerWindow: number; // Max OTPs per window
  windowMs: number; // Time window in milliseconds
}
```

### EmailTemplates

Email template configuration.

```typescript
interface EmailTemplates {
  subject: string; // Email subject template
  html: string; // HTML email template
  text: string; // Plain text email template
}
```

**Template Variables:**

| Variable          | Description            |
| ----------------- | ---------------------- |
| `{otp}`           | The generated OTP      |
| `{expiryMinutes}` | Expiry time in minutes |
| `{companyName}`   | Company name           |
| `{supportEmail}`  | Support email address  |

### EventHandlers

Event handler configuration.

```typescript
interface EventHandlers {
  onRequest?: (event: OtpEvent) => Promise<void>;
  onSend?: (event: OtpEvent) => Promise<void>;
  onVerify?: (event: OtpEvent) => Promise<void>;
  onFail?: (event: OtpEvent) => Promise<void>;
}
```

### OtpEvent

Event data structure.

```typescript
interface OtpEvent {
  email: string;
  context: string;
  sessionId: string;
  requestMeta: RequestMeta;
  timestamp: Date;
  error?: Error;
}
```

## 🚨 Error Handling

### OtpError

Custom error class for OTP-related errors.

```typescript
class OtpError extends Error {
  constructor(
    message: string,
    public code: OtpErrorCode,
    public details?: any
  ) {
    super(message);
    this.name = "OtpError";
  }
}
```

### OtpErrorCode

Error code enumeration.

```typescript
enum OtpErrorCode {
  EXPIRED = "EXPIRED",
  INVALID = "INVALID",
  ATTEMPTS_EXCEEDED = "ATTEMPTS_EXCEEDED",
  RATE_LIMITED = "RATE_LIMITED",
  META_MISMATCH = "META_MISMATCH",
  NOT_FOUND = "NOT_FOUND",
  ALREADY_USED = "ALREADY_USED",
  LOCKED = "LOCKED",
}
```

**Error Handling Example:**

```typescript
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
    switch (error.code) {
      case OtpErrorCode.EXPIRED:
        console.log("OTP has expired");
        break;
      case OtpErrorCode.INVALID:
        console.log("Invalid OTP");
        break;
      case OtpErrorCode.ATTEMPTS_EXCEEDED:
        console.log("Too many failed attempts");
        break;
      case OtpErrorCode.RATE_LIMITED:
        console.log("Rate limit exceeded");
        break;
      case OtpErrorCode.META_MISMATCH:
        console.log("Request context mismatch");
        break;
      default:
        console.log("Unknown error:", error.message);
    }
  } else {
    console.log("Unexpected error:", error);
  }
}
```

## 🔧 Adapter Interfaces

### DatabaseAdapter

Interface for database adapters.

```typescript
interface DatabaseAdapter {
  createOtp(
    otp: Omit<OtpRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<OtpRecord>;
  findOtp(
    email: string,
    context: string,
    sessionId: string
  ): Promise<OtpRecord | null>;
  updateOtp(id: string, updates: Partial<OtpRecord>): Promise<OtpRecord>;
  deleteOtp(id: string): Promise<void>;
  findActiveOtp(email: string, context: string): Promise<OtpRecord | null>;
  cleanupExpiredOtps(): Promise<void>;
}
```

### EmailProvider

Interface for email providers.

```typescript
interface EmailProvider {
  sendEmail(params: EmailParams): Promise<void>;
}
```

### RateLimiterAdapter

Interface for rate limiter adapters.

```typescript
interface RateLimiterAdapter {
  checkLimit(
    key: string,
    maxPerWindow: number,
    windowMs: number
  ): Promise<boolean>;
  increment(key: string): Promise<void>;
}
```

## 📊 OtpRecord

Database record structure for OTPs.

```typescript
interface OtpRecord {
  id: string;
  email: string;
  context: string;
  sessionId: string;
  otpHash: string;
  hmac: string;
  requestMeta: RequestMeta;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  isUsed: boolean;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

**Need more details?** Check out the [Usage Guide](./USAGE.md) for practical examples or the [Database Adapters](./ADAPTERS.md) guide for specific database setup instructions.
