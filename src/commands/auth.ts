import chalk from 'chalk';
import inquirer from 'inquirer';
import { configManager } from '../lib/simple-config';
import { clockifyAPI } from '../lib/api';
import { isValidApiKey } from '../lib/utils';

export const authCommands = {
  async login(options: { key?: string }): Promise<void> {
    try {
      let apiKey = options.key;

      // If no API key provided via option, prompt for it
      if (!apiKey) {
        console.log(chalk.blue('🔑 Clockify CLI Authentication\n'));
        console.log(chalk.gray('Get your API key from: https://clockify.me/user/settings\n'));

        const answers = await inquirer.prompt([
          {
            type: 'password',
            name: 'apiKey',
            message: 'Enter your Clockify API key:',
            mask: '*',
            validate: (input: string) => {
              if (!input || input.trim().length === 0) {
                return 'API key is required';
              }
              if (!isValidApiKey(input.trim())) {
                return 'Invalid API key format. Expected a long alphanumeric string.';
              }
              return true;
            }
          }
        ]);

        apiKey = answers.apiKey.trim();
      }

      if (!apiKey) {
        console.log(chalk.red('❌ No API key provided'));
        process.exit(1);
      }

      // Validate API key format
      if (!isValidApiKey(apiKey)) {
        console.log(chalk.red('❌ Invalid API key format'));
        process.exit(1);
      }

      console.log(chalk.blue('🔍 Validating API key...'));

      // Store API key temporarily to test it
      await configManager.setApiKey(apiKey);

      try {
        // Test the API key by fetching user info
        const user = await clockifyAPI.testConnection();
        console.log(chalk.green(`✅ Successfully authenticated as: ${user.name} (${user.email})`));

        // Get workspaces and set default if only one
        const workspaces = await clockifyAPI.getWorkspaces();
        console.log(chalk.blue(`📁 Found ${workspaces.length} workspace(s)`));

        if (workspaces.length === 1) {
          const workspace = workspaces[0]!; // Safe because we checked length === 1
          configManager.set('workspaceId', workspace.id);
          console.log(chalk.green(`✅ Set default workspace: ${workspace.name}`));
        } else if (workspaces.length > 1) {
          console.log(chalk.yellow('📋 Multiple workspaces found. Use "clockify workspace list" to see all.'));
          console.log(chalk.yellow('💡 Tip: Use "clockify workspace switch <name>" to set a default workspace.'));
        }

        console.log(chalk.green('\n🎉 Authentication setup complete!'));
        console.log(chalk.gray('Try: clockify status'));

      } catch (error) {
        // Remove invalid API key
        await configManager.removeApiKey();
        throw error;
      }

    } catch (error) {
      console.log(chalk.red(`❌ Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  },

  async logout(): Promise<void> {
    try {
      console.log(chalk.yellow('🔓 Removing stored credentials...'));

      const hasKey = await configManager.hasApiKey();
      if (!hasKey) {
        console.log(chalk.gray('ℹ️  No credentials found to remove'));
        return;
      }

      const removed = await configManager.removeApiKey();
      if (removed) {
        console.log(chalk.green('✅ Credentials removed successfully'));
        console.log(chalk.gray('💡 Run "clockify auth login" to authenticate again'));
      } else {
        console.log(chalk.yellow('⚠️  Could not remove credentials from keychain'));
      }

    } catch (error) {
      console.log(chalk.red(`❌ Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  },

  async status(): Promise<void> {
    try {
      console.log(chalk.blue('🔍 Checking authentication status...\n'));

      const hasKey = await configManager.hasApiKey();
      if (!hasKey) {
        console.log(chalk.red('❌ Not authenticated'));
        console.log(chalk.gray('💡 Run: clockify auth login'));
        return;
      }

      try {
        const user = await clockifyAPI.getCurrentUser();
        const workspaces = await clockifyAPI.getWorkspaces();
        const config = configManager.getAll();

        console.log(chalk.green('✅ Authenticated'));
        console.log(chalk.gray('━'.repeat(50)));
        console.log(chalk.bold('User:'), chalk.white(user.name));
        console.log(chalk.bold('Email:'), chalk.white(user.email));
        console.log(chalk.bold('Workspaces:'), chalk.white(workspaces.length));
        
        if (config.workspaceId) {
          const currentWorkspace = workspaces.find(w => w.id === config.workspaceId);
          console.log(chalk.bold('Current Workspace:'), chalk.white(currentWorkspace?.name || 'Unknown'));
        } else {
          console.log(chalk.bold('Current Workspace:'), chalk.yellow('Not set'));
        }

        console.log(chalk.bold('Config File:'), chalk.gray(configManager.getConfigPath()));
        console.log(chalk.gray('━'.repeat(50)));

      } catch (error) {
        console.log(chalk.red('❌ Authentication invalid'));
        console.log(chalk.gray('💡 Run: clockify auth login'));
      }

    } catch (error) {
      console.log(chalk.red(`❌ Status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  }
}; 