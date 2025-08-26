import { EmailProvider, EmailParams } from '../../types';

export interface ConsoleEmailConfig {
  enabled?: boolean;
  logLevel?: 'info' | 'debug' | 'warn';
}

export class ConsoleEmailAdapter implements EmailProvider {
  private enabled: boolean;
  private logLevel: 'info' | 'debug' | 'warn';

  constructor(config: ConsoleEmailConfig = {}) {
    this.enabled = config.enabled !== false;
    this.logLevel = config.logLevel || 'info';
  }

  async sendEmail(params: EmailParams): Promise<void> {
    if (!this.enabled) {
      return;
    }

    const logMessage = {
      type: 'EMAIL_SENT',
      timestamp: new Date().toISOString(),
      from: params.from || 'noreply@demo.com',
      to: params.to,
      subject: params.subject,
      hasHtml: !!params.html,
      hasText: !!params.text,
      htmlPreview: params.html ? params.html.substring(0, 100) + '...' : undefined,
      textPreview: params.text ? params.text.substring(0, 100) + '...' : undefined,
    };

    switch (this.logLevel) {
    case 'debug':
      // eslint-disable-next-line no-console
      console.debug('📧 ConsoleEmailAdapter:', logMessage);
      break;
    case 'warn':
      // eslint-disable-next-line no-console
      console.warn('📧 ConsoleEmailAdapter:', logMessage);
      break;
    default:
      // eslint-disable-next-line no-console
      console.info('📧 ConsoleEmailAdapter:', logMessage);
    }
  }

  async verifyConnection(): Promise<boolean> {
    return true; // Always return true for connection verification
  }
}
