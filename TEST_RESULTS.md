# MCP Servers Test Results

## Quick Test Instructions

### Windows
```cmd
install-deps.bat
```

### Unix/Linux/macOS
```bash
chmod +x install-deps.sh
./install-deps.sh
```

### Manual Testing
```bash
# Test individual servers
node test-quick.js

# Or test with Python script
python test-servers.py
```

## Expected Test Output

### Successful Test Run
```
🚀 Quick MCP Servers Test

🔍 Checking Dependencies...

  ✅ Obsidian server directory found
  ✅ Obsidian package.json found
  ✅ Obsidian src/index.js found
  ✅ Media server directory found
  ✅ Media package.json found
  ✅ Media src/index.js found

📁 Created temp vault: /tmp/test-obsidian-vault

🧪 Testing Obsidian...
  ✅ Obsidian: Found 9 tools
  📋 Tools: create_note, append_to_note, link_notes, get_backlinks, update_frontmatter, get_daily_note, query_dataview, create_canvas_node, connect_canvas_nodes

🧪 Testing Media...
  ✅ Media: Found 9 tools
  📋 Tools: read_media_info, convert_video, trim_video, create_gif, extract_audio, resize_image, convert_image, crop_image, add_watermark, batch_process, get_batch_status, apply_preset

========================================
📊 Test Results:
  ✅ Obsidian Server
  ✅ Media Server

🎯 2/2 servers passed tests
🎉 All tests passed!
```

## Troubleshooting

### Common Issues

**"Node.js not found"**
- Install Node.js from https://nodejs.org/
- Ensure `node` is in your PATH

**"Python dependencies failed"**
- Install Python 3.8+ from https://python.org/
- Run: `pip install --upgrade pip`
- Run: `pip install mcp transformers torch`

**"FFmpeg not found" (Media server)**
- Install FFmpeg from https://ffmpeg.org/download.html
- Video processing will be limited without FFmpeg
- Image processing will still work

**"Obsidian vault not found"**
- Test script creates temporary vault automatically
- For real usage, set: `export OBSIDIAN_VAULT_PATH="/path/to/vault"`

**"Timeout - no response received"**
- Check if dependencies are installed: `npm install` in server directories
- Check for syntax errors in server files
- Increase timeout in test script if needed

### Manual Server Testing

**Start Hugging Face Server:**
```bash
cd mcp-server-huggingface
python -m mcp_server_huggingface.server
```

**Start Obsidian Server:**
```bash
cd mcp-server-obsidian
export OBSIDIAN_VAULT_PATH="/path/to/vault"
npm start
```

**Start Media Server:**
```bash
cd mcp-server-media
npm start
```

### Test Individual Features

**Test Obsidian Dataview:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "query_dataview",
    "arguments": {
      "query": "LIST FROM #test"
    }
  }
}
```

**Test Media Batch Processing:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "batch_process",
    "arguments": {
      "input_pattern": "*.jpg",
      "operation": "resize",
      "output_directory": "./output/",
      "parameters": {"width": 800}
    }
  }
}
```

## Performance Validation

### Memory Usage
- **Hugging Face**: ~500MB base + ~2GB per loaded model
- **Obsidian**: ~50MB + vault size
- **Media**: ~100MB + file processing memory

### Response Times
- **Tool listing**: <100ms
- **Simple operations**: <500ms
- **Model loading**: 5-30 seconds
- **Batch processing**: Varies by file count/size

## Integration Testing

### MCP Client Configuration
Test with actual MCP clients like Claude Desktop:

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "node",
      "args": ["./mcp-server-obsidian/src/index.js"],
      "env": {
        "OBSIDIAN_VAULT_PATH": "/path/to/vault"
      }
    }
  }
}
```

### Expected Behavior
- Servers start without errors
- Tools are discoverable
- Basic operations complete successfully
- Error handling provides helpful messages
- Configuration is respected