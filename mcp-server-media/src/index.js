#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

// Batch job tracking
const batchJobs = new Map();
const PRESETS = {
  web_optimized: { width: 1280, format: 'webp', quality: 85 },
  social_media: { width: 1080, height: 1080, format: 'jpg', quality: 90 },
  thumbnail: { width: 320, height: 240, format: 'jpg', quality: 75 },
  high_quality: { format: 'png', quality: 95 }
};

class MediaMCPServer {
  constructor() {
    this.server = new Server(
      { name: 'mcp-server-media', version: '0.1.0' },
      { capabilities: { resources: {}, tools: {} } }
    );
    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'media://info',
          name: 'Media File Information',
          description: 'Get metadata about media files',
          mimeType: 'application/json'
        },
        {
          uri: 'media://batch',
          name: 'Batch Job Status',
          description: 'Monitor batch processing jobs',
          mimeType: 'application/json'
        }
      ]
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const url = new URL(request.params.uri);
      
      if (url.protocol === 'media:') {
        if (url.hostname === 'info') {
          const filePath = url.searchParams.get('path');
          if (filePath) {
            return await this.getMediaInfo(filePath);
          }
        } else if (url.hostname === 'batch') {
          const jobId = url.searchParams.get('job_id');
          return await this.getBatchStatus({ job_id: jobId });
        }
      }
      
      throw new Error(`Unknown resource: ${request.params.uri}`);
    });

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'read_media_info',
          description: 'Get metadata information about a media file',
          inputSchema: {
            type: 'object',
            properties: {
              inputPath: { type: 'string', description: 'Path to the media file' }
            },
            required: ['inputPath']
          }
        },
        {
          name: 'convert_video',
          description: 'Convert video to different format',
          inputSchema: {
            type: 'object',
            properties: {
              inputPath: { type: 'string', description: 'Input video file path' },
              outputPath: { type: 'string', description: 'Output file path' },
              format: { type: 'string', enum: ['mp4', 'webm', 'mov', 'avi'], description: 'Output format' },
              quality: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Quality preset' }
            },
            required: ['inputPath', 'outputPath', 'format']
          }
        },
        {
          name: 'trim_video',
          description: 'Trim video to specific time range',
          inputSchema: {
            type: 'object',
            properties: {
              inputPath: { type: 'string', description: 'Input video file path' },
              outputPath: { type: 'string', description: 'Output file path' },
              startTime: { type: 'string', description: 'Start time (HH:MM:SS or seconds)' },
              duration: { type: 'string', description: 'Duration (HH:MM:SS or seconds)' }
            },
            required: ['inputPath', 'outputPath', 'startTime', 'duration']
          }
        },
        {
          name: 'create_gif',
          description: 'Create GIF from video segment',
          inputSchema: {
            type: 'object',
            properties: {
              inputPath: { type: 'string', description: 'Input video file path' },
              outputPath: { type: 'string', description: 'Output GIF file path' },
              startTime: { type: 'string', description: 'Start time (HH:MM:SS)' },
              duration: { type: 'string', description: 'Duration (HH:MM:SS)' },
              width: { type: 'number', description: 'GIF width in pixels', default: 480 },
              fps: { type: 'number', description: 'Frames per second', default: 10 }
            },
            required: ['inputPath', 'outputPath', 'startTime', 'duration']
          }
        },
        {
          name: 'extract_audio',
          description: 'Extract audio track from video',
          inputSchema: {
            type: 'object',
            properties: {
              inputPath: { type: 'string', description: 'Input video file path' },
              outputPath: { type: 'string', description: 'Output audio file path' },
              format: { type: 'string', enum: ['mp3', 'wav', 'aac'], description: 'Audio format' }
            },
            required: ['inputPath', 'outputPath', 'format']
          }
        },
        {
          name: 'resize_image',
          description: 'Resize image to specified dimensions',
          inputSchema: {
            type: 'object',
            properties: {
              inputPath: { type: 'string', description: 'Input image file path' },
              outputPath: { type: 'string', description: 'Output image file path' },
              width: { type: 'number', description: 'Target width in pixels' },
              height: { type: 'number', description: 'Target height in pixels' },
              maintainAspect: { type: 'boolean', description: 'Maintain aspect ratio', default: true }
            },
            required: ['inputPath', 'outputPath']
          }
        },
        {
          name: 'convert_image',
          description: 'Convert image to different format',
          inputSchema: {
            type: 'object',
            properties: {
              inputPath: { type: 'string', description: 'Input image file path' },
              outputPath: { type: 'string', description: 'Output image file path' },
              format: { type: 'string', enum: ['jpg', 'png', 'webp', 'avif'], description: 'Output format' },
              quality: { type: 'number', description: 'Quality (1-100)', default: 80 }
            },
            required: ['inputPath', 'outputPath', 'format']
          }
        },
        {
          name: 'crop_image',
          description: 'Crop image to specified area',
          inputSchema: {
            type: 'object',
            properties: {
              inputPath: { type: 'string', description: 'Input image file path' },
              outputPath: { type: 'string', description: 'Output image file path' },
              x: { type: 'number', description: 'X coordinate of crop area' },
              y: { type: 'number', description: 'Y coordinate of crop area' },
              width: { type: 'number', description: 'Width of crop area' },
              height: { type: 'number', description: 'Height of crop area' }
            },
            required: ['inputPath', 'outputPath', 'x', 'y', 'width', 'height']
          }
        },
        {
          name: 'add_watermark',
          description: 'Add text watermark to image',
          inputSchema: {
            type: 'object',
            properties: {
              inputPath: { type: 'string', description: 'Input image file path' },
              outputPath: { type: 'string', description: 'Output image file path' },
              text: { type: 'string', description: 'Watermark text' },
              position: { type: 'string', enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'], description: 'Watermark position' },
              opacity: { type: 'number', description: 'Opacity (0-1)', default: 0.5 }
            },
            required: ['inputPath', 'outputPath', 'text', 'position']
          }
        },
        {
          name: 'batch_process',
          description: 'Process multiple files with the same operation',
          inputSchema: {
            type: 'object',
            properties: {
              input_pattern: { type: 'string', description: 'Glob pattern for input files (e.g., "*.jpg", "videos/*.mp4")' },
              operation: { type: 'string', enum: ['resize', 'convert', 'watermark', 'compress'], description: 'Operation to perform' },
              output_directory: { type: 'string', description: 'Output directory path' },
              parameters: { type: 'object', description: 'Operation-specific parameters' }
            },
            required: ['input_pattern', 'operation', 'output_directory']
          }
        },
        {
          name: 'get_batch_status',
          description: 'Get status of running batch operations',
          inputSchema: {
            type: 'object',
            properties: {
              job_id: { type: 'string', description: 'Batch job ID (optional - returns all if not specified)' }
            }
          }
        },
        {
          name: 'apply_preset',
          description: 'Apply predefined optimization presets',
          inputSchema: {
            type: 'object',
            properties: {
              inputPath: { type: 'string', description: 'Input file path' },
              outputPath: { type: 'string', description: 'Output file path' },
              preset: { type: 'string', enum: ['web_optimized', 'social_media', 'thumbnail', 'high_quality'], description: 'Preset to apply' }
            },
            required: ['inputPath', 'outputPath', 'preset']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'read_media_info':
            return await this.readMediaInfo(args);
          case 'convert_video':
            return await this.convertVideo(args);
          case 'trim_video':
            return await this.trimVideo(args);
          case 'create_gif':
            return await this.createGif(args);
          case 'extract_audio':
            return await this.extractAudio(args);
          case 'resize_image':
            return await this.resizeImage(args);
          case 'convert_image':
            return await this.convertImage(args);
          case 'crop_image':
            return await this.cropImage(args);
          case 'add_watermark':
            return await this.addWatermark(args);
          case 'batch_process':
            return await this.batchProcess(args);
          case 'get_batch_status':
            return await this.getBatchStatus(args);
          case 'apply_preset':
            return await this.applyPreset(args);
          default:
            throw new MCPError(`Unknown tool: ${name}`, 'E001', null, 'Check available tools list');
        }
      } catch (error) {
        if (error instanceof MCPError) {
          return { content: [{ type: 'text', text: error.toResponse() }] };
        }
        
        console.error(`Tool ${name} failed:`, error);
        return { content: [{ type: 'text', text: `Unexpected error: ${error.message}` }] };
      }
    });
  }

  async getMediaInfo(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) reject(err);
        else resolve({ contents: [{ type: 'text', text: JSON.stringify(metadata, null, 2) }] });
      });
    });
  }

  async readMediaInfo(args) {
    const { inputPath } = args;
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          reject(new Error(`Failed to read media info: ${err.message}`));
        } else {
          const info = {
            duration: metadata.format.duration,
            size: metadata.format.size,
            bitRate: metadata.format.bit_rate,
            format: metadata.format.format_name,
            streams: metadata.streams.map(s => ({
              type: s.codec_type,
              codec: s.codec_name,
              width: s.width,
              height: s.height,
              fps: s.r_frame_rate
            }))
          };
          resolve({ content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] });
        }
      });
    });
  }

  async convertVideo(args) {
    const { inputPath, outputPath, format, quality = 'medium' } = args;
    
    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath);
      
      // Quality presets
      if (quality === 'high') command = command.videoBitrate('2000k');
      else if (quality === 'low') command = command.videoBitrate('500k');
      else command = command.videoBitrate('1000k');
      
      command
        .format(format)
        .output(outputPath)
        .on('end', () => resolve({ content: [{ type: 'text', text: `Video converted to ${outputPath}` }] }))
        .on('error', (err) => reject(new Error(`Conversion failed: ${err.message}`)))
        .run();
    });
  }

  async trimVideo(args) {
    const { inputPath, outputPath, startTime, duration } = args;
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .seekInput(startTime)
        .duration(duration)
        .output(outputPath)
        .on('end', () => resolve({ content: [{ type: 'text', text: `Video trimmed and saved to ${outputPath}` }] }))
        .on('error', (err) => reject(new Error(`Trim failed: ${err.message}`)))
        .run();
    });
  }

  async createGif(args) {
    const { inputPath, outputPath, startTime, duration, width = 480, fps = 10 } = args;
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .seekInput(startTime)
        .duration(duration)
        .size(`${width}x?`)
        .fps(fps)
        .format('gif')
        .output(outputPath)
        .on('end', () => resolve({ content: [{ type: 'text', text: `GIF created: ${outputPath}` }] }))
        .on('error', (err) => reject(new Error(`GIF creation failed: ${err.message}`)))
        .run();
    });
  }

  async extractAudio(args) {
    const { inputPath, outputPath, format } = args;
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .noVideo()
        .audioCodec(format === 'mp3' ? 'libmp3lame' : format === 'aac' ? 'aac' : 'pcm_s16le')
        .format(format)
        .output(outputPath)
        .on('end', () => resolve({ content: [{ type: 'text', text: `Audio extracted to ${outputPath}` }] }))
        .on('error', (err) => reject(new Error(`Audio extraction failed: ${err.message}`)))
        .run();
    });
  }

  async resizeImage(args) {
    const { inputPath, outputPath, width, height, maintainAspect = true } = args;
    
    try {
      let resizer = sharp(inputPath);
      
      if (width || height) {
        resizer = resizer.resize(width, height, {
          fit: maintainAspect ? 'inside' : 'fill',
          withoutEnlargement: false
        });
      }
      
      await resizer.toFile(outputPath);
      return { content: [{ type: 'text', text: `Image resized and saved to ${outputPath}` }] };
    } catch (error) {
      throw new Error(`Image resize failed: ${error.message}`);
    }
  }

  async convertImage(args) {
    const { inputPath, outputPath, format, quality = 80 } = args;
    
    try {
      let converter = sharp(inputPath);
      
      switch (format) {
        case 'jpg':
          converter = converter.jpeg({ quality });
          break;
        case 'png':
          converter = converter.png();
          break;
        case 'webp':
          converter = converter.webp({ quality });
          break;
        case 'avif':
          converter = converter.avif({ quality });
          break;
      }
      
      await converter.toFile(outputPath);
      return { content: [{ type: 'text', text: `Image converted to ${format} and saved to ${outputPath}` }] };
    } catch (error) {
      throw new Error(`Image conversion failed: ${error.message}`);
    }
  }

  async cropImage(args) {
    const { inputPath, outputPath, x, y, width, height } = args;
    
    try {
      await sharp(inputPath)
        .extract({ left: x, top: y, width, height })
        .toFile(outputPath);
      
      return { content: [{ type: 'text', text: `Image cropped and saved to ${outputPath}` }] };
    } catch (error) {
      throw new Error(`Image crop failed: ${error.message}`);
    }
  }

  async addWatermark(args) {
    const { inputPath, outputPath, text, position, opacity = 0.5 } = args;
    
    try {
      const image = sharp(inputPath);
      const { width, height } = await image.metadata();
      
      // Create text overlay (simplified - would need more complex positioning logic)
      const svg = `
        <svg width="${width}" height="${height}">
          <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" opacity="${opacity}" text-anchor="middle">${text}</text>
        </svg>
      `;
      
      await image
        .composite([{ input: Buffer.from(svg), gravity: this.getGravity(position) }])
        .toFile(outputPath);
      
      return { content: [{ type: 'text', text: `Watermark added and saved to ${outputPath}` }] };
    } catch (error) {
      throw new Error(`Watermark failed: ${error.message}`);
    }
  }

  getGravity(position) {
    const gravityMap = {
      'top-left': 'northwest',
      'top-right': 'northeast',
      'bottom-left': 'southwest',
      'bottom-right': 'southeast',
      'center': 'center'
    };
    return gravityMap[position] || 'center';
  }

  async batchProcess(args) {
    const { input_pattern, operation, output_directory, parameters = {} } = args;
    const jobId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Find matching files
      const { glob } = await import('glob');
      const files = await glob(input_pattern);
      
      if (files.length === 0) {
        return { content: [{ type: 'text', text: `No files found matching pattern: ${input_pattern}` }] };
      }

      // Initialize job tracking
      const job = {
        id: jobId,
        operation,
        total: files.length,
        completed: 0,
        failed: 0,
        status: 'running',
        startTime: Date.now(),
        files: files.map(f => ({ path: f, status: 'pending' }))
      };
      
      batchJobs.set(jobId, job);

      // Process files asynchronously
      this.processBatchAsync(jobId, files, operation, output_directory, parameters);
      
      return { content: [{ type: 'text', text: `Started batch job ${jobId}: processing ${files.length} files` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Batch process failed: ${error.message}` }] };
    }
  }

  async processBatchAsync(jobId, files, operation, outputDir, parameters) {
    const job = batchJobs.get(jobId);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = path.basename(file);
      const outputPath = path.join(outputDir, fileName);
      
      try {
        job.files[i].status = 'processing';
        
        // Perform operation based on type
        switch (operation) {
          case 'resize':
            await this.resizeImageBatch(file, outputPath, parameters);
            break;
          case 'convert':
            await this.convertImageBatch(file, outputPath, parameters);
            break;
          case 'watermark':
            await this.addWatermarkBatch(file, outputPath, parameters);
            break;
          case 'compress':
            await this.compressImageBatch(file, outputPath, parameters);
            break;
        }
        
        job.files[i].status = 'completed';
        job.completed++;
      } catch (error) {
        job.files[i].status = 'failed';
        job.files[i].error = error.message;
        job.failed++;
      }
      
      // Update progress
      job.progress = Math.round((job.completed + job.failed) / job.total * 100);
    }
    
    job.status = 'completed';
    job.endTime = Date.now();
    job.duration = job.endTime - job.startTime;
  }

  async resizeImageBatch(inputPath, outputPath, params) {
    const { width = 800, height, maintainAspect = true } = params;
    
    let resizer = sharp(inputPath);
    if (width || height) {
      resizer = resizer.resize(width, height, {
        fit: maintainAspect ? 'inside' : 'fill'
      });
    }
    await resizer.toFile(outputPath);
  }

  async convertImageBatch(inputPath, outputPath, params) {
    const { format = 'jpg', quality = 80 } = params;
    
    let converter = sharp(inputPath);
    switch (format) {
      case 'jpg':
        converter = converter.jpeg({ quality });
        break;
      case 'webp':
        converter = converter.webp({ quality });
        break;
      case 'png':
        converter = converter.png();
        break;
    }
    
    await converter.toFile(outputPath);
  }

  async addWatermarkBatch(inputPath, outputPath, params) {
    const { text = 'Watermark', position = 'bottom-right', opacity = 0.5 } = params;
    
    const image = sharp(inputPath);
    const { width, height } = await image.metadata();
    
    const svg = `
      <svg width="${width}" height="${height}">
        <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" opacity="${opacity}" text-anchor="middle">${text}</text>
      </svg>
    `;
    
    await image
      .composite([{ input: Buffer.from(svg), gravity: this.getGravity(position) }])
      .toFile(outputPath);
  }

  async compressImageBatch(inputPath, outputPath, params) {
    const { quality = 75 } = params;
    
    await sharp(inputPath)
      .jpeg({ quality, progressive: true })
      .toFile(outputPath);
  }

  async getBatchStatus(args) {
    const { job_id } = args;
    
    if (job_id) {
      const job = batchJobs.get(job_id);
      if (!job) {
        return { content: [{ type: 'text', text: `Job ${job_id} not found` }] };
      }
      
      const status = {
        id: job.id,
        operation: job.operation,
        status: job.status,
        progress: job.progress || 0,
        completed: job.completed,
        failed: job.failed,
        total: job.total,
        duration: job.duration ? `${Math.round(job.duration / 1000)}s` : 'running'
      };
      
      return { content: [{ type: 'text', text: JSON.stringify(status, null, 2) }] };
    } else {
      // Return all jobs
      const allJobs = Array.from(batchJobs.values()).map(job => ({
        id: job.id,
        operation: job.operation,
        status: job.status,
        progress: job.progress || 0,
        total: job.total
      }));
      
      return { content: [{ type: 'text', text: JSON.stringify(allJobs, null, 2) }] };
    }
  }

  async applyPreset(args) {
    const { inputPath, outputPath, preset } = args;
    
    if (!PRESETS[preset]) {
      return { content: [{ type: 'text', text: `Unknown preset: ${preset}` }] };
    }
    
    const presetConfig = PRESETS[preset];
    
    try {
      let processor = sharp(inputPath);
      
      // Apply resize if specified
      if (presetConfig.width || presetConfig.height) {
        processor = processor.resize(presetConfig.width, presetConfig.height, {
          fit: 'inside',
          withoutEnlargement: false
        });
      }
      
      // Apply format and quality
      switch (presetConfig.format) {
        case 'jpg':
          processor = processor.jpeg({ quality: presetConfig.quality });
          break;
        case 'webp':
          processor = processor.webp({ quality: presetConfig.quality });
          break;
        case 'png':
          processor = processor.png();
          break;
      }
      
      await processor.toFile(outputPath);
      
      return { content: [{ type: 'text', text: `Applied ${preset} preset to ${inputPath} → ${outputPath}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Preset application failed: ${error.message}` }] };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new MediaMCPServer();
server.run().catch(console.error);