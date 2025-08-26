// Core classes
export { SecureEmailOtp } from './core/secure-email-otp';
export { OtpGenerator } from './core/otp-generator';

// Factory functions for easy setup
export { createSecureEmailOtp, createDemoInstance } from './factory';

// Database adapters
export { MemoryDatabaseAdapter } from './adapters/database/memory-adapter';
export { PrismaDatabaseAdapter } from './adapters/database/prisma-adapter';
export { MongoDbAdapter } from './adapters/database/mongodb-adapter';
export { MongooseAdapter } from './adapters/database/mongoose-adapter';

// Email adapters
export { NodemailerAdapter } from './adapters/email/nodemailer-adapter';
export { SendGridAdapter } from './adapters/email/sendgrid-adapter';
export { BrevoAdapter } from './adapters/email/brevo-adapter';
export { PostmarkAdapter } from './adapters/email/postmark-adapter';
export { MailgunAdapter } from './adapters/email/mailgun-adapter';
export { CustomAdapter } from './adapters/email/custom-adapter';
export { ConsoleEmailAdapter } from './adapters/email/console-adapter';

// Rate limiter adapters
export { MemoryRateLimiterAdapter } from './adapters/rate-limiter/memory-rate-limiter';

// Templates
export { EmailTemplates } from './templates/email-templates';

// Types and interfaces
export type {
  OtpConfig,
  OtpGenerationResult,
  OtpVerificationResult,
  RequestMeta,
  DatabaseAdapter,
  EmailProvider,
  RateLimiterAdapter,
  EmailTemplates as EmailTemplatesType,
  EventHandlers,
  OtpEvent,
  RateLimitConfig,
  EmailParams,
  OtpRecord,
  OtpContext,
  OtpChannel,
} from './types';

// Error classes
export { OtpError, OtpErrorCode } from './types';

// Adapter interfaces
export type { NodemailerConfig } from './adapters/email/nodemailer-adapter';
export type { SendGridConfig } from './adapters/email/sendgrid-adapter';
export type { BrevoConfig } from './adapters/email/brevo-adapter';
export type { PostmarkConfig } from './adapters/email/postmark-adapter';
export type { MailgunConfig } from './adapters/email/mailgun-adapter';
export type { CustomEmailConfig } from './adapters/email/custom-adapter';
export type { ConsoleEmailConfig } from './adapters/email/console-adapter';
export type { DemoConfig } from './factory';
export type { PrismaClient } from './adapters/database/prisma-adapter';
export type { MongoDbConfig } from './adapters/database/mongodb-adapter';
export type { MongooseConfig } from './adapters/database/mongoose-adapter';
