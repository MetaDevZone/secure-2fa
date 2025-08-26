import { CustomAdapter, CustomEmailConfig } from '../custom-adapter';
import { EmailParams } from '../../../types';

describe('CustomAdapter', () => {
  let adapter: CustomAdapter;
  let config: CustomEmailConfig;
  let mockSendFunction: jest.Mock;
  let mockVerifyFunction: jest.Mock;

  beforeEach(() => {
    mockSendFunction = jest.fn().mockResolvedValue(undefined);
    mockVerifyFunction = jest.fn().mockResolvedValue(true);
    
    config = {
      sendFunction: mockSendFunction,
      verifyFunction: mockVerifyFunction
    };
    adapter = new CustomAdapter(config);
  });

  describe('constructor', () => {
    it('should create adapter with provided config', () => {
      expect(adapter).toBeInstanceOf(CustomAdapter);
    });

    it('should create adapter without verify function', () => {
      const adapterWithoutVerify = new CustomAdapter({
        sendFunction: mockSendFunction
      });
      expect(adapterWithoutVerify).toBeInstanceOf(CustomAdapter);
    });
  });

  describe('sendEmail', () => {
    const emailParams: EmailParams = {
      to: 'recipient@example.com',
      subject: 'Test Subject',
      html: '<p>Test HTML content</p>',
      text: 'Test text content'
    };

    it('should call send function successfully', async () => {
      await expect(adapter.sendEmail(emailParams)).resolves.not.toThrow();
      expect(mockSendFunction).toHaveBeenCalledWith(emailParams);
    });

    it('should call send function with custom from address', async () => {
      const paramsWithFrom = { ...emailParams, from: 'custom@example.com' };
      await expect(adapter.sendEmail(paramsWithFrom)).resolves.not.toThrow();
      expect(mockSendFunction).toHaveBeenCalledWith(paramsWithFrom);
    });

    it('should throw error when send function fails', async () => {
      const errorMessage = 'Custom send function error';
      mockSendFunction.mockRejectedValueOnce(new Error(errorMessage));

      await expect(adapter.sendEmail(emailParams)).rejects.toThrow(
        `Failed to send email via custom provider: ${errorMessage}`
      );
    });

    it('should throw error when send function throws non-Error', async () => {
      mockSendFunction.mockRejectedValueOnce('String error');

      await expect(adapter.sendEmail(emailParams)).rejects.toThrow(
        'Failed to send email via custom provider: Unknown error'
      );
    });
  });

  describe('verifyConnection', () => {
    it('should return true when verify function succeeds', async () => {
      const result = await adapter.verifyConnection();
      expect(result).toBe(true);
      expect(mockVerifyFunction).toHaveBeenCalled();
    });

    it('should return false when verify function fails', async () => {
      mockVerifyFunction.mockRejectedValueOnce(new Error('Verification failed'));

      const result = await adapter.verifyConnection();
      expect(result).toBe(false);
    });

    it('should return true when no verify function is provided', async () => {
      const adapterWithoutVerify = new CustomAdapter({
        sendFunction: mockSendFunction
      });

      const result = await adapterWithoutVerify.verifyConnection();
      expect(result).toBe(true);
    });

    it('should return false when verify function throws non-Error', async () => {
      mockVerifyFunction.mockRejectedValueOnce('String error');

      const result = await adapter.verifyConnection();
      expect(result).toBe(false);
    });
  });
});
