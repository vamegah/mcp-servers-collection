# MCP Server for Obsidian

A Model Context Protocol (MCP) server that bridges AI assistants with Obsidian vaults, enabling intelligent knowledge management through natural language interactions.

## Features

### Resources (Read-only)
- **obsidian://search** - Search through vault notes with query parameters
- **obsidian://tags** - List all tags used in the vault
- **obsidian://graph** - Explore note connections and backlinks
- **obsidian://dataview** - Execute and view Dataview query results ⚡
- **obsidian://canvas** - Browse Canvas files and their structure ⚡

### Tools (Actions)
- **create_note** - Create notes with frontmatter and tags
- **append_to_note** - Add content to existing notes
- **link_notes** - Create bidirectional wiki-links between notes
- **get_backlinks** - Find all notes linking to a specific note
- **update_frontmatter** - Modify YAML metadata
- **get_daily_note** - Access or create daily notes
- **query_dataview** - Execute Dataview queries (TABLE, LIST, TASK) ⚡
- **create_canvas_node** - Add nodes to Obsidian Canvas ⚡
- **connect_canvas_nodes** - Link Canvas nodes with relationships ⚡

## Installation

```bash
cd mcp-server-obsidian
npm install
```

## Configuration

Set your Obsidian vault path:
```bash
export OBSIDIAN_VAULT_PATH="/path/to/your/vault"
```

Add to your MCP client configuration:
```json
{
  "mcpServers": {
    "obsidian": {
      "command": "node",
      "args": ["./src/index.js"],
      "env": {
        "OBSIDIAN_VAULT_PATH": "/path/to/your/vault"
      }
    }
  }
}
```

## Example Interactions

### Knowledge Management
- "Create a meeting note for Acme Corp, tag it with #meeting and #acme"
- "Find all notes from last week mentioning 'project Phoenix'"
- "Link my new research note to the existing 'Literature Review'"

### Dataview Queries (New!)
- "Show me a table of all my projects with their status and due dates"
- "List all meeting notes from this month"
- "Find all incomplete tasks across my vault"
- "Create a dashboard of my research papers by citation count"

### Canvas Integration (New!)
- "Create a canvas for my AI research project with key paper nodes"
- "Map out our project workflow visually with connected phases"
- "Build a concept map linking related ideas from my notes"

### Daily Workflow
- "Add today's action items to my daily note"
- "Show me all notes that reference my 'Goals 2024' note"
- "Create a project template with status tracking"

### Graph Navigation
- "What notes are most connected to my 'Machine Learning' note?"
- "Find orphaned notes that aren't linked to anything"
- "Show me the backlink structure for my research notes"