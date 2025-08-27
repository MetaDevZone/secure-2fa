# 🔧 Brevo Email Delivery Troubleshooting Guide

## 🚨 **Common Issues & Solutions**

### 1. **Email Not Being Received**

#### **Check Brevo Dashboard**

1. **Log into Brevo Dashboard**: https://app.brevo.com/
2. **Go to Activity Log**: Check if emails are being sent
3. **Check Status**: Look for "Delivered", "Bounced", or "Failed"

#### **Common Causes & Fixes**

**A. API Key Issues**

```typescript
// Verify your API key is correct
const brevoConfig = {
  apiKey: "your-actual-api-key-here", // Make sure this is correct
  from: "verified-sender@yourdomain.com",
  senderName: "Your Company",
};
```

**B. Sender Email Not Verified**

- **Issue**: Using unverified sender email
- **Fix**: Verify your sender domain in Brevo
- **Steps**:
  1. Go to Brevo Dashboard → Senders & IP
  2. Add and verify your domain
  3. Wait for DNS verification (can take 24-48 hours)

**C. Recipient Email Issues**

- **Check spam folder**
- **Verify email address is correct**
- **Check if recipient domain blocks Brevo**

### 2. **Testing Your Brevo Setup**

#### **Quick Test Script**

```typescript
import { BrevoAdapter } from "secure-2fa";

async function testBrevoConnection() {
  const brevoAdapter = new BrevoAdapter({
    apiKey: "your-api-key",
    from: "your-verified-email@yourdomain.com",
    senderName: "Test Sender",
  });

  // Test connection
  const isConnected = await brevoAdapter.verifyConnection();
  console.log("Brevo connection:", isConnected ? "✅ Connected" : "❌ Failed");

  if (isConnected) {
    // Test email sending
    try {
      await brevoAdapter.sendEmail({
        to: "your-test-email@gmail.com",
        subject: "Test Email from Brevo",
        html: "<h1>Test Email</h1><p>This is a test email from Brevo.</p>",
        text: "Test Email - This is a test email from Brevo.",
      });
      console.log("✅ Test email sent successfully");
    } catch (error) {
      console.error("❌ Failed to send test email:", error);
    }
  }
}

testBrevoConnection();
```

### 3. **Brevo Configuration Checklist**

#### **✅ Required Setup**

- [ ] **API Key**: Valid Brevo API key
- [ ] **Sender Domain**: Verified in Brevo dashboard
- [ ] **Sender Email**: From verified domain
- [ ] **DNS Records**: Properly configured
- [ ] **Account Status**: Active Brevo account

#### **🔧 DNS Configuration**

Add these records to your domain:

**SPF Record**:

```
v=spf1 include:spf.brevo.com ~all
```

**DKIM Record** (get from Brevo dashboard):

```
v=DKIM1; k=rsa; p=YOUR_DKIM_KEY_FROM_BREVO
```

**DMARC Record**:

```
v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

### 4. **Debug Your Current Setup**

#### **Step 1: Check API Key**

```typescript
// Test your API key
const brevo = require("@getbrevo/brevo");
const apiInstance = new brevo.AccountApi();
apiInstance.setApiKey(brevo.AccountApiApiKeys.apiKey, "your-api-key");

try {
  const account = await apiInstance.getAccount();
  console.log("✅ API Key valid:", account.email);
} catch (error) {
  console.error("❌ API Key invalid:", error.message);
}
```

#### **Step 2: Check Sender Verification**

```typescript
// Test sender verification
const emailApi = new brevo.SendersApi();
apiInstance.setApiKey(brevo.SendersApiApiKeys.apiKey, "your-api-key");

try {
  const senders = await emailApi.getSenders();
  console.log("✅ Verified senders:", senders.senders);
} catch (error) {
  console.error("❌ Sender verification failed:", error.message);
}
```

### 5. **Common Error Messages & Solutions**

| Error Message          | Cause                  | Solution                             |
| ---------------------- | ---------------------- | ------------------------------------ |
| `Invalid API key`      | Wrong API key          | Get correct key from Brevo dashboard |
| `Sender not verified`  | Domain not verified    | Verify domain in Brevo               |
| `Email blocked`        | Recipient blocks Brevo | Check recipient settings             |
| `Rate limit exceeded`  | Too many requests      | Wait and retry                       |
| `Invalid email format` | Malformed email        | Check email format                   |

### 6. **Production Checklist**

#### **Before Going Live**

- [ ] **Test with multiple email providers** (Gmail, Outlook, Yahoo)
- [ ] **Check deliverability score** in Brevo dashboard
- [ ] **Monitor bounce rates** and handle them
- [ ] **Set up webhooks** for delivery status
- [ ] **Configure proper error handling**

#### **Monitoring**

```typescript
// Add error handling to your OTP service
const otpService = new SecureEmailOtp(
  dbAdapter,
  brevoAdapter,
  rateLimiter,
  serverSecret,
  {
    events: {
      onFail: async (event) => {
        if (event.error?.message.includes("Brevo")) {
          console.error("Brevo email failed:", event.error);
          // Send to your monitoring service
        }
      },
    },
  }
);
```

### 7. **Quick Fixes to Try**

1. **Check Brevo Dashboard** for delivery status
2. **Verify sender email** is from verified domain
3. **Test with different recipient** email
4. **Check spam folder** of recipient
5. **Verify API key** is correct
6. **Check account status** in Brevo
7. **Review Brevo logs** for specific errors

### 8. **Support Resources**

- **Brevo Documentation**: https://developers.brevo.com/
- **Brevo Support**: https://www.brevo.com/support/
- **Email Deliverability Guide**: https://www.brevo.com/email-deliverability/
- **API Status**: https://status.brevo.com/

---

## 🚀 **Next Steps**

1. **Run the test script** above to verify your setup
2. **Check Brevo dashboard** for delivery status
3. **Verify your sender domain** is properly configured
4. **Test with a different recipient** email
5. **Check spam folder** of recipient

**If still having issues**, please share:

- Error messages from your logs
- Brevo dashboard activity status
- Your sender domain verification status
