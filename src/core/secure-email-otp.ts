import {
  OtpConfig,
  OtpGenerationResult,
  OtpVerificationResult,
  OtpGenerationParams,
  RequestMeta,
  DatabaseAdapter,
  EmailProvider,
  RateLimiterAdapter,
  OtpError,
  OtpErrorCode,
  OtpEvent,
  EventHandlers,
  HealthCheckResult
} from '../types';
import { OtpGenerator } from './otp-generator';
import { EmailTemplates as EmailTemplatesClass, TemplateData } from '../templates/email-templates';
import { EmailTemplates } from '../types';

export class SecureEmailOtp {
  private readonly config: Required<OtpConfig>;
  private readonly otpGenerator: OtpGenerator;
  private readonly dbAdapter: DatabaseAdapter;
  private readonly emailProvider: EmailProvider;
  private readonly rateLimiter: RateLimiterAdapter;
  private readonly events: EventHandlers;

  constructor(
    dbAdapter: DatabaseAdapter,
    emailProvider: EmailProvider,
    rateLimiter: RateLimiterAdapter,
    serverSecret: string,
    config: OtpConfig = {}
  ) {
    this.dbAdapter = dbAdapter;
    this.emailProvider = emailProvider;
    this.rateLimiter = rateLimiter;
    this.otpGenerator = new OtpGenerator(serverSecret);
    this.events = config.events || {};

    // Set default configuration
    this.config = {
      otpLength: 6,
      expiryMs: 2 * 60 * 1000, // 2 minutes
      maxRetries: 5,
      strictMode: true,
      rateLimit: {
        maxPerWindow: 3,
        windowMs: 15 * 60 * 1000, // 15 minutes
      },
      templates: {
        subject: EmailTemplatesClass.getDefaultSubject(),
        html: EmailTemplatesClass.getDefaultHtml({} as TemplateData),
        text: EmailTemplatesClass.getDefaultText({} as TemplateData),
        senderName: 'Dynamite Lifestyle',
        senderEmail: 'info@dynamitelifestyle.com',
      },
      events: {},
      ...config,
    };
  }

