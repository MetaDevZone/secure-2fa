import { EmailProvider, EmailParams } from '../../types';

export interface MailgunConfig {
  apiKey: string;
  domain: string;
  from?: string;
  region?: 'us' | 'eu';
}

export class MailgunAdapter implements EmailProvider {
  private apiKey: string;
  private domain: string;
  private defaultFrom: string;

  constructor(config: MailgunConfig) {
    this.apiKey = config.apiKey;
    this.domain = config.domain;
    this.defaultFrom = config.from || `noreply@${config.domain}`;
  }

  async sendEmail(params: EmailParams): Promise<void> {
    try {
      // Dynamic import to avoid bundling issues
      const mailgun = require('mailgun.js');
      const mg = mailgun.client({ username: 'api', key: this.apiKey });

      const messageData: any = {
        from: params.from || this.defaultFrom,
        to: params.to,
        subject: params.subject
      };

      if (params.html) {
        messageData.html = params.html;
      }

      if (params.text) {
        messageData.text = params.text;
      }

      await mg.messages.create(this.domain, messageData);
    } catch (error) {
      throw new Error(`Failed to send email via Mailgun: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      // Dynamic import to avoid bundling issues
      const mailgun = require('mailgun.js');
      const mg = mailgun.client({ username: 'api', key: this.apiKey });
      
      // Try to get domain info to verify connection
      await mg.domains.get(this.domain);
      return true;
    } catch (error) {
      return false;
    }
  }
}
