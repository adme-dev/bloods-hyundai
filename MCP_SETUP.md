# Neon MCP Server Setup

This project is configured to use the Neon MCP Server for natural language database interactions with your Neon Postgres database.

## Project Information
- **Neon Project ID**: `green-tooth-34908352`
- **Console URL**: https://console.neon.tech/app/projects/green-tooth-34908352

## Setup Options

You have two options for connecting to your Neon database via MCP:

### Option 1: Remote MCP Server (Recommended - Preview)

The easiest setup using OAuth authentication. No local installation or API key needed.

#### For Cursor IDE:

1. Open Cursor Settings
2. Navigate to the MCP section
3. Add the following configuration to your `mcp.json`:

```json
{
  "mcpServers": {
    "Neon": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.neon.tech/mcp"]
    }
  }
}
```

4. Restart Cursor
5. An OAuth window will open - authorize access to your Neon account

#### For Other MCP Clients:

Add this to your client's MCP configuration file:

```json
{
  "mcpServers": {
    "Neon": {
      "url": "https://mcp.neon.tech/mcp",
      "headers": {
        "Authorization": "Bearer <YOUR_NEON_API_KEY>"
      }
    }
  }
}
```

**Read-Only Mode** (prevents accidental modifications):
```json
{
  "mcpServers": {
    "Neon": {
      "url": "https://mcp.neon.tech/mcp",
      "headers": {
        "Authorization": "Bearer <YOUR_NEON_API_KEY>",
        "x-read-only": "true"
      }
    }
  }
}
```

### Option 2: Local MCP Server

Run the MCP server locally with your Neon API key.

#### Prerequisites:
- Node.js >= v18.0.0
- npm
- Neon API Key (get from https://console.neon.tech/app/settings/api-keys)

#### Configuration:

1. Get your Neon API key from: https://console.neon.tech/app/settings/api-keys

2. Add to your MCP client's configuration:

**For Cursor IDE** (`mcp.json`):
```json
{
  "mcpServers": {
    "neon-green-tooth": {
      "command": "npx",
      "args": [
        "-y",
        "@neondatabase/mcp-server-neon",
        "start",
        "<YOUR_NEON_API_KEY>"
      ],
      "env": {
        "NEON_PROJECT_ID": "green-tooth-34908352"
      }
    }
  }
}
```

**For Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):
```json
{
  "mcpServers": {
    "neon-green-tooth": {
      "command": "npx",
      "args": [
        "-y",
        "@neondatabase/mcp-server-neon",
        "start",
        "<YOUR_NEON_API_KEY>"
      ],
      "env": {
        "NEON_PROJECT_ID": "green-tooth-34908352"
      }
    }
  }
}
```

3. Replace `<YOUR_NEON_API_KEY>` with your actual API key

4. Restart your MCP client

#### Windows Users:

If you encounter issues on Windows, use one of these configurations:

**Command Prompt:**
```json
{
  "mcpServers": {
    "neon-green-tooth": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@neondatabase/mcp-server-neon",
        "start",
        "<YOUR_NEON_API_KEY>"
      ],
      "env": {
        "NEON_PROJECT_ID": "green-tooth-34908352"
      }
    }
  }
}
```

**WSL:**
```json
{
  "mcpServers": {
    "neon-green-tooth": {
      "command": "wsl",
      "args": [
        "npx",
        "-y",
        "@neondatabase/mcp-server-neon",
        "start",
        "<YOUR_NEON_API_KEY>"
      ],
      "env": {
        "NEON_PROJECT_ID": "green-tooth-34908352"
      }
    }
  }
}
```

## Usage Examples

Once configured, you can use natural language to interact with your database:

### Project Management
- "List all my Neon projects"
- "Describe the green-tooth-34908352 project"
- "Create a new branch called 'dev' in my project"

### Database Operations
- "Show me all tables in the database"
- "Create a table called 'users' with columns: id, name, email, created_at"
- "Run a query to get all records from the users table"
- "What's the schema of the users table?"

### Migrations
- "Prepare a migration to add a 'last_login' column to the users table"
- "Run a migration to alter the products table"

### Performance
- "Show me the slowest queries in my database"
- "Explain the execution plan for: SELECT * FROM users WHERE email = 'test@example.com'"
- "Suggest optimizations for my slow queries"

## Available MCP Tools

The Neon MCP server provides these capabilities:

**Project Management:**
- `list_projects` - List all your Neon projects
- `describe_project` - Get detailed project information
- `create_project` - Create a new project
- `delete_project` - Delete a project

**Branch Management:**
- `create_branch` - Create a new branch
- `delete_branch` - Delete a branch
- `describe_branch` - Get branch details
- `compare_database_schema` - Compare schemas between branches
- `reset_from_parent` - Reset branch to parent state

**SQL Operations:**
- `get_connection_string` - Get database connection string
- `run_sql` - Execute SQL queries
- `run_sql_transaction` - Execute transaction
- `get_database_tables` - List all tables
- `describe_table_schema` - Get table schema

**Migrations:**
- `prepare_database_migration` - Start a migration (creates temp branch)
- `complete_database_migration` - Apply migration to main branch

**Performance:**
- `list_slow_queries` - Find slow queries
- `explain_sql_statement` - Get query execution plan
- `prepare_query_tuning` - Analyze and optimize queries
- `complete_query_tuning` - Apply query optimizations

**Search:**
- `search` - Search across projects and branches
- `fetch` - Get detailed information by ID

## Security Considerations

⚠️ **Important Security Notes:**

1. **Review Before Execution**: Always review and authorize actions requested by the LLM before execution
2. **Local Development Only**: The Neon MCP Server is intended for local development and IDE integrations only
3. **Not for Production**: Do not use in production environments
4. **Authorized Access**: Ensure only authorized users have access
5. **API Key Security**: Keep your Neon API key secure and never commit it to version control

## Troubleshooting

### MCP Server Not Found
- Ensure Node.js >= v18.0.0 is installed
- Try running `npx -y @neondatabase/mcp-server-neon` manually to verify installation

### Authentication Issues
- Verify your Neon API key is correct
- Check that the API key has appropriate permissions
- For OAuth: ensure you've authorized the application

### Connection Issues
- Verify your project ID is correct: `green-tooth-34908352`
- Check your internet connection
- Ensure the Neon service is accessible

## Resources

- [Neon MCP Server GitHub](https://github.com/neondatabase/mcp-server-neon)
- [Neon Console](https://console.neon.tech/app/projects/green-tooth-34908352)
- [Neon API Keys](https://console.neon.tech/app/settings/api-keys)
- [MCP Documentation](https://modelcontextprotocol.io/)
- [Neon Documentation](https://neon.tech/docs)
