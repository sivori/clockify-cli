#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { authCommands } from './commands/auth';
import { timerCommands } from './commands/timer';
import { projectCommands } from './commands/projects';
import { reportCommands } from './commands/reports';
import { configCommands } from './commands/config';
import { checkForUpdates, validateEnvironment } from './lib/utils';

const program = new Command();

async function main(): Promise<void> {
  try {
    // Security: Validate environment first
    await validateEnvironment();

    program
      .name('clockify')
      .description(chalk.blue('⏰ Clockify CLI - Command-line time tracking'))
      .version('1.0.0')
      .option('-v, --verbose', 'verbose output')
      .option('--no-color', 'disable colored output')
      .hook('preAction', async (thisCommand) => {
        // Security: Input validation for all commands
        const options = thisCommand.opts();
        
        // Validate global options
        if (options.verbose && typeof options.verbose !== 'boolean') {
          console.error(chalk.red('Error: --verbose must be a boolean'));
          process.exit(1);
        }
      });

    // Authentication commands
    const authGroup = program
      .command('auth')
      .description('Authentication and credential management');
    
    authGroup
      .command('login')
      .description('Configure API key and authenticate')
      .option('-k, --key <apikey>', 'API key from Clockify settings')
      .action(authCommands.login);

    authGroup
      .command('logout')
      .description('Remove stored credentials')
      .action(authCommands.logout);

    authGroup
      .command('status')
      .description('Show current authentication status')
      .action(authCommands.status);

    // Timer commands
    program
      .command('start')
      .description('Start tracking time')
      .option('-p, --project <name>', 'project name or ID')
      .option('-t, --task <name>', 'task name or ID')
      .option('-d, --description <text>', 'time entry description')
      .option('-b, --billable', 'mark as billable')
      .option('--no-billable', 'mark as non-billable')
      .action(timerCommands.start);

    program
      .command('stop')
      .description('Stop current timer')
      .option('-d, --description <text>', 'update description on stop')
      .action(timerCommands.stop);

    program
      .command('status')
      .description('Show current timer status')
      .option('-f, --format <type>', 'output format', 'table')
      .action(timerCommands.status);

    program
      .command('pause')
      .description('Pause current timer')
      .action(timerCommands.pause);

    program
      .command('resume')
      .description('Resume paused timer')
      .action(timerCommands.resume);

    // Manual time entry commands
    program
      .command('add')
      .description('Add manual time entry')
      .argument('<duration>', 'duration (e.g., 2h30m, 1.5h, 90m)')
      .option('-p, --project <name>', 'project name or ID')
      .option('-t, --task <name>', 'task name or ID')
      .option('-d, --description <text>', 'time entry description')
      .option('-s, --start-time <time>', 'start time (e.g., 09:00, 2023-10-01T09:00)')
      .option('-e, --end-time <time>', 'end time (e.g., 17:30)')
      .option('-b, --billable', 'mark as billable')
      .option('--no-billable', 'mark as non-billable')
      .action(timerCommands.add);

    program
      .command('edit')
      .description('Edit time entry')
      .argument('<entry-id>', 'time entry ID')
      .option('-d, --description <text>', 'update description')
      .option('-p, --project <name>', 'update project')
      .option('-t, --task <name>', 'update task')
      .option('-s, --start-time <time>', 'update start time')
      .option('-e, --end-time <time>', 'update end time')
      .option('-b, --billable', 'mark as billable')
      .option('--no-billable', 'mark as non-billable')
      .action(timerCommands.edit);

    program
      .command('delete')
      .description('Delete time entry')
      .argument('<entry-id>', 'time entry ID')
      .option('-f, --force', 'skip confirmation prompt')
      .action(timerCommands.delete);

    // Project and task management
    const projectGroup = program
      .command('projects')
      .alias('proj')
      .description('Project and task management');

    projectGroup
      .command('list')
      .alias('ls')
      .description('List all projects')
      .option('-a, --archived', 'include archived projects')
      .option('-c, --client <name>', 'filter by client')
      .option('-f, --format <type>', 'output format', 'table')
      .action(projectCommands.list);

    projectGroup
      .command('create')
      .description('Create new project')
      .argument('<name>', 'project name')
      .option('-c, --client <name>', 'client name or ID')
      .option('--color <hex>', 'project color (hex format)')
      .option('-b, --billable', 'make project billable by default')
      .option('--public', 'make project public')
      .action(projectCommands.create);

    projectGroup
      .command('archive')
      .description('Archive project')
      .argument('<name>', 'project name or ID')
      .action(projectCommands.archive);

    // Task commands
    const taskGroup = program
      .command('tasks')
      .description('Task management');

    taskGroup
      .command('list')
      .alias('ls')
      .description('List tasks for project')
      .argument('<project>', 'project name or ID')
      .option('-f, --format <type>', 'output format', 'table')
      .action(projectCommands.listTasks);

    taskGroup
      .command('create')
      .description('Create new task')
      .argument('<name>', 'task name')
      .option('-p, --project <name>', 'project name or ID')
      .action(projectCommands.createTask);

    // Reporting commands
    const reportGroup = program
      .command('report')
      .alias('rep')
      .description('Time tracking reports and analytics');

    reportGroup
      .command('today')
      .description('Today\'s time summary')
      .option('-f, --format <type>', 'output format', 'table')
      .action(reportCommands.today);

    reportGroup
      .command('week')
      .description('This week\'s time summary')
      .option('-f, --format <type>', 'output format', 'table')
      .action(reportCommands.week);

    reportGroup
      .command('month')
      .description('This month\'s time summary')
      .option('-f, --format <type>', 'output format', 'table')
      .action(reportCommands.month);

    reportGroup
      .command('custom')
      .description('Custom date range report')
      .option('-s, --start <date>', 'start date (YYYY-MM-DD)')
      .option('-e, --end <date>', 'end date (YYYY-MM-DD)')
      .option('-p, --project <name>', 'filter by project')
      .option('-f, --format <type>', 'output format', 'table')
      .action(reportCommands.custom);

    // Export commands
    program
      .command('export')
      .description('Export time data')
      .argument('<format>', 'export format (csv, json, xlsx)')
      .option('-s, --start <date>', 'start date (YYYY-MM-DD)')
      .option('-e, --end <date>', 'end date (YYYY-MM-DD)')
      .option('-p, --project <name>', 'filter by project')
      .option('-o, --output <file>', 'output file path')
      .action(reportCommands.export);

    // Configuration commands
    const configGroup = program
      .command('config')
      .description('Configuration management');

    configGroup
      .command('show')
      .description('Display current configuration')
      .action(configCommands.show);

    configGroup
      .command('set')
      .description('Set configuration option')
      .argument('<key>', 'configuration key')
      .argument('<value>', 'configuration value')
      .action(configCommands.set);

    configGroup
      .command('reset')
      .description('Reset configuration to defaults')
      .option('-f, --force', 'skip confirmation prompt')
      .action(configCommands.reset);

    // Workspace commands
    const workspaceGroup = program
      .command('workspace')
      .alias('ws')
      .description('Workspace management');

    workspaceGroup
      .command('list')
      .alias('ls')
      .description('List available workspaces')
      .option('-f, --format <type>', 'output format', 'table')
      .action(configCommands.listWorkspaces);

    workspaceGroup
      .command('switch')
      .description('Switch to different workspace')
      .argument('<workspace>', 'workspace name or ID')
      .action(configCommands.switchWorkspace);

    workspaceGroup
      .command('current')
      .description('Show current workspace')
      .action(configCommands.currentWorkspace);

    // Utility commands
    program
      .command('version')
      .description('Show version information')
      .action(() => {
        console.log(chalk.blue(`Clockify CLI v${program.version()}`));
        console.log(chalk.gray('Node.js time tracking with Clockify API'));
      });

    program
      .command('doctor')
      .description('Check system configuration and connectivity')
      .action(async () => {
        const { default: ora } = await import('ora');
        const spinner = ora('Running diagnostics...').start();
        
        try {
          // Check environment, connectivity, etc.
          await validateEnvironment();
          spinner.succeed('System check completed successfully');
        } catch (error) {
          spinner.fail(`System check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          process.exit(1);
        }
      });

    // Check for updates (non-blocking)
    checkForUpdates().catch(() => {
      // Silently fail update check
    });

    await program.parseAsync(process.argv);

  } catch (error) {
    console.error(chalk.red('Fatal error:'), error instanceof Error ? error.message : 'Unknown error');
    
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
    
    process.exit(1);
  }
}

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('Unhandled Rejection:'), reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\nGracefully shutting down...'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(chalk.yellow('\nReceived SIGTERM, shutting down...'));
  process.exit(0);
});

if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.red('Application failed to start:'), error.message);
    process.exit(1);
  });
}

export default program; 