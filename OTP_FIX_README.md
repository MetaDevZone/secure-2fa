# OTP Verification Issues - Fixes Applied

## Issues Identified

Based on your terminal output, you were experiencing two main issues:

1. **"OTP expired"** - OTPs were expiring too quickly
2. **"Invalid OTP"** - OTP verification was failing even with correct codes

## Root Cause

The main issue was in the OTP generation logic when handling resend scenarios:

1. **Session ID Reuse**: When requesting a new OTP for the same email/context, the system was reusing the same session ID but generating a new OTP
2. **HMAC Mismatch**: The HMAC (Hash-based Message Authentication Code) was created with the new OTP but the old session ID, causing verification failures
3. **Strict Mode**: The system was running in strict mode, which requires exact request metadata matching between generation and verification

## Fixes Applied

### 1. Fixed OTP Generation Logic (`src/core/secure-email-otp.ts`)

**Before**: When resending OTP, the system would:

- Keep the same session ID
- Generate a new OTP
- Update the existing record with new hash/HMAC
- This created HMAC mismatches

**After**: When resending OTP, the system now:

- Marks the old OTP as used (invalidates it)
- Generates a completely new OTP with a new session ID
- Creates a fresh database record
- Ensures HMAC consistency

### 2. Improved Configuration (`examples/express-example.ts`)

- **Increased expiry time**: From 2 minutes to 10 minutes
- **Disabled strict mode**: For easier testing (removes request metadata validation)
- **Added detailed logging**: Better error tracking and debugging

### 3. Enhanced Error Handling

- Added detailed error codes in API responses
- Improved logging for debugging
- Better error messages for different failure scenarios

## Testing the Fix

### Option 1: Use the Test Script

```bash
# Install axios if not already installed
npm install axios

# Run the test script
node test-otp.js
```

### Option 2: Manual Testing with curl

```bash
# 1. Generate OTP
curl -X POST http://localhost:3000/api/otp/generate \
  -H "Content-Type: application/json" \
  -d '{"email": "ghulammohiodin.me@gmail.com", "context": "login"}'

# 2. Copy the sessionId and OTP from the response, then verify
curl -X POST http://localhost:3000/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ghulammohiodin.me@gmail.com",
    "otp": "123456",
    "context": "login",
    "sessionId": "your-session-id-here"
  }'
```

### Option 3: Using Postman or similar tool

1. **Generate OTP**: `POST /api/otp/generate`

   ```json
   {
     "email": "ghulammohiodin.me@gmail.com",
     "context": "login"
   }
   ```

2. **Verify OTP**: `POST /api/otp/verify`
   ```json
   {
     "email": "ghulammohiodin.me@gmail.com",
     "otp": "123456",
     "context": "login",
     "sessionId": "session-id-from-step-1"
   }
   ```

## Expected Behavior Now

1. **First OTP request**: Should generate a new OTP with a unique session ID
2. **Subsequent requests**: Should invalidate the old OTP and create a completely new one
3. **Verification**: Should work correctly with the OTP and session ID from the most recent generation
4. **Expiry**: OTPs now last 10 minutes instead of 2 minutes
5. **Error messages**: More detailed error information for debugging

## Production Considerations

For production use, consider:

1. **Re-enable strict mode**: Set `strictMode: true` for better security
2. **Adjust expiry time**: Set appropriate expiry based on your security requirements
3. **Remove debug OTP**: Remove the `otp` field from the generate response
4. **Add rate limiting**: Ensure proper rate limiting is configured
5. **Use persistent database**: Replace `MemoryDatabaseAdapter` with a real database adapter

## Troubleshooting

If you still experience issues:

1. **Check server logs**: Look for detailed error messages
2. **Verify session ID**: Ensure you're using the session ID from the most recent generation
3. **Check request metadata**: If strict mode is enabled, ensure consistent request metadata
4. **Database state**: Check if OTP records are being properly created/updated

The fixes should resolve the "expired OTP" and "invalid OTP" issues you were experiencing.

