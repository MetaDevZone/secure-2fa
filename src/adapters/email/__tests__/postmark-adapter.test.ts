import { PostmarkAdapter, PostmarkConfig } from '../postmark-adapter';
import { EmailParams } from '../../../types';

// Mock the Postmark client
const mockPostmarkClient = {
  sendEmail: jest.fn().mockResolvedValue({ MessageID: 'test-message-id' }),
  getServer: jest.fn().mockResolvedValue({ Name: 'test-server' })
};

jest.mock('postmark', () => ({
  ServerClient: jest.fn(() => mockPostmarkClient)
}));

describe('PostmarkAdapter', () => {
  let adapter: PostmarkAdapter;
  let config: PostmarkConfig;

  beforeEach(() => {
    config = {
      serverToken: 'test-server-token',
      from: 'test@example.com'
    };
    adapter = new PostmarkAdapter(config);
  });

  describe('constructor', () => {
    it('should create adapter with provided config', () => {
      expect(adapter).toBeInstanceOf(PostmarkAdapter);
    });

    it('should use default from email when not provided', () => {
      const adapterWithoutFrom = new PostmarkAdapter({ serverToken: 'test-token' });
      expect(adapterWithoutFrom).toBeInstanceOf(PostmarkAdapter);
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
      mockPostmarkClient.sendEmail.mockRejectedValueOnce(new Error('API Error'));

      await expect(adapter.sendEmail(emailParams)).rejects.toThrow('Failed to send email via Postmark: API Error');
    });
  });

  describe('verifyConnection', () => {
    it('should return true when connection is successful', async () => {
      const result = await adapter.verifyConnection();
      expect(result).toBe(true);
    });

    it('should return false when connection fails', async () => {
      mockPostmarkClient.getServer.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await adapter.verifyConnection();
      expect(result).toBe(false);
    });
  });
});
