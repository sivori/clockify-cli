import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { configManager } from './simple-config';
import { isValidApiKey, sleep } from './utils';
import { User, Workspace, Project, TimeEntry, TimeEntryRequest, ProjectRequest, ApiError } from '../types/clockify';

class ClockifyAPI {
  private client: AxiosInstance;
  private readonly baseURL = 'https://api.clockify.me/api/v1';
  private readonly timeout = 10000; // 10 seconds
  private lastRequestTime = 0;
  private readonly minRequestInterval = 100; // 100ms between requests

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'clockify-cli/1.0.0'
      }
    });

    // Add request interceptor for authentication and rate limiting
    this.client.interceptors.request.use(async (config) => {
      // Rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.minRequestInterval) {
        await sleep(this.minRequestInterval - timeSinceLastRequest);
      }
      this.lastRequestTime = Date.now();
      
      // Authentication
      const apiKey = await configManager.getApiKey();
      if (apiKey) {
        if (!isValidApiKey(apiKey)) {
          throw new Error('Invalid API key format detected');
        }
        config.headers['X-Api-Key'] = apiKey;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Log error for debugging but don't expose details to user
        if (process.env.NODE_ENV === 'development') {
          console.error('API Error:', error.response?.data);
        }
        
        if (error.response?.status === 401) {
          throw new Error('Authentication failed. Please check your API key.');
        }
        if (error.response?.status === 403) {
          throw new Error('Access denied. Check your permissions.');
        }
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (error.response?.status === 404) {
          throw new Error('Resource not found.');
        }
        if (error.response?.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        
        // Only show safe error messages, never expose internal details
        throw new Error('Request failed. Please check your connection and try again.');
      }
    );
  }

  /**
   * Test API key validity by fetching user info
   */
  async testConnection(): Promise<User> {
    try {
      const response = await this.client.get<User>('/user');
      return response.data;
    } catch (error) {
      throw new Error(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/user');
    return response.data;
  }

  /**
   * Get user's workspaces
   */
  async getWorkspaces(): Promise<Workspace[]> {
    const response = await this.client.get<Workspace[]>('/workspaces');
    return response.data;
  }

  /**
   * Get projects for a workspace
   */
  async getProjects(workspaceId: string): Promise<Project[]> {
    const response = await this.client.get<Project[]>(`/workspaces/${workspaceId}/projects`);
    return response.data;
  }

  /**
   * Create a new project
   */
  async createProject(workspaceId: string, projectData: ProjectRequest): Promise<Project> {
    const response = await this.client.post<Project>(
      `/workspaces/${workspaceId}/projects`,
      projectData
    );
    return response.data;
  }

  /**
   * Get time entries for current user
   */
  async getTimeEntries(workspaceId: string, userId: string): Promise<TimeEntry[]> {
    const response = await this.client.get<TimeEntry[]>(
      `/workspaces/${workspaceId}/user/${userId}/time-entries`
    );
    return response.data;
  }

  /**
   * Start time tracking
   */
  async startTimer(workspaceId: string, timeEntry: TimeEntryRequest): Promise<TimeEntry> {
    // Add current timestamp as start time
    const entryWithStart = {
      ...timeEntry,
      start: new Date().toISOString()
    };

    const response = await this.client.post<TimeEntry>(
      `/workspaces/${workspaceId}/time-entries`,
      entryWithStart
    );
    return response.data;
  }

  /**
   * Stop current timer - Updated to use specific time entry endpoint
   */
  async stopTimer(workspaceId: string, userId: string): Promise<TimeEntry> {
    // First, find the running time entry
    const timeEntries = await this.getTimeEntries(workspaceId, userId);
    const runningEntry = timeEntries.find(entry => !entry.timeInterval.end);
    
    if (!runningEntry) {
      throw new Error('No running timer found');
    }

    // If the entry doesn't have a project but workspace requires it, get a default project
    let projectId = runningEntry.projectId;
    if (!projectId) {
      try {
        const projects = await this.getProjects(workspaceId);
        if (projects.length > 0 && projects[0]) {
          projectId = projects[0].id; // Use first available project as default
        }
      } catch (error) {
        // If we can't get projects, try without project and let API handle the error
      }
    }

    // Update the specific time entry with an end time using the correct format
    const stopData = {
      start: runningEntry.timeInterval.start,
      end: new Date().toISOString(),
      billable: runningEntry.billable,
      description: runningEntry.description || '',
      projectId: projectId || null,
      taskId: runningEntry.taskId || null,
      tagIds: runningEntry.tagIds || []
    };

    const response = await this.client.put<TimeEntry>(
      `/workspaces/${workspaceId}/time-entries/${runningEntry.id}`,
      stopData
    );
    return response.data;
  }

  /**
   * Create a manual time entry
   */
  async createTimeEntry(workspaceId: string, timeEntry: TimeEntryRequest): Promise<TimeEntry> {
    const response = await this.client.post<TimeEntry>(
      `/workspaces/${workspaceId}/time-entries`,
      timeEntry
    );
    return response.data;
  }

  /**
   * Update a time entry
   */
  async updateTimeEntry(workspaceId: string, timeEntryId: string, updates: Partial<TimeEntryRequest>): Promise<TimeEntry> {
    const response = await this.client.put<TimeEntry>(
      `/workspaces/${workspaceId}/time-entries/${timeEntryId}`,
      updates
    );
    return response.data;
  }

  /**
   * Delete a time entry
   */
  async deleteTimeEntry(workspaceId: string, timeEntryId: string): Promise<void> {
    await this.client.delete(`/workspaces/${workspaceId}/time-entries/${timeEntryId}`);
  }
}

export const clockifyAPI = new ClockifyAPI(); 