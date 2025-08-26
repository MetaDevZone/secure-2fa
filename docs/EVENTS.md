# Event System

Complete guide to the webhook-style event system in Secure Email OTP for monitoring, analytics, and integrations.

## 📋 Table of Contents

- [Overview](#overview)
- [Event Types](#event-types)
- [Event Handlers](#event-handlers)
- [Event Payloads](#event-payloads)
- [Use Cases](#use-cases)
- [Best Practices](#best-practices)

## 🎯 Overview

The Secure Email OTP package includes a comprehensive event system that allows you to monitor and react to OTP lifecycle events. Events are triggered at key points in the OTP process and can be used for:

- **Audit Logging**: Track all OTP activities
- **Analytics**: Monitor usage patterns and success rates
- **Security Monitoring**: Detect suspicious activities
- **Integrations**: Connect with external services
- **Debugging**: Troubleshoot issues in production

## 🔔 Event Types

### onRequest

Triggered when an OTP generation is requested.

**When:** Before OTP generation and email sending
**Use Case:** Rate limiting, fraud detection, analytics

```typescript
onRequest: async (event: OtpEvent) => {
  console.log("OTP requested:", {
    email: event.email,
    context: event.context,
    ip: event.requestMeta.ip,
    timestamp: event.timestamp,
  });
};
```

### onSend

Triggered when an OTP email is successfully sent.

**When:** After email is sent to the user
**Use Case:** Delivery tracking, success metrics, user notifications

```typescript
onSend: async (event: OtpEvent) => {
  console.log("OTP sent:", {
    email: event.email,
    sessionId: event.sessionId,
    timestamp: event.timestamp,
  });
};
```

### onVerify

Triggered when an OTP is successfully verified.

**When:** After successful OTP verification
**Use Case:** Success tracking, user activity logging, conversion metrics

```typescript
onVerify: async (event: OtpEvent) => {
  console.log("OTP verified:", {
    email: event.email,
    sessionId: event.sessionId,
    timestamp: event.timestamp,
  });
};
```

### onFail

Triggered when an OTP operation fails.

**When:** After any failure (generation, sending, verification)
**Use Case:** Error tracking, security alerts, debugging

```typescript
onFail: async (event: OtpEvent) => {
  console.log("OTP failed:", {
    email: event.email,
    error: event.error?.message,
    timestamp: event.timestamp,
  });
};
```

## 🛠️ Event Handlers

### Basic Event Handler Setup

```typescript
import {
  SecureEmailOtp,
  MemoryDatabaseAdapter,
  NodemailerAdapter,
} from "secure-email-otp";

const otpService = new SecureEmailOtp(
  new MemoryDatabaseAdapter(),
  new NodemailerAdapter({
    /* email config */
  }),
  new MemoryRateLimiterAdapter(),
  "your-server-secret",
  {
    events: {
      onRequest: async (event) => {
        console.log("OTP requested:", event.email);
      },
      onSend: async (event) => {
        console.log("OTP sent:", event.sessionId);
      },
      onVerify: async (event) => {
        console.log("OTP verified:", event.email);
      },
      onFail: async (event) => {
        console.log("OTP failed:", event.error?.message);
      },
    },
  }
);
```

### Advanced Event Handler with Error Handling

```typescript
const otpService = new SecureEmailOtp(
  dbAdapter,
  emailProvider,
  rateLimiter,
  serverSecret,
  {
    events: {
      onRequest: async (event) => {
        try {
          // Log to database
          await logToDatabase("otp_requested", {
            email: event.email,
            context: event.context,
            ip: event.requestMeta.ip,
            userAgent: event.requestMeta.userAgent,
            timestamp: event.timestamp,
          });

          // Check for suspicious activity
          const suspiciousActivity = await checkSuspiciousActivity(event);
          if (suspiciousActivity) {
            await sendSecurityAlert(event);
          }
        } catch (error) {
          console.error("Error in onRequest handler:", error);
        }
      },

      onSend: async (event) => {
        try {
          // Update delivery metrics
          await updateDeliveryMetrics(event.email, "sent");

          // Send webhook to external service
          await sendWebhook("otp_sent", event);
        } catch (error) {
          console.error("Error in onSend handler:", error);
        }
      },

      onVerify: async (event) => {
        try {
          // Update user status
          await updateUserVerificationStatus(event.email, event.context);

          // Track conversion
          await trackConversion(event.email, event.context);
        } catch (error) {
          console.error("Error in onVerify handler:", error);
        }
      },

      onFail: async (event) => {
        try {
          // Log error for debugging
          await logError("otp_failed", {
            email: event.email,
            error: event.error?.message,
            stack: event.error?.stack,
            timestamp: event.timestamp,
          });

          // Send alert for repeated failures
          if (event.error?.message?.includes("ATTEMPTS_EXCEEDED")) {
            await sendSecurityAlert(event);
          }
        } catch (error) {
          console.error("Error in onFail handler:", error);
        }
      },
    },
  }
);
```

## 📊 Event Payloads

### OtpEvent Interface

```typescript
interface OtpEvent {
  email: string; // Email address
  context: string; // OTP context (login, reset, etc.)
  sessionId: string; // Unique session ID
  requestMeta: RequestMeta; // Request metadata
  timestamp: Date; // Event timestamp
  error?: Error; // Error object (only in onFail)
}
```

### RequestMeta Interface

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

### Example Event Payloads

**onRequest Event:**

```json
{
  "email": "user@example.com",
  "context": "login",
  "sessionId": "session_123456789",
  "requestMeta": {
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "deviceId": "device-123",
    "platform": "web",
    "browser": "chrome",
    "os": "windows"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**onSend Event:**

```json
{
  "email": "user@example.com",
  "context": "login",
  "sessionId": "session_123456789",
  "requestMeta": {
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "deviceId": "device-123",
    "platform": "web",
    "browser": "chrome",
    "os": "windows"
  },
  "timestamp": "2024-01-15T10:30:05.000Z"
}
```

**onVerify Event:**

```json
{
  "email": "user@example.com",
  "context": "login",
  "sessionId": "session_123456789",
  "requestMeta": {
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "deviceId": "device-123",
    "platform": "web",
    "browser": "chrome",
    "os": "windows"
  },
  "timestamp": "2024-01-15T10:32:15.000Z"
}
```

**onFail Event:**

```json
{
  "email": "user@example.com",
  "context": "login",
  "sessionId": "session_123456789",
  "requestMeta": {
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "deviceId": "device-123",
    "platform": "web",
    "browser": "chrome",
    "os": "windows"
  },
  "timestamp": "2024-01-15T10:32:15.000Z",
  "error": {
    "message": "OTP expired",
    "code": "EXPIRED",
    "stack": "Error: OTP expired\n    at SecureEmailOtp.verify..."
  }
}
```

## 🎯 Use Cases

### 1. Audit Logging

Track all OTP activities for compliance and security.

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

  onSend: async (event: OtpEvent) => {
    await logToAuditTrail({
      action: "OTP_SENT",
      email: event.email,
      context: event.context,
      timestamp: event.timestamp,
      sessionId: event.sessionId,
    });
  },

  onVerify: async (event: OtpEvent) => {
    await logToAuditTrail({
      action: "OTP_VERIFIED",
      email: event.email,
      context: event.context,
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
      timestamp: event.timestamp,
      sessionId: event.sessionId,
    });
  },
};
```

### 2. Analytics and Metrics

Track OTP usage patterns and success rates.

```typescript
const analyticsTracker = {
  onRequest: async (event: OtpEvent) => {
    await incrementMetric("otp_requests_total", {
      context: event.context,
      platform: event.requestMeta.platform,
    });
  },

  onSend: async (event: OtpEvent) => {
    await incrementMetric("otp_sent_total", {
      context: event.context,
    });
  },

  onVerify: async (event: OtpEvent) => {
    await incrementMetric("otp_verified_total", {
      context: event.context,
    });

    // Calculate success rate
    const successRate = await calculateSuccessRate(event.context);
    await updateMetric("otp_success_rate", successRate, {
      context: event.context,
    });
  },

  onFail: async (event: OtpEvent) => {
    await incrementMetric("otp_failed_total", {
      context: event.context,
      error_type: event.error?.message,
    });
  },
};
```

### 3. Security Monitoring

Detect and alert on suspicious activities.

```typescript
const securityMonitor = {
  onRequest: async (event: OtpEvent) => {
    // Check for rapid requests from same IP
    const recentRequests = await getRecentRequests(event.requestMeta.ip, 60); // 1 minute
    if (recentRequests.length > 5) {
      await sendSecurityAlert("RAPID_OTP_REQUESTS", {
        ip: event.requestMeta.ip,
        count: recentRequests.length,
        timeWindow: "1 minute",
      });
    }

    // Check for requests from known malicious IPs
    const isMaliciousIP = await checkMaliciousIP(event.requestMeta.ip);
    if (isMaliciousIP) {
      await blockIP(event.requestMeta.ip);
      await sendSecurityAlert("MALICIOUS_IP_DETECTED", {
        ip: event.requestMeta.ip,
        email: event.email,
      });
    }
  },

  onFail: async (event: OtpEvent) => {
    // Alert on repeated failures
    if (event.error?.message?.includes("ATTEMPTS_EXCEEDED")) {
      await sendSecurityAlert("OTP_ATTEMPTS_EXCEEDED", {
        email: event.email,
        ip: event.requestMeta.ip,
        context: event.context,
      });
    }

    // Alert on context mismatch (potential attack)
    if (event.error?.message?.includes("META_MISMATCH")) {
      await sendSecurityAlert("CONTEXT_MISMATCH_DETECTED", {
        email: event.email,
        ip: event.requestMeta.ip,
        context: event.context,
      });
    }
  },
};
```

### 4. External Integrations

Connect with third-party services.

```typescript
const externalIntegrations = {
  onSend: async (event: OtpEvent) => {
    // Send webhook to CRM
    await sendWebhook("https://your-crm.com/webhooks/otp-sent", {
      email: event.email,
      context: event.context,
      timestamp: event.timestamp,
    });

    // Update user activity in analytics platform
    await updateUserActivity(event.email, {
      action: "otp_sent",
      context: event.context,
      timestamp: event.timestamp,
    });
  },

  onVerify: async (event: OtpEvent) => {
    // Update user status in external system
    await updateUserStatus(event.email, {
      verified: true,
      context: event.context,
      timestamp: event.timestamp,
    });

    // Send notification to Slack
    await sendSlackNotification({
      channel: "#user-activity",
      text: `✅ User ${event.email} verified OTP for ${event.context}`,
    });
  },
};
```

### 5. Debugging and Monitoring

Track issues in production.

```typescript
const debugMonitor = {
  onFail: async (event: OtpEvent) => {
    // Log detailed error information
    await logError("otp_failure", {
      email: event.email,
      context: event.context,
      sessionId: event.sessionId,
      error: {
        message: event.error?.message,
        code: event.error?.code,
        stack: event.error?.stack,
      },
      requestMeta: event.requestMeta,
      timestamp: event.timestamp,
    });

    // Send to error tracking service
    await sendToErrorTracking({
      service: "secure-email-otp",
      error: event.error,
      context: {
        email: event.email,
        sessionId: event.sessionId,
        requestMeta: event.requestMeta,
      },
    });
  },
};
```

## 🚀 Best Practices

### 1. Error Handling

Always wrap event handlers in try-catch blocks to prevent failures from affecting the main OTP flow.

```typescript
const safeEventHandler = (handler: (event: OtpEvent) => Promise<void>) => {
  return async (event: OtpEvent) => {
    try {
      await handler(event);
    } catch (error) {
      console.error("Event handler error:", error);
      // Don't throw - let the main flow continue
    }
  };
};

const otpService = new SecureEmailOtp(
  dbAdapter,
  emailProvider,
  rateLimiter,
  serverSecret,
  {
    events: {
      onRequest: safeEventHandler(async (event) => {
        // Your event handling logic
      }),
    },
  }
);
```

### 2. Async Event Handlers

Make event handlers async and non-blocking to avoid slowing down the main OTP flow.

```typescript
const otpService = new SecureEmailOtp(
  dbAdapter,
  emailProvider,
  rateLimiter,
  serverSecret,
  {
    events: {
      onSend: async (event) => {
        // Fire and forget - don't await if not critical
        setImmediate(async () => {
          try {
            await sendAnalytics(event);
          } catch (error) {
            console.error("Analytics error:", error);
          }
        });
      },
    },
  }
);
```

### 3. Event Filtering

Only process events that are relevant to your use case.

```typescript
const filteredEventHandler = {
  onRequest: async (event: OtpEvent) => {
    // Only track login attempts
    if (event.context === "login") {
      await trackLoginAttempt(event);
    }
  },

  onVerify: async (event: OtpEvent) => {
    // Only send notifications for critical contexts
    if (["password_reset", "account_recovery"].includes(event.context)) {
      await sendSecurityNotification(event);
    }
  },
};
```

### 4. Performance Optimization

Use efficient event handling for high-traffic applications.

```typescript
const optimizedEventHandler = {
  onRequest: async (event: OtpEvent) => {
    // Use in-memory caching for frequent operations
    const cacheKey = `otp_request_${event.email}_${event.context}`;
    const recentRequests = (await cache.get(cacheKey)) || 0;

    if (recentRequests > 10) {
      // Rate limit exceeded - don't process further
      return;
    }

    await cache.set(cacheKey, recentRequests + 1, 60); // 1 minute TTL
    await logRequest(event);
  },
};
```

### 5. Event Batching

Batch events for better performance when possible.

```typescript
class EventBatcher {
  private events: OtpEvent[] = [];
  private batchSize = 100;
  private flushInterval = 5000; // 5 seconds

  constructor() {
    setInterval(() => this.flush(), this.flushInterval);
  }

  add(event: OtpEvent) {
    this.events.push(event);

    if (this.events.length >= this.batchSize) {
      this.flush();
    }
  }

  private async flush() {
    if (this.events.length === 0) return;

    const eventsToProcess = [...this.events];
    this.events = [];

    try {
      await this.processBatch(eventsToProcess);
    } catch (error) {
      console.error("Batch processing error:", error);
    }
  }

  private async processBatch(events: OtpEvent[]) {
    // Process events in batch
    await batchInsertToDatabase(events);
  }
}

const eventBatcher = new EventBatcher();

const otpService = new SecureEmailOtp(
  dbAdapter,
  emailProvider,
  rateLimiter,
  serverSecret,
  {
    events: {
      onRequest: async (event) => {
        eventBatcher.add(event);
      },
    },
  }
);
```

## 📝 Example Implementations

### Complete Event System Example

```typescript
import {
  SecureEmailOtp,
  MemoryDatabaseAdapter,
  NodemailerAdapter,
} from "secure-email-otp";

// Event handlers
const eventHandlers = {
  onRequest: async (event: OtpEvent) => {
    console.log(`📧 OTP requested for ${event.email} (${event.context})`);

    // Log to database
    await logToDatabase("otp_events", {
      type: "request",
      email: event.email,
      context: event.context,
      ip: event.requestMeta.ip,
      timestamp: event.timestamp,
    });
  },

  onSend: async (event: OtpEvent) => {
    console.log(`📤 OTP sent to ${event.email}`);

    // Update metrics
    await incrementCounter("otp_sent_total");

    // Send webhook
    await sendWebhook("https://your-api.com/webhooks/otp-sent", event);
  },

  onVerify: async (event: OtpEvent) => {
    console.log(`✅ OTP verified for ${event.email}`);

    // Update user status
    await updateUserStatus(event.email, "verified");

    // Send success notification
    await sendNotification(event.email, "OTP verified successfully");
  },

  onFail: async (event: OtpEvent) => {
    console.log(`❌ OTP failed for ${event.email}: ${event.error?.message}`);

    // Log error
    await logError("otp_failure", {
      email: event.email,
      error: event.error?.message,
      timestamp: event.timestamp,
    });

    // Send security alert for repeated failures
    if (event.error?.message?.includes("ATTEMPTS_EXCEEDED")) {
      await sendSecurityAlert(event);
    }
  },
};

// Initialize OTP service with event handlers
const otpService = new SecureEmailOtp(
  new MemoryDatabaseAdapter(),
  new NodemailerAdapter({
    /* email config */
  }),
  new MemoryRateLimiterAdapter(),
  "your-server-secret",
  {
    events: eventHandlers,
  }
);
```

---

**Ready to implement events?** Check out the [Usage Guide](./USAGE.md) for practical examples or the [API Reference](./API.md) for detailed function documentation.
