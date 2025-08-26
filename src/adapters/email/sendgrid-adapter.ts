import sgMail from '@sendgrid/mail';
import { EmailProvider, EmailParams } from '../../types';

export interface SendGridConfig {
  apiKey: string;
  from?: string;
}

export class SendGridAdapter implements EmailProvider {
  private defaultFrom: string;

  constructor(config: SendGridConfig) {
    sgMail.setApiKey(config.apiKey);
    this.defaultFrom = config.from || 'noreply@yourdomain.com';
  }

  async sendEmail(params: EmailParams): Promise<void> {
    const msg: any = {
      to: params.to,
      from: params.from || this.defaultFrom,
      subject: params.subject,
      html: params.html,
    };
    
    if (params.text) {
      msg.text = params.text;
    }

    try {
      await sgMail.send(msg);
    } catch (error) {
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      // SendGrid doesn't have a direct connection test, but we can validate the API key
      // by making a minimal request
      const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
        headers: {
          'Authorization': `Bearer ${process.env['SENDGRID_API_KEY'] || ''}`,
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
