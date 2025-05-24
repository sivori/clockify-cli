import * as os from 'os';
import { promisify } from 'util';
import { exec } from 'child_process';
import chalk from 'chalk';

const execAsync = promisify(exec);

/**
 * Validate the environment for security and compatibility
 */
export async function validateEnvironment(): Promise<void> {
  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0] || '0', 10);
  
  if (majorVersion < 16) {
    throw new Error(`Node.js 16+ required, found ${nodeVersion}`);
  }

  // Check platform support
  const platform = os.platform();
  const supportedPlatforms = ['darwin', 'linux', 'win32'];
  
  if (!supportedPlatforms.includes(platform)) {
    console.warn(chalk.yellow(`Warning: Platform ${platform} may not be fully supported`));
  }

  // Validate environment variables
  if (process.env.NODE_ENV === 'development') {
    console.log(chalk.gray('Running in development mode'));
  }
}

/**
 * Check for application updates (non-blocking)
 */
export async function checkForUpdates(): Promise<void> {
  try {
    // In a real implementation, this would check npm registry or GitHub releases
    // For now, this is a placeholder
    const packageJson = require('../../package.json');
    console.log(chalk.gray(`Current version: ${packageJson.version}`));
  } catch (error) {
    // Silently fail - updates are not critical
  }
}

/**
 * Format duration in minutes to human-readable format
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Parse duration string to minutes
 * Supports formats: 1h, 30m, 1h30m, 1.5h, 90
 */
export function parseDuration(duration: string): number {
  const normalizedDuration = duration.toLowerCase().trim();
  
  // Just a number (minutes)
  if (/^\d+$/.test(normalizedDuration)) {
    return parseInt(normalizedDuration);
  }
  
  // Decimal hours (e.g., 1.5h)
  const decimalHoursMatch = normalizedDuration.match(/^(\d+(?:\.\d+)?)h?$/);
  if (decimalHoursMatch && decimalHoursMatch[1]) {
    return Math.round(parseFloat(decimalHoursMatch[1]) * 60);
  }
  
  // Hours and minutes (e.g., 1h30m)
  const hoursMinutesMatch = normalizedDuration.match(/^(?:(\d+)h)?(?:(\d+)m)?$/);
  if (hoursMinutesMatch) {
    const hours = parseInt(hoursMinutesMatch[1] || '0');
    const minutes = parseInt(hoursMinutesMatch[2] || '0');
    return hours * 60 + minutes;
  }
  
  // Just minutes (e.g., 30m)
  const minutesMatch = normalizedDuration.match(/^(\d+)m$/);
  if (minutesMatch && minutesMatch[1]) {
    return parseInt(minutesMatch[1]);
  }
  
  // Just hours (e.g., 2h)
  const hoursMatch = normalizedDuration.match(/^(\d+)h$/);
  if (hoursMatch && hoursMatch[1]) {
    return parseInt(hoursMatch[1]) * 60;
  }
  
  throw new Error(`Invalid duration format: ${duration}. Use formats like: 1h, 30m, 1h30m, 1.5h, or 90`);
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  return input
    .trim()
    .replace(/[<>&"'`]/g, '') // Remove potentially dangerous characters
    .replace(/\x00-\x1f/g, '') // Remove control characters
    .replace(/\x7f-\x9f/g, '') // Remove additional control characters
    .substring(0, 1000); // Limit length
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString();
}

/**
 * Format time for display
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString();
}

/**
 * Validate API key format
 */
export function isValidApiKey(apiKey: string): boolean {
  if (typeof apiKey !== 'string') {
    return false;
  }
  
  // Clockify API keys are typically 56 characters long, alphanumeric only
  // Ensure no suspicious patterns
  if (apiKey.length < 40 || apiKey.length > 60) {
    return false;
  }
  
  if (!/^[a-zA-Z0-9]+$/.test(apiKey)) {
    return false;
  }
  
  // Check for obviously fake or test keys
  const suspiciousPatterns = [
    /^(test|fake|demo|sample)/i,
    /^(1234|abcd|0000)/,
    /(.)\1{10,}/ // Repeated characters
  ];
  
  return !suspiciousPatterns.some(pattern => pattern.test(apiKey));
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
} 