# Obsidian MCP Server Usage Guide

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set vault path:
```bash
export OBSIDIAN_VAULT_PATH="/Users/me/My-Obsidian-Vault"
```

3. Test the server:
```bash
npm start
```

## MCP Client Configuration

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "node",
      "args": ["/path/to/mcp-server-obsidian/src/index.js"],
      "env": {
        "OBSIDIAN_VAULT_PATH": "/Users/me/My-Obsidian-Vault"
      }
    }
  }
}
```

## Example User Flows

### 1. Meeting Notes & Project Management

**User:** "I just had a meeting with Acme Corp about the Q2 project. Create a note for it, tag it with #meeting and #acme, and link it to my existing 'Q2 Planning' note."

**AI Actions:**
- Uses `create_note` with title "Meeting with Acme Corp 2024-03-15"
- Adds tags: ["meeting", "acme"] in frontmatter
- Uses `link_notes` to connect to "Q2 Planning.md"

### 2. Research & Knowledge Discovery

**User:** "Find the last three ideas I had about renewable energy and show me what notes link to them."

**AI Actions:**
- Uses `obsidian://search?query=renewable energy #idea` resource
- For each result, uses `get_backlinks` tool
- Presents organized findings with connection patterns

### 3. Daily Workflow Integration

**User:** "Add today's action items from my meeting notes to my daily note."

**AI Actions:**
- Uses `get_daily_note` to access today's note
- Searches meeting notes from today
- Uses `append_to_note` to add extracted action items

### 4. Knowledge Graph Navigation

**User:** "What are the most connected notes in my vault? Show me the knowledge clusters."

**AI Actions:**
- Uses `obsidian://graph` resource for multiple notes
- Analyzes connection patterns
- Identifies highly connected "hub" notes

## Available Resources

### obsidian://search?query={query}
Search through all vault notes. Supports Obsidian search syntax:
- `tag:#meeting` - Notes with meeting tag
- `"exact phrase"` - Exact phrase matching
- `path:Projects/` - Notes in specific folder

### obsidian://tags
Returns all tags used in the vault, from both frontmatter and inline #tags.

### obsidian://graph?note={note_path}
Returns connection data for a specific note, showing all incoming and outgoing links.

## Available Tools

### create_note
```json
{
  "title": "Meeting Notes 2024-03-15",
  "content": "## Agenda\n- Project timeline\n- Budget review",
  "tags": ["meeting", "project"],
  "properties": {
    "status": "active",
    "priority": "high"
  }
}
```

### append_to_note
```json
{
  "note_path": "Daily Notes/2024-03-15.md",
  "content": "\n## Action Items\n- [ ] Follow up with client\n- [ ] Update project timeline"
}
```

### link_notes
```json
{
  "from_note": "Meeting Notes 2024-03-15.md",
  "to_note": "Projects/Q2 Planning.md",
  "link_text": "Q2 Project Planning"
}
```

### update_frontmatter
```json
{
  "note_path": "Projects/Website Redesign.md",
  "properties": {
    "status": "completed",
    "completion_date": "2024-03-15"
  }
}
```

## Advanced Use Cases

### Template-Based Note Creation
The server can create notes with consistent structure:
- Meeting notes with agenda/action items sections
- Project notes with status tracking
- Daily notes with reflection prompts

### Intelligent Linking
When creating notes, the AI can:
- Suggest related existing notes to link
- Automatically create bidirectional connections
- Maintain knowledge graph integrity

### Content Analysis
The server enables the AI to:
- Identify orphaned notes (no incoming links)
- Find over-connected hub notes
- Suggest content organization improvements

### Workflow Automation
Common patterns the AI can handle:
- Weekly review note generation from daily notes
- Project status updates across multiple notes
- Tag-based content organization and cleanup