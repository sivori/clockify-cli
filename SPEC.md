# Clockify CLI - Time Tracking Application Specification

## Overview

A command-line interface (CLI) application for tracking time using the Clockify API. This tool enables developers and professionals to manage their time tracking workflow directly from the terminal without switching to the web interface.

## API Foundation

Based on **Clockify REST API** documentation from [docs.clockify.me](https://docs.clockify.me):
- **Authentication**: API Key via `X-Api-Key` header
- **Base URL**: `https://api.clockify.me/api/v1`
- **Data Format**: JSON
- **Rate Limiting**: 50 entries per request (pagination), recommended delays between requests
- **Webhooks**: Available for real-time event notifications

## Core Features

### 1. Authentication & Setup
- **Initial Setup**: Store API key securely in config file
- **Workspace Selection**: Auto-detect or manually select workspace
- **Configuration Management**: Manage settings and preferences

### 2. Time Tracking Operations
- **Start Timer**: Begin tracking time with project/task/description
- **Stop Timer**: End current time session
- **Current Status**: Display active timer status
- **Manual Entry**: Add time entries with specific start/end times
- **Edit Entries**: Modify existing time entries
- **Delete Entries**: Remove time entries

### 3. Project & Task Management
- **List Projects**: View available projects in workspace
- **List Tasks**: View tasks for a specific project
- **Create Projects**: Add new projects (if permissions allow)
- **Create Tasks**: Add new tasks to projects

### 4. Reporting & Analytics
- **Time Reports**: Generate daily, weekly, monthly summaries
- **Project Reports**: Time breakdown by project
- **Export Data**: Export time data in various formats (CSV, JSON)
- **Quick Stats**: Show today's tracked time, weekly totals

### 5. Workspace Management
- **Switch Workspaces**: Change between available workspaces
- **List Clients**: View clients in current workspace
- **User Information**: Display current user details

## CLI Interface Design

### Command Structure
```bash
clockify [command] [subcommand] [options]
```

### Core Commands

#### Authentication
```bash
clockify auth login              # Configure API key
clockify auth logout             # Remove stored credentials
clockify auth status             # Show current authentication status
```

#### Time Tracking
```bash
clockify start [project] [task]  # Start tracking time
clockify stop                    # Stop current timer
clockify status                  # Show current timer status
clockify add <duration>          # Add manual time entry
clockify edit <entry-id>         # Edit time entry
clockify delete <entry-id>       # Delete time entry
```

#### Projects & Tasks
```bash
clockify projects list           # List all projects
clockify projects create <name>  # Create new project
clockify tasks list <project>    # List tasks for project
clockify tasks create <name>     # Create new task
```

#### Reports
```bash
clockify report today           # Today's time summary
clockify report week            # This week's summary
clockify report month           # This month's summary
clockify report project <name>  # Project-specific report
clockify export <format>        # Export data (csv, json)
```

#### Configuration
```bash
clockify config show           # Display current configuration
clockify config set <key=value> # Set configuration option
clockify workspace list        # List available workspaces
clockify workspace switch <id> # Switch to different workspace
```

### Common Options
```bash
--project, -p    # Specify project
--task, -t       # Specify task
--description, -d # Add description
--billable, -b   # Mark as billable
--start-time, -s # Set specific start time
--end-time, -e   # Set specific end time
--format, -f     # Output format (table, json, csv)
--verbose, -v    # Verbose output
--help, -h       # Show help
```

## Technical Implementation

### Technology Stack
- **Language**: Node.js 16+ with TypeScript
- **CLI Framework**: Commander.js (see comparison below)
- **HTTP Client**: axios with retry logic
- **Configuration**: conf package with encryption
- **Data Storage**: better-sqlite3 for caching
- **Package Management**: npm with package-lock.json
- **Security**: keytar for credential storage, input validation

### Architecture

#### Core Modules
```
src/
├── cli.ts                    # Main CLI entry point
├── commands/                 # Command implementations
│   ├── auth.ts              # Authentication commands
│   ├── timer.ts             # Time tracking operations
│   ├── projects.ts          # Project and task management
│   ├── reports.ts           # Reporting and analytics
│   └── config.ts            # Configuration commands
├── lib/
│   ├── api.ts               # Clockify API client wrapper
│   ├── config.ts            # Configuration management
│   ├── database.ts          # SQLite operations
│   ├── security.ts          # Security utilities
│   └── utils.ts             # Helper functions
├── types/
│   └── clockify.d.ts        # TypeScript definitions
└── __tests__/               # Test files
    ├── unit/
    ├── integration/
    └── __mocks__/
```

#### Data Models (TypeScript)
```typescript
interface TimeEntry {
  id: string;
  description: string;
  start: Date;
  end?: Date;
  project?: Project;
  task?: Task;
  billable: boolean;
}

interface Project {
  id: string;
  name: string;
  client?: Client;
  color: string;
  archived: boolean;
}

interface Workspace {
  id: string;
  name: string;
  hourlyRate?: number;
  memberships: WorkspaceMembership[];
}

interface ClockifyConfig {
  apiKey?: string;
  workspaceId?: string;
  defaultProject?: string;
  timeFormat: '12h' | '24h';
  billableByDefault: boolean;
}
```

### Configuration & Dependencies

#### Package.json
```json
{
  "name": "clockify-cli",
  "version": "1.0.0",
  "description": "Command-line time tracking with Clockify API",
  "bin": {
    "clockify": "./dist/cli.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/cli.js",
    "dev": "ts-node src/cli.ts",
    "test": "jest",
    "lint": "eslint src/**/*.ts",
    "security": "npm audit && snyk test"
  },
  "dependencies": {
    "commander": "^11.0.0",
    "inquirer": "^9.2.0",
    "axios": "^1.5.0",
    "chalk": "^5.3.0",
    "conf": "^11.0.2",
    "keytar": "^7.9.0",
    "better-sqlite3": "^8.7.0",
    "date-fns": "^2.30.0",
    "ora": "^7.0.1",
    "table": "^6.8.1"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-node": "^10.9.0",
    "eslint": "^8.50.0",
    "snyk": "^1.1200.0"
  }
}
```

#### Configuration Storage
```typescript
// Uses 'conf' package with encryption for sensitive data
const config = new Conf({
  projectName: 'clockify-cli',
  schema: {
    workspaceId: { type: 'string' },
    defaultProject: { type: 'string' },
    timeFormat: { type: 'string', enum: ['12h', '24h'], default: '24h' },
    billableByDefault: { type: 'boolean', default: false }
  },
  encryptionKey: 'user-specific-key' // API key stored separately in keytar
});
```

### Local Cache/Database
- **SQLite database** for offline capabilities
- **Cache recent projects/tasks** for quick access
- **Store incomplete time entries** for recovery
- **Sync with API** when online

## User Experience Features

### Interactive Mode
- **Smart Autocomplete**: Project and task name completion
- **Fuzzy Search**: Find projects/tasks with partial names
- **Interactive Prompts**: Guide users through complex operations

### Productivity Features
- **Quick Start**: Remember last used project/task
- **Time Templates**: Save common time entry patterns
- **Notifications**: Desktop notifications for long-running timers
- **Integration**: Shell aliases and shortcuts

### Error Handling
- **Graceful Degradation**: Work offline when possible
- **Clear Error Messages**: User-friendly error descriptions
- **Recovery Options**: Suggest solutions for common problems
- **Retry Logic**: Automatic retry for transient failures

## CLI Framework Comparison

### Commander.js vs Click/Typer vs Oclif

| Feature | Commander.js (Node) | Click (Python) | Oclif (Node) |
|---------|-------------------|----------------|-------------|
| **Performance** | ⭐⭐⭐⭐⭐ Fast startup | ⭐⭐⭐ Moderate | ⭐⭐⭐⭐ Fast |
| **Type Safety** | ⭐⭐⭐⭐⭐ Full TypeScript | ⭐⭐⭐ Limited | ⭐⭐⭐⭐⭐ Excellent |
| **Auto-completion** | ⭐⭐⭐ Basic | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent |
| **Plugin System** | ⭐⭐ Limited | ⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Built-in |
| **Learning Curve** | ⭐⭐⭐⭐⭐ Simple | ⭐⭐⭐⭐ Easy | ⭐⭐⭐ Complex |
| **Community** | ⭐⭐⭐⭐⭐ Huge | ⭐⭐⭐⭐ Strong | ⭐⭐⭐ Growing |

**Decision: Commander.js** - Best balance of simplicity, performance, and TypeScript support for our use case.

## Security Considerations (Public Project)

### 🔐 Credential Security
- **keytar Integration**: Store API keys in OS credential manager (Keychain/Windows Credential Store)
- **No Hardcoded Secrets**: Zero secrets in source code
- **Environment Variables**: Support `CLOCKIFY_API_KEY` for CI/CD
- **Config Encryption**: Encrypt sensitive config data at rest
- **Session Management**: Secure token refresh and invalidation

### 🛡️ Input Validation & Sanitization
```typescript
// Example security validation
import Joi from 'joi';

const apiKeySchema = Joi.string()
  .pattern(/^[a-zA-Z0-9]{40,}$/)
  .required();

const projectNameSchema = Joi.string()
  .min(1)
  .max(255)
  .pattern(/^[^<>\"'&]*$/) // Prevent XSS-like attacks
  .required();
```

### 🔒 Dependency Security
- **npm audit**: Automated vulnerability scanning
- **Snyk integration**: Advanced security monitoring
- **Package pinning**: Lock dependency versions
- **SPDX License checking**: Ensure compatible licenses
- **Supply chain protection**: Verify package integrity

### 📡 Network Security
- **Certificate pinning**: Verify Clockify API certificates
- **Request timeout**: Prevent hanging connections
- **Rate limiting**: Respect API limits, prevent abuse
- **User-Agent**: Identify requests properly
- **Proxy support**: Corporate firewall compatibility

### 🔍 Data Privacy
- **Minimal data collection**: Only store necessary data
- **Local-first**: Keep sensitive data local when possible
- **Clear data policy**: Document what data is stored where
- **Data retention**: Configurable local cache expiry
- **Secure deletion**: Properly clear sensitive data

### 🚨 Security Disclosure
```typescript
// Built-in security reporting
{
  "security": {
    "policy": "https://github.com/user/clockify-cli/security/policy",
    "contacts": ["security@your-domain.com"],
    "disclosure": "coordinated",
    "advisory-db": true
  }
}
```

### 🔐 Code Security Practices
- **TypeScript strict mode**: Catch type-related vulnerabilities
- **ESLint security rules**: Automated security linting
- **Input sanitization**: All user inputs validated
- **Path traversal protection**: Secure file operations
- **Command injection prevention**: Safe subprocess execution

### 🛠️ Development Security
- **Pre-commit hooks**: Security checks before commits
- **Dependency scanning**: Automated in CI/CD
- **Code signing**: Sign releases for integrity
- **Reproducible builds**: Consistent build environment
- **SBOM generation**: Software Bill of Materials

## Testing Strategy

### Unit Tests
- **API Client**: Mock API responses
- **Time Calculations**: Validate duration logic
- **Configuration**: Test config file handling

### Integration Tests
- **Live API**: Test against Clockify sandbox (if available)
- **End-to-End**: Full workflow testing
- **CLI Interface**: Command parsing and output

### Performance Tests
- **API Rate Limits**: Respect and handle rate limiting
- **Large Datasets**: Handle workspaces with many projects
- **Offline Mode**: Test local database performance

## Installation & Distribution

### Package Distribution
- **PyPI**: Installable via `pip install clockify-cli`
- **GitHub Releases**: Pre-built binaries for major platforms
- **Homebrew**: Formula for macOS users
- **Docker**: Containerized version for consistent environments

### System Requirements
- **Python**: 3.8 or higher
- **Operating Systems**: Windows, macOS, Linux
- **Dependencies**: Minimal external dependencies
- **Storage**: ~10MB for application + cache

## Future Enhancements

### Advanced Features
- **Team Management**: Multi-user workspace support
- **Advanced Reporting**: Custom report templates
- **Integrations**: Git hooks, calendar sync
- **Mobile Sync**: Sync with mobile app timers

### Productivity Integrations
- **IDE Plugins**: VS Code, JetBrains extensions
- **Shell Integration**: Zsh/Bash completion scripts
- **Status Bar**: Terminal status bar integration
- **Pomodoro Timer**: Built-in productivity techniques

## Success Metrics

### User Adoption
- **Installation Rate**: PyPI download statistics
- **User Retention**: Repeat usage tracking
- **Feature Usage**: Most/least used commands
- **Error Rates**: API failure and user error frequency

### Performance
- **Response Time**: API call latency
- **Offline Capability**: Successful offline operations
- **Sync Reliability**: Data consistency between local and remote
- **Resource Usage**: Memory and CPU efficiency

---

## Questions for Clarification

1. **Target Users**: Are we focusing on individual developers, teams, or both?

2. **Offline Capabilities**: How important is offline functionality vs. always-connected usage?

3. **Integration Priorities**: Which integrations (Git, IDEs, calendar) are most valuable?

4. **Reporting Complexity**: Do we need advanced analytics or simple time summaries?

5. **Multi-workspace Support**: How important is switching between multiple Clockify workspaces?

6. **Collaboration Features**: Should the CLI support team-specific features like approvals?

7. **Data Export**: What export formats and destinations are most important?

8. **Notification Preferences**: Desktop notifications, email summaries, or minimal interruption?

9. **Configuration Complexity**: Simple config file vs. comprehensive settings management?

10. **Deployment Environment**: Will this be used in CI/CD pipelines or only interactive sessions? 