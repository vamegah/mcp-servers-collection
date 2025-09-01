# Media MCP Server Usage Guide

## Setup & Dependencies

### 1. Install FFmpeg
**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt install ffmpeg  # Ubuntu/Debian
sudo yum install ffmpeg  # CentOS/RHEL
```

### 2. Install Node.js Dependencies
```bash
npm install
```

### 3. Test Installation
```bash
npm start  # Should start the MCP server
ffmpeg -version  # Should show FFmpeg info
```

## MCP Client Configuration

```json
{
  "mcpServers": {
    "media": {
      "command": "node",
      "args": ["/path/to/mcp-server-media/src/index.js"]
    }
  }
}
```

## Detailed Tool Usage

### Video Tools

#### convert_video
```json
{
  "inputPath": "/path/to/input.mov",
  "outputPath": "/path/to/output.mp4", 
  "format": "mp4",
  "quality": "medium"
}
```

#### trim_video
```json
{
  "inputPath": "/path/to/video.mp4",
  "outputPath": "/path/to/trimmed.mp4",
  "startTime": "00:01:30",
  "duration": "00:00:45"
}
```

#### create_gif
```json
{
  "inputPath": "/path/to/video.mp4",
  "outputPath": "/path/to/animation.gif",
  "startTime": "00:01:05",
  "duration": "00:00:10",
  "width": 480,
  "fps": 10
}
```

### Image Tools

#### resize_image
```json
{
  "inputPath": "/path/to/large.jpg",
  "outputPath": "/path/to/resized.jpg",
  "width": 1200,
  "maintainAspect": true
}
```

#### convert_image
```json
{
  "inputPath": "/path/to/image.png",
  "outputPath": "/path/to/image.webp",
  "format": "webp",
  "quality": 80
}
```

#### add_watermark
```json
{
  "inputPath": "/path/to/photo.jpg",
  "outputPath": "/path/to/watermarked.jpg",
  "text": "© 2024 Company Name",
  "position": "bottom-right",
  "opacity": 0.7
}
```

## Real-World Examples

### Content Creation Workflow
**User:** "I recorded a 10-minute tutorial. Extract a 30-second highlight from 2:15-2:45, convert it to a GIF for social media, and also create an MP3 of just the audio."

**AI Actions:**
1. `trim_video` - Extract 30-second segment
2. `create_gif` - Convert segment to GIF with optimized settings
3. `extract_audio` - Pull audio track as MP3

### E-commerce Image Processing
**User:** "I have 50 product photos that need to be web-ready: resize to 800px width, convert to WebP, and add our logo watermark."

**AI Actions:**
1. For each image: `resize_image` to 800px width
2. `convert_image` to WebP format with 85% quality
3. `add_watermark` with company logo

### Social Media Content
**User:** "Turn this 5-minute presentation into 3 separate GIFs highlighting key features, each about 10 seconds long."

**AI Actions:**
1. `create_gif` for segment 1 (0:30-0:40)
2. `create_gif` for segment 2 (2:15-2:25) 
3. `create_gif` for segment 3 (4:20-4:30)

## Error Handling

The server handles common issues:
- **Missing FFmpeg**: Clear installation instructions
- **Invalid file paths**: File existence validation
- **Unsupported formats**: Format compatibility checks
- **Processing failures**: Detailed error messages with suggestions

## Performance Tips

### Video Processing
- Use "low" quality for quick previews
- Limit GIF dimensions (480px max) for reasonable file sizes
- Consider MP4 over MOV for better compatibility

### Image Processing
- WebP offers best compression for web use
- AVIF provides even better compression but limited browser support
- Use progressive JPEG for large images

## Supported Formats

### Video Input/Output
- **Input**: MP4, MOV, AVI, MKV, WebM, FLV
- **Output**: MP4, WebM, MOV, AVI, GIF

### Audio Input/Output  
- **Input**: Any video format, MP3, WAV, AAC, FLAC
- **Output**: MP3, WAV, AAC

### Image Input/Output
- **Input**: JPEG, PNG, WebP, TIFF, BMP, GIF
- **Output**: JPEG, PNG, WebP, AVIF