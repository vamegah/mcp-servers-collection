#!/usr/bin/env python3
"""MCP Server for Hugging Face Hub integration."""

import asyncio
import json
import os
import logging
from typing import Any, Dict, List, Optional, Sequence
from urllib.parse import quote
from functools import lru_cache
from pathlib import Path

import aiohttp
from huggingface_hub import HfApi, hf_hub_download, create_repo, upload_file
from transformers import AutoTokenizer, AutoModelForCausalLM, AutoModelForSequenceClassification, pipeline
import torch
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import (
    Resource, Tool, TextContent, ImageContent, EmbeddedResource,
    CallToolRequest, GetResourceRequest, ListResourcesRequest, ListToolsRequest
)

class MCPError(Exception):
    def __init__(self, message, code, details=None, suggestions=None):
        super().__init__(message)
        self.code = code
        self.details = details
        self.suggestions = suggestions

    def to_response(self):
        response = f"Error {self.code}: {self.message}"
        if self.details: response += f"\nDetails: {self.details}"
        if self.suggestions: response += f"\nSuggestion: {self.suggestions}"
        return response

# Load configuration
def load_config():
    config_path = Path(__file__).parent / "config.json"
    try:
        with open(config_path) as f:
            return json.load(f)
    except FileNotFoundError:
        return {
            "server": {"max_retries": 3, "timeout_ms": 30000},
            "huggingface": {"cache_size": 100, "max_model_size_mb": 2048},
            "local_inference": {"max_loaded_models": 3}
        }

config = load_config()

