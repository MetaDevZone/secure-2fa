# Database Adapters

Complete guide to database, email, and rate limiter adapters in Secure Email OTP.

## 📋 Table of Contents

- [Database Adapters](#database-adapters)
- [Email Adapters](#email-adapters)
- [Rate Limiter Adapters](#rate-limiter-adapters)
- [Custom Adapters](#custom-adapters)
- [Adapter Comparison](#adapter-comparison)

## 🗄️ Database Adapters

### MemoryDatabaseAdapter

In-memory storage for development and testing.

**Use Case:** Development, testing, demos

**Features:**

- ✅ No setup required
- ✅ Fast performance
- ❌ Data lost on restart
- ❌ Not suitable for production

```typescript
import { MemoryDatabaseAdapter } from "secure-email-otp";

const dbAdapter = new MemoryDatabaseAdapter();
```

### MongoDbAdapter

MongoDB adapter using the native MongoDB driver.

**Use Case:** Production applications with MongoDB

**Features:**

- ✅ High performance
- ✅ Automatic indexing
- ✅ TTL for automatic cleanup
- ✅ Horizontal scaling support

```typescript
import { MongoClient } from "mongodb";
import { MongoDbAdapter } from "secure-email-otp";

// Connect to MongoDB
const client = new MongoClient("mongodb://localhost:27017");
await client.connect();

const dbAdapter = new MongoDbAdapter({
  client,
  dbName: "myapp",
  collectionName: "otps", // Optional: defaults to 'otps'
});
```

**Automatic Indexes Created:**

- `{ email: 1, context: 1, sessionId: 1 }` (unique)
- `{ email: 1, context: 1, expiresAt: 1 }`
- `{ expiresAt: 1 }` (TTL index)

### MongooseAdapter

MongoDB adapter using Mongoose ODM.

**Use Case:** Production applications using Mongoose

**Features:**

- ✅ Mongoose schema validation
- ✅ Automatic timestamps
- ✅ Middleware support
- ✅ Type safety with Mongoose

```typescript
import mongoose from "mongoose";
import { MongooseAdapter } from "secure-email-otp";

// Connect to MongoDB with Mongoose
await mongoose.connect("mongodb://localhost:27017/myapp");

const dbAdapter = new MongooseAdapter({
  connection: mongoose.connection,
  collectionName: "otps", // Optional: defaults to 'otps'
});
```

**Mongoose Schema Features:**

- Automatic `createdAt` and `updatedAt` timestamps
- Built-in validation
- Compound indexes for performance
- TTL index for automatic cleanup

### PrismaDatabaseAdapter

Prisma adapter for SQL databases.

**Use Case:** PostgreSQL, MySQL, SQLite applications

**Features:**

- ✅ Type-safe database access
- ✅ Migration support
- ✅ Multiple database support
- ✅ Connection pooling

```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaDatabaseAdapter } from "secure-email-otp";

const prisma = new PrismaClient();
const dbAdapter = new PrismaDatabaseAdapter(prisma);
```

**Required Prisma Schema:**

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

## 📧 Email Adapters

### NodemailerAdapter

SMTP email adapter using Nodemailer.

**Use Case:** Any SMTP provider (Gmail, Outlook, custom SMTP)

**Features:**

- ✅ Universal SMTP support
- ✅ SSL/TLS encryption
- ✅ Custom email templates
- ✅ Attachment support

```typescript
import { NodemailerAdapter } from "secure-email-otp";

const emailProvider = new NodemailerAdapter({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "your-email@gmail.com",
    pass: "your-app-password",
  },
  from: "noreply@yourdomain.com", // Optional
});
```

**Popular SMTP Configurations:**

**Gmail:**

```typescript
{
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password', // Use App Password, not regular password
  },
}
```

**Outlook/Hotmail:**

```typescript
{
  host: 'smtp-mail.outlook.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@outlook.com',
    pass: 'your-password',
  },
}
```

**Custom SMTP:**

```typescript
{
  host: 'mail.yourdomain.com',
  port: 587,
  secure: false,
  auth: {
    user: 'noreply@yourdomain.com',
    pass: 'your-smtp-password',
  },
}
```

### SendGridAdapter

SendGrid API adapter for high-volume email sending.

**Use Case:** High-volume applications, transactional emails

**Features:**

- ✅ High deliverability
- ✅ Analytics and tracking
- ✅ Webhook support
- ✅ Template management

```typescript
import { SendGridAdapter } from "secure-email-otp";

const emailProvider = new SendGridAdapter({
  apiKey: "your-sendgrid-api-key",
  from: "noreply@yourdomain.com", // Optional
});
```

**SendGrid Setup:**

1. Create a SendGrid account
2. Generate an API key
3. Verify your sender domain
4. Use the API key in your configuration

### BrevoAdapter (Sendinblue)

Brevo (formerly Sendinblue) API adapter for transactional emails.

**Use Case:** European applications, marketing emails, transactional emails

**Features:**

- ✅ High deliverability in Europe
- ✅ Marketing automation
- ✅ Template management
- ✅ SMS integration

```typescript
import { BrevoAdapter } from "secure-email-otp";

const emailProvider = new BrevoAdapter({
  apiKey: "your-brevo-api-key",
  from: "noreply@yourdomain.com", // Optional
  senderName: "Your App Name", // Optional
});
```

**Brevo Setup:**

1. Create a Brevo account
2. Generate an API key
3. Verify your sender domain
4. Use the API key in your configuration

### PostmarkAdapter

Postmark API adapter for transactional emails with high deliverability.

**Use Case:** Transactional emails, high deliverability requirements

**Features:**

- ✅ Excellent deliverability
- ✅ Fast delivery
- ✅ Bounce handling
- ✅ Template support

```typescript
import { PostmarkAdapter } from "secure-email-otp";

const emailProvider = new PostmarkAdapter({
  serverToken: "your-postmark-server-token",
  from: "noreply@yourdomain.com", // Optional
});
```

**Postmark Setup:**

1. Create a Postmark account
2. Create a server
3. Get your server token
4. Verify your sender domain
5. Use the server token in your configuration

### MailgunAdapter

Mailgun API adapter for flexible email delivery.

**Use Case:** Custom domains, flexible email routing

**Features:**

- ✅ Custom domain support
- ✅ Flexible routing
- ✅ Webhook support
- ✅ Analytics

```typescript
import { MailgunAdapter } from "secure-email-otp";

const emailProvider = new MailgunAdapter({
  apiKey: "your-mailgun-api-key",
  domain: "your-domain.com",
  from: "noreply@your-domain.com", // Optional
  region: "us", // Optional: 'us' or 'eu'
});
```

**Mailgun Setup:**

1. Create a Mailgun account
2. Add your domain
3. Generate an API key
4. Use the API key and domain in your configuration

### CustomAdapter

Use the built-in CustomAdapter for any email service.

**Use Case:** Any email service not covered by built-in adapters

**Features:**

- ✅ Easy integration with any email service
- ✅ Flexible configuration
- ✅ Optional connection verification

```typescript
import { CustomAdapter } from "secure-email-otp";

// Define your email sending function
const sendEmailFunction = async (params: EmailParams): Promise<void> => {
  const { to, subject, html, text } = params;

  // Your email sending logic here
  // Example: AWS SES, custom SMTP, webhook-based service, etc.

  console.log(`Sending email to ${to}:`, { subject, html, text });

  // Implement your email service API call
  // await yourEmailService.send({ to, subject, html, text });
};

// Optional: Define connection verification function
const verifyConnectionFunction = async (): Promise<boolean> => {
  try {
    // Check if your email service is available
    // await yourEmailService.healthCheck();
    return true;
  } catch (error) {
    return false;
  }
};

// Use the custom adapter
const emailProvider = new CustomAdapter({
  sendFunction: sendEmailFunction,
  verifyFunction: verifyConnectionFunction, // Optional
});
```

**Example: AWS SES Integration:**

```typescript
import { SES } from "aws-sdk";
import { CustomAdapter, EmailParams } from "secure-email-otp";

const ses = new SES({ region: "us-east-1" });

const sendEmailFunction = async (params: EmailParams): Promise<void> => {
  const { to, subject, html, text } = params;

  await ses
    .sendEmail({
      Source: "noreply@yourdomain.com",
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
        },
        Body: {
          Html: {
            Data: html,
          },
          Text: {
            Data: text,
          },
        },
      },
    })
    .promise();
};

const emailProvider = new CustomAdapter({
  sendFunction: sendEmailFunction,
});
```

## ⚡ Rate Limiter Adapters

### MemoryRateLimiterAdapter

In-memory rate limiter for single-instance applications.

**Use Case:** Development, single-server production

**Features:**

- ✅ No external dependencies
- ✅ Fast performance
- ❌ Not shared across instances
- ❌ Data lost on restart

```typescript
import { MemoryRateLimiterAdapter } from "secure-email-otp";

const rateLimiter = new MemoryRateLimiterAdapter();
```

### RedisRateLimiterAdapter

Redis-based rate limiter for distributed applications.

**Use Case:** Multi-instance applications, horizontal scaling

**Features:**

- ✅ Shared across instances
- ✅ Persistent storage
- ✅ High performance
- ✅ Automatic cleanup

```typescript
import Redis from "ioredis";
import { RedisRateLimiterAdapter } from "secure-email-otp";

const redis = new Redis("redis://localhost:6379");

const rateLimiter = new RedisRateLimiterAdapter(redis);
```

**Redis Configuration:**

```typescript
// With authentication
const redis = new Redis({
  host: "localhost",
  port: 6379,
  password: "your-redis-password",
  db: 0,
});

// With SSL
const redis = new Redis({
  host: "your-redis-host",
  port: 6380,
  tls: {
    rejectUnauthorized: false,
  },
});
```

### Custom Rate Limiter Adapter

Create your own rate limiter for any service.

```typescript
import { RateLimiterAdapter } from "secure-email-otp";

class CustomRateLimiterAdapter implements RateLimiterAdapter {
  async checkLimit(
    key: string,
    maxPerWindow: number,
    windowMs: number
  ): Promise<boolean> {
    // Your rate limiting logic here
    // Return true if within limit, false if exceeded

    // Example implementation
    const currentCount = await this.getCurrentCount(key, windowMs);
    return currentCount < maxPerWindow;
  }

  async increment(key: string): Promise<void> {
    // Increment the counter for the given key
    await this.incrementCounter(key);
  }

  private async getCurrentCount(
    key: string,
    windowMs: number
  ): Promise<number> {
    // Implement your counter logic
    return 0; // Placeholder
  }

  private async incrementCounter(key: string): Promise<void> {
    // Implement your increment logic
  }
}

// Use the custom adapter
const rateLimiter = new CustomRateLimiterAdapter();
```

## 🔧 Custom Adapters

### Creating a Custom Database Adapter

```typescript
import { DatabaseAdapter, OtpRecord } from "secure-email-otp";

class MyCustomDatabaseAdapter implements DatabaseAdapter {
  async createOtp(
    otp: Omit<OtpRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<OtpRecord> {
    const now = new Date();
    const record = {
      ...otp,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };

    // Save to your database
    await this.saveToDatabase(record);

    return record;
  }

  async findOtp(
    email: string,
    context: string,
    sessionId: string
  ): Promise<OtpRecord | null> {
    // Query your database
    const record = await this.queryDatabase({ email, context, sessionId });
    return record || null;
  }

  async updateOtp(id: string, updates: Partial<OtpRecord>): Promise<OtpRecord> {
    const now = new Date();
    const updatedRecord = {
      ...updates,
      updatedAt: now,
    };

    // Update in your database
    const record = await this.updateInDatabase(id, updatedRecord);

    if (!record) {
      throw new Error(`OTP with id ${id} not found`);
    }

    return record;
  }

  async deleteOtp(id: string): Promise<void> {
    await this.deleteFromDatabase(id);
  }

  async findActiveOtp(
    email: string,
    context: string
  ): Promise<OtpRecord | null> {
    const now = new Date();
    const record = await this.queryDatabase({
      email,
      context,
      expiresAt: { $gt: now },
      isUsed: false,
      isLocked: false,
    });

    return record || null;
  }

  async cleanupExpiredOtps(): Promise<void> {
    const now = new Date();
    await this.deleteFromDatabase({ expiresAt: { $lt: now } });
  }

  private generateId(): string {
    return `otp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Implement your database-specific methods
  private async saveToDatabase(record: OtpRecord): Promise<void> {
    // Your database save logic
  }

  private async queryDatabase(query: any): Promise<OtpRecord | null> {
    // Your database query logic
    return null;
  }

  private async updateInDatabase(
    id: string,
    updates: any
  ): Promise<OtpRecord | null> {
    // Your database update logic
    return null;
  }

  private async deleteFromDatabase(query: any): Promise<void> {
    // Your database delete logic
  }
}
```

### Example: PostgreSQL with pg

```typescript
import { Pool } from "pg";
import { DatabaseAdapter, OtpRecord } from "secure-email-otp";

class PostgresAdapter implements DatabaseAdapter {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async createOtp(
    otp: Omit<OtpRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<OtpRecord> {
    const now = new Date();
    const query = `
      INSERT INTO otps (id, email, context, session_id, otp_hash, hmac, request_meta, expires_at, attempts, max_attempts, is_used, is_locked, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const values = [
      this.generateId(),
      otp.email,
      otp.context,
      otp.sessionId,
      otp.otpHash,
      otp.hmac,
      JSON.stringify(otp.requestMeta),
      otp.expiresAt,
      otp.attempts || 0,
      otp.maxAttempts || 5,
      otp.isUsed || false,
      otp.isLocked || false,
      now,
      now,
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToOtpRecord(result.rows[0]);
  }

  async findOtp(
    email: string,
    context: string,
    sessionId: string
  ): Promise<OtpRecord | null> {
    const query = `
      SELECT * FROM otps 
      WHERE email = $1 AND context = $2 AND session_id = $3
    `;

    const result = await this.pool.query(query, [email, context, sessionId]);
    return result.rows[0] ? this.mapRowToOtpRecord(result.rows[0]) : null;
  }

  async updateOtp(id: string, updates: Partial<OtpRecord>): Promise<OtpRecord> {
    const now = new Date();
    const setClause = Object.keys(updates)
      .map((key, index) => `${this.camelToSnake(key)} = $${index + 2}`)
      .join(", ");

    const query = `
      UPDATE otps 
      SET ${setClause}, updated_at = $1
      WHERE id = $${Object.keys(updates).length + 2}
      RETURNING *
    `;

    const values = [now, ...Object.values(updates), id];
    const result = await this.pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error(`OTP with id ${id} not found`);
    }

    return this.mapRowToOtpRecord(result.rows[0]);
  }

  async deleteOtp(id: string): Promise<void> {
    await this.pool.query("DELETE FROM otps WHERE id = $1", [id]);
  }

  async findActiveOtp(
    email: string,
    context: string
  ): Promise<OtpRecord | null> {
    const query = `
      SELECT * FROM otps 
      WHERE email = $1 AND context = $2 AND expires_at > $3 AND is_used = false AND is_locked = false
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await this.pool.query(query, [email, context, new Date()]);
    return result.rows[0] ? this.mapRowToOtpRecord(result.rows[0]) : null;
  }

  async cleanupExpiredOtps(): Promise<void> {
    await this.pool.query("DELETE FROM otps WHERE expires_at < $1", [
      new Date(),
    ]);
  }

  private generateId(): string {
    return `otp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private mapRowToOtpRecord(row: any): OtpRecord {
    return {
      id: row.id,
      email: row.email,
      context: row.context,
      sessionId: row.session_id,
      otpHash: row.otp_hash,
      hmac: row.hmac,
      requestMeta: JSON.parse(row.request_meta),
      expiresAt: row.expires_at,
      attempts: row.attempts,
      maxAttempts: row.max_attempts,
      isUsed: row.is_used,
      isLocked: row.is_locked,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }
}
```

## 📊 Adapter Comparison

### Database Adapters

| Adapter  | Use Case    | Setup  | Performance | Scalability | Persistence |
| -------- | ----------- | ------ | ----------- | ----------- | ----------- |
| Memory   | Development | ⭐     | ⭐⭐⭐⭐⭐  | ❌          | ❌          |
| MongoDB  | Production  | ⭐⭐   | ⭐⭐⭐⭐    | ⭐⭐⭐⭐⭐  | ✅          |
| Mongoose | Production  | ⭐⭐   | ⭐⭐⭐      | ⭐⭐⭐⭐⭐  | ✅          |
| Prisma   | Production  | ⭐⭐⭐ | ⭐⭐⭐⭐    | ⭐⭐⭐⭐    | ✅          |

### Email Adapters

| Adapter    | Use Case       | Setup    | Deliverability | Features   | Cost       |
| ---------- | -------------- | -------- | -------------- | ---------- | ---------- |
| Nodemailer | Universal      | ⭐⭐     | ⭐⭐⭐         | ⭐⭐⭐     | ⭐⭐⭐⭐⭐ |
| SendGrid   | High-volume    | ⭐⭐⭐   | ⭐⭐⭐⭐⭐     | ⭐⭐⭐⭐⭐ | ⭐⭐       |
| Brevo      | European       | ⭐⭐⭐   | ⭐⭐⭐⭐       | ⭐⭐⭐⭐⭐ | ⭐⭐⭐     |
| Postmark   | Transactional  | ⭐⭐⭐   | ⭐⭐⭐⭐⭐     | ⭐⭐⭐⭐   | ⭐⭐       |
| Mailgun    | Custom domains | ⭐⭐⭐   | ⭐⭐⭐⭐       | ⭐⭐⭐⭐   | ⭐⭐⭐     |
| Custom     | Any service    | ⭐⭐⭐⭐ | Varies         | Varies     | Varies     |

### Rate Limiter Adapters

| Adapter | Use Case        | Setup  | Performance | Scalability | Persistence |
| ------- | --------------- | ------ | ----------- | ----------- | ----------- |
| Memory  | Single-instance | ⭐     | ⭐⭐⭐⭐⭐  | ❌          | ❌          |
| Redis   | Multi-instance  | ⭐⭐⭐ | ⭐⭐⭐⭐    | ⭐⭐⭐⭐⭐  | ✅          |

## 🚀 Best Practices

### Database Selection

1. **Development:** Use `MemoryDatabaseAdapter` for quick setup
2. **Single Server:** Use `MongoDbAdapter` or `PrismaDatabaseAdapter`
3. **Multi-instance:** Use `MongoDbAdapter` with MongoDB cluster or `PrismaDatabaseAdapter` with PostgreSQL
4. **Existing Mongoose:** Use `MongooseAdapter`

### Email Provider Selection

1. **Low Volume:** Use `NodemailerAdapter` with your existing SMTP
2. **High Volume:** Use `SendGridAdapter` for better deliverability
3. **European Market:** Use `BrevoAdapter` for better European deliverability
4. **Transactional Emails:** Use `PostmarkAdapter` for excellent deliverability
5. **Custom Domains:** Use `MailgunAdapter` for flexible domain management
6. **Custom Requirements:** Use `CustomAdapter` for any email service

### Rate Limiter Selection

1. **Single Instance:** Use `MemoryRateLimiterAdapter`
2. **Multi-instance:** Use `RedisRateLimiterAdapter`
3. **Custom Requirements:** Create a custom rate limiter adapter

---

**Need help choosing?** Check out our [Usage Guide](./USAGE.md) for practical examples or the [FAQ](./FAQ.md) for common questions.
