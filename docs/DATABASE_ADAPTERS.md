# Database Adapters Guide

This guide shows you how to tell the Secure Email OTP package which database you want to use. The package uses an **adapter pattern** that makes it easy to switch between different databases.

## 🗄️ Available Database Adapters

The package comes with several built-in database adapters:

1. **Memory Adapter** - For development/testing (data stored in memory)
2. **MongoDB Adapter** - For MongoDB databases (native driver)
3. **Mongoose Adapter** - For MongoDB databases (Mongoose ODM)
4. **Prisma Adapter** - For any database supported by Prisma ORM
5. **Custom Adapter** - For any other database you want to use

## 🚀 How to Specify Your Database

### 1. Memory Database (Development/Testing)

```typescript
import { SecureEmailOtp, MemoryDatabaseAdapter } from "secure-email-otp";

const otpService = new SecureEmailOtp(
  new MemoryDatabaseAdapter(), // ← This tells the package to use memory storage
  emailProvider,
  rateLimiter,
  serverSecret
);
```

**Use case**: Development, testing, or when you don't need persistent storage.

### 2. MongoDB Database

```typescript
import { SecureEmailOtp, MongoDbAdapter } from "secure-email-otp";
import { MongoClient } from "mongodb";

// Connect to MongoDB
const client = new MongoClient("mongodb://localhost:27017");
await client.connect();

const otpService = new SecureEmailOtp(
  new MongoDbAdapter({
    // ← This tells the package to use MongoDB
    client,
    dbName: "myapp",
    collectionName: "otps", // Optional: defaults to 'otps'
  }),
  emailProvider,
  rateLimiter,
  serverSecret
);
```

**Use case**: Production applications using MongoDB with native driver.

### 3. Mongoose ODM (MongoDB)

```typescript
import { SecureEmailOtp, MongooseAdapter } from "secure-email-otp";
import mongoose from "mongoose";

// Connect to MongoDB with Mongoose
await mongoose.connect("mongodb://localhost:27017/myapp");

const otpService = new SecureEmailOtp(
  new MongooseAdapter({
    // ← This tells the package to use Mongoose
    connection: mongoose.connection,
    collectionName: "otps", // Optional: defaults to 'otps'
  }),
  emailProvider,
  rateLimiter,
  serverSecret
);
```

**Use case**: Production applications using MongoDB with Mongoose ODM.

### 4. Prisma ORM (PostgreSQL, MySQL, SQLite, etc.)

```typescript
import { SecureEmailOtp, PrismaDatabaseAdapter } from "secure-email-otp";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const otpService = new SecureEmailOtp(
  new PrismaDatabaseAdapter(prisma), // ← This tells the package to use Prisma
  emailProvider,
  rateLimiter,
  serverSecret
);
```

**Use case**: Applications using Prisma ORM with any supported database.

### 5. Custom Database Adapter

## 📋 Complete Examples by Database

### MongoDB Example

```typescript
import express from "express";
import { MongoClient } from "mongodb";
import {
  SecureEmailOtp,
  MongoDbAdapter,
  NodemailerAdapter,
  MemoryRateLimiterAdapter,
} from "secure-email-otp";

const app = express();

// MongoDB connection
const client = new MongoClient(process.env.MONGODB_URL!);
await client.connect();

// Initialize OTP service with MongoDB
const otpService = new SecureEmailOtp(
  new MongoDbAdapter({
    client,
    dbName: "myapp",
    collectionName: "otps",
  }),
  new NodemailerAdapter({
    /* email config */
  }),
  new MemoryRateLimiterAdapter(),
  process.env.SERVER_SECRET!
);

// Your routes here...
```

### PostgreSQL with Prisma Example

```typescript
import express from "express";
import { PrismaClient } from "@prisma/client";
import {
  SecureEmailOtp,
  PrismaDatabaseAdapter,
  NodemailerAdapter,
  MemoryRateLimiterAdapter,
} from "secure-email-otp";

const app = express();

// Prisma client
const prisma = new PrismaClient();

// Initialize OTP service with Prisma
const otpService = new SecureEmailOtp(
  new PrismaDatabaseAdapter(prisma),
  new NodemailerAdapter({
    /* email config */
  }),
  new MemoryRateLimiterAdapter(),
  process.env.SERVER_SECRET!
);

// Your routes here...
```

### Mongoose Example

```typescript
import express from "express";
import mongoose from "mongoose";
import {
  SecureEmailOtp,
  MongooseAdapter,
  NodemailerAdapter,
  MemoryRateLimiterAdapter,
} from "secure-email-otp";

const app = express();

// Mongoose connection
await mongoose.connect(process.env.MONGODB_URL!);

// Initialize OTP service with Mongoose
const otpService = new SecureEmailOtp(
  new MongooseAdapter({
    connection: mongoose.connection,
    collectionName: "otps",
  }),
  new NodemailerAdapter({
    /* email config */
  }),
  new MemoryRateLimiterAdapter(),
  process.env.SERVER_SECRET!
);

// Your routes here...
```

### MySQL with Prisma Example

```typescript
import express from "express";
import { PrismaClient } from "@prisma/client";
import {
  SecureEmailOtp,
  PrismaDatabaseAdapter,
  NodemailerAdapter,
  MemoryRateLimiterAdapter,
} from "secure-email-otp";

const app = express();

// Prisma client (configured for MySQL in schema.prisma)
const prisma = new PrismaClient();

// Initialize OTP service with Prisma (MySQL)
const otpService = new SecureEmailOtp(
  new PrismaDatabaseAdapter(prisma),
  new NodemailerAdapter({
    /* email config */
  }),
  new MemoryRateLimiterAdapter(),
  process.env.SERVER_SECRET!
);

// Your routes here...
```

