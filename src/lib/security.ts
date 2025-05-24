/**
 * Security configuration and utilities
 */

export const SECURITY_CONFIG = {
  // File permissions
  CONFIG_DIR_MODE: 0o700,      // rwx------
  CONFIG_FILE_MODE: 0o600,     // rw-------
  API_KEY_FILE_MODE: 0o600,    // rw-------
  
  // Input validation limits
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_PROJECT_NAME_LENGTH: 255,
  MAX_API_KEY_LENGTH: 60,
  MIN_API_KEY_LENGTH: 40,
  
  // Rate limiting
  MIN_REQUEST_INTERVAL_MS: 100,
  MAX_REQUESTS_PER_MINUTE: 50,
  
  // Timeouts
  API_TIMEOUT_MS: 10000,
  CONNECTION_TIMEOUT_MS: 5000,
  
  // Allowed characters patterns
  SAFE_CHARS_REGEX: /^[a-zA-Z0-9\s\-_\.,:;!()\[\]{}'"\/\\@#$%^&*+=|~`?\n\r\t]*$/,
  API_KEY_CHARS_REGEX: /^[a-zA-Z0-9]+$/,
  
  // Blocked patterns
  DANGEROUS_PATTERNS: [
    /<script[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
  ],
  
  // Suspicious API key patterns
  SUSPICIOUS_API_KEY_PATTERNS: [
    /^(test|fake|demo|sample|example|placeholder)/i,
    /^(1234|abcd|0000|aaaa|bbbb)/,
    /(.)\1{10,}/, // Repeated characters
    /^[a-z]+$/,   // All lowercase (real keys are mixed case)
    /^[A-Z]+$/,   // All uppercase
  ]
} as const;

/**
 * Validate input against security patterns
 */
export function validateSecureInput(input: string, maxLength: number = SECURITY_CONFIG.MAX_DESCRIPTION_LENGTH): boolean {
  if (typeof input !== 'string') {
    return false;
  }
  
  if (input.length > maxLength) {
    return false;
  }
  
  // Check for dangerous patterns
  for (const pattern of SECURITY_CONFIG.DANGEROUS_PATTERNS) {
    if (pattern.test(input)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Sanitize and validate user input with strict security rules
 */
export function securelyProcessInput(input: string, maxLength: number = SECURITY_CONFIG.MAX_DESCRIPTION_LENGTH): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  // Remove null bytes and control characters
  let cleaned = input
    .replace(/\x00/g, '') // Remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove control chars
    .trim();
  
  // Validate against dangerous patterns
  if (!validateSecureInput(cleaned, maxLength)) {
    throw new Error('Input contains potentially dangerous content');
  }
  
  // Truncate if too long
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }
  
  return cleaned;
}

/**
 * Validate API key with comprehensive security checks
 */
export function validateApiKeySecurity(apiKey: string): { valid: boolean; reason?: string } {
  if (typeof apiKey !== 'string') {
    return { valid: false, reason: 'API key must be a string' };
  }
  
  if (apiKey.length < SECURITY_CONFIG.MIN_API_KEY_LENGTH || apiKey.length > SECURITY_CONFIG.MAX_API_KEY_LENGTH) {
    return { valid: false, reason: 'API key length is invalid' };
  }
  
  if (!SECURITY_CONFIG.API_KEY_CHARS_REGEX.test(apiKey)) {
    return { valid: false, reason: 'API key contains invalid characters' };
  }
  
  // Check for suspicious patterns
  for (const pattern of SECURITY_CONFIG.SUSPICIOUS_API_KEY_PATTERNS) {
    if (pattern.test(apiKey)) {
      return { valid: false, reason: 'API key appears to be a placeholder or test key' };
    }
  }
  
  return { valid: true };
}

/**
 * Security headers for HTTP requests
 */
export const SECURITY_HEADERS = {
  'User-Agent': 'clockify-cli/1.0.0',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
} as const; 