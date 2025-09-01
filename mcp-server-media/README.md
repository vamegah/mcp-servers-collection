# MCP Server for Media Processing

A Model Context Protocol (MCP) server that enables AI assistants to perform advanced media processing tasks using FFmpeg and ImageMagick through natural language commands.

## Features

### Video Processing (FFmpeg)
- **convert_video** - Convert between formats (mp4, webm, mov, avi)
- **trim_video** - Cut video segments by time range
- **create_gif** - Generate optimized GIFs from video clips
- **extract_audio** - Extract audio tracks (mp3, wav, aac)
- **read_media_info** - Get metadata (duration, resolution, codecs)

### Image Processing (Sharp)
- **resize_image** - Smart resizing with aspect ratio control
- **convert_image** - Format conversion (jpg, png, webp, avif)
- **crop_image** - Precise cropping to specified dimensions
- **add_watermark** - Text watermarks with positioning

### Batch Processing (New!) ⚡
- **batch_process** - Process multiple files with same operation
- **get_batch_status** - Real-time progress tracking
- **apply_preset** - Use predefined optimization settings
- **Progress monitoring** - Per-file status and completion metrics

## Prerequisites

### Required Software
- **FFmpeg**: Download from [ffmpeg.org](https://ffmpeg.org/download.html)
- **Node.js**: Version 16+ required

### Installation Check
```bash
ffmpeg -version  # Should show FFmpeg version
node --version   # Should show Node.js version
```

## Installation

```bash
cd mcp-server-media
npm install
```

## Configuration

Add to your MCP client configuration:
```json
{
  "mcpServers": {
    "media": {
      "command": "node",
      "args": ["./src/index.js"],
      "cwd": "/path/to/mcp-server-media"
    }
  }
}
```

## Example Interactions

### Video Processing
- "Convert my presentation.mov to MP4 format for web sharing"
- "Create a GIF from my demo video between 1:05 and 1:15"
- "Extract the audio track from this interview video as MP3"
- "Trim the first 30 seconds from this recording"

### Image Processing  
- "Resize all my screenshots to max width 1200px for the blog"
- "Convert these PNG files to optimized WebP format"
- "Add a copyright watermark to the bottom-right of these photos"
- "Crop this image to remove the empty space around the subject"

### Batch Processing (New!)
- "Process all JPGs in images/ folder: resize to 800px and convert to WebP"
- "Apply social media preset to all my photos for Instagram"
- "Add watermarks to all product photos in the catalog folder"
- "Show me the progress of my batch conversion job"

### Smart Presets
- "Optimize these images for web delivery" (web_optimized preset)
- "Prepare these photos for social media" (social_media preset)
- "Create thumbnails from these images" (thumbnail preset)