# Setup logging
logging.basicConfig(
    level=getattr(logging, config.get("logging", {}).get("level", "INFO").upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize HF API
hf_api = HfApi()
HF_TOKEN = os.getenv("HF_TOKEN")

# Local model cache
loaded_models = {}
loaded_tokenizers = {}
max_loaded_models = config["local_inference"]["max_loaded_models"]

app = Server("mcp-server-huggingface")

@lru_cache(maxsize=config["huggingface"]["cache_size"])
def get_cached_model_info(model_id):
    """Cache model info to reduce API calls."""
    try:
        return hf_api.model_info(model_id)
    except Exception as e:
        logger.error(f"Failed to get model info for {model_id}: {e}")
        raise MCPError(
            f"Model {model_id} not found or inaccessible",
            "E102",
            str(e),
            "Check model ID spelling and availability"
        )

@app.list_resources()
async def list_resources() -> List[Resource]:
    """List available resources."""
    return [
        Resource(
            uri="hf://models",
            name="Hugging Face Models",
            description="Browse and search models on Hugging Face Hub",
            mimeType="application/json"
        ),
        Resource(
            uri="hf://datasets", 
            name="Hugging Face Datasets",
            description="Browse datasets on Hugging Face Hub",
            mimeType="application/json"
        ),
        Resource(
            uri="hf://spaces",
            name="Hugging Face Spaces", 
            description="Browse Spaces (demo apps) on Hugging Face Hub",
            mimeType="application/json"
        )
    ]

@app.get_resource()
async def get_resource(request: GetResourceRequest) -> str:
    """Get resource content."""
    uri = request.uri
    
    if uri.startswith("hf://models"):
        # Parse query parameters from URI
        params = {}
        if "?" in uri:
            query = uri.split("?", 1)[1]
            for param in query.split("&"):
                if "=" in param:
                    key, value = param.split("=", 1)
                    params[key] = value
        
        models = hf_api.list_models(
            task=params.get("task"),
            library=params.get("library"), 
            limit=int(params.get("limit", "20"))
        )
        
        result = []
        for model in models:
            result.append({
                "id": model.id,
                "author": getattr(model, "author", None),
                "downloads": getattr(model, "downloads", 0),
                "likes": getattr(model, "likes", 0),
                "tags": getattr(model, "tags", []),
                "pipeline_tag": getattr(model, "pipeline_tag", None)
            })
        
        return json.dumps(result, indent=2)
    
    elif uri.startswith("hf://model/"):
        model_id = uri.replace("hf://model/", "")
        try:
            model_info = hf_api.model_info(model_id)
            card_data = hf_api.get_model_readme(model_id) if hasattr(hf_api, 'get_model_readme') else None
            
            result = {
                "id": model_info.id,
                "author": getattr(model_info, "author", None),
                "downloads": getattr(model_info, "downloads", 0),
                "likes": getattr(model_info, "likes", 0),
                "tags": getattr(model_info, "tags", []),
                "pipeline_tag": getattr(model_info, "pipeline_tag", None),
                "card_data": card_data
            }
            return json.dumps(result, indent=2)
        except Exception as e:
            return f"Error fetching model info: {str(e)}"
    
    elif uri.startswith("hf://datasets"):
        datasets = hf_api.list_datasets(limit=20)
        result = []
        for dataset in datasets:
            result.append({
                "id": dataset.id,
                "author": getattr(dataset, "author", None),
                "downloads": getattr(dataset, "downloads", 0),
                "likes": getattr(dataset, "likes", 0),
                "tags": getattr(dataset, "tags", [])
            })
        return json.dumps(result, indent=2)
    
    elif uri.startswith("hf://dataset/"):
        dataset_id = uri.replace("hf://dataset/", "")
        try:
            dataset_info = hf_api.dataset_info(dataset_id)
            result = {
                "id": dataset_info.id,
                "author": getattr(dataset_info, "author", None),
                "downloads": getattr(dataset_info, "downloads", 0),
                "likes": getattr(dataset_info, "likes", 0),
                "tags": getattr(dataset_info, "tags", []),
                "card_data": getattr(dataset_info, "card_data", None)
            }
            return json.dumps(result, indent=2)
        except Exception as e:
            return f"Error fetching dataset info: {str(e)}"
    
    elif uri.startswith("hf://spaces"):
        spaces = hf_api.list_spaces(limit=20)
        result = []
        for space in spaces:
            result.append({
                "id": space.id,
                "author": getattr(space, "author", None),
                "likes": getattr(space, "likes", 0),
                "sdk": getattr(space, "sdk", None)
            })
        return json.dumps(result, indent=2)
    
    return "Resource not found"

@app.list_tools()
async def list_tools() -> List[Tool]:
    """List available tools."""
    tools = [
        Tool(
            name="search_hub",
            description="Search Hugging Face Hub for models, datasets, or spaces",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"},
                    "type": {"type": "string", "enum": ["model", "dataset", "space"], "description": "Type to search for"}
                },
                "required": ["query"]
            }
        ),
        Tool(
            name="inference_api_run",
            description="Run inference using Hugging Face Inference API",
            inputSchema={
                "type": "object", 
                "properties": {
                    "model_id": {"type": "string", "description": "Model ID on Hugging Face Hub"},
                    "inputs": {"type": "string", "description": "Input text or data"},
                    "parameters": {"type": "object", "description": "Optional parameters for inference"}
                },
                "required": ["model_id", "inputs"]
            }
        ),
        Tool(
            name="hf_download",
            description="Download a model or dataset file",
            inputSchema={
                "type": "object",
                "properties": {
                    "repo_id": {"type": "string", "description": "Repository ID"},
                    "filename": {"type": "string", "description": "File to download"},
                    "local_dir": {"type": "string", "description": "Local directory to save to"}
                },
                "required": ["repo_id", "filename"]
            }
        )
    ]
    
    # Add local inference tools
    tools.extend([
        Tool(
            name="load_model_locally",
            description="Load a model locally for faster inference",
            inputSchema={
                "type": "object",
                "properties": {
                    "model_id": {"type": "string", "description": "Model ID to load"},
                    "task": {"type": "string", "enum": ["text-generation", "text-classification", "sentiment-analysis"], "description": "Task type"}
                },
                "required": ["model_id"]
            }
        ),
        Tool(
            name="local_inference",
            description="Run inference on locally loaded model",
            inputSchema={
                "type": "object",
                "properties": {
                    "model_id": {"type": "string", "description": "Loaded model ID"},
                    "inputs": {"type": "string", "description": "Input text"},
                    "max_length": {"type": "integer", "default": 50}
                },
                "required": ["model_id", "inputs"]
            }
        ),
        Tool(
            name="compare_models",
            description="Compare multiple models on key metrics",
            inputSchema={
                "type": "object",
                "properties": {
                    "model_ids": {"type": "array", "items": {"type": "string"}, "description": "Models to compare"},
                    "criteria": {"type": "array", "items": {"type": "string"}, "description": "Comparison criteria", "default": ["downloads", "size", "task"]}
                },
                "required": ["model_ids"]
            }
        )
    ])
    
    # Add authenticated tools if token is available
    if HF_TOKEN:
        tools.extend([
            Tool(
                name="hf_repo_create",
                description="Create a new repository on Hugging Face Hub",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "repo_id": {"type": "string", "description": "Repository ID to create"},
                        "repo_type": {"type": "string", "enum": ["model", "dataset"], "default": "model"},
                        "private": {"type": "boolean", "default": False}
                    },
                    "required": ["repo_id"]
                }
            ),
            Tool(
                name="hf_upload_file", 
                description="Upload a file to a Hugging Face repository",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "repo_id": {"type": "string", "description": "Repository ID"},
                        "path_or_fileobj": {"type": "string", "description": "Local file path"},
                        "path_in_repo": {"type": "string", "description": "Path in repository"},
                        "commit_message": {"type": "string", "description": "Commit message"}
                    },
                    "required": ["repo_id", "path_or_fileobj", "path_in_repo"]
                }
            )
        ])
    
    return tools

