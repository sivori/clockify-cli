# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Best Practices

### For Users

1. **API Key Security**:
   - Never share your Clockify API key
   - Don't commit API keys to version control
   - Use environment variables in CI/CD: `CLOCKIFY_API_KEY`
   - Regularly rotate your API keys

2. **Installation Security**:
   - Install only from official sources (npm, GitHub releases)
   - Verify package integrity using npm's built-in verification
   - Keep the CLI updated to the latest version

3. **System Security**:
   - Ensure your system keychain/credential manager is secure
   - Use appropriate file permissions for config files
   - Regular system updates and security patches

### For Developers

1. **Code Security**:
   - All inputs are validated and sanitized
   - No secrets in source code
   - Secure API communication (HTTPS only)
   - Regular dependency updates and security audits

2. **Data Protection**:
   - Minimal data collection and storage
   - Secure credential storage using OS keychain
   - Local-first approach for sensitive data
   - Clear data retention policies

## Reporting a Vulnerability

We take security vulnerabilities seriously. Please follow responsible disclosure:

### How to Report

1. **Email**: Send details to `security@your-domain.com`
2. **GitHub Security**: Use [GitHub Security Advisories](https://github.com/yourusername/clockify-cli/security/advisories)
3. **Include**:
   - Detailed description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact assessment
   - Suggested fix (if known)

### What to Expect

- **Acknowledgment**: Within 24 hours
- **Initial Assessment**: Within 72 hours
- **Regular Updates**: Every 7 days until resolution
- **Public Disclosure**: After fix is available and users have time to update

### Disclosure Timeline

1. **Day 0**: Vulnerability reported
2. **Day 1**: Acknowledgment and initial triage
3. **Day 3**: Detailed assessment and severity classification
4. **Day 7-30**: Fix development and testing
5. **Day 30+**: Coordinated public disclosure

## Security Measures

### Authentication & Authorization
- API keys stored securely in OS credential manager (Keychain/Windows Credential Store)
- Support for environment variable authentication
- No hardcoded credentials or secrets

### Input Validation
- All user inputs sanitized to prevent injection attacks
- Strict validation of API responses
- Length limits and format validation

### Network Security
- HTTPS-only communication with Clockify API
- Certificate verification and pinning
- Request/response timeout handling
- Proper User-Agent identification

### Dependency Security
- Regular `npm audit` scanning
- Snyk integration for advanced vulnerability detection
- Automated dependency updates for security patches
- SPDX license compliance checking

### Development Security
- TypeScript strict mode for type safety
- ESLint security rules and static analysis
- Pre-commit hooks for security checks
- Secure CI/CD pipeline

### Data Protection
- Minimal data collection principles
- Local-first data storage approach
- Secure deletion of sensitive data
- No telemetry or tracking without explicit consent

## Security Tools & Processes

### Automated Security
- GitHub Dependabot for dependency updates
- Snyk for vulnerability scanning
- CodeQL for code security analysis
- npm audit in CI/CD pipeline

### Manual Security Reviews
- Code review requirements for all changes
- Security-focused PR reviews
- Regular security audits
- Penetration testing for major releases

## Incident Response

In case of a confirmed security incident:

1. **Immediate Response** (0-24h):
   - Confirm and assess the vulnerability
   - Determine scope and impact
   - Prepare hotfix if critical

2. **Short-term Response** (1-7 days):
   - Develop and test comprehensive fix
   - Prepare security advisory
   - Coordinate with affected users

3. **Long-term Response** (7+ days):
   - Release patched version
   - Public disclosure and communication
   - Post-incident review and improvements

## Contact Information

- **Security Email**: security@your-domain.com
- **GitHub Security**: [Security Advisories](https://github.com/yourusername/clockify-cli/security/advisories)
- **Maintainer**: [@yourusername](https://github.com/yourusername)

## Acknowledgments

We appreciate security researchers and users who help improve our security:

- Responsible disclosure participants
- Security audit contributors
- Community security feedback

---

**Note**: This security policy is regularly reviewed and updated. Last updated: 2024-01-01 