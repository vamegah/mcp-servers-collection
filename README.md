# MCP Servers Collection

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-purple.svg)](https://modelcontextprotocol.io/)

A collection of Model Context Protocol (MCP) servers that extend AI assistant capabilities with specialized integrations.

> **🚀 Ready for Production** - All servers include error handling, configuration management, and comprehensive testing.

## Available Servers

### 🤗 [mcp-server-huggingface](./mcp-server-huggingface/)
**Bridge to the Hugging Face ecosystem**
- Search and explore 500k+ models and datasets
- Run inference via Hugging Face API
- Manage repositories and upload models
- Perfect for AI research and model evaluation

**Key Features:**
- Model discovery and comparison
- Inference API integration  
- Dataset exploration
- Repository management (with auth)

### 📝 [mcp-server-obsidian](./mcp-server-obsidian/)
**Intelligent knowledge management for Obsidian vaults**
- Navigate knowledge graphs and backlinks
- Create and link notes intelligently
- Search with Obsidian syntax support
- Daily note and template integration

**Key Features:**
- Vault-aware operations
- Graph navigation
- Smart linking and tagging
- Template-based note creation

### 🎬 [mcp-server-media](./mcp-server-media/)
**Advanced media processing with FFmpeg and ImageMagick**
- Convert videos between formats (MP4, WebM, MOV)
- Create optimized GIFs from video clips
- Resize, crop, and optimize images
- Extract audio tracks and add watermarks

**Key Features:**
- Natural language media commands
- Batch processing capabilities
- Format conversion and optimization
- Professional-grade video/image tools

## Quick Start

### Hugging Face Server
```bash
cd mcp-server-huggingface
pip install -e .
export HF_TOKEN=your_token  # Optional, for authenticated operations
mcp-server-huggingface
```

### Obsidian Server  
```bash
cd mcp-server-obsidian
npm install
export OBSIDIAN_VAULT_PATH="/path/to/vault"
npm start
```

### Media Server
```bash
cd mcp-server-media
npm install
# Requires FFmpeg: https://ffmpeg.org/download.html
npm start
```

## MCP Client Configuration

Add servers to your MCP client (Claude Desktop, Cline, etc.):

```json
{
  "mcpServers": {
    "huggingface": {
      "command": "python",
      "args": ["-m", "mcp_server_huggingface.server"],
      "env": {
        "HF_TOKEN": "your_huggingface_token"
      }
    },
    "obsidian": {
      "command": "node", 
      "args": ["./mcp-server-obsidian/src/index.js"],
      "env": {
        "OBSIDIAN_VAULT_PATH": "/path/to/your/vault"
      }
    },
    "media": {
      "command": "node",
      "args": ["./mcp-server-media/src/index.js"]
    }
  }
}
```

## Example Workflows

### AI Research Assistant
1. **Discover Models**: "Find me the best text summarization models under 1GB"
2. **Test Quickly**: "Run this paragraph through microsoft/DialoGPT-medium"
3. **Document Findings**: "Create an Obsidian note comparing these 3 models"
4. **Organize Knowledge**: "Link this to my 'AI Research' project notes"

### Knowledge Management
1. **Meeting Notes**: "Create a meeting note, tag it appropriately, and link to project notes"
2. **Research Synthesis**: "Find all my notes about transformers and create a summary"
3. **Daily Planning**: "Add action items from yesterday's meetings to today's daily note"
4. **Knowledge Discovery**: "What are the most connected concepts in my vault?"

### Content Creation
1. **Video Processing**: "Convert my tutorial to MP4, create a 30-second GIF highlight"
2. **Image Optimization**: "Resize these product photos to 800px and convert to WebP"
3. **Social Media**: "Extract audio from this interview and create thumbnail images"
4. **Batch Operations**: "Process all videos in this folder for web delivery"

## Architecture

All servers follow MCP best practices:
- **Resources**: Read-only data access (search, browse, explore)
- **Tools**: Actions that modify state (create, upload, link)
- **Stdio Transport**: CLI-friendly communication
- **Error Handling**: Structured error codes with suggestions ⚡
- **Configuration**: JSON-based settings for customization ⚡
- **Logging**: Structured logging with configurable levels ⚡

## Configuration & Error Handling

### Structured Error System
- **Error Codes**: E001-E005 (common), E101+ (service-specific)
- **Detailed Messages**: Context, suggestions, and troubleshooting
- **Graceful Degradation**: Continue operation when possible

### JSON Configuration
- **Performance Tuning**: Memory limits, timeouts, batch sizes
- **Feature Control**: Enable/disable specific capabilities
- **Resource Management**: File size limits, concurrent operations

See [CONFIG_GUIDE.md](./CONFIG_GUIDE.md) for detailed configuration options.

## Contributing

Each server is independently maintained:
- **Hugging Face**: Python-based, uses `huggingface_hub` SDK
- **Obsidian**: Node.js-based, direct filesystem operations
- **Media**: Node.js-based, uses FFmpeg and Sharp for processing

See individual README files for development setup and contribution guidelines.

## 📊 Project Stats

- **3 Production-Ready Servers** with advanced features
- **25+ Tools** for AI assistant integration  
- **Structured Error Handling** with 20+ error codes
- **JSON Configuration** for performance tuning
- **Comprehensive Testing** with automated validation

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

- 🐛 **Bug Reports**: Use GitHub Issues
- 💡 **Feature Requests**: Use GitHub Discussions  
- 🔧 **Pull Requests**: Follow our contribution guidelines
- 📖 **Documentation**: Help improve our guides

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Links

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Configuration Guide](CONFIG_GUIDE.md)
- [Changelog](CHANGELOG.md)
- [Contributing Guidelines](CONTRIBUTING.md)