# MCP Servers Configuration Guide

## Configuration Files

Each MCP server includes a `config.json` file for customizing behavior, limits, and performance settings.

### Hugging Face Server (`mcp-server-huggingface/config.json`)

```json
{
  "server": {
    "max_retries": 3,           // Retry failed operations
    "timeout_ms": 30000         // Request timeout
  },
  "huggingface": {
    "cache_size": 100,          // Model info cache size
    "max_model_size_mb": 2048   // Local model size limit
  },
  "local_inference": {
    "max_loaded_models": 3,     // Models kept in memory
    "torch_device": "auto",     // GPU/CPU selection
    "max_memory_per_model_gb": 4
  },
  "rate_limits": {
    "api_calls_per_minute": 60,
    "inference_calls_per_minute": 30
  }
}
```

### Obsidian Server (`mcp-server-obsidian/config.json`)

```json
{
  "vault": {
    "max_file_size_mb": 50,     // Skip large files
    "supported_extensions": [".md", ".canvas"]
  },
  "dataview": {
    "max_results": 1000,        // Query result limit
    "query_timeout_ms": 5000,   // Query execution timeout
    "supported_queries": ["TABLE", "LIST", "TASK"]
  },
  "canvas": {
    "max_nodes_per_canvas": 500,
    "default_node_width": 250,
    "default_node_height": 60
  },
  "search": {
    "max_results": 100,
    "excerpt_length": 200
  }
}
```

### Media Server (`mcp-server-media/config.json`)

```json
{
  "ffmpeg": {
    "timeout_ms": 300000,       // 5 minute timeout
    "max_file_size_mb": 1000,   // 1GB file limit
    "supported_video_formats": ["mp4", "webm", "mov", "avi"]
  },
  "image_processing": {
    "max_file_size_mb": 100,
    "max_dimensions": {
      "width": 8000,
      "height": 8000
    }
  },
  "batch_processing": {
    "max_concurrent_jobs": 3,
    "max_files_per_batch": 1000,
    "job_retention_hours": 24
  },
  "presets": {
    "web_optimized": {
      "width": 1280,
      "format": "webp",
      "quality": 85
    }
  }
}
```

## Error Handling System

### Error Codes

| Code | Category | Description |
|------|----------|-------------|
| E001 | Common | Invalid input parameters |
| E002 | Common | File not found |
| E003 | Common | Permission denied |
| E101 | HuggingFace | API error |
| E102 | HuggingFace | Model not found |
| E103 | HuggingFace | Invalid token |
| E201 | Obsidian | Vault not found |
| E202 | Obsidian | Note not found |
| E203 | Obsidian | Dataview error |
| E301 | Media | FFmpeg not found |
| E302 | Media | Unsupported format |
| E303 | Media | Processing failed |

### Error Response Format

```
Error E102: Model microsoft/invalid-model not found or inaccessible
Details: 404 Client Error: Not Found for url: https://huggingface.co/api/models/microsoft/invalid-model
Suggestion: Check model ID spelling and availability
```

## Performance Tuning

### Memory Management

**Hugging Face Server:**
- Adjust `max_loaded_models` based on available RAM
- Use `torch_dtype: "float16"` to reduce memory usage
- Set `max_model_size_mb` to prevent loading huge models

**Obsidian Server:**
- Increase `max_file_size_mb` for large vaults
- Adjust `max_results` for faster queries on large vaults
- Enable `cache_results` for repeated queries

**Media Server:**
- Set `max_concurrent_jobs` based on CPU cores
- Adjust `max_file_size_mb` for available disk space
- Tune `timeout_ms` for large file processing

### Network Optimization

```json
{
  "server": {
    "max_retries": 5,        // Increase for unstable connections
    "timeout_ms": 60000      // Longer timeout for slow networks
  },
  "rate_limits": {
    "api_calls_per_minute": 30  // Reduce for free API tiers
  }
}
```

## Environment Variables

### Required
- `HF_TOKEN`: Hugging Face API token (for authenticated operations)
- `OBSIDIAN_VAULT_PATH`: Path to Obsidian vault directory

### Optional
- `MCP_LOG_LEVEL`: Set to `debug` for verbose logging
- `MCP_CONFIG_PATH`: Custom config file location

## Troubleshooting

### Common Issues

**"Vault not found" (E201)**
```bash
export OBSIDIAN_VAULT_PATH="/Users/me/Documents/MyVault"
```

**"FFmpeg not found" (E301)**
```bash
# Install FFmpeg
brew install ffmpeg  # macOS
sudo apt install ffmpeg  # Ubuntu
```

**"Model loading failed" (E102)**
- Check available memory
- Reduce `max_loaded_models`
- Use smaller models

**"Batch job limit exceeded" (E304)**
- Wait for jobs to complete
- Increase `max_concurrent_jobs`
- Use smaller file batches

### Debug Mode

Enable detailed logging:
```json
{
  "logging": {
    "level": "debug",
    "file": "server-debug.log"
  }
}
```

### Health Checks

Each server validates configuration on startup:
- File paths exist and are accessible
- Required dependencies are installed
- Memory limits are reasonable
- Network connectivity (for API-based servers)

## Custom Presets

### Media Server Presets

Add custom optimization presets:
```json
{
  "presets": {
    "podcast_audio": {
      "format": "mp3",
      "bitrate": "128k",
      "sample_rate": 44100
    },
    "mobile_video": {
      "width": 720,
      "format": "mp4",
      "quality": 70
    }
  }
}
```

### Usage
```
User: "Apply podcast_audio preset to this interview recording"
AI: Uses custom preset for audio optimization
```

## Configuration Validation

Servers validate configuration on startup and provide helpful error messages:

```
Configuration Error: max_file_size_mb (5000) exceeds recommended limit (1000)
Suggestion: Large files may cause memory issues. Consider reducing limit or increasing system RAM.
```

## Best Practices

1. **Start with defaults** - Modify only what you need
2. **Monitor resource usage** - Adjust limits based on actual usage
3. **Test configuration changes** - Restart servers after config updates
4. **Keep backups** - Save working configurations before changes
5. **Use environment-specific configs** - Different settings for dev/prod