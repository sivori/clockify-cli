import chalk from 'chalk';
import { configManager } from '../lib/simple-config';
import { clockifyAPI } from '../lib/api';
import { formatDuration, parseDuration, sanitizeInput } from '../lib/utils';
import { TimeEntryRequest } from '../types/clockify';

export const timerCommands = {
  async start(options: any): Promise<void> {
    try {
      console.log(chalk.blue('⏱️  Starting timer...'));

      // Check authentication
      const hasKey = await configManager.hasApiKey();
      if (!hasKey) {
        console.log(chalk.red('❌ Not authenticated. Run: clockify auth login'));
        process.exit(1);
      }

      // Get workspace
      const workspaceId = configManager.get('workspaceId');
      if (!workspaceId) {
        console.log(chalk.red('❌ No workspace configured. Run: clockify auth status'));
        process.exit(1);
      }

      // Get current user
      const user = await clockifyAPI.getCurrentUser();

      // Check if there's already a running timer
      const currentEntries = await clockifyAPI.getTimeEntries(workspaceId, user.id);
      const runningEntry = currentEntries.find(entry => !entry.timeInterval.end);
      
      if (runningEntry) {
        console.log(chalk.yellow('⚠️  Timer already running!'));
        console.log(chalk.gray(`Current: ${runningEntry.description || 'No description'}`));
        console.log(chalk.gray('💡 Use "clockify stop" first or "clockify status" to see details'));
        return;
      }

      // Build time entry
      const timeEntry: TimeEntryRequest = {
        start: new Date().toISOString(),
        description: options.description ? sanitizeInput(options.description) : '',
        billable: options.billable ?? configManager.get('billableByDefault')
      };

      // Resolve project if provided
      if (options.project) {
        const projects = await clockifyAPI.getProjects(workspaceId);
        const project = projects.find(p => 
          p.name.toLowerCase().includes(options.project.toLowerCase()) ||
          p.id === options.project
        );
        
        if (project) {
          timeEntry.projectId = project.id;
          console.log(chalk.gray(`📁 Project: ${project.name}`));
        } else {
          // Project not found, create it
          console.log(chalk.blue(`🔨 Creating new project: "${options.project}"`));
          try {
            const newProject = await clockifyAPI.createProject(workspaceId, {
              name: sanitizeInput(options.project),
              isPublic: true,
              billable: options.billable ?? configManager.get('billableByDefault'),
              color: '#4CAF50' // Default green color
            });
            
            timeEntry.projectId = newProject.id;
            console.log(chalk.green(`✅ Project "${newProject.name}" created successfully!`));
            console.log(chalk.gray(`📁 Project: ${newProject.name}`));
          } catch (error) {
            console.log(chalk.yellow(`⚠️  Failed to create project "${options.project}". Starting without project.`));
            console.log(chalk.gray(`💡 Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
          }
        }
      }

      // Start the timer
      const entry = await clockifyAPI.startTimer(workspaceId, timeEntry);
      
      console.log(chalk.green('✅ Timer started successfully!'));
      console.log(chalk.gray('━'.repeat(50)));
      if (entry.project?.name) {
        console.log(chalk.bold('Project:'), chalk.white(entry.project.name));
      }
      if (entry.task?.name) {
        console.log(chalk.bold('Task:'), chalk.white(entry.task.name));
      }
      console.log(chalk.bold('Description:'), chalk.white(entry.description || 'No description'));
      console.log(chalk.bold('Billable:'), entry.billable ? chalk.green('Yes') : chalk.gray('No'));
      console.log(chalk.bold('Started:'), chalk.white(new Date(entry.timeInterval.start).toLocaleTimeString()));
      console.log(chalk.gray('━'.repeat(50)));
      console.log(chalk.gray('💡 Use "clockify status" to check progress or "clockify stop" to finish'));

    } catch (error) {
      console.log(chalk.red(`❌ Failed to start timer: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  },

  async stop(options: any): Promise<void> {
    try {
      console.log(chalk.blue('⏹️  Stopping timer...'));

      // Check authentication
      const hasKey = await configManager.hasApiKey();
      if (!hasKey) {
        console.log(chalk.red('❌ Not authenticated. Run: clockify auth login'));
        process.exit(1);
      }

      // Get workspace and user
      const workspaceId = configManager.get('workspaceId');
      if (!workspaceId) {
        console.log(chalk.red('❌ No workspace configured. Run: clockify auth status'));
        process.exit(1);
      }

      const user = await clockifyAPI.getCurrentUser();

      // Find running timer
      const currentEntries = await clockifyAPI.getTimeEntries(workspaceId, user.id);
      const runningEntry = currentEntries.find(entry => !entry.timeInterval.end);
      
      if (!runningEntry) {
        console.log(chalk.yellow('⚠️  No timer currently running'));
        console.log(chalk.gray('💡 Use "clockify start" to begin tracking time'));
        return;
      }

      // Stop the timer
      const stoppedEntry = await clockifyAPI.stopTimer(workspaceId, user.id);
      const startTime = new Date(stoppedEntry.timeInterval.start);
      const endTime = new Date(stoppedEntry.timeInterval.end!);
      const duration = endTime.getTime() - startTime.getTime();
      const durationMinutes = Math.round(duration / 60000);

      console.log(chalk.green('✅ Timer stopped successfully!'));
      console.log(chalk.gray('━'.repeat(50)));
      if (stoppedEntry.project?.name) {
        console.log(chalk.bold('Project:'), chalk.white(stoppedEntry.project.name));
      }
      console.log(chalk.bold('Description:'), chalk.white(stoppedEntry.description || 'No description'));
      console.log(chalk.bold('Duration:'), chalk.white(formatDuration(durationMinutes)));
      console.log(chalk.bold('Billable:'), stoppedEntry.billable ? chalk.green('Yes') : chalk.gray('No'));
      console.log(chalk.gray('━'.repeat(50)));

    } catch (error) {
      console.log(chalk.red(`❌ Failed to stop timer: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  },

  async status(options: any): Promise<void> {
    try {
      console.log(chalk.blue('📊 Checking timer status...\n'));

      // Check authentication
      const hasKey = await configManager.hasApiKey();
      if (!hasKey) {
        console.log(chalk.red('❌ Not authenticated. Run: clockify auth login'));
        return;
      }

      // Get workspace and user
      const workspaceId = configManager.get('workspaceId');
      if (!workspaceId) {
        console.log(chalk.red('❌ No workspace configured. Run: clockify auth status'));
        return;
      }

      const user = await clockifyAPI.getCurrentUser();

      // Find running timer
      const currentEntries = await clockifyAPI.getTimeEntries(workspaceId, user.id);
      const runningEntry = currentEntries.find(entry => !entry.timeInterval.end);
      
      if (!runningEntry) {
        console.log(chalk.gray('⏸️  No timer currently running'));
        console.log(chalk.gray('💡 Use "clockify start" to begin tracking time'));
        
        // Show today's summary
        const today = new Date().toISOString().split('T')[0];
        const todayEntries = currentEntries.filter(entry => {
          const entryDate = entry.timeInterval.start.split('T')[0];
          return entryDate === today && entry.timeInterval.end;
        });
        
        if (todayEntries.length > 0) {
          const totalMinutes = todayEntries.reduce((total, entry) => {
            const startTime = new Date(entry.timeInterval.start);
            const endTime = new Date(entry.timeInterval.end!);
            const duration = endTime.getTime() - startTime.getTime();
            return total + Math.round(duration / 60000);
          }, 0);
          
          console.log(chalk.gray('\n📈 Today\'s Summary:'));
          console.log(chalk.white(`   ${todayEntries.length} entries • ${formatDuration(totalMinutes)} total`));
        }
        return;
      }

      // Calculate elapsed time
      const startTime = new Date(runningEntry.timeInterval.start);
      const elapsed = new Date().getTime() - startTime.getTime();
      const elapsedMinutes = Math.round(elapsed / 60000);

      console.log(chalk.green('⏱️  Timer is running'));
      console.log(chalk.gray('━'.repeat(50)));
      if (runningEntry.project?.name) {
        console.log(chalk.bold('Project:'), chalk.white(runningEntry.project.name));
      } else {
        console.log(chalk.bold('Project:'), chalk.gray('No project'));
      }
      if (runningEntry.task?.name) {
        console.log(chalk.bold('Task:'), chalk.white(runningEntry.task.name));
      }
      console.log(chalk.bold('Description:'), chalk.white(runningEntry.description || 'No description'));
      console.log(chalk.bold('Started:'), chalk.white(startTime.toLocaleTimeString()));
      console.log(chalk.bold('Elapsed:'), chalk.yellow(formatDuration(elapsedMinutes)));
      console.log(chalk.bold('Billable:'), runningEntry.billable ? chalk.green('Yes') : chalk.gray('No'));
      console.log(chalk.gray('━'.repeat(50)));
      console.log(chalk.gray('💡 Use "clockify stop" to finish or "clockify stop -d \'Final description\'" to update description'));

    } catch (error) {
      console.log(chalk.red(`❌ Failed to get timer status: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  },

  async pause(): Promise<void> {
    console.log(chalk.yellow('⏸️  Pause functionality coming soon!'));
    console.log(chalk.gray('💡 For now, use "clockify stop" then "clockify start" to achieve the same effect'));
  },

  async resume(): Promise<void> {
    console.log(chalk.yellow('▶️  Resume functionality coming soon!'));
    console.log(chalk.gray('💡 For now, use "clockify start" to begin a new timer'));
  },

  async add(duration: string, options: any): Promise<void> {
    try {
      console.log(chalk.blue(`➕ Adding manual time entry: ${duration}`));

      // Check authentication
      const hasKey = await configManager.hasApiKey();
      if (!hasKey) {
        console.log(chalk.red('❌ Not authenticated. Run: clockify auth login'));
        process.exit(1);
      }

      // Get workspace
      const workspaceId = configManager.get('workspaceId');
      if (!workspaceId) {
        console.log(chalk.red('❌ No workspace configured. Run: clockify auth status'));
        process.exit(1);
      }

      // Parse duration
      const durationMinutes = parseDuration(duration);
      console.log(chalk.gray(`⏱️  Duration: ${formatDuration(durationMinutes)}`));

      // Calculate start and end times
      let startTime: Date;
      let endTime: Date;

      if (options.startTime) {
        // Parse start time
        const now = new Date();
        const timeMatch = options.startTime.match(/^(\d{1,2}):(\d{2})$/);
        if (timeMatch) {
          startTime = new Date(now);
          startTime.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
        } else {
          startTime = new Date(options.startTime);
        }
        endTime = new Date(startTime.getTime() + durationMinutes * 60000);
      } else {
        // Default to ending now and calculating start time
        endTime = new Date();
        startTime = new Date(endTime.getTime() - durationMinutes * 60000);
      }

      // Build time entry
      const timeEntry: TimeEntryRequest = {
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        description: options.description ? sanitizeInput(options.description) : '',
        billable: options.billable ?? configManager.get('billableByDefault')
      };

      // Resolve project if provided
      if (options.project) {
        const projects = await clockifyAPI.getProjects(workspaceId);
        const project = projects.find(p => 
          p.name.toLowerCase().includes(options.project.toLowerCase()) ||
          p.id === options.project
        );
        
        if (project) {
          timeEntry.projectId = project.id;
          console.log(chalk.gray(`📁 Project: ${project.name}`));
        } else {
          console.log(chalk.yellow(`⚠️  Project "${options.project}" not found. Adding without project.`));
        }
      }

      // Create the time entry
      const entry = await clockifyAPI.createTimeEntry(workspaceId, timeEntry);
      
      console.log(chalk.green('✅ Time entry added successfully!'));
      console.log(chalk.gray('━'.repeat(50)));
      if (entry.project?.name) {
        console.log(chalk.bold('Project:'), chalk.white(entry.project.name));
      }
      console.log(chalk.bold('Description:'), chalk.white(entry.description || 'No description'));
      console.log(chalk.bold('Start:'), chalk.white(new Date(entry.timeInterval.start).toLocaleString()));
      console.log(chalk.bold('End:'), chalk.white(new Date(entry.timeInterval.end!).toLocaleString()));
      console.log(chalk.bold('Duration:'), chalk.white(formatDuration(durationMinutes)));
      console.log(chalk.bold('Billable:'), entry.billable ? chalk.green('Yes') : chalk.gray('No'));
      console.log(chalk.gray('━'.repeat(50)));

    } catch (error) {
      console.log(chalk.red(`❌ Failed to add time entry: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  },

  async edit(entryId: string, options: any): Promise<void> {
    console.log(chalk.yellow(`✏️  Edit functionality coming soon!`));
    console.log(chalk.gray('Entry ID:'), entryId);
    console.log(chalk.gray('💡 This feature will allow editing existing time entries'));
  },

  async delete(entryId: string, options: any): Promise<void> {
    console.log(chalk.yellow(`🗑️  Delete functionality coming soon!`));
    console.log(chalk.gray('Entry ID:'), entryId);
    console.log(chalk.gray('💡 This feature will allow deleting time entries'));
  }
}; 