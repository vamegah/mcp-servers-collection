"""Tests for the MCP Hugging Face server."""

import pytest
import asyncio
from mcp_server_huggingface.server import app

@pytest.mark.asyncio
async def test_list_resources():
    """Test listing resources."""
    resources = await app.list_resources()
    assert len(resources) >= 3
    assert any(r.uri == "hf://models" for r in resources)
    assert any(r.uri == "hf://datasets" for r in resources)
    assert any(r.uri == "hf://spaces" for r in resources)

@pytest.mark.asyncio 
async def test_list_tools():
    """Test listing tools."""
    tools = await app.list_tools()
    tool_names = [t.name for t in tools]
    assert "search_hub" in tool_names
    assert "inference_api_run" in tool_names
    assert "hf_download" in tool_names