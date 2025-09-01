#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import fm from 'front-matter';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load configuration
let config;
try {
  const configPath = path.join(__dirname, '..', '..', 'config.json');
  const configData = await fs.readFile(configPath, 'utf-8');
  config = JSON.parse(configData);
} catch (error) {
  config = {
    server: { max_retries: 3, timeout_ms: 15000 },
    vault: { max_file_size_mb: 50 },
    dataview: { max_results: 1000 },
    canvas: { max_nodes_per_canvas: 500 }
  };
}

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || process.cwd();

class MCPError extends Error {
  constructor(message, code, details = null, suggestions = null) {
    super(message);
    this.name = 'MCPError';
    this.code = code;
    this.details = details;
    this.suggestions = suggestions;
  }

  toResponse() {
    let response = `Error ${this.code}: ${this.message}`;
    if (this.details) response += `\nDetails: ${this.details}`;
    if (this.suggestions) response += `\nSuggestion: ${this.suggestions}`;
    return response;
  }
}

// Validate vault path
try {
  await fs.access(VAULT_PATH);
} catch (error) {
  console.error(`Vault path not accessible: ${VAULT_PATH}`);
  throw new MCPError(
    'Obsidian vault not found',
    'E201',
    VAULT_PATH,
    'Set OBSIDIAN_VAULT_PATH environment variable to your vault directory'
  );
}

