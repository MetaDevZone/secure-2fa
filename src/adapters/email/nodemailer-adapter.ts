import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import { EmailProvider, EmailParams } from '../../types';

export interface NodemailerConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from?: string;
}

export class NodemailerAdapter implements EmailProvider {
  private transporter: Transporter;
  private defaultFrom: string;

  constructor(config: NodemailerConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });

    this.defaultFrom = config.from || config.auth.user;
  }

  async sendEmail(params: EmailParams): Promise<void> {
    const mailOptions: SendMailOptions = {
      from: params.from || this.defaultFrom,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      return false;
    }
  }
}