  /**
   * Generate and send OTP
   */
  async generate(params: OtpGenerationParams): Promise<OtpGenerationResult> {
    const { email, context, requestMeta, template } = params;

    // Validate inputs
    if (!email || !context || !requestMeta) {
      throw new OtpError(OtpErrorCode.INVALID, 'Missing required parameters');
    }

    // Check rate limiting
    const rateLimitKey = `otp:${email}:email`; // Rate limit per email, not per email+context
    const canProceed = await this.rateLimiter.checkLimit(
      rateLimitKey,
      this.config.rateLimit.maxPerWindow,
      this.config.rateLimit.windowMs
    );

    if (!canProceed) {
      await this.emitEvent('fail', { 
        email, 
        context, 
        requestMeta 
      }, new OtpError(OtpErrorCode.RATE_LIMITED, 'Rate limit exceeded'));
      throw new OtpError(OtpErrorCode.RATE_LIMITED, 'Too many OTP requests. Please try again later.');
    }

    // Increment rate limit counter
    await this.rateLimiter.increment(rateLimitKey, this.config.rateLimit.windowMs);

    await this.emitEvent('request', { email, context, requestMeta });

    // Clean up any conflicting OTPs first
    try {
      await this.dbAdapter.cleanupConflictingOtps(email, context, 'email');
    } catch (cleanupError) {
      console.warn('Failed to cleanup conflicting OTPs:', cleanupError);
    }

    // Check for existing active OTP and clean it up
    const existingOtp = await this.dbAdapter.findActiveOtp(email, context, 'email');
    let isResent = false;
    
    if (existingOtp) {
      // Mark the existing OTP as used to invalidate it
      try {
        await this.dbAdapter.updateOtp(existingOtp.id, {
          isUsed: true,
        });
        isResent = true;
      } catch (error) {
        // If update fails, try to delete the existing OTP
        try {
          await this.dbAdapter.deleteOtp(existingOtp.id);
        } catch (deleteError) {
          console.warn('Failed to clean up existing OTP:', deleteError);
        }
      }
    }

    // Generate new session ID (always unique)
    const sessionId = this.otpGenerator.generateSessionId();

    // Generate new OTP
    const otp = this.otpGenerator.generateOtp(this.config.otpLength);
    
    // Ensure we create a valid date for expiration
    const expiryTimestamp = Date.now() + this.config.expiryMs;
    const expiresAt = new Date(expiryTimestamp);
    
    // Validate the created date
    if (isNaN(expiresAt.getTime())) {
      throw new OtpError(OtpErrorCode.INVALID, 'Failed to create valid expiration date');
    }

    // Create OTP record with retry logic for duplicate key errors
    let otpRecord;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        otpRecord = await this.dbAdapter.createOtp({
          email,
          context,
          sessionId: retryCount > 0 ? this.otpGenerator.generateSessionId() : sessionId,
          channel: 'email',
          otpHash: await this.otpGenerator.hashOtp(otp),
          hmac: this.otpGenerator.createHmac(otp, context, sessionId),
          expiresAt,
          attempts: 0,
          maxAttempts: this.config.maxRetries,
          isUsed: false,
          isLocked: false,
          requestMeta,
        });
        break; // Success, exit retry loop
      } catch (error: any) {
        retryCount++;
        
        // Check if it's a duplicate key error
        if (error.code === 11000 && retryCount < maxRetries) {
          console.warn(`Duplicate key error on attempt ${retryCount}, retrying with new session ID...`);
          // Continue to next iteration with new session ID
          continue;
        }
        
        // If it's not a duplicate key error or we've exhausted retries, throw the error
        throw error;
      }
    }

    if (!otpRecord) {
      throw new OtpError(OtpErrorCode.DATABASE_ERROR, 'Failed to create OTP record after multiple attempts');
    }

    // Send OTP via email
    try {
      await this.sendEmailOtp(email, otp, context, template);

      await this.emitEvent('send', { 
        email, 
        context, 
        sessionId: otpRecord.sessionId, 
        requestMeta 
      });

      return {
        sessionId: otpRecord.sessionId,
        expiresAt,
        isResent,
        ...(this.config.strictMode ? {} : { otp }), // Only include in non-strict mode for debugging
      };
    } catch (error) {
      // Clean up the OTP record if sending failed
      try {
        await this.dbAdapter.deleteOtp(otpRecord.id);
      } catch (cleanupError) {
        console.error('Failed to clean up OTP record after email send failure:', cleanupError);
      }
      
      await this.emitEvent('fail', { 
        email, 
        context, 
        sessionId: otpRecord.sessionId, 
        requestMeta 
      }, error instanceof Error ? error : new Error(String(error)));
      
      throw new OtpError(OtpErrorCode.EMAIL_SEND_FAILED, `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify OTP
   */
  async verify(params: {
    email: string;
    clientHash: string;
    context: string;
    sessionId: string;
    requestMeta: RequestMeta;
  }): Promise<OtpVerificationResult> {
    const { email, clientHash, context, sessionId, requestMeta } = params;

    // Validate inputs
    if (!email || !clientHash || !context || !sessionId || !requestMeta) {
      throw new OtpError(OtpErrorCode.INVALID, 'Missing required parameters');
    }

    // Find OTP record
    const otpRecord = await this.dbAdapter.findOtp(email, context, sessionId, 'email');
    
    if (!otpRecord) {
      await this.emitEvent('fail', { 
        email, 
        context, 
        sessionId, 
        requestMeta 
      }, new OtpError(OtpErrorCode.INVALID, 'Invalid OTP'));
      throw new OtpError(OtpErrorCode.INVALID, 'Invalid OTP');
    }

    // Check if OTP is already used
    if (otpRecord.isUsed) {
      await this.emitEvent('fail', { 
        email, 
        context, 
        sessionId, 
        requestMeta 
      }, new OtpError(OtpErrorCode.ALREADY_USED, 'OTP already used'));
      throw new OtpError(OtpErrorCode.ALREADY_USED, 'OTP has already been used');
    }

    // Check if OTP is locked
    if (otpRecord.isLocked) {
      await this.emitEvent('fail', { 
        email, 
        context, 
        sessionId, 
        requestMeta 
      }, new OtpError(OtpErrorCode.LOCKED, 'OTP is locked'));
      throw new OtpError(OtpErrorCode.LOCKED, 'OTP is locked due to too many failed attempts');
    }

    // Check if OTP is expired
    if (otpRecord.expiresAt < new Date()) {
      await this.emitEvent('fail', { 
        email, 
        context, 
        sessionId, 
        requestMeta 
      }, new OtpError(OtpErrorCode.EXPIRED, 'OTP expired'));
      throw new OtpError(OtpErrorCode.EXPIRED, 'OTP has expired');
    }

    // Verify OTP hash
    const isValidHash = await this.otpGenerator.verifyOtpHash(clientHash, otpRecord.otpHash);
    const isValidHmac = this.otpGenerator.verifyHmac(clientHash, context, sessionId, otpRecord.hmac);

    if (!isValidHash || !isValidHmac) {
      // Increment attempts
      const newAttempts = otpRecord.attempts + 1;
      const isLocked = newAttempts >= otpRecord.maxAttempts;

      await this.dbAdapter.updateOtp(otpRecord.id, {
        attempts: newAttempts,
        isLocked,
      });

      if (isLocked) {
        await this.emitEvent('fail', { 
          email, 
          context, 
          sessionId, 
          requestMeta 
        }, new OtpError(OtpErrorCode.ATTEMPTS_EXCEEDED, 'Too many failed attempts'));
        throw new OtpError(OtpErrorCode.ATTEMPTS_EXCEEDED, 'Too many failed attempts. OTP is now locked.');
      }

      await this.emitEvent('fail', { 
        email, 
        context, 
        sessionId, 
        requestMeta 
      }, new OtpError(OtpErrorCode.INVALID, 'Invalid OTP'));
      throw new OtpError(OtpErrorCode.INVALID, 'Invalid OTP');
    }

    // Check request metadata in strict mode
    if (this.config.strictMode) {
      const metaMismatch = this.checkMetaMismatch(otpRecord.requestMeta, requestMeta);
      if (metaMismatch) {
        await this.emitEvent('fail', { 
          email, 
          context, 
          sessionId, 
          requestMeta 
        }, new OtpError(OtpErrorCode.META_MISMATCH, 'Request context mismatch'));
        throw new OtpError(OtpErrorCode.META_MISMATCH, 'Request context mismatch');
      }
    }

    // Mark OTP as used
    await this.dbAdapter.updateOtp(otpRecord.id, {
      isUsed: true,
    });

    await this.emitEvent('verify', { 
      email, 
      context, 
      sessionId, 
      requestMeta 
    });

    return {
      success: true,
      sessionId,
      email,
      context,
      channel: 'email',
    };
  }

  /**
   * Cleanup expired OTPs
   */
  async cleanup(): Promise<void> {
    await this.dbAdapter.cleanupExpiredOtps();
  }

  /**
   * Health check for monitoring
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const checks = {
      database: false,
      emailProvider: false,
      rateLimiter: false,
    };

    try {
      // Test database connection
      await this.dbAdapter.cleanupExpiredOtps();
      checks.database = true;
    } catch (error) {
      // Database check failed
    }

    try {
      // Test email provider by attempting a test send (will be caught)
      await this.emailProvider.sendEmail({
        to: 'health-check@example.com',
        subject: 'Health Check',
        text: 'Health check test'
      });
      checks.emailProvider = true;
    } catch (error) {
      // Email provider check failed
    }

    try {
      // Test rate limiter
      await this.rateLimiter.checkLimit('health-check', 1, 60000);
      checks.rateLimiter = true;
    } catch (error) {
      // Rate limiter check failed
    }

    const healthyChecks = Object.values(checks).filter(Boolean).length;
    let status: 'healthy' | 'degraded' | 'unhealthy';

    if (healthyChecks === 3) {
      status = 'healthy';
    } else if (healthyChecks >= 1) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      checks,
      timestamp: new Date(),
      version: '1.0.1',
    };
  }

  /**
   * Send email OTP
   */
  private async sendEmailOtp(email: string, otp: string, context: string, customTemplate?: EmailTemplates): Promise<void> {
    const templateData: TemplateData = {
      otp,
      email,
      context,
      expiresIn: `${Math.floor(this.config.expiryMs / (1000 * 60))} minutes`,
      companyName: this.config.templates.senderName,
      supportEmail: this.config.templates.senderEmail,
    };

    // Use custom template if provided, otherwise fall back to default templates
    const effectiveTemplate = customTemplate || this.config.templates;
    
    // Get the template content (custom or default)
    const htmlTemplate = effectiveTemplate.html || EmailTemplatesClass.getDefaultHtml(templateData);
    const textTemplate = effectiveTemplate.text || EmailTemplatesClass.getDefaultText(templateData);
    const subjectTemplate = effectiveTemplate.subject || EmailTemplatesClass.getDefaultSubject();

    // Always render templates with actual values, whether custom or default
    const html = EmailTemplatesClass.renderTemplate(htmlTemplate, templateData);
    const text = EmailTemplatesClass.renderTemplate(textTemplate, templateData);
    const subject = EmailTemplatesClass.renderTemplate(subjectTemplate, templateData);

    const emailParams = {
      to: email,
      subject,
      html,
      text,
      ...(effectiveTemplate.senderEmail && { from: effectiveTemplate.senderEmail }),
    };

    await this.emailProvider.sendEmail(emailParams);
  }

  /**
   * Check if request metadata matches
   */
  private checkMetaMismatch(originalMeta: RequestMeta, currentMeta: RequestMeta): boolean {
    return (
      originalMeta.ip !== currentMeta.ip ||
      originalMeta.userAgent !== currentMeta.userAgent ||
      (originalMeta.deviceId ? originalMeta.deviceId !== currentMeta.deviceId : false) ||
      (originalMeta.platform ? originalMeta.platform !== currentMeta.platform : false)
    );
  }

  /**
   * Emit event
   */
  private async emitEvent(
    type: 'request' | 'send' | 'verify' | 'fail',
    data: {
      email: string;
      context: string;
      sessionId?: string;
      requestMeta: RequestMeta;
    },
    error?: Error
  ): Promise<void> {
    const event: OtpEvent = {
      type,
      email: data.email,
      context: data.context,
      sessionId: data.sessionId || '',
      channel: 'email',
      requestMeta: data.requestMeta,
      timestamp: new Date(),
      ...(error && { error }),
    };

    const handler = this.events[`on${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof EventHandlers];
    if (handler) {
      try {
        await handler(event);
              } catch (error) {
          // Silently handle event handler errors to prevent crashes
          // In production, consider logging to a proper logging service
        }
    }
  }
}
