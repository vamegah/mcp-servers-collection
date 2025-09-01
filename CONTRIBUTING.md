# Contributing to MCP Servers Collection

## Quick Start

1. **Fork and clone** the repository
2. **Install dependencies**: Run `./install-deps.sh` (Unix) or `install-deps.bat` (Windows)
3. **Test changes**: Run `node test-quick.js` to verify servers work
4. **Submit PR** with clear description of changes

## Development Setup

### Prerequisites
- **Node.js** 16+ for Obsidian and Media servers
- **Python** 3.8+ for Hugging Face server
- **FFmpeg** (optional, for video processing)

### Installation
```bash
# Install all dependencies
./install-deps.sh

# Or install individually
cd mcp-server-huggingface && pip install -e .
cd mcp-server-obsidian && npm install
cd mcp-server-media && npm install
```

## Server Architecture

Each server follows MCP protocol standards:
- **Resources**: Read-only data access
- **Tools**: Actions that modify state
- **Error Handling**: Structured error codes (E001-E999)
- **Configuration**: JSON-based settings

## Adding Features

### New Tools
1. Add tool definition to `list_tools()` handler
2. Implement tool logic in `call_tool()` handler
3. Add error handling with appropriate error codes
4. Update configuration schema if needed
5. Add tests and documentation

### Error Codes
- **E001-E005**: Common errors
- **E101-E199**: Hugging Face specific
- **E201-E299**: Obsidian specific  
- **E301-E399**: Media specific

## Testing

```bash
# Quick test all servers
node test-quick.js

# Comprehensive test suite
python test-servers.py

# Test individual server
cd mcp-server-obsidian && npm start
```

## Code Style

- **Python**: Follow PEP 8, use type hints
- **JavaScript**: Use ES modules, async/await
- **Error Messages**: Include error code, details, and suggestions
- **Configuration**: Use JSON with validation

## Pull Request Guidelines

1. **Clear title** describing the change
2. **Test coverage** for new features
3. **Documentation** updates for user-facing changes
4. **Error handling** for edge cases
5. **Configuration** updates if adding new settings

## Release Process

1. Update version numbers in package files
2. Update CHANGELOG.md with new features
3. Test all servers with `node test-quick.js`
4. Create release with semantic versioning

## Getting Help

- **Issues**: Use GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub discussions for questions
- **Documentation**: Check individual server README files