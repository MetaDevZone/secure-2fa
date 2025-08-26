import { EmailProvider, EmailParams } from '../../types';

export interface BrevoConfig {
  apiKey: string;
  from?: string;
  senderName?: string;
}

export class BrevoAdapter implements EmailProvider {
  private apiKey: string;
  private defaultFrom: string;
  private senderName: string | undefined;

  constructor(config: BrevoConfig) {
    this.apiKey = config.apiKey;
    this.defaultFrom = config.from || 'noreply@yourdomain.com';
    this.senderName = config.senderName;
  }

  async sendEmail(params: EmailParams): Promise<void> {
    try {
      // Dynamic import to avoid bundling issues
      const brevo = await import('@getbrevo/brevo');
      
      const apiInstance = new brevo.TransactionalEmailsApi();
      apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, this.apiKey);

      const sendSmtpEmail = new brevo.SendSmtpEmail();
      
      // Set sender
      const sender = {
        email: params.from || this.defaultFrom,
        name: this.senderName || 'OTP Service'
      };
      
      sendSmtpEmail.sender = sender;
      sendSmtpEmail.to = [{ email: params.to }];
      sendSmtpEmail.subject = params.subject;
      
      if (params.html) {
        sendSmtpEmail.htmlContent = params.html;
      }
      
      if (params.text) {
        sendSmtpEmail.textContent = params.text;
      }

      await apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error) {
      throw new Error(`Failed to send email via Brevo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      // Dynamic import to avoid bundling issues
      const brevo = await import('@getbrevo/brevo');
      
      const apiInstance = new brevo.AccountApi();
      apiInstance.setApiKey(brevo.AccountApiApiKeys.apiKey, this.apiKey);
      
      // Try to get account info to verify connection
      await apiInstance.getAccount();
      return true;
    } catch (error) {
      return false;
    }
  }
}