@app.call_tool()
async def call_tool(request: CallToolRequest) -> List[TextContent]:
    """Handle tool calls."""
    
    if request.name == "search_hub":
        query = request.arguments.get("query", "")
        search_type = request.arguments.get("type", "model")
        
        try:
            if search_type == "model":
                results = list(hf_api.list_models(search=query, limit=10))
                formatted_results = [
                    f"**{model.id}** (↓{getattr(model, 'downloads', 0)}) - {getattr(model, 'pipeline_tag', 'N/A')}"
                    for model in results
                ]
            elif search_type == "dataset":
                results = list(hf_api.list_datasets(search=query, limit=10))
                formatted_results = [
                    f"**{dataset.id}** (↓{getattr(dataset, 'downloads', 0)})"
                    for dataset in results
                ]
            elif search_type == "space":
                results = list(hf_api.list_spaces(search=query, limit=10))
                formatted_results = [
                    f"**{space.id}** - {getattr(space, 'sdk', 'N/A')}"
                    for space in results
                ]
            
            return [TextContent(
                type="text",
                text=f"Found {len(formatted_results)} {search_type}s:\n\n" + "\n".join(formatted_results)
            )]
        except Exception as e:
            logger.error(f"Search failed: {e}")
            error = MCPError(
                "Hub search failed",
                "E101",
                str(e),
                "Check network connection and search terms"
            )
            return [TextContent(type="text", text=error.to_response())]
    
    elif request.name == "inference_api_run":
        model_id = request.arguments.get("model_id")
        inputs = request.arguments.get("inputs")
        parameters = request.arguments.get("parameters", {})
        
        try:
            async with aiohttp.ClientSession() as session:
                headers = {}
                if HF_TOKEN:
                    headers["Authorization"] = f"Bearer {HF_TOKEN}"
                
                payload = {"inputs": inputs}
                if parameters:
                    payload["parameters"] = parameters
                
                async with session.post(
                    f"https://api-inference.huggingface.co/models/{model_id}",
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return [TextContent(
                            type="text", 
                            text=f"Inference result:\n```json\n{json.dumps(result, indent=2)}\n```"
                        )]
                    else:
                        error_text = await response.text()
                        return [TextContent(type="text", text=f"Inference failed: {error_text}")]
        except Exception as e:
            logger.error(f"Inference failed: {e}")
            error = MCPError(
                "Inference API request failed",
                "E101",
                str(e),
                "Check model availability and API limits"
            )
            return [TextContent(type="text", text=error.to_response())]
    
    elif request.name == "hf_download":
        repo_id = request.arguments.get("repo_id")
        filename = request.arguments.get("filename")
        local_dir = request.arguments.get("local_dir", ".")
        
        try:
            downloaded_path = hf_hub_download(
                repo_id=repo_id,
                filename=filename,
                local_dir=local_dir
            )
            return [TextContent(
                type="text",
                text=f"Downloaded {filename} from {repo_id} to {downloaded_path}"
            )]
        except Exception as e:
            return [TextContent(type="text", text=f"Download failed: {str(e)}")]
    
    elif request.name == "hf_repo_create" and HF_TOKEN:
        repo_id = request.arguments.get("repo_id")
        repo_type = request.arguments.get("repo_type", "model")
        private = request.arguments.get("private", False)
        
        try:
            create_repo(
                repo_id=repo_id,
                repo_type=repo_type,
                private=private,
                token=HF_TOKEN
            )
            return [TextContent(
                type="text",
                text=f"Created {repo_type} repository: {repo_id}"
            )]
        except Exception as e:
            return [TextContent(type="text", text=f"Repository creation failed: {str(e)}")]
    
    elif request.name == "load_model_locally":
        model_id = request.arguments.get("model_id")
        task = request.arguments.get("task", "text-generation")
        
        try:
            if model_id in loaded_models:
                return [TextContent(type="text", text=f"Model {model_id} already loaded")]
            
            # Check model limit
            if len(loaded_models) >= max_loaded_models:
                # Unload oldest model
                oldest_model = next(iter(loaded_models))
                del loaded_models[oldest_model]
                del loaded_tokenizers[oldest_model]
                logger.info(f"Unloaded {oldest_model} to make space")
            
            # Validate model exists
            model_info = get_cached_model_info(model_id)
            
            # Load tokenizer
            tokenizer = AutoTokenizer.from_pretrained(model_id)
            loaded_tokenizers[model_id] = tokenizer
            
            # Load model based on task
            if task == "text-generation":
                model = AutoModelForCausalLM.from_pretrained(
                    model_id, 
                    torch_dtype=torch.float16, 
                    device_map="auto",
                    low_cpu_mem_usage=True
                )
            else:
                model = AutoModelForSequenceClassification.from_pretrained(model_id)
            
            loaded_models[model_id] = model
            logger.info(f"Successfully loaded {model_id}")
            
            return [TextContent(
                type="text",
                text=f"Successfully loaded {model_id} for {task}"
            )]
        except MCPError:
            raise
        except Exception as e:
            logger.error(f"Model loading failed: {e}")
            raise MCPError(
                f"Failed to load model {model_id}",
                "E102",
                str(e),
                "Check model availability and system memory"
            )
    
    elif request.name == "local_inference":
        model_id = request.arguments.get("model_id")
        inputs = request.arguments.get("inputs")
        max_length = request.arguments.get("max_length", 50)
        
        try:
            if model_id not in loaded_models:
                return [TextContent(type="text", text=f"Model {model_id} not loaded. Use load_model_locally first.")]
            
            model = loaded_models[model_id]
            tokenizer = loaded_tokenizers[model_id]
            
            # Tokenize input
            input_ids = tokenizer.encode(inputs, return_tensors="pt")
            
            # Generate
            with torch.no_grad():
                outputs = model.generate(input_ids, max_length=max_length, do_sample=True, temperature=0.7)
            
            # Decode output
            result = tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            return [TextContent(
                type="text",
                text=f"Local inference result:\n{result}"
            )]
        except Exception as e:
            return [TextContent(type="text", text=f"Local inference failed: {str(e)}")]
    
    elif request.name == "compare_models":
        model_ids = request.arguments.get("model_ids", [])
        criteria = request.arguments.get("criteria", ["downloads", "size", "task"])
        
        try:
            comparison = []
            for model_id in model_ids:
                model_info = get_cached_model_info(model_id)
                
                model_data = {
                    "model_id": model_id,
                    "downloads": getattr(model_info, "downloads", 0),
                    "likes": getattr(model_info, "likes", 0),
                    "task": getattr(model_info, "pipeline_tag", "unknown"),
                    "size_mb": getattr(model_info, "safetensors", {}).get("total", 0) // (1024*1024) if hasattr(model_info, "safetensors") else "unknown",
                    "library": getattr(model_info, "library_name", "unknown")
                }
                comparison.append(model_data)
            
            # Sort by downloads (most popular first)
            comparison.sort(key=lambda x: x["downloads"], reverse=True)
            
            # Format comparison table
            result = "Model Comparison:\n\n"
            result += f"{'Model':<30} {'Downloads':<10} {'Task':<20} {'Size (MB)':<10} {'Likes':<8}\n"
            result += "-" * 80 + "\n"
            
            for model in comparison:
                result += f"{model['model_id']:<30} {model['downloads']:<10} {model['task']:<20} {model['size_mb']:<10} {model['likes']:<8}\n"
            
            # Add recommendations
            result += "\n\nRecommendations:\n"
            result += f"• Most Popular: {comparison[0]['model_id']} ({comparison[0]['downloads']} downloads)\n"
            
            smallest = min(comparison, key=lambda x: x['size_mb'] if isinstance(x['size_mb'], int) else float('inf'))
            if isinstance(smallest['size_mb'], int):
                result += f"• Smallest: {smallest['model_id']} ({smallest['size_mb']} MB)\n"
            
            return [TextContent(type="text", text=result)]
        except Exception as e:
            return [TextContent(type="text", text=f"Model comparison failed: {str(e)}")]
    
    elif request.name == "hf_upload_file" and HF_TOKEN:
        repo_id = request.arguments.get("repo_id")
        path_or_fileobj = request.arguments.get("path_or_fileobj")
        path_in_repo = request.arguments.get("path_in_repo")
        commit_message = request.arguments.get("commit_message", "Upload file via MCP")
        
        try:
            upload_file(
                path_or_fileobj=path_or_fileobj,
                path_in_repo=path_in_repo,
                repo_id=repo_id,
                commit_message=commit_message,
                token=HF_TOKEN
            )
            return [TextContent(
                type="text",
                text=f"Uploaded {path_or_fileobj} to {repo_id}/{path_in_repo}"
            )]
        except Exception as e:
            return [TextContent(type="text", text=f"Upload failed: {str(e)}")]
    
    return [TextContent(type="text", text=f"Unknown tool: {request.name}")]

async def main():
    """Main entry point for the server."""
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    asyncio.run(main())