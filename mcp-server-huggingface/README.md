# MCP Server for Hugging Face

A Model Context Protocol (MCP) server that provides seamless integration with the Hugging Face ecosystem, enabling AI assistants to search, analyze, and interact with models, datasets, and spaces on the Hugging Face Hub.

## Features

### Resources (Read-only)
- **hf_models**: List and filter models from the Hub
- **hf_model_card**: Fetch model cards and documentation
- **hf_datasets**: Browse available datasets
- **hf_dataset_card**: Get dataset information and cards
- **hf_spaces**: Access Hugging Face Spaces information

### Tools (Actions)
- **search_hub**: Natural language search across Hub
- **inference_api_run**: Run inference using HF Inference API
- **load_model_locally**: Load models locally for faster inference ⚡
- **local_inference**: Run inference on locally loaded models ⚡
- **compare_models**: AI-powered model comparison and recommendations ⚡
- **hf_download**: Download models and datasets locally

### Repository Management (with authentication)
- **hf_repo_create**: Create new repositories
- **hf_upload_file**: Upload files to repositories

## Installation

```bash
pip install -e .
```

## Configuration

For authenticated operations, set your Hugging Face token:
```bash
export HF_TOKEN=your_token_here
```

## Usage

Run the server:
```bash
mcp-server-huggingface
```

## Example Interactions

### Model Discovery & Comparison
- "Find me the top 3 summarization models under 500MB"
- "Compare GPT-2, DistilBERT, and BERT-base on key metrics"
- "What's the smallest conversational AI model available?"

### Local Inference (New!)
- "Load microsoft/DialoGPT-small locally for faster responses"
- "Generate text using my locally loaded model"
- "Test this model on my data without API limits"

### Hub Operations
- "Run this text through microsoft/DialoGPT-medium"
- "What's in the 'emotion' dataset?"
- "Create a new repo and upload my fine-tuned model"