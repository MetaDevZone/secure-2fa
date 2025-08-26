import { randomBytes, createHmac, createHash } from 'crypto';
import bcrypt from 'bcrypt';

export class OtpGenerator {
  private readonly serverSecret: string;

  constructor(serverSecret: string) {
    if (!serverSecret || serverSecret.length < 32) {
      throw new Error('Server secret must be at least 32 characters long');
    }
    this.serverSecret = serverSecret;
  }

  /**
   * Generate a secure OTP with specified length
   */
  generateOtp(length: number = 6): string {
    if (length < 4 || length > 10) {
      throw new Error('OTP length must be between 4 and 10 digits');
    }

    // Generate cryptographically secure random bytes
    const bytes = randomBytes(length);
    let otp = '';

    // Convert to numeric OTP
    for (let i = 0; i < length; i++) {
      otp += (bytes[i]! % 10).toString();
    }

    return otp;
  }

  /**
   * Create HMAC for OTP to prevent tampering
   */
  createHmac(otp: string, context: string, sessionId: string): string {
    const data = `${otp}:${context}:${sessionId}`;
    const hmac = createHmac('sha256', this.serverSecret);
    hmac.update(data);
    return hmac.digest('hex');
  }

  /**
   * Verify HMAC for OTP using constant-time comparison
   */
  verifyHmac(otp: string, context: string, sessionId: string, expectedHmac: string): boolean {
    const calculatedHmac = this.createHmac(otp, context, sessionId);
    
    // Use constant-time comparison to prevent timing attacks
    if (calculatedHmac.length !== expectedHmac.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < calculatedHmac.length; i++) {
      result |= calculatedHmac.charCodeAt(i) ^ expectedHmac.charCodeAt(i);
    }
    
    return result === 0;
  }

  /**
   * Hash OTP for secure storage (using bcrypt)
   */
  async hashOtp(otp: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(otp, saltRounds);
  }

  /**
   * Verify OTP hash
   */
  async verifyOtpHash(otp: string, hash: string): Promise<boolean> {
    return bcrypt.compare(otp, hash);
  }

  /**
   * Generate session ID (UUID v4)
   */
  generateSessionId(): string {
    const bytes = randomBytes(16);
    
    // Set version (4) and variant bits
    bytes[6] = (bytes[6]! & 0x0f) | 0x40;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;
    
    const hex = bytes.toString('hex');
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32)
    ].join('-');
  }

  /**
   * Create a hash of request metadata for context binding
   */
  hashRequestMeta(requestMeta: {
    ip: string;
    userAgent: string;
    deviceId?: string;
    platform?: string;
    browser?: string;
    os?: string;
  }): string {
    const data = JSON.stringify(requestMeta);
    const hash = createHash('sha256');
    hash.update(data);
    return hash.digest('hex');
  }

  /**
   * Verify request metadata hash
   */
  verifyRequestMeta(
    requestMeta: {
      ip: string;
      userAgent: string;
      deviceId?: string;
      platform?: string;
      browser?: string;
      os?: string;
    },
    expectedHash: string
  ): boolean {
    const calculatedHash = this.hashRequestMeta(requestMeta);
    return calculatedHash === expectedHash;
  }
}