## 🔧 Database Schema Requirements

### MongoDB Schema

The MongoDB adapter automatically creates the collection with this structure:

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

### Prisma Schema

Add this to your `schema.prisma`:

```prisma
model Otp {
  id               String   @id @default(cuid())
  email            String
  context          String
  sessionId        String
  otpHash          String
  hmac             String
  requestMetaHash  String
  expiresAt        DateTime
  used             Boolean  @default(false)
  attemptCount     Int      @default(0)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@unique([email, context, sessionId])
  @@index([email, context, expiresAt])
  @@index([expiresAt])
}
```

## 🛠️ Creating Custom Database Adapters

If you want to use a database not supported by the built-in adapters, you can create your own:

```typescript
import { DatabaseAdapter, OtpRecord } from "secure-email-otp";

export class MyCustomDatabaseAdapter implements DatabaseAdapter {
  async createOtp(
    otp: Omit<OtpRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<OtpRecord> {
    // Your database-specific implementation
    const record = await yourDatabase.insert("otps", {
      ...otp,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.mapToOtpRecord(record);
  }

  async findOtp(
    email: string,
    context: string,
    sessionId: string
  ): Promise<OtpRecord | null> {
    // Your database-specific implementation
    const record = await yourDatabase.findOne("otps", {
      email,
      context,
      sessionId,
    });

    return record ? this.mapToOtpRecord(record) : null;
  }

  // Implement other required methods...
  async updateOtp(id: string, updates: Partial<OtpRecord>): Promise<OtpRecord> {
    /* ... */
  }
  async deleteOtp(id: string): Promise<void> {
    /* ... */
  }
  async findActiveOtp(
    email: string,
    context: string
  ): Promise<OtpRecord | null> {
    /* ... */
  }
  async cleanupExpiredOtps(): Promise<void> {
    /* ... */
  }

  private mapToOtpRecord(record: any): OtpRecord {
    return {
      id: record.id,
      email: record.email,
      context: record.context,
      sessionId: record.sessionId,
      otpHash: record.otpHash,
      hmac: record.hmac,
      requestMetaHash: record.requestMetaHash,
      expiresAt: record.expiresAt,
      used: record.used,
      attemptCount: record.attemptCount,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
```

Then use it:

```typescript
const otpService = new SecureEmailOtp(
  new MyCustomDatabaseAdapter(), // ← Your custom adapter
  emailProvider,
  rateLimiter,
  serverSecret
);
```

## 📊 Database Comparison

| Database   | Adapter                 | Best For               | Setup Complexity |
| ---------- | ----------------------- | ---------------------- | ---------------- |
| Memory     | `MemoryDatabaseAdapter` | Development/Testing    | ⭐ (Easiest)     |
| MongoDB    | `MongoDbAdapter`        | Production (NoSQL)     | ⭐⭐             |
| MongoDB    | `MongooseAdapter`       | Production (NoSQL)     | ⭐⭐             |
| PostgreSQL | `PrismaDatabaseAdapter` | Production (SQL)       | ⭐⭐⭐           |
| MySQL      | `PrismaDatabaseAdapter` | Production (SQL)       | ⭐⭐⭐           |
| SQLite     | `PrismaDatabaseAdapter` | Development/Small apps | ⭐⭐             |
| Custom     | Custom Adapter          | Any database           | ⭐⭐⭐⭐         |

## 🔄 Switching Between Databases

You can easily switch databases by changing just the adapter:

```typescript
// Development (Memory)
const devOtpService = new SecureEmailOtp(
  new MemoryDatabaseAdapter(),
  emailProvider,
  rateLimiter,
  serverSecret
);

// Production (MongoDB)
const prodOtpService = new SecureEmailOtp(
  new MongoDbAdapter({ client, dbName: "prod" }),
  emailProvider,
  rateLimiter,
  serverSecret
);

// Testing (Memory)
const testOtpService = new SecureEmailOtp(
  new MemoryDatabaseAdapter(),
  emailProvider,
  rateLimiter,
  serverSecret
);
```

## 🚀 Environment-Based Configuration

```typescript
import {
  SecureEmailOtp,
  MemoryDatabaseAdapter,
  MongoDbAdapter,
  PrismaDatabaseAdapter,
} from "secure-email-otp";

function createDatabaseAdapter() {
  const env = process.env.NODE_ENV;

  switch (env) {
    case "development":
      return new MemoryDatabaseAdapter();

    case "production":
      if (process.env.DATABASE_TYPE === "mongodb") {
        return new MongoDbAdapter({
          client: mongoClient,
          dbName: process.env.DB_NAME!,
        });
      } else {
        return new PrismaDatabaseAdapter(prismaClient);
      }

    case "test":
      return new MemoryDatabaseAdapter();

    default:
      return new MemoryDatabaseAdapter();
  }
}

const otpService = new SecureEmailOtp(
  createDatabaseAdapter(), // ← Automatically chooses based on environment
  emailProvider,
  rateLimiter,
  serverSecret
);
```

## 🤝 Need Help?

- **MongoDB**: See [MONGODB_INTEGRATION.md](./MONGODB_INTEGRATION.md)
- **Prisma**: See [PRISMA_INTEGRATION.md](./PRISMA_INTEGRATION.md) (if available)
- **Custom Adapter**: Check the `DatabaseAdapter` interface in the source code
- **General**: Check the main [README.md](../README.md)

The adapter pattern makes it super easy to use any database with this package!
