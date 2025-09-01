# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email security concerns to: [your-email@example.com]
3. Include detailed information about the vulnerability
4. Allow time for investigation and patching

## Security Considerations

### API Keys and Tokens
- **Hugging Face Token**: Store in environment variables, never commit to code
- **File Permissions**: Ensure proper access controls for vault and media directories
- **Network Security**: All API calls use HTTPS

### Input Validation
- File size limits prevent resource exhaustion
- Path validation prevents directory traversal
- Format validation ensures safe file processing

### Error Handling
- Structured error messages avoid information leakage
- Sensitive data is not included in error responses
- Logs can be configured to exclude sensitive information

### Dependencies
- Regular dependency updates via automated tools
- Security scanning of all dependencies
- Minimal dependency footprint to reduce attack surface

## Best Practices

### Deployment
- Run servers with minimal required permissions
- Use containerization for isolation
- Monitor resource usage and set appropriate limits
- Regularly update dependencies and base images

### Configuration
- Review configuration files for sensitive data
- Use environment variables for secrets
- Enable logging for security monitoring
- Set appropriate timeout and rate limits