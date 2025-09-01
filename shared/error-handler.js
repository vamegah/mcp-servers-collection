// Shared error handling utilities for MCP servers

export class MCPError extends Error {
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

export const ErrorCodes = {
  // Common errors
  INVALID_INPUT: 'E001',
  FILE_NOT_FOUND: 'E002', 
  PERMISSION_DENIED: 'E003',
  NETWORK_ERROR: 'E004',
  TIMEOUT: 'E005',
  
  // HuggingFace specific
  HF_API_ERROR: 'E101',
  HF_MODEL_NOT_FOUND: 'E102',
  HF_TOKEN_INVALID: 'E103',
  HF_QUOTA_EXCEEDED: 'E104',
  
  // Obsidian specific
  VAULT_NOT_FOUND: 'E201',
  NOTE_NOT_FOUND: 'E202',
  DATAVIEW_ERROR: 'E203',
  CANVAS_ERROR: 'E204',
  
  // Media specific
  FFMPEG_NOT_FOUND: 'E301',
  UNSUPPORTED_FORMAT: 'E302',
  PROCESSING_FAILED: 'E303',
  BATCH_ERROR: 'E304'
};

export function handleError(error, context = '') {
  console.error(`[${context}] ${error.message}`, error);
  
  if (error instanceof MCPError) {
    return [{ type: 'text', text: error.toResponse() }];
  }
  
  // Map common errors to MCPError
  if (error.code === 'ENOENT') {
    return [{ type: 'text', text: new MCPError(
      'File or directory not found',
      ErrorCodes.FILE_NOT_FOUND,
      error.path,
      'Check the file path and ensure it exists'
    ).toResponse() }];
  }
  
  if (error.code === 'EACCES') {
    return [{ type: 'text', text: new MCPError(
      'Permission denied',
      ErrorCodes.PERMISSION_DENIED,
      error.path,
      'Check file permissions or run with appropriate privileges'
    ).toResponse() }];
  }
  
  // Generic error fallback
  return [{ type: 'text', text: `Unexpected error: ${error.message}` }];
}