import { ConsoleEmailAdapter, ConsoleEmailConfig } from '../console-adapter';
import { EmailParams } from '../../../types';

// Mock console methods
const mockConsole = {
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  // @ts-ignore - Mocking console methods
  global.console = mockConsole;
});

describe('ConsoleEmailAdapter', () => {
  const defaultEmailParams: EmailParams = {
    to: 'test@example.com',
    subject: 'Test OTP',
    html: '<p>Your OTP is 123456</p>',
    text: 'Your OTP is 123456',
    from: 'noreply@test.com',
  };

  describe('constructor', () => {
    it('should create adapter with default config', () => {
      const adapter = new ConsoleEmailAdapter();
      expect(adapter).toBeInstanceOf(ConsoleEmailAdapter);
    });

    it('should create adapter with custom config', () => {
      const config: ConsoleEmailConfig = {
        enabled: true,
        logLevel: 'debug',
      };
      const adapter = new ConsoleEmailAdapter(config);
      expect(adapter).toBeInstanceOf(ConsoleEmailAdapter);
    });

    it('should disable adapter when enabled is false', () => {
      const adapter = new ConsoleEmailAdapter({ enabled: false });
      expect(adapter).toBeInstanceOf(ConsoleEmailAdapter);
    });
  });

  describe('sendEmail', () => {
    it('should log email with info level by default', async () => {
      const adapter = new ConsoleEmailAdapter();
      await adapter.sendEmail(defaultEmailParams);

      expect(mockConsole.info).toHaveBeenCalledWith(
        '📧 ConsoleEmailAdapter:',
        expect.objectContaining({
          type: 'EMAIL_SENT',
          to: 'test@example.com',
          subject: 'Test OTP',
          hasHtml: true,
          hasText: true,
        })
      );
    });

    it('should log email with debug level when configured', async () => {
      const adapter = new ConsoleEmailAdapter({ logLevel: 'debug' });
      await adapter.sendEmail(defaultEmailParams);

      expect(mockConsole.debug).toHaveBeenCalledWith(
        '📧 ConsoleEmailAdapter:',
        expect.objectContaining({
          type: 'EMAIL_SENT',
          to: 'test@example.com',
          subject: 'Test OTP',
        })
      );
    });

    it('should log email with warn level when configured', async () => {
      const adapter = new ConsoleEmailAdapter({ logLevel: 'warn' });
      await adapter.sendEmail(defaultEmailParams);

      expect(mockConsole.warn).toHaveBeenCalledWith(
        '📧 ConsoleEmailAdapter:',
        expect.objectContaining({
          type: 'EMAIL_SENT',
          to: 'test@example.com',
          subject: 'Test OTP',
        })
      );
    });

    it('should not log when disabled', async () => {
      const adapter = new ConsoleEmailAdapter({ enabled: false });
      await adapter.sendEmail(defaultEmailParams);

      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
    });

    it('should handle email with only text content', async () => {
      const adapter = new ConsoleEmailAdapter();
      const textOnlyParams: EmailParams = {
        to: 'test@example.com',
        subject: 'Test OTP',
        text: 'Your OTP is 123456',
      };

      await adapter.sendEmail(textOnlyParams);

      expect(mockConsole.info).toHaveBeenCalledWith(
        '📧 ConsoleEmailAdapter:',
        expect.objectContaining({
          hasHtml: false,
          hasText: true,
          htmlPreview: undefined,
          textPreview: 'Your OTP is 123456...',
        })
      );
    });

    it('should handle email with only html content', async () => {
      const adapter = new ConsoleEmailAdapter();
      const htmlOnlyParams: EmailParams = {
        to: 'test@example.com',
        subject: 'Test OTP',
        html: '<p>Your OTP is 123456</p>',
      };

      await adapter.sendEmail(htmlOnlyParams);

      expect(mockConsole.info).toHaveBeenCalledWith(
        '📧 ConsoleEmailAdapter:',
        expect.objectContaining({
          hasHtml: true,
          hasText: false,
          htmlPreview: '<p>Your OTP is 123456</p>...',
          textPreview: undefined,
        })
      );
    });

    it('should truncate long content in preview', async () => {
      const adapter = new ConsoleEmailAdapter();
      const longHtml = '<p>' + 'A'.repeat(200) + '</p>';
      const longText = 'B'.repeat(200);

      const longParams: EmailParams = {
        to: 'test@example.com',
        subject: 'Test OTP',
        html: longHtml,
        text: longText,
      };

      await adapter.sendEmail(longParams);

      const callArgs = mockConsole.info.mock.calls[0];
      const logMessage = callArgs[1] as any;

      expect(logMessage.htmlPreview).toMatch(/^<p>A+\.\.\.$/);
      expect(logMessage.textPreview).toMatch(/^B+\.\.\.$/);
      expect(logMessage.htmlPreview.length).toBeLessThanOrEqual(103); // 100 chars + "..."
      expect(logMessage.textPreview.length).toBeLessThanOrEqual(103); // 100 chars + "..."
    });
  });

  describe('verifyConnection', () => {
    it('should return true when enabled', async () => {
      const adapter = new ConsoleEmailAdapter({ enabled: true });
      const result = await adapter.verifyConnection();
      expect(result).toBe(true);
    });

    it('should return true when enabled by default', async () => {
      const adapter = new ConsoleEmailAdapter();
      const result = await adapter.verifyConnection();
      expect(result).toBe(true);
    });

    it('should return true when disabled', async () => {
      const adapter = new ConsoleEmailAdapter({ enabled: false });
      const result = await adapter.verifyConnection();
      expect(result).toBe(true);
    });
  });
});
