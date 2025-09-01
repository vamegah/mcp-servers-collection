# Usage Examples

## Setup

1. Install the server:
```bash
cd mcp-server-huggingface
pip install -e .
```

2. Set your Hugging Face token (optional, for authenticated operations):
```bash
export HF_TOKEN=your_token_here
```

3. Test the server:
```bash
python src/mcp_server_huggingface/cli.py
```

## MCP Client Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "huggingface": {
      "command": "python",
      "args": ["-m", "mcp_server_huggingface.server"],
      "env": {
        "HF_TOKEN": "your_huggingface_token_here"
      }
    }
  }
}
```

## Example Interactions

### 1. Model Research & Comparison

**User:** "Find me the top summarization models and compare their performance"

**AI Assistant Actions:**
- Uses `search_hub` tool with query "summarization" and type "model"
- Accesses `hf://model/{model_id}` resources to get model cards
- Compares download counts, model sizes, and evaluation metrics

### 2. Quick Inference Testing

**User:** "Test this text with microsoft/DialoGPT-medium: 'Hello, how are you?'"

**AI Assistant Actions:**
- Uses `inference_api_run` tool with model_id and input text
- Returns the model's response

### 3. Dataset Exploration

**User:** "What's in the emotion dataset? Show me some examples"

**AI Assistant Actions:**
- Accesses `hf://dataset/emotion` resource
- Gets dataset card and metadata
- Optionally uses `hf_download` to fetch samples

### 4. Repository Management

**User:** "Create a repo called 'my-sentiment-model' and upload my model files"

**AI Assistant Actions:**
- Uses `hf_repo_create` tool to create repository
- Uses `hf_upload_file` tool for each file in the specified directory

## Available Resources

- `hf://models` - List all models (supports query parameters)
- `hf://models?task=text-generation&limit=10` - Filtered model list
- `hf://model/{model_id}` - Specific model information and card
- `hf://datasets` - List all datasets
- `hf://dataset/{dataset_id}` - Specific dataset information
- `hf://spaces` - List Hugging Face Spaces

## Available Tools

### Public Tools (no authentication required)
- `search_hub` - Search for models, datasets, or spaces
- `inference_api_run` - Run inference using HF Inference API
- `hf_download` - Download model/dataset files

### Authenticated Tools (requires HF_TOKEN)
- `hf_repo_create` - Create new repositories
- `hf_upload_file` - Upload files to repositories

## Error Handling

The server handles common errors gracefully:
- Network connectivity issues
- Invalid model/dataset IDs
- Authentication failures
- Rate limiting

All errors are returned as descriptive text messages to help users understand what went wrong.