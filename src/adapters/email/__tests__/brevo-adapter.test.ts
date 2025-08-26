import { BrevoAdapter, BrevoConfig } from '../brevo-adapter';
import { EmailParams } from '../../../types';

// Mock the Brevo API
const mockTransactionalEmailsApi = {
  setApiKey: jest.fn(),
  sendTransacEmail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
};

const mockSendSmtpEmail = {
  sender: {},
  to: [],
  subject: '',
  htmlContent: '',
  textContent: ''
};

const mockAccountApi = {
  setApiKey: jest.fn(),
  getAccount: jest.fn().mockResolvedValue({ email: 'test@example.com' })
};

jest.mock('@getbrevo/brevo', () => ({
  TransactionalEmailsApi: jest.fn(() => mockTransactionalEmailsApi),
  SendSmtpEmail: jest.fn(() => mockSendSmtpEmail),
  TransactionalEmailsApiApiKeys: { apiKey: 'api-key' },
  AccountApi: jest.fn(() => mockAccountApi),
  AccountApiApiKeys: { apiKey: 'api-key' }
}));

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  mockTransactionalEmailsApi.sendTransacEmail.mockResolvedValue({ messageId: 'test-message-id' });
  mockAccountApi.getAccount.mockResolvedValue({ email: 'test@example.com' });
});

describe('BrevoAdapter', () => {
  let adapter: BrevoAdapter;
  let config: BrevoConfig;

  beforeEach(() => {
    config = {
      apiKey: 'test-api-key',
      from: 'test@example.com',
      senderName: 'Test Sender'
    };
    adapter = new BrevoAdapter(config);
  });

  describe('constructor', () => {
    it('should create adapter with provided config', () => {
      expect(adapter).toBeInstanceOf(BrevoAdapter);
    });

    it('should use default from email when not provided', () => {
      const adapterWithoutFrom = new BrevoAdapter({ apiKey: 'test-key' });
      expect(adapterWithoutFrom).toBeInstanceOf(BrevoAdapter);
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
      mockTransactionalEmailsApi.sendTransacEmail.mockRejectedValueOnce(new Error('API Error'));

      await expect(adapter.sendEmail(emailParams)).rejects.toThrow('Failed to send email via Brevo: API Error');
    });
  });

  describe('verifyConnection', () => {
    it('should return true when connection is successful', async () => {
      const result = await adapter.verifyConnection();
      expect(result).toBe(true);
    });

    it('should return false when connection fails', async () => {
      mockAccountApi.getAccount.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await adapter.verifyConnection();
      expect(result).toBe(false);
    });
  });
});
