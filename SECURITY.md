# Security Policy

## 🔒 Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | ✅ Yes             |
| < 1.0   | ❌ No              |

## 🚨 Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability:

### 📧 Contact
- **Email**: suryakanta9662@gmail.com
- **Response Time**: Within 48 hours
- **Updates**: Weekly until resolved

### 📝 Include in Report
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### 🔐 Security Measures
- **Code Execution**: Docker isolation with resource limits
- **Authentication**: JWT tokens with expiration
- **Input Validation**: Sanitization and XSS protection
- **Database**: SQL injection prevention
- **Network**: CORS protection and rate limiting

### 🏆 Recognition
Security researchers will be credited in our Hall of Fame (with permission).

## 🛡️ Best Practices for Contributors
- Never commit secrets or API keys
- Use environment variables for sensitive data
- Follow secure coding practices
- Test for common vulnerabilities

Thank you for helping keep Codesplex secure! 🙏