export interface RequestMeta {
  ip: string;
  userAgent: string;
  deviceId?: string;
  platform?: string;
  browser?: string;
  os?: string;
}

export type OtpChannel = 'email';

export interface OtpContext {
  email: string;
  context: string;
  sessionId: string;
  channel: OtpChannel;
  requestMeta: RequestMeta;
}

export interface OtpRecord {
  id: string;
  email: string;
  context: string;
  sessionId: string;
  channel: OtpChannel;
  otpHash: string;
  hmac: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  isUsed: boolean;
  isLocked: boolean;
  requestMeta: RequestMeta;
  createdAt: Date;
  updatedAt: Date;
}

export interface OtpGenerationResult {
  sessionId: string;
  expiresAt: Date;
  isResent: boolean;
  otp?: string; // For debugging purposes only
}

export interface OtpGenerationParams {
  email: string;
  context: string;
  requestMeta: RequestMeta;
  template?: EmailTemplates; // Optional custom template for this specific OTP
}

export interface OtpVerificationParams {
  email: string;
  otpCode: string; // The actual OTP code entered by user
  context: string;
  sessionId: string;
  requestMeta: RequestMeta;
}

export interface OtpVerificationResult {
  success: boolean;
  sessionId: string;
  email: string;
  context: string;
  channel: OtpChannel;
}

export interface OtpConfig {
  otpLength?: number;
  expiryMs?: number;
  maxRetries?: number;
  strictMode?: boolean;
  rateLimit?: RateLimitConfig;
  templates?: EmailTemplates;
  events?: EventHandlers;
}

export interface RateLimitConfig {
  maxPerWindow: number;
  windowMs: number;
}

export interface EmailTemplates {
  subject?: string;
  html?: string;
  text?: string;
  senderName?: string;
  senderEmail?: string;
}



export interface EventHandlers {
  onRequest?: (event: OtpEvent) => Promise<void>;
  onSend?: (event: OtpEvent) => Promise<void>;
  onVerify?: (event: OtpEvent) => Promise<void>;
  onFail?: (event: OtpEvent) => Promise<void>;
}

export interface OtpEvent {
  type: 'request' | 'send' | 'verify' | 'fail';
  email: string;
  context: string;
  sessionId: string;
  channel: OtpChannel;
  requestMeta: RequestMeta;
  timestamp: Date;
  error?: Error;
}

export interface EmailProvider {
  sendEmail(params: EmailParams): Promise<void>;
}



export interface EmailParams {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}



export interface DatabaseAdapter {
  createOtp(otp: Omit<OtpRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<OtpRecord>;
  findOtp(email: string, context: string, sessionId: string, channel: OtpChannel): Promise<OtpRecord | null>;
  updateOtp(id: string, updates: Partial<OtpRecord>): Promise<OtpRecord>;
  deleteOtp(id: string): Promise<void>;
  findActiveOtp(email: string, context: string, channel: OtpChannel): Promise<OtpRecord | null>;
  cleanupExpiredOtps(): Promise<void>;
  cleanupConflictingOtps(email: string, context: string, channel: OtpChannel): Promise<void>;
}

export interface RateLimiterAdapter {
  checkLimit(key: string, limit: number, windowMs: number): Promise<boolean>;
  increment(key: string, windowMs?: number): Promise<void>;
  reset(key: string): Promise<void>;
}

export enum OtpErrorCode {
  EXPIRED = 'EXPIRED',
  INVALID = 'INVALID',
  ATTEMPTS_EXCEEDED = 'ATTEMPTS_EXCEEDED',
  META_MISMATCH = 'META_MISMATCH',
  RATE_LIMITED = 'RATE_LIMITED',
  ALREADY_USED = 'ALREADY_USED',
  LOCKED = 'LOCKED',
  EMAIL_SEND_FAILED = 'EMAIL_SEND_FAILED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  MISSING_IDENTIFIER = 'MISSING_IDENTIFIER'
}

export class OtpError extends Error {
  constructor(
    public code: OtpErrorCode,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'OtpError';
  }
}

export interface OtpStats {
  totalRequests: number;
  totalSends: number;
  totalVerifications: number;
  totalFailures: number;
  averageResponseTime: number;
  successRate: number;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: boolean;
    emailProvider: boolean;
    rateLimiter: boolean;
  };
  timestamp: Date;
  version: string;
}

export interface OtpMetrics {
  requestsPerMinute: number;
  successRate: number;
  averageVerificationTime: number;
  topFailureReasons: Array<{
    reason: string;
    count: number;
  }>;
}
