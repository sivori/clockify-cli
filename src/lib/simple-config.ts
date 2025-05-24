import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ClockifyConfig } from '../types/clockify';

const CONFIG_DIR = path.join(os.homedir(), '.clockify-cli');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const API_KEY_FILE = path.join(CONFIG_DIR, 'api-key');

class SimpleConfigManager {
  private config: ClockifyConfig;

  constructor() {
    this.ensureConfigDir();
    this.config = this.loadConfig();
  }

  private ensureConfigDir(): void {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { mode: 0o700 }); // Secure permissions
    }
  }

  private loadConfig(): ClockifyConfig {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const data = fs.readFileSync(CONFIG_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      // Ignore errors, use defaults
    }

    return {
      timeFormat: '24h',
      billableByDefault: false,
      autoStartTimer: false,
      notificationsEnabled: true
    };
  }

  private saveConfig(): void {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), { mode: 0o600 });
    } catch (error) {
      throw new Error(`Failed to save config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Store API key securely in file with restricted permissions
   */
  async setApiKey(apiKey: string): Promise<void> {
    try {
      fs.writeFileSync(API_KEY_FILE, apiKey, { mode: 0o600 });
    } catch (error) {
      throw new Error(`Failed to store API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve API key from file or environment variable
   */
  async getApiKey(): Promise<string | null> {
    try {
      // First try environment variable
      if (process.env.CLOCKIFY_API_KEY) {
        return process.env.CLOCKIFY_API_KEY;
      }

      // Then try file
      if (fs.existsSync(API_KEY_FILE)) {
        return fs.readFileSync(API_KEY_FILE, 'utf8').trim();
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Remove API key file
   */
  async removeApiKey(): Promise<boolean> {
    try {
      if (fs.existsSync(API_KEY_FILE)) {
        fs.unlinkSync(API_KEY_FILE);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if API key exists
   */
  async hasApiKey(): Promise<boolean> {
    const apiKey = await this.getApiKey();
    return apiKey !== null && apiKey.length > 0;
  }

  /**
   * Get configuration value
   */
  get<K extends keyof ClockifyConfig>(key: K): ClockifyConfig[K] {
    return this.config[key];
  }

  /**
   * Set configuration value
   */
  set<K extends keyof ClockifyConfig>(key: K, value: ClockifyConfig[K]): void {
    this.config[key] = value;
    this.saveConfig();
  }

  /**
   * Get all configuration
   */
  getAll(): ClockifyConfig {
    return { ...this.config };
  }

  /**
   * Reset configuration to defaults
   */
  reset(): void {
    this.config = {
      timeFormat: '24h',
      billableByDefault: false,
      autoStartTimer: false,
      notificationsEnabled: true
    };
    this.saveConfig();
  }

  /**
   * Get configuration file path
   */
  getConfigPath(): string {
    return CONFIG_FILE;
  }
}

export const configManager = new SimpleConfigManager(); 