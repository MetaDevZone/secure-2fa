import { EmailProvider, EmailParams } from '../../types';

export interface CustomEmailConfig {
  sendFunction: (params: EmailParams) => Promise<void>;
  verifyFunction?: () => Promise<boolean>;
}

export class CustomAdapter implements EmailProvider {
  private sendFunction: (params: EmailParams) => Promise<void>;
  private verifyFunction: (() => Promise<boolean>) | undefined;

  constructor(config: CustomEmailConfig) {
    this.sendFunction = config.sendFunction;
    this.verifyFunction = config.verifyFunction;
  }

  async sendEmail(params: EmailParams): Promise<void> {
    try {
      await this.sendFunction(params);
    } catch (error) {
      throw new Error(`Failed to send email via custom provider: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.verifyFunction) {
      // If no verify function is provided, assume connection is always valid
      return true;
    }

    try {
      return await this.verifyFunction();
    } catch (error) {
      return false;
    }
  }
}
