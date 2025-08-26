import { SecureEmailOtp } from '../core/secure-email-otp';
import { MemoryDatabaseAdapter } from '../adapters/database/memory-adapter';
import { MemoryRateLimiterAdapter } from '../adapters/rate-limiter/memory-rate-limiter';
import { OtpError } from '../types';

// Mock email provider
const mockEmailProvider = {
  sendEmail: jest.fn().mockResolvedValue(undefined),
};

describe('SecureEmailOtp', () => {
  let secureOtp: SecureEmailOtp;
  let dbAdapter: MemoryDatabaseAdapter;
  let rateLimiter: MemoryRateLimiterAdapter;
  const serverSecret = 'this-is-a-very-long-server-secret-for-testing-purposes-only';

  const mockRequestMeta = {
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    deviceId: 'device-123',
    platform: 'web',
    browser: 'Chrome',
    os: 'Windows',
  };

  beforeEach(() => {
    dbAdapter = new MemoryDatabaseAdapter();
    rateLimiter = new MemoryRateLimiterAdapter();
    secureOtp = new SecureEmailOtp(
      dbAdapter,
      mockEmailProvider as any,
      rateLimiter,
      serverSecret,
      {
        otpLength: 6,
        expiryMs: 2 * 60 * 1000, // 2 minutes
        maxRetries: 3,
        strictMode: true,
        rateLimit: {
          maxPerWindow: 3,
          windowMs: 15 * 60 * 1000, // 15 minutes
        },
      }
    );

    // Clear mocks
    jest.clearAllMocks();
    dbAdapter.clear();
    rateLimiter.clear();
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      expect(secureOtp).toBeInstanceOf(SecureEmailOtp);
    });

    it('should create instance with custom config', () => {
      const customOtp = new SecureEmailOtp(
        dbAdapter,
        mockEmailProvider as any,
        rateLimiter,
        serverSecret,
        {
          otpLength: 8,
          expiryMs: 5 * 60 * 1000,
          maxRetries: 5,
        }
      );
      expect(customOtp).toBeInstanceOf(SecureEmailOtp);
    });
  });

  describe('generate', () => {
    it('should generate OTP successfully', async () => {
      const result = await secureOtp.generate({
        email: 'test@example.com',
        context: 'login',
        requestMeta: mockRequestMeta,
      });

      expect(result.sessionId).toBeDefined();
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.isResent).toBe(false);
      expect(mockEmailProvider.sendEmail).toHaveBeenCalledTimes(1);
    });

    it('should throw error for missing parameters', async () => {
      await expect(
        secureOtp.generate({
          email: '',
          context: 'login',
          requestMeta: mockRequestMeta,
        })
      ).rejects.toThrow(OtpError);

      await expect(
        secureOtp.generate({
          email: 'test@example.com',
          context: '',
          requestMeta: mockRequestMeta,
        })
      ).rejects.toThrow(OtpError);
    });

    it('should resend existing OTP if active', async () => {
      // Generate first OTP
      const result1 = await secureOtp.generate({
        email: 'test@example.com',
        context: 'login',
        requestMeta: mockRequestMeta,
      });

      // Generate second OTP (should resend)
      const result2 = await secureOtp.generate({
        email: 'test@example.com',
        context: 'login',
        requestMeta: mockRequestMeta,
      });

      expect(result1.sessionId).toBe(result2.sessionId);
      expect(result2.isResent).toBe(true);
      expect(mockEmailProvider.sendEmail).toHaveBeenCalledTimes(2);
    });

    it('should respect rate limiting', async () => {
      // Generate OTPs up to the limit
      for (let i = 0; i < 3; i++) {
        await secureOtp.generate({
          email: 'test@example.com',
          context: 'login',
          requestMeta: mockRequestMeta,
        });
      }

      // Next request should be rate limited
      await expect(
        secureOtp.generate({
          email: 'test@example.com',
          context: 'login',
          requestMeta: mockRequestMeta,
        })
      ).rejects.toThrow(OtpError);
    });
  });

  describe('verify', () => {
    let sessionId: string;

    beforeEach(async () => {
      const result = await secureOtp.generate({
        email: 'test@example.com',
        context: 'login',
        requestMeta: mockRequestMeta,
      });
      sessionId = result.sessionId;

      // Verify OTP record exists
      await dbAdapter.findOtp('test@example.com', 'login', sessionId, 'email');
    });

    it('should verify OTP successfully', async () => {
      const result = await secureOtp.verify({
        email: 'test@example.com',
        clientHash: '123456', // Mock bcrypt.compare returns true
        context: 'login',
        sessionId,
        requestMeta: mockRequestMeta,
      });

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe(sessionId);
      expect(result.email).toBe('test@example.com');
      expect(result.context).toBe('login');
    });

    it('should throw error for missing parameters', async () => {
      await expect(
        secureOtp.verify({
          email: '',
          clientHash: '123456',
          context: 'login',
          sessionId,
          requestMeta: mockRequestMeta,
        })
      ).rejects.toThrow(OtpError);
    });

    it('should throw error for non-existent OTP', async () => {
      await expect(
        secureOtp.verify({
          email: 'test@example.com',
          clientHash: '123456',
          context: 'login',
          sessionId: 'non-existent',
          requestMeta: mockRequestMeta,
        })
      ).rejects.toThrow(OtpError);
    });

    it('should throw error for already used OTP', async () => {
      // Verify first time
      await secureOtp.verify({
        email: 'test@example.com',
        clientHash: '123456',
        context: 'login',
        sessionId,
        requestMeta: mockRequestMeta,
      });

      // Try to verify again
      await expect(
        secureOtp.verify({
          email: 'test@example.com',
          clientHash: '123456',
          context: 'login',
          sessionId,
          requestMeta: mockRequestMeta,
        })
      ).rejects.toThrow(OtpError);
    });

    it('should throw error for expired OTP', async () => {
      // Get the actual OTP record first
      const otpRecord = await dbAdapter.findOtp('test@example.com', 'login', sessionId, 'email');
      if (!otpRecord) throw new Error('OTP record not found');
      
      // Manually expire the OTP
      await dbAdapter.updateOtp(otpRecord.id, {
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
      });

      await expect(
        secureOtp.verify({
          email: 'test@example.com',
          clientHash: '123456',
          context: 'login',
          sessionId,
          requestMeta: mockRequestMeta,
        })
      ).rejects.toThrow(OtpError);
    });

    it('should increment attempts on failed verification', async () => {
      // Mock bcrypt.compare to return false for invalid OTP
      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValueOnce(false);

      await expect(
        secureOtp.verify({
          email: 'test@example.com',
          clientHash: 'wrong-otp',
          context: 'login',
          sessionId,
          requestMeta: mockRequestMeta,
        })
      ).rejects.toThrow(OtpError);

      // Check that attempts were incremented
      const otpRecord = await dbAdapter.findOtp('test@example.com', 'login', sessionId, 'email');
      expect(otpRecord!.attempts).toBe(1);
    });

    it('should lock OTP after max attempts', async () => {
      // Mock bcrypt.compare to return false
      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValue(false);

      // Try to verify multiple times
      for (let i = 0; i < 3; i++) {
        await expect(
          secureOtp.verify({
            email: 'test@example.com',
            clientHash: 'wrong-otp',
            context: 'login',
            sessionId,
            requestMeta: mockRequestMeta,
          })
        ).rejects.toThrow(OtpError);
      }

      // Check that OTP is locked
      const otpRecord = await dbAdapter.findOtp('test@example.com', 'login', sessionId, 'email');
      expect(otpRecord!.isLocked).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should clean up expired OTPs', async () => {
      // Create an expired OTP
      await dbAdapter.createOtp({
        email: 'test@example.com',
        context: 'login',
        sessionId: 'test-session',
        channel: 'email',
        otpHash: 'hash',
        hmac: 'hmac',
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
        attempts: 0,
        maxAttempts: 3,
        isUsed: false,
        isLocked: false,
        requestMeta: mockRequestMeta,
      });

      await secureOtp.cleanup();

      // Check that expired OTP was removed
      const otpRecord = await dbAdapter.findOtp('test@example.com', 'login', 'test-session', 'email');
      expect(otpRecord).toBeNull();
    });
  });
});
