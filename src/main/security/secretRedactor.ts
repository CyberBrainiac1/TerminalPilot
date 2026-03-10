const SECRET_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /sk-[a-zA-Z0-9]{20,}/g, replacement: '[OPENAI_KEY_REDACTED]' },
  { pattern: /Bearer\s+[a-zA-Z0-9\-._~+\/]+=*/g, replacement: 'Bearer [TOKEN_REDACTED]' },
  { pattern: /ghp_[a-zA-Z0-9]{36}/g, replacement: '[GITHUB_TOKEN_REDACTED]' },
  { pattern: /AKIA[0-9A-Z]{16}/g, replacement: '[AWS_ACCESS_KEY_REDACTED]' },
  { pattern: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (RSA |EC |OPENSSH )?PRIVATE KEY-----/g, replacement: '[PRIVATE_KEY_REDACTED]' },
  { pattern: /(password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key)\s*=\s*['"]?[^\s'"&;]+['"]?/gi, replacement: '$1=[REDACTED]' },
  { pattern: /([A-Z_]*(PASSWORD|SECRET|TOKEN|API_KEY|ACCESS_KEY|PRIVATE_KEY)[A-Z_]*)\s*=\s*\S+/g, replacement: '$1=[REDACTED]' },
  { pattern: /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/g, replacement: 'mongodb$1://[CREDENTIALS_REDACTED]@' },
  { pattern: /postgres(ql)?:\/\/[^:]+:[^@]+@/g, replacement: 'postgres$1://[CREDENTIALS_REDACTED]@' },
  { pattern: /mysql:\/\/[^:]+:[^@]+@/g, replacement: 'mysql://[CREDENTIALS_REDACTED]@' },
];

export function redactSecrets(text: string): string {
  let result = text;
  for (const { pattern, replacement } of SECRET_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}
