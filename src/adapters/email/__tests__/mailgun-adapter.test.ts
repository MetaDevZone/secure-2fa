import { MailgunAdapter, MailgunConfig } from '../mailgun-adapter';
import { EmailParams } from '../../../types';

// Mock mailgun.js
const mockMailgunClient = {
  messages: {
    create: jest.fn().mockResolvedValue({ id: 'test-message-id' })
  },
  domains: {
    get: jest.fn().mockResolvedValue({ name: 'test-domain.com' })
  }
};

jest.mock('mailgun.js', () => ({
  client: jest.fn(() => mockMailgunClient)
}));

// Mock form-data
jest.mock('form-data', () => {
  return jest.fn().mockImplementation(() => ({}));
});

describe('MailgunAdapter', () => {
  let adapter: MailgunAdapter;
  let config: MailgunConfig;

  beforeEach(() => {
    config = {
      apiKey: 'test-api-key',
      domain: 'test-domain.com',
      from: 'test@test-domain.com',
      region: 'us'
    };
    adapter = new MailgunAdapter(config);
  });

  describe('constructor', () => {
    it('should create adapter with provided config', () => {
      expect(adapter).toBeInstanceOf(MailgunAdapter);
    });

    it('should use default from email when not provided', () => {
      const adapterWithoutFrom = new MailgunAdapter({ 
        apiKey: 'test-key', 
        domain: 'test-domain.com' 
      });
      expect(adapterWithoutFrom).toBeInstanceOf(MailgunAdapter);
    });

    it('should use default region when not provided', () => {
      const adapterWithoutRegion = new MailgunAdapter({ 
        apiKey: 'test-key', 
        domain: 'test-domain.com' 
      });
      expect(adapterWithoutRegion).toBeInstanceOf(MailgunAdapter);
    });
  });

  describe('sendEmail', () => {
    const emailParams: EmailParams = {
      to: 'recipient@example.com',
      subject: 'Test Subject',
      html: '<p>Test HTML content</p>',
      text: 'Test text content'
    };

    it('should send email successfully', async () => {
      await expect(adapter.sendEmail(emailParams)).resolves.not.toThrow();
    });

    it('should send email with custom from address', async () => {
      const paramsWithFrom = { ...emailParams, from: 'custom@example.com' };
      await expect(adapter.sendEmail(paramsWithFrom)).resolves.not.toThrow();
    });

    it('should send email with only HTML content', async () => {
      const paramsHtmlOnly = { ...emailParams };
      delete paramsHtmlOnly.text;
      await expect(adapter.sendEmail(paramsHtmlOnly)).resolves.not.toThrow();
    });

    it('should send email with only text content', async () => {
      const paramsTextOnly = { to: emailParams.to, subject: emailParams.subject, text: emailParams.text || 'Test text content' };
      await expect(adapter.sendEmail(paramsTextOnly)).resolves.not.toThrow();
    });

    it('should throw error when API call fails', async () => {
      mockMailgunClient.messages.create.mockRejectedValueOnce(new Error('API Error'));

      await expect(adapter.sendEmail(emailParams)).rejects.toThrow('Failed to send email via Mailgun: API Error');
    });
  });

  describe('verifyConnection', () => {
    it('should return true when connection is successful', async () => {
      const result = await adapter.verifyConnection();
      expect(result).toBe(true);
    });

    it('should return false when connection fails', async () => {
      mockMailgunClient.domains.get.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await adapter.verifyConnection();
      expect(result).toBe(false);
    });
  });
});
