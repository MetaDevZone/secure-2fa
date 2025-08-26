import { EmailProvider, EmailParams } from '../../types';

export interface PostmarkConfig {
  serverToken: string;
  from?: string;
}

export class PostmarkAdapter implements EmailProvider {
  private serverToken: string;
  private defaultFrom: string;

  constructor(config: PostmarkConfig) {
    this.serverToken = config.serverToken;
    this.defaultFrom = config.from || 'noreply@yourdomain.com';
  }

  async sendEmail(params: EmailParams): Promise<void> {
    try {
      // Dynamic import to avoid bundling issues
      const { ServerClient } = await import('postmark');
      
      const client = new ServerClient(this.serverToken);

      const emailData: any = {
        From: params.from || this.defaultFrom,
        To: params.to,
        Subject: params.subject,
        MessageStream: 'outbound'
      };

      if (params.html) {
        emailData.HtmlBody = params.html;
      }

      if (params.text) {
        emailData.TextBody = params.text;
      }

      await client.sendEmail(emailData);
    } catch (error) {
      throw new Error(`Failed to send email via Postmark: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      // Dynamic import to avoid bundling issues
      const { ServerClient } = await import('postmark');
      
      const client = new ServerClient(this.serverToken);
      
      // Try to get server info to verify connection
      await client.getServer();
      return true;
    } catch (error) {
      return false;
    }
  }
}
