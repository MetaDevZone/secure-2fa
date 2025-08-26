# Usage Guide

A step-by-step tutorial to get you up and running with Secure Email OTP in your Node.js application.

## 📋 Table of Contents

- [Installation](#installation)
- [Basic Setup](#basic-setup)
- [Express.js Example](#expressjs-example)
- [Client-Side Implementation](#client-side-implementation)
- [Advanced Configuration](#advanced-configuration)
- [Production Deployment](#production-deployment)

## 🚀 Installation

### 1. Install the Package

```bash
npm install secure-email-otp
```

### 2. Install Required Dependencies

Choose your database and email provider:

```bash
# For MongoDB (native driver)
npm install mongodb

# For MongoDB with Mongoose
npm install mongoose

# For PostgreSQL/MySQL with Prisma
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

## 🔧 Basic Setup

### 1. Import Required Classes

```typescript
import {
  SecureEmailOtp,
  MemoryDatabaseAdapter,
  NodemailerAdapter,
  MemoryRateLimiterAdapter,
} from "secure-email-otp";
```

### 2. Initialize the OTP Service

```typescript
const otpService = new SecureEmailOtp(
  new MemoryDatabaseAdapter(), // Database adapter
  new NodemailerAdapter({
    // Email provider
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  }),
  new MemoryRateLimiterAdapter(), // Rate limiter
  process.env.SERVER_SECRET!, // Server secret for HMAC
  {
    otpLength: 6,
    expiryMs: 2 * 60 * 1000, // 2 minutes
    maxRetries: 5,
    strictMode: true,
  }
);
```

### 3. Generate an OTP

```typescript
const result = await otpService.generate({
  email: "user@example.com",
  context: "login",
  requestMeta: {
    ip: "192.168.1.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    deviceId: "device-123",
  },
});

console.log("OTP generated:", {
  sessionId: result.sessionId,
  expiresAt: result.expiresAt,
});
```

### 4. Verify an OTP

```typescript
const verification = await otpService.verify({
  email: "user@example.com",
  clientHash: "123456", // The OTP entered by user
  context: "login",
  sessionId: result.sessionId,
  requestMeta: {
    ip: "192.168.1.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    deviceId: "device-123",
  },
});

if (verification.verified) {
  console.log("OTP verified successfully!");
} else {
  console.log("OTP verification failed:", verification.reason);
}
```

## 🌐 Express.js Example

Here's a complete Express.js application with OTP endpoints:

```typescript
import express from "express";
import {
  SecureEmailOtp,
  MemoryDatabaseAdapter,
  NodemailerAdapter,
  MemoryRateLimiterAdapter,
} from "secure-email-otp";

const app = express();
app.use(express.json());

// Initialize OTP service
const otpService = new SecureEmailOtp(
  new MemoryDatabaseAdapter(),
  new NodemailerAdapter({
    host: "smtp.gmail.com",
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

// Generate OTP endpoint
app.post("/api/otp/generate", async (req, res) => {
  try {
    const { email, context } = req.body;

    const result = await otpService.generate({
      email,
      context,
      requestMeta: {
        ip: req.ip,
        userAgent: req.get("User-Agent") || "Unknown",
        deviceId: req.headers["x-device-id"] as string,
      },
    });

    res.json({
      success: true,
      sessionId: result.sessionId,
      expiresAt: result.expiresAt,
      message: "OTP sent to your email",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Verify OTP endpoint
app.post("/api/otp/verify", async (req, res) => {
  try {
    const { email, otp, context, sessionId } = req.body;

    const result = await otpService.verify({
      email,
      clientHash: otp,
      context,
      sessionId,
      requestMeta: {
        ip: req.ip,
        userAgent: req.get("User-Agent") || "Unknown",
        deviceId: req.headers["x-device-id"] as string,
      },
    });

    if (result.verified) {
      res.json({
        success: true,
        message: "OTP verified successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.reason,
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## 📧 Email Provider Examples

### Brevo (Sendinblue)

```typescript
import { BrevoAdapter } from "secure-email-otp";

const emailProvider = new BrevoAdapter({
  apiKey: process.env.BREVO_API_KEY!,
  from: "noreply@yourdomain.com",
  senderName: "Your App Name",
});
```

**Setup:**

1. Create a Brevo account
2. Generate an API key
3. Verify your sender domain
4. Set environment variable: `BREVO_API_KEY=your-api-key`

### Postmark

```typescript
import { PostmarkAdapter } from "secure-email-otp";

const emailProvider = new PostmarkAdapter({
  serverToken: process.env.POSTMARK_SERVER_TOKEN!,
  from: "noreply@yourdomain.com",
});
```

**Setup:**

1. Create a Postmark account
2. Create a server
3. Get your server token
4. Verify your sender domain
5. Set environment variable: `POSTMARK_SERVER_TOKEN=your-server-token`

### Mailgun

```typescript
import { MailgunAdapter } from "secure-email-otp";

const emailProvider = new MailgunAdapter({
  apiKey: process.env.MAILGUN_API_KEY!,
  domain: process.env.MAILGUN_DOMAIN!,
  from: "noreply@your-domain.com",
  region: "us", // or "eu"
});
```

**Setup:**

1. Create a Mailgun account
2. Add your domain
3. Generate an API key
4. Set environment variables:
   - `MAILGUN_API_KEY=your-api-key`
   - `MAILGUN_DOMAIN=your-domain.com`

### Custom Email Provider

```typescript
import { CustomAdapter } from "secure-email-otp";

const emailProvider = new CustomAdapter({
  sendFunction: async (params) => {
    // Your email sending logic here
    // Example: AWS SES, custom SMTP, webhook-based service
    console.log("Sending email:", params);

    // await yourEmailService.send({
    //   to: params.to,
    //   from: params.from,
    //   subject: params.subject,
    //   html: params.html,
    //   text: params.text
    // });
  },
  verifyFunction: async () => {
    // Optional: Verify your email service is working
    return true;
  },
});
```

## 📱 Client-Side Implementation

### React/TypeScript Example

```typescript
import React, { useState } from "react";

interface OtpResponse {
  success: boolean;
  sessionId?: string;
  expiresAt?: string;
  error?: string;
}

const OtpComponent: React.FC = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const generateOtp = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/otp/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Id": "web-client-123",
        },
        body: JSON.stringify({
          email,
          context: "login",
        }),
      });

      const data: OtpResponse = await response.json();

      if (data.success && data.sessionId) {
        setSessionId(data.sessionId);
        setMessage(`OTP sent to ${email}. Check your email.`);
      } else {
        setMessage(data.error || "Failed to send OTP");
      }
    } catch (error) {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Id": "web-client-123",
        },
        body: JSON.stringify({
          email,
          otp,
          context: "login",
          sessionId,
        }),
      });

      const data: OtpResponse = await response.json();

      if (data.success) {
        setMessage("OTP verified successfully!");
        // Redirect or update UI
      } else {
        setMessage(data.error || "OTP verification failed");
      }
    } catch (error) {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-container">
      <h2>Email Verification</h2>

      <div className="input-group">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button onClick={generateOtp} disabled={loading || !email}>
          {loading ? "Sending..." : "Send OTP"}
        </button>
      </div>

      {sessionId && (
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
          />
          <button onClick={verifyOtp} disabled={loading || !otp}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </div>
      )}

      {message && (
        <div
          className={`message ${
            message.includes("successfully") ? "success" : "error"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default OtpComponent;
```

### Mobile App Example (React Native)

```typescript
import React, { useState } from "react";
import { View, TextInput, Button, Text, Alert } from "react-native";

const OtpScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);

  const generateOtp = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://your-api.com/api/otp/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Id": "mobile-app-456",
        },
        body: JSON.stringify({
          email,
          context: "login",
        }),
      });

      const data = await response.json();

      if (data.success && data.sessionId) {
        setSessionId(data.sessionId);
        Alert.alert("Success", `OTP sent to ${email}`);
      } else {
        Alert.alert("Error", data.error || "Failed to send OTP");
      }
    } catch (error) {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://your-api.com/api/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Id": "mobile-app-456",
        },
        body: JSON.stringify({
          email,
          otp,
          context: "login",
          sessionId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert("Success", "OTP verified successfully!");
        // Navigate to next screen
      } else {
        Alert.alert("Error", data.error || "OTP verification failed");
      }
    } catch (error) {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Email Verification</Text>

      <TextInput
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <Button
        title={loading ? "Sending..." : "Send OTP"}
        onPress={generateOtp}
        disabled={loading || !email}
      />

      {sessionId && (
        <>
          <TextInput
            style={{
              borderWidth: 1,
              padding: 10,
              marginTop: 20,
              marginBottom: 10,
            }}
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            maxLength={6}
          />

          <Button
            title={loading ? "Verifying..." : "Verify OTP"}
            onPress={verifyOtp}
            disabled={loading || !otp}
          />
        </>
      )}
    </View>
  );
};

export default OtpScreen;
```

## ⚙️ Advanced Configuration

### Custom Email Templates

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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your Verification Code</h2>
          <p>Hello,</p>
          <p>Your verification code is: <strong style="font-size: 24px; color: #007bff;">{otp}</strong></p>
          <p>This code will expire in {expiryMinutes} minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            {companyName} | {supportEmail}
          </p>
        </div>
      `,
      text: `
        Your Verification Code
        
        Your verification code is: {otp}
        This code will expire in {expiryMinutes} minutes.
        
        If you didn't request this code, please ignore this email.
        
        {companyName} | {supportEmail}
      `,
    },
  }
);
```

### Event Handlers

```typescript
const otpService = new SecureEmailOtp(
  dbAdapter,
  emailProvider,
  rateLimiter,
  serverSecret,
  {
    events: {
      onRequest: async (event) => {
        console.log("OTP requested:", {
          email: event.email,
          context: event.context,
          ip: event.requestMeta.ip,
          timestamp: event.timestamp,
        });
        // Log to analytics, audit trail, etc.
      },

      onSend: async (event) => {
        console.log("OTP sent:", {
          email: event.email,
          sessionId: event.sessionId,
          timestamp: event.timestamp,
        });
        // Track delivery success, update metrics
      },

      onVerify: async (event) => {
        console.log("OTP verified:", {
          email: event.email,
          sessionId: event.sessionId,
          timestamp: event.timestamp,
        });
        // Update user status, log success
      },

      onFail: async (event) => {
        console.log("OTP failed:", {
          email: event.email,
          error: event.error?.message,
          timestamp: event.timestamp,
        });
        // Alert on suspicious activity, update security metrics
      },
    },
  }
);
```

## 🚀 Production Deployment

### Environment Variables

```bash
# Server Configuration
SERVER_SECRET=your-very-long-random-secret-key-here
NODE_ENV=production

# Email Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Database Configuration
DATABASE_URL=mongodb://localhost:27017/myapp
# OR
DATABASE_URL=postgresql://user:password@localhost:5432/myapp

# Rate Limiting
REDIS_URL=redis://localhost:6379
```

### Production Database Setup

```typescript
// MongoDB with Mongoose
import mongoose from "mongoose";
import { MongooseAdapter } from "secure-email-otp";

await mongoose.connect(process.env.DATABASE_URL!);

const dbAdapter = new MongooseAdapter({
  connection: mongoose.connection,
  collectionName: "otps",
});

// PostgreSQL with Prisma
import { PrismaClient } from "@prisma/client";
import { PrismaDatabaseAdapter } from "secure-email-otp";

const prisma = new PrismaClient();
const dbAdapter = new PrismaDatabaseAdapter(prisma);
```

### Health Checks

```typescript
// Add health check endpoint
app.get("/health", async (req, res) => {
  try {
    // Test database connection
    await otpService.cleanup(); // This will test the database adapter

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});
```

## 📝 Next Steps

- **[API Reference](./API.md)** - Complete function documentation
- **[Database Adapters](./ADAPTERS.md)** - Configure your preferred database
- **[Event System](./EVENTS.md)** - Set up monitoring and analytics
- **[Security Model](./SECURITY.md)** - Understand security features
- **[FAQ](./FAQ.md)** - Common questions and solutions

---

**Need help?** Check out our [FAQ](./FAQ.md) or [open an issue](https://github.com/yourusername/secure-email-otp/issues) on GitHub.
