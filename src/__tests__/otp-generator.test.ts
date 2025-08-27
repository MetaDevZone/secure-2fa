import { OtpGenerator } from '../core/otp-generator';

describe('OtpGenerator', () => {
  let otpGenerator: OtpGenerator;
  const serverSecret = 'this-is-a-very-long-server-secret-for-testing-purposes-only';

  beforeEach(() => {
    otpGenerator = new OtpGenerator(serverSecret);
  });

  describe('constructor', () => {
    it('should throw error for short server secret', () => {
      expect(() => new OtpGenerator('short')).toThrow('Server secret must be at least 32 characters long');
    });

    it('should throw error for empty server secret', () => {
      expect(() => new OtpGenerator('')).toThrow('Server secret must be at least 32 characters long');
    });

    it('should create instance with valid server secret', () => {
      expect(otpGenerator).toBeInstanceOf(OtpGenerator);
    });
  });

  describe('generateOtp', () => {
    it('should generate OTP with default length', () => {
      const otp = otpGenerator.generateOtp();
      expect(otp).toHaveLength(6);
      expect(otp).toMatch(/^\d+$/);
    });

    it('should generate OTP with custom length', () => {
      const otp = otpGenerator.generateOtp(8);
      expect(otp).toHaveLength(8);
      expect(otp).toMatch(/^\d+$/);
    });

    it('should throw error for invalid length < 4', () => {
      expect(() => otpGenerator.generateOtp(3)).toThrow('OTP length must be between 4 and 10 digits');
    });

    it('should throw error for invalid length > 10', () => {
      expect(() => otpGenerator.generateOtp(11)).toThrow('OTP length must be between 4 and 10 digits');
    });
  });

  describe('createHmac and verifyHmac', () => {
    it('should create and verify HMAC correctly', () => {
      const otp = '123456';
      const context = 'test-context';
      const sessionId = 'test-session';

      const hmac = otpGenerator.createHmac(otp, context, sessionId);
      expect(hmac).toBe('mocked-hmac-hash');

      const isValid = otpGenerator.verifyHmac(otp, context, sessionId, hmac);
      expect(isValid).toBe(true);
    });

    it('should fail verification with wrong HMAC', () => {
      const otp = '123456';
      const context = 'test-context';
      const sessionId = 'test-session';

      const isValid = otpGenerator.verifyHmac(otp, context, sessionId, 'wrong-hmac');
      expect(isValid).toBe(false);
    });
  });

  describe('hashOtp and verifyOtpHash', () => {
    it('should hash and verify OTP correctly', async () => {
      const otp = '123456';
      const hash = await otpGenerator.hashOtp(otp);
      expect(hash).toBe('mocked-bcrypt-hash');

      const isValid = await otpGenerator.verifyOtpHash(otp, hash);
      expect(isValid).toBe(true);
    });
  });

  describe('generateSessionId', () => {
    it('should generate valid UUID v4 format with timestamp', () => {
      const sessionId = otpGenerator.generateSessionId();
      // UUID v4 format with optional timestamp suffix
      expect(sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(-[a-z0-9]+)?$/i);
    });

    it('should generate unique session IDs', () => {
      const sessionId1 = otpGenerator.generateSessionId();
      const sessionId2 = otpGenerator.generateSessionId();
      expect(sessionId1).not.toBe(sessionId2);
    });
  });

  describe('hashRequestMeta and verifyRequestMeta', () => {
    const requestMeta = {
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      deviceId: 'device-123',
      platform: 'web',
      browser: 'Chrome',
      os: 'Windows',
    };

    it('should hash and verify request metadata correctly', () => {
      const hash = otpGenerator.hashRequestMeta(requestMeta);
      expect(hash).toMatch(/^mocked-hash-\d+$/);

      const isValid = otpGenerator.verifyRequestMeta(requestMeta, hash);
      expect(isValid).toBe(true);
    });

    it('should fail verification with different metadata', () => {
      const hash = otpGenerator.hashRequestMeta(requestMeta);
      const differentMeta = { ...requestMeta, ip: '192.168.1.2' };

      const isValid = otpGenerator.verifyRequestMeta(differentMeta, hash);
      expect(isValid).toBe(false);
    });
  });
});