class ObsidianMCPServer {
  constructor() {
    this.server = new Server(
      { name: 'mcp-server-obsidian', version: '0.1.0' },
      { capabilities: { resources: {}, tools: {} } }
    );
    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'obsidian://search',
          name: 'Search Notes',
          description: 'Search through vault notes',
          mimeType: 'application/json'
        },
        {
          uri: 'obsidian://tags',
          name: 'All Tags',
          description: 'List all tags in vault',
          mimeType: 'application/json'
        },
        {
          uri: 'obsidian://graph',
          name: 'Graph Connections',
          description: 'Note connections and backlinks',
          mimeType: 'application/json'
        },
        {
          uri: 'obsidian://dataview',
          name: 'Dataview Query Results',
          description: 'Execute and view Dataview queries',
          mimeType: 'application/json'
        },
        {
          uri: 'obsidian://canvas',
          name: 'Canvas Information',
          description: 'Browse Canvas files and their contents',
          mimeType: 'application/json'
        }
      ]
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const url = new URL(request.params.uri);
      
      if (url.protocol === 'obsidian:') {
        switch (url.hostname) {
          case 'search':
            return await this.searchNotes(url.searchParams.get('query') || '');
          case 'tags':
            return await this.getAllTags();
          case 'graph':
            return await this.getGraphConnections(url.searchParams.get('note'));
          case 'dataview':
            const query = url.searchParams.get('query') || 'LIST';
            return await this.queryDataview({ query });
          case 'canvas':
            return await this.getCanvasInfo({});
        }
      }
      
      throw new Error(`Unknown resource: ${request.params.uri}`);
    });

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'create_note',
          description: 'Create a new note with optional frontmatter',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Note title' },
              content: { type: 'string', description: 'Note content' },
              tags: { type: 'array', items: { type: 'string' }, description: 'Tags to add' },
              properties: { type: 'object', description: 'Additional frontmatter properties' }
            },
            required: ['title']
          }
        },
        {
          name: 'append_to_note',
          description: 'Append content to an existing note',
          inputSchema: {
            type: 'object',
            properties: {
              note_path: { type: 'string', description: 'Path to note file' },
              content: { type: 'string', description: 'Content to append' }
            },
            required: ['note_path', 'content']
          }
        },
        {
          name: 'link_notes',
          description: 'Create bidirectional links between notes',
          inputSchema: {
            type: 'object',
            properties: {
              from_note: { type: 'string', description: 'Source note path' },
              to_note: { type: 'string', description: 'Target note path' },
              link_text: { type: 'string', description: 'Optional link text' }
            },
            required: ['from_note', 'to_note']
          }
        },
        {
          name: 'get_backlinks',
          description: 'Get all notes that link to a given note',
          inputSchema: {
            type: 'object',
            properties: {
              note_path: { type: 'string', description: 'Path to note file' }
            },
            required: ['note_path']
          }
        },
        {
          name: 'update_frontmatter',
          description: 'Update YAML frontmatter of a note',
          inputSchema: {
            type: 'object',
            properties: {
              note_path: { type: 'string', description: 'Path to note file' },
              properties: { type: 'object', description: 'Properties to update' }
            },
            required: ['note_path', 'properties']
          }
        },
        {
          name: 'get_daily_note',
          description: 'Get or create today\'s daily note',
          inputSchema: {
            type: 'object',
            properties: {
              date: { type: 'string', description: 'Date in YYYY-MM-DD format (defaults to today)' }
            }
          }
        },
        {
          name: 'query_dataview',
          description: 'Execute Dataview queries on vault notes',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Dataview query (TABLE, LIST, TASK format)' },
              source: { type: 'string', description: 'Source filter (folder, tag, etc.)', default: '""' }
            },
            required: ['query']
          }
        },
        {
          name: 'create_canvas_node',
          description: 'Add a node to an Obsidian Canvas',
          inputSchema: {
            type: 'object',
            properties: {
              canvas_path: { type: 'string', description: 'Path to canvas file' },
              node_type: { type: 'string', enum: ['text', 'file', 'link'], description: 'Type of node' },
              content: { type: 'string', description: 'Node content or file path' },
              x: { type: 'number', description: 'X position', default: 0 },
              y: { type: 'number', description: 'Y position', default: 0 },
              width: { type: 'number', description: 'Node width', default: 250 },
              height: { type: 'number', description: 'Node height', default: 60 }
            },
            required: ['canvas_path', 'node_type', 'content']
          }
        },
        {
          name: 'connect_canvas_nodes',
          description: 'Connect two nodes in a Canvas',
          inputSchema: {
            type: 'object',
            properties: {
              canvas_path: { type: 'string', description: 'Path to canvas file' },
              from_node_id: { type: 'string', description: 'Source node ID' },
              to_node_id: { type: 'string', description: 'Target node ID' },
              label: { type: 'string', description: 'Connection label' }
            },
            required: ['canvas_path', 'from_node_id', 'to_node_id']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'create_note':
          return await this.createNote(args);
        case 'append_to_note':
          return await this.appendToNote(args);
        case 'link_notes':
          return await this.linkNotes(args);
        case 'get_backlinks':
          return await this.getBacklinks(args);
        case 'update_frontmatter':
          return await this.updateFrontmatter(args);
        case 'get_daily_note':
          return await this.getDailyNote(args);
        case 'query_dataview':
          return await this.queryDataview(args);
        case 'create_canvas_node':
          return await this.createCanvasNode(args);
        case 'connect_canvas_nodes':
          return await this.connectCanvasNodes(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async searchNotes(query) {
    try {
      const files = await glob('**/*.md', { cwd: VAULT_PATH });
      const results = [];
      const maxResults = config.search?.max_results || 100;

      for (const file of files.slice(0, maxResults)) {
        try {
          const filePath = path.join(VAULT_PATH, file);
          const stats = await fs.stat(filePath);
          
          // Check file size limit
          if (stats.size > (config.vault.max_file_size_mb * 1024 * 1024)) {
            console.warn(`Skipping large file: ${file}`);
            continue;
          }
          
          const content = await fs.readFile(filePath, 'utf-8');
          if (content.toLowerCase().includes(query.toLowerCase())) {
            const parsed = fm(content);
            results.push({
              path: file,
              title: parsed.attributes.title || path.basename(file, '.md'),
              tags: parsed.attributes.tags || [],
              excerpt: content.substring(0, config.search?.excerpt_length || 200) + '...'
            });
          }
        } catch (fileError) {
          console.warn(`Error reading file ${file}: ${fileError.message}`);
          continue;
        }
      }

      return { contents: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
    } catch (error) {
      throw new MCPError(
        'Search operation failed',
        'E202',
        error.message,
        'Check vault path and file permissions'
      );
    }
  }

  async getAllTags() {
    const files = await glob('**/*.md', { cwd: VAULT_PATH });
    const tags = new Set();

    for (const file of files) {
      const content = await fs.readFile(path.join(VAULT_PATH, file), 'utf-8');
      const parsed = fm(content);
      
      // From frontmatter
      if (parsed.attributes.tags) {
        parsed.attributes.tags.forEach(tag => tags.add(tag));
      }
      
      // From content (#tag)
      const tagMatches = content.match(/#[\w-]+/g) || [];
      tagMatches.forEach(tag => tags.add(tag.substring(1)));
    }

    return { contents: [{ type: 'text', text: JSON.stringify([...tags].sort(), null, 2) }] };
  }

  async getGraphConnections(notePath) {
    if (!notePath) {
      const canvases = await glob('**/*.canvas', { cwd: VAULT_PATH });
      const results = [];
      
      for (const canvas of canvases) {
        try {
          const content = await fs.readFile(path.join(VAULT_PATH, canvas), 'utf-8');
          const data = JSON.parse(content);
          results.push({
            canvas: canvas,
            nodes: data.nodes?.length || 0,
            edges: data.edges?.length || 0
          });
        } catch (e) {
          // Skip invalid files
        }
      }
      
      return { contents: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
    }
    
    const files = await glob('**/*.md', { cwd: VAULT_PATH });
    const connections = [];
    const noteTitle = path.basename(notePath, '.md');

    for (const file of files) {
      const content = await fs.readFile(path.join(VAULT_PATH, file), 'utf-8');
      const linkMatches = content.match(/\[\[([^\]]+)\]\]/g) || [];
      
      for (const match of linkMatches) {
        const linkedNote = match.slice(2, -2);
        if (linkedNote === noteTitle || file === notePath) {
          connections.push({ from: file, to: linkedNote, type: 'wikilink' });
        }
      }
    }

    return { contents: [{ type: 'text', text: JSON.stringify(connections, null, 2) }] };
  }

  async createNote(args) {
    const { title, content = '', tags = [], properties = {} } = args;
    const fileName = `${title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')}.md`;
    const filePath = path.join(VAULT_PATH, fileName);

    let frontmatter = { ...properties };
    if (tags.length > 0) frontmatter.tags = tags;

    let noteContent = '';
    if (Object.keys(frontmatter).length > 0) {
      noteContent += '---\n';
      for (const [key, value] of Object.entries(frontmatter)) {
        noteContent += `${key}: ${Array.isArray(value) ? JSON.stringify(value) : value}\n`;
      }
      noteContent += '---\n\n';
    }
    noteContent += content;

    await fs.writeFile(filePath, noteContent);
    return { content: [{ type: 'text', text: `Created note: ${fileName}` }] };
  }

  async appendToNote(args) {
    const { note_path, content } = args;
    const filePath = path.join(VAULT_PATH, note_path);
    
    const existing = await fs.readFile(filePath, 'utf-8');
    await fs.writeFile(filePath, existing + '\n\n' + content);
    
    return { content: [{ type: 'text', text: `Appended to: ${note_path}` }] };
  }

  async linkNotes(args) {
    const { from_note, to_note, link_text } = args;
    const fromPath = path.join(VAULT_PATH, from_note);
    const toTitle = path.basename(to_note, '.md');
    
    const content = await fs.readFile(fromPath, 'utf-8');
    const linkText = link_text || toTitle;
    const wikiLink = `[[${toTitle}|${linkText}]]`;
    
    await fs.writeFile(fromPath, content + '\n\n' + wikiLink);
    
    return { content: [{ type: 'text', text: `Linked ${from_note} to ${to_note}` }] };
  }

  async getBacklinks(args) {
    const { note_path } = args;
    const noteTitle = path.basename(note_path, '.md');
    const files = await glob('**/*.md', { cwd: VAULT_PATH });
    const backlinks = [];

    for (const file of files) {
      if (file === note_path) continue;
      
      const content = await fs.readFile(path.join(VAULT_PATH, file), 'utf-8');
      if (content.includes(`[[${noteTitle}]]`)) {
        backlinks.push(file);
      }
    }

    return { content: [{ type: 'text', text: JSON.stringify(backlinks, null, 2) }] };
  }

  async updateFrontmatter(args) {
    const { note_path, properties } = args;
    const filePath = path.join(VAULT_PATH, note_path);
    
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = fm(content);
    
    const updatedAttributes = { ...parsed.attributes, ...properties };
    
    let newContent = '---\n';
    for (const [key, value] of Object.entries(updatedAttributes)) {
      newContent += `${key}: ${Array.isArray(value) ? JSON.stringify(value) : value}\n`;
    }
    newContent += '---\n\n' + parsed.body;
    
    await fs.writeFile(filePath, newContent);
    
    return { content: [{ type: 'text', text: `Updated frontmatter for: ${note_path}` }] };
  }

  async getDailyNote(args) {
    const date = args?.date || new Date().toISOString().split('T')[0];
    const fileName = `${date}.md`;
    const filePath = path.join(VAULT_PATH, fileName);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return { content: [{ type: 'text', text: `Daily note exists: ${fileName}\n\n${content}` }] };
    } catch {
      const template = `---\ndate: ${date}\ntags: [daily]\n---\n\n# ${date}\n\n## Tasks\n\n## Notes\n\n## Reflections\n`;
      await fs.writeFile(filePath, template);
      return { content: [{ type: 'text', text: `Created daily note: ${fileName}` }] };
    }
  }

  async queryDataview(args) {
    const { query, source = '""' } = args;
    
    try {
      // Validate query format
      const supportedQueries = config.dataview?.supported_queries || ['TABLE', 'LIST', 'TASK'];
      const queryType = query.split(' ')[0].toUpperCase();
      
      if (!supportedQueries.includes(queryType)) {
        throw new MCPError(
          `Unsupported query type: ${queryType}`,
          'E203',
          `Supported types: ${supportedQueries.join(', ')}`,
          'Use TABLE, LIST, or TASK query format'
        );
      }
      
      const files = await glob('**/*.md', { cwd: VAULT_PATH });
      const results = [];
      const maxResults = config.dataview?.max_results || 1000;
      
      for (const file of files.slice(0, maxResults)) {
        try {
          const content = await fs.readFile(path.join(VAULT_PATH, file), 'utf-8');
          const parsed = fm(content);
          
          if (source !== '""' && !this.matchesSource(file, content, parsed, source)) {
            continue;
          }
          
          if (queryType === 'TABLE') {
            results.push(this.executeTableQuery(file, content, parsed));
          } else if (queryType === 'LIST') {
            results.push(this.executeListQuery(file, content, parsed));
          } else if (queryType === 'TASK') {
            const tasks = this.extractTasks(content);
            if (tasks.length > 0) results.push({ file, tasks });
          }
        } catch (fileError) {
          console.warn(`Error processing file ${file}: ${fileError.message}`);
          continue;
        }
      }
      
      return { content: [{ type: 'text', text: this.formatDataviewResults(queryType, results) }] };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      
      throw new MCPError(
        'Dataview query execution failed',
        'E203',
        error.message,
        'Check query syntax and vault accessibility'
      );
    }
  }

  matchesSource(file, content, parsed, source) {
    if (source.startsWith('#')) {
      const tag = source.substring(1);
      return (parsed.attributes.tags || []).includes(tag) || content.includes(`#${tag}`);
    } else if (source.startsWith('"') && source.endsWith('"')) {
      const folder = source.slice(1, -1);
      return file.startsWith(folder);
    }
    return true;
  }

  executeTableQuery(file, content, parsed) {
    const title = parsed.attributes.title || path.basename(file, '.md');
    return {
      file: title,
      created: parsed.attributes.created || 'unknown',
      tags: (parsed.attributes.tags || []).join(', '),
      size: content.length
    };
  }

  executeListQuery(file, content, parsed) {
    const title = parsed.attributes.title || path.basename(file, '.md');
    return {
      title,
      path: file,
      excerpt: content.substring(0, 100) + '...'
    };
  }

  extractTasks(content) {
    const taskRegex = /^\s*- \[([ x])\] (.+)$/gm;
    const tasks = [];
    let match;
    
    while ((match = taskRegex.exec(content)) !== null) {
      tasks.push({
        completed: match[1] === 'x',
        text: match[2]
      });
    }
    
    return tasks;
  }

  formatDataviewResults(queryType, results) {
    if (results.length === 0) return 'No results found.';
    
    if (queryType === 'TABLE') {
      let output = 'File                    Created      Tags                 Size\n';
      output += '─'.repeat(60) + '\n';
      
      results.forEach(r => {
        output += `${r.file.padEnd(20)} ${String(r.created).padEnd(10)} ${r.tags.padEnd(15)} ${r.size}\n`;
      });
      
      return output;
    } else if (queryType === 'LIST') {
      return results.map(r => `• [[${r.title}]] - ${r.excerpt}`).join('\n');
    } else if (queryType === 'TASK') {
      let output = 'Tasks found:\n\n';
      results.forEach(r => {
        output += `**${r.file}:**\n`;
        r.tasks.forEach(task => {
          const status = task.completed ? '✅' : '⏳';
          output += `  ${status} ${task.text}\n`;
        });
        output += '\n';
      });
      return output;
    }
    
    return JSON.stringify(results, null, 2);
  }

  async createCanvasNode(args) {
    const { canvas_path, node_type, content, x = 0, y = 0, width = 250, height = 60 } = args;
    const canvasFilePath = path.join(VAULT_PATH, canvas_path);
    
    try {
      // Validate node type
      const validTypes = ['text', 'file', 'link'];
      if (!validTypes.includes(node_type)) {
        throw new MCPError(
          `Invalid node type: ${node_type}`,
          'E204',
          `Valid types: ${validTypes.join(', ')}`,
          'Use text, file, or link node type'
        );
      }
      
      let canvasData;
      
      try {
        const existing = await fs.readFile(canvasFilePath, 'utf-8');
        canvasData = JSON.parse(existing);
      } catch {
        canvasData = { nodes: [], edges: [] };
      }
      
      // Check node limit
      const maxNodes = config.canvas?.max_nodes_per_canvas || 500;
      if (canvasData.nodes.length >= maxNodes) {
        throw new MCPError(
          `Canvas node limit exceeded`,
          'E204',
          `Maximum ${maxNodes} nodes per canvas`,
          'Remove some nodes or create a new canvas'
        );
      }
      
      const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const node = {
        id: nodeId,
        type: node_type,
        x,
        y,
        width: width || config.canvas?.default_node_width || 250,
        height: height || config.canvas?.default_node_height || 60
      };
      
      if (node_type === 'text') {
        node.text = content;
      } else if (node_type === 'file') {
        node.file = content;
      } else if (node_type === 'link') {
        node.url = content;
      }
      
      canvasData.nodes.push(node);
      
      await fs.writeFile(canvasFilePath, JSON.stringify(canvasData, null, 2));
      
      return { content: [{ type: 'text', text: `Created ${node_type} node in canvas: ${nodeId}` }] };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      
      throw new MCPError(
        'Canvas node creation failed',
        'E204',
        error.message,
        'Check canvas file permissions and format'
      );
    }
  }

  async connectCanvasNodes(args) {
    const { canvas_path, from_node_id, to_node_id, label } = args;
    const canvasFilePath = path.join(VAULT_PATH, canvas_path);
    
    try {
      const canvasContent = await fs.readFile(canvasFilePath, 'utf-8');
      const canvasData = JSON.parse(canvasContent);
      
      const edge = {
        id: `edge-${Date.now()}`,
        fromNode: from_node_id,
        toNode: to_node_id
      };
      
      if (label) edge.label = label;
      
      canvasData.edges.push(edge);
      
      await fs.writeFile(canvasFilePath, JSON.stringify(canvasData, null, 2));
      
      return { content: [{ type: 'text', text: `Connected nodes ${from_node_id} → ${to_node_id}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Canvas connection failed: ${error.message}` }] };
    }
  }

  async getCanvasInfo(args) {
    try {
      const canvases = await glob('**/*.canvas', { cwd: VAULT_PATH });
      const results = [];
      
      for (const canvas of canvases) {
        try {
          const content = await fs.readFile(path.join(VAULT_PATH, canvas), 'utf-8');
          const data = JSON.parse(content);
          results.push({
            file: canvas,
            nodes: data.nodes?.length || 0,
            edges: data.edges?.length || 0
          });
        } catch (e) {
          // Skip invalid canvas files
        }
      }
      
      return { contents: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
    } catch (error) {
      return { contents: [{ type: 'text', text: `Canvas info failed: ${error.message}` }] };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new ObsidianMCPServer();
server.run().catch(console.error);