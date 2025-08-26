# Security Policy

## Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow these steps:

### 1. **DO NOT** create a public GitHub issue

Security vulnerabilities should be reported privately to prevent exploitation.

### 2. Email us directly

Send a detailed report to: `security@yourdomain.com`

### 3. Include the following information:

- **Description**: Clear description of the vulnerability
- **Steps to reproduce**: Detailed steps to reproduce the issue
- **Impact**: Potential impact of the vulnerability
- **Suggested fix**: If you have a suggested solution
- **Affected versions**: Which versions are affected
- **Proof of concept**: If applicable, include a safe PoC

### 4. Response timeline

- **Initial response**: Within 48 hours
- **Status update**: Within 7 days
- **Fix timeline**: Depends on severity (1-30 days)

## Security Features

This package implements several security measures:

### Cryptographic Security

- **OTP Generation**: Uses `crypto.randomBytes()` for cryptographically secure random numbers
- **HMAC Verification**: Constant-time comparison to prevent timing attacks
- **OTP Storage**: bcrypt hashing with 12 salt rounds
- **Session Binding**: HMAC-based session and context binding

### Rate Limiting

- Configurable rate limiting per email/context
- Automatic blocking after max retries
- Window-based rate limiting

### Request Validation

- Strict mode for request metadata validation
- Context and session binding
- Replay attack prevention

### Secure Defaults

- Minimum 32-character server secret required
- Strict mode enabled by default
- Secure OTP length (4-10 digits)
- Reasonable expiry times (2 minutes default)

## Best Practices

### Server Secret

- Use a strong, randomly generated server secret (minimum 32 characters)
- Store the secret securely (environment variables, secret management)
- Rotate secrets periodically

### Rate Limiting

- Configure appropriate rate limits for your use case
- Monitor for abuse patterns
- Consider IP-based rate limiting for additional protection

### Request Metadata

- Enable strict mode in production
- Collect and validate request metadata
- Use device fingerprinting when possible

### Email Security

- Use reputable email providers
- Implement SPF, DKIM, and DMARC
- Monitor email delivery rates

## Security Considerations

### Known Limitations

- Email delivery is not guaranteed
- SMS-based OTP may be more reliable for critical applications
- Consider multi-factor authentication for high-security applications

### Recommendations

- Implement proper logging and monitoring
- Regular security audits
- Keep dependencies updated
- Follow OWASP guidelines

## Disclosure Policy

When a vulnerability is fixed:

1. A security advisory will be published
2. Patches will be released promptly
3. Users will be notified through appropriate channels
4. CVE numbers will be requested when applicable

## Contact

For security-related questions or concerns:

- Email: `security@yourdomain.com`
- PGP Key: [Add your PGP key if available]

Thank you for helping keep this package secure!
