import { SecureEmailOtp } from './core/secure-email-otp';
import { OtpConfig } from './types';
import { MemoryDatabaseAdapter } from './adapters/database/memory-adapter';
import { ConsoleEmailAdapter } from './adapters/email/console-adapter';
import { MemoryRateLimiterAdapter } from './adapters/rate-limiter/memory-rate-limiter';
import { DatabaseAdapter, EmailProvider, RateLimiterAdapter } from './types';

export interface DemoConfig extends OtpConfig {
  serverSecret?: string;
  demoMode?: boolean;
}

/**
 * Create a SecureEmailOtp instance with zero-config setup
 * Perfect for development, testing, and quick prototyping
 */
export function createSecureEmailOtp(
  dbAdapter?: DatabaseAdapter,
  emailProvider?: EmailProvider,
  rateLimiter?: RateLimiterAdapter,
  serverSecret?: string,
  config?: DemoConfig
): SecureEmailOtp {
  // Use provided adapters or defaults for demo mode
  const finalDbAdapter = dbAdapter || new MemoryDatabaseAdapter();
  const finalEmailProvider = emailProvider || new ConsoleEmailAdapter({ 
    enabled: config?.demoMode !== false 
  });
  const finalRateLimiter = rateLimiter || new MemoryRateLimiterAdapter();
  
  // Generate a secure server secret if not provided
  const finalServerSecret = serverSecret || generateSecureSecret();
  
  // Merge config with defaults
  const finalConfig: OtpConfig = {
    otpLength: 6,
    expiryMs: 2 * 60 * 1000, // 2 minutes
    maxRetries: 5,
    strictMode: true,
    rateLimit: {
      maxPerWindow: 3,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
    ...config,
  };

  return new SecureEmailOtp(
    finalDbAdapter,
    finalEmailProvider,
    finalRateLimiter,
    finalServerSecret,
    finalConfig
  );
}

/**
 * Generate a secure random secret for demo mode
 */
function generateSecureSecret(): string {
  const { randomBytes } = require('crypto');
  return randomBytes(32).toString('hex');
}

/**
 * Quick demo setup - returns a fully configured instance for testing
 */
export function createDemoInstance(config?: DemoConfig): SecureEmailOtp {
  return createSecureEmailOtp(
    undefined, // Use MemoryDatabaseAdapter
    undefined, // Use ConsoleEmailAdapter
    undefined, // Use MemoryRateLimiterAdapter
    undefined, // Auto-generate server secret
    { demoMode: true, ...config }
  );
}
