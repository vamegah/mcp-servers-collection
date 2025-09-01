#!/usr/bin/env python3
"""Test script for MCP servers functionality."""

import asyncio
import json
import subprocess
import sys
import tempfile
import os
from pathlib import Path

async def test_huggingface_server():
    """Test Hugging Face MCP server basic functionality."""
    print("🤗 Testing Hugging Face Server...")
    
    try:
        # Test server startup
        proc = subprocess.Popen([
            sys.executable, "-m", "mcp_server_huggingface.server"
        ], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        cwd="mcp-server-huggingface", text=True)
        
        # Test list_tools request
        request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/list"
        }
        
        proc.stdin.write(json.dumps(request) + "\n")
        proc.stdin.flush()
        
        # Read response
        response = proc.stdout.readline()
        if response:
            data = json.loads(response)
            tools = data.get("result", {}).get("tools", [])
            tool_names = [t["name"] for t in tools]
            
            expected_tools = ["search_hub", "inference_api_run", "load_model_locally", "compare_models"]
            found_tools = [t for t in expected_tools if t in tool_names]
            
            print(f"  ✅ Found {len(found_tools)}/{len(expected_tools)} expected tools")
            if len(found_tools) == len(expected_tools):
                print("  ✅ Hugging Face server: PASS")
            else:
                print(f"  ❌ Missing tools: {set(expected_tools) - set(found_tools)}")
        
        proc.terminate()
        
    except Exception as e:
        print(f"  ❌ Hugging Face server test failed: {e}")

def test_obsidian_server():
    """Test Obsidian MCP server with temporary vault."""
    print("📝 Testing Obsidian Server...")
    
    try:
        # Create temporary vault
        with tempfile.TemporaryDirectory() as temp_vault:
            # Create test files
            test_note = Path(temp_vault) / "test-note.md"
            test_note.write_text("---\ntags: [test]\n---\n\n# Test Note\n\nThis is a test note.")
            
            test_canvas = Path(temp_vault) / "test-canvas.canvas"
            test_canvas.write_text('{"nodes": [], "edges": []}')
            
            # Set environment variable
            env = os.environ.copy()
            env["OBSIDIAN_VAULT_PATH"] = temp_vault
            
            # Test server startup
            proc = subprocess.Popen([
                "node", "src/index.js"
            ], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            cwd="mcp-server-obsidian", text=True, env=env)
            
            # Test list_tools request
            request = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "tools/list"
            }
            
            proc.stdin.write(json.dumps(request) + "\n")
            proc.stdin.flush()
            
            # Read response
            response = proc.stdout.readline()
            if response:
                data = json.loads(response)
                tools = data.get("result", {}).get("tools", [])
                tool_names = [t["name"] for t in tools]
                
                expected_tools = ["create_note", "query_dataview", "create_canvas_node"]
                found_tools = [t for t in expected_tools if t in tool_names]
                
                print(f"  ✅ Found {len(found_tools)}/{len(expected_tools)} expected tools")
                if len(found_tools) == len(expected_tools):
                    print("  ✅ Obsidian server: PASS")
                else:
                    print(f"  ❌ Missing tools: {set(expected_tools) - set(found_tools)}")
            
            proc.terminate()
            
    except Exception as e:
        print(f"  ❌ Obsidian server test failed: {e}")

def test_media_server():
    """Test Media MCP server basic functionality."""
    print("🎬 Testing Media Server...")
    
    try:
        # Check FFmpeg availability
        try:
            subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
            ffmpeg_available = True
        except (subprocess.CalledProcessError, FileNotFoundError):
            ffmpeg_available = False
            print("  ⚠️  FFmpeg not found - video features will be limited")
        
        # Test server startup
        proc = subprocess.Popen([
            "node", "src/index.js"
        ], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        cwd="mcp-server-media", text=True)
        
        # Test list_tools request
        request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/list"
        }
        
        proc.stdin.write(json.dumps(request) + "\n")
        proc.stdin.flush()
        
        # Read response
        response = proc.stdout.readline()
        if response:
            data = json.loads(response)
            tools = data.get("result", {}).get("tools", [])
            tool_names = [t["name"] for t in tools]
            
            expected_tools = ["resize_image", "convert_image", "batch_process", "apply_preset"]
            found_tools = [t for t in expected_tools if t in tool_names]
            
            print(f"  ✅ Found {len(found_tools)}/{len(expected_tools)} expected tools")
            if len(found_tools) == len(expected_tools):
                print("  ✅ Media server: PASS")
            else:
                print(f"  ❌ Missing tools: {set(expected_tools) - set(found_tools)}")
        
        proc.terminate()
        
    except Exception as e:
        print(f"  ❌ Media server test failed: {e}")

def check_dependencies():
    """Check if required dependencies are installed."""
    print("🔍 Checking Dependencies...")
    
    # Check Python dependencies
    try:
        import mcp
        print("  ✅ MCP Python SDK installed")
    except ImportError:
        print("  ❌ MCP Python SDK missing - run: pip install mcp")
        return False
    
    try:
        import transformers
        print("  ✅ Transformers installed")
    except ImportError:
        print("  ❌ Transformers missing - run: pip install transformers")
        return False
    
    # Check Node.js
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"  ✅ Node.js {result.stdout.strip()} installed")
        else:
            print("  ❌ Node.js not found")
            return False
    except FileNotFoundError:
        print("  ❌ Node.js not found")
        return False
    
    # Check npm packages (basic check)
    obsidian_package = Path("mcp-server-obsidian/package.json")
    media_package = Path("mcp-server-media/package.json")
    
    if obsidian_package.exists():
        print("  ✅ Obsidian server package.json found")
    else:
        print("  ❌ Obsidian server package.json missing")
    
    if media_package.exists():
        print("  ✅ Media server package.json found")
    else:
        print("  ❌ Media server package.json missing")
    
    return True

def main():
    """Run all tests."""
    print("🧪 MCP Servers Test Suite\n")
    
    if not check_dependencies():
        print("\n❌ Dependency check failed. Please install missing dependencies.")
        return
    
    print("\n" + "="*50)
    
    # Test each server
    asyncio.run(test_huggingface_server())
    print()
    
    test_obsidian_server()
    print()
    
    test_media_server()
    print()
    
    print("="*50)
    print("🎉 Test suite completed!")
    print("\nTo run individual servers:")
    print("  HuggingFace: cd mcp-server-huggingface && python -m mcp_server_huggingface.server")
    print("  Obsidian:    cd mcp-server-obsidian && npm start")
    print("  Media:       cd mcp-server-media && npm start")

if __name__ == "__main__":
    main()