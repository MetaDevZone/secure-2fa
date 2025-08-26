# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-XX

### Added

- **Initial Release**: Complete email-based OTP (2FA) package
- **Core Features**:

  - Secure OTP generation using `crypto.randomBytes()`
  - HMAC-based session and context binding
  - bcrypt hashing for OTP storage
  - Constant-time HMAC verification
  - Configurable rate limiting
  - Request metadata validation
  - Event system for auditing

- **Database Adapters**:

  - Memory adapter (for development/testing)
  - Prisma adapter (PostgreSQL)
  - MongoDB adapter
  - Mongoose adapter
  - Custom adapter interface

- **Email Adapters**:

  - Nodemailer adapter (SMTP)
  - SendGrid adapter
  - Brevo (Sendinblue) adapter
  - Postmark adapter
  - Mailgun adapter
  - Console adapter (for development)
  - Custom adapter interface

- **Rate Limiter Adapters**:

  - Memory rate limiter
  - Redis rate limiter (planned)

- **Developer Experience**:

  - TypeScript-first design
  - Comprehensive TypeScript types
  - Factory functions for easy setup
  - Demo mode with zero configuration
  - Extensive documentation
  - Complete test suite (66 tests)

- **Security Features**:

  - Minimum 32-character server secret requirement
  - Strict mode for request validation
  - Replay attack prevention
  - Automatic OTP invalidation after use
  - Configurable retry limits
  - Secure defaults

- **Documentation**:
  - Comprehensive README with quickstart
  - API reference documentation
  - Adapters guide
  - Usage examples
  - FAQ section
  - Security policy

### Security

- **Cryptographic Security**: All OTP generation uses cryptographically secure random numbers
- **HMAC Verification**: Constant-time comparison to prevent timing attacks
- **Secure Storage**: bcrypt hashing with 12 salt rounds
- **Session Binding**: HMAC-based binding to prevent replay attacks
- **Request Validation**: Strict mode validates request metadata

### Technical Details

- **Node.js**: Requires Node.js 18.0.0 or higher
- **TypeScript**: Full TypeScript support with strict compiler options
- **Dependencies**: Minimal runtime dependencies, extensive peer dependencies
- **Build**: TypeScript compilation with declaration files
- **Testing**: Jest test suite with comprehensive coverage
- **Linting**: ESLint with TypeScript rules

### Breaking Changes

- None (initial release)

### Migration Guide

- N/A (initial release)

## [Unreleased]

### Planned Features

- Redis rate limiter adapter
- Additional email providers
- Webhook support for events
- Performance optimizations
- Additional security features

### Known Issues

- None currently identified

---

## Version History

- **1.0.0**: Initial release with complete feature set
