#!/usr/bin/env python3
"""CLI for testing the MCP Hugging Face server."""

import asyncio
import json
from huggingface_hub import HfApi

async def test_basic_functionality():
    """Test basic HF API functionality."""
    print("Testing Hugging Face API connection...")
    
    hf_api = HfApi()
    
    # Test listing models
    print("\n1. Testing model listing...")
    models = list(hf_api.list_models(limit=5))
    for model in models:
        print(f"  - {model.id} ({getattr(model, 'pipeline_tag', 'N/A')})")
    
    # Test model info
    print("\n2. Testing model info...")
    try:
        model_info = hf_api.model_info("microsoft/DialoGPT-medium")
        print(f"  - Model: {model_info.id}")
        print(f"  - Downloads: {getattr(model_info, 'downloads', 0)}")
        print(f"  - Task: {getattr(model_info, 'pipeline_tag', 'N/A')}")
    except Exception as e:
        print(f"  - Error: {e}")
    
    # Test dataset listing
    print("\n3. Testing dataset listing...")
    datasets = list(hf_api.list_datasets(limit=3))
    for dataset in datasets:
        print(f"  - {dataset.id}")
    
    print("\n✅ Basic functionality test completed!")

if __name__ == "__main__":
    asyncio.run(test_basic_functionality())