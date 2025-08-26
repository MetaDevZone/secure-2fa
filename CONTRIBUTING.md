# Contributing to Secure Email OTP

Thank you for your interest in contributing to the Secure Email OTP package! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

- Use the GitHub issue tracker
- Include a clear and descriptive title
- Provide detailed steps to reproduce the bug
- Include your environment details (Node.js version, OS, etc.)
- Include error messages and stack traces
- Provide a minimal reproduction case if possible

### Suggesting Enhancements

- Use the GitHub issue tracker with the "enhancement" label
- Clearly describe the feature and its benefits
- Consider the impact on existing functionality
- Discuss implementation approach if you have ideas

### Pull Requests

- Fork the repository
- Create a feature branch (`git checkout -b feature/amazing-feature`)
- Make your changes following the coding standards
- Add tests for new functionality
- Update documentation as needed
- Commit your changes (`git commit -m 'Add amazing feature'`)
- Push to the branch (`git push origin feature/amazing-feature`)
- Open a Pull Request

## Development Setup

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/secure-email-otp.git
cd secure-email-otp

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Available Scripts

- `npm run build` - Build the TypeScript code
- `npm run dev` - Watch mode for development
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run clean` - Clean build artifacts

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Prefer explicit types over `any`
- Use interfaces for object shapes
- Use enums for constants
- Use readonly properties where appropriate
- Use proper access modifiers (public, private, protected)

### Code Style

- Follow the existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Use early returns to reduce nesting
- Prefer const over let when possible

### File Organization

- Keep related code together
- Use descriptive file names
- Follow the existing directory structure
- Export only what's necessary from modules

### Error Handling

- Use custom error classes
- Provide meaningful error messages
- Handle async errors properly
- Use try-catch blocks appropriately

## Testing

### Test Structure

- Tests should be in `__tests__` directories
- Use descriptive test names
- Group related tests with `describe` blocks
- Use `beforeEach` and `afterEach` for setup/cleanup
- Mock external dependencies

### Test Coverage

- Aim for at least 80% test coverage
- Test both success and error cases
- Test edge cases and boundary conditions
- Test async functions properly

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=otp-generator.test.ts
```

## Pull Request Process

### Before Submitting

1. **Ensure tests pass**: Run `npm test` and fix any failures
2. **Check linting**: Run `npm run lint` and fix any issues
3. **Update documentation**: Update README, API docs, or examples if needed
4. **Add tests**: Include tests for new functionality
5. **Check coverage**: Ensure test coverage doesn't decrease significantly

### PR Guidelines

1. **Clear title**: Use a descriptive title that explains the change
2. **Detailed description**: Explain what the PR does and why
3. **Reference issues**: Link to related issues using keywords
4. **Screenshots**: Include screenshots for UI changes if applicable
5. **Breaking changes**: Clearly mark any breaking changes

### Review Process

1. **Automated checks**: All CI checks must pass
2. **Code review**: At least one maintainer must approve
3. **Testing**: Changes must be tested thoroughly
4. **Documentation**: Documentation must be updated if needed

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **Major** (1.0.0): Breaking changes
- **Minor** (1.1.0): New features, backward compatible
- **Patch** (1.0.1): Bug fixes, backward compatible

### Release Steps

1. **Update version**: Update version in `package.json`
2. **Update changelog**: Add entry to `CHANGELOG.md`
3. **Create release branch**: `git checkout -b release/v1.0.0`
4. **Final testing**: Run full test suite
5. **Merge to main**: Merge release branch to main
6. **Create tag**: `git tag v1.0.0`
7. **Publish**: `npm publish`
8. **Create GitHub release**: Create release on GitHub

## Security

### Security Issues

- **DO NOT** create public issues for security vulnerabilities
- Email security issues to: `security@yourdomain.com`
- Include detailed information about the vulnerability
- Allow time for investigation and fix

### Security Guidelines

- Never commit secrets or sensitive data
- Use environment variables for configuration
- Follow security best practices
- Review code for security issues

## Questions?

If you have questions about contributing:

- Check the existing documentation
- Search existing issues
- Create a new issue for general questions
- Contact maintainers directly for urgent matters

Thank you for contributing to Secure Email OTP!
