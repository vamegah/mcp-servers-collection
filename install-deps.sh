#!/bin/bash
set -e

echo "Installing MCP Server Dependencies..."
echo

echo "🐍 Installing Python dependencies..."
cd mcp-server-huggingface
pip install -e .
cd ..

echo
echo "📝 Installing Obsidian server dependencies..."
cd mcp-server-obsidian
npm install
cd ..

echo
echo "🎬 Installing Media server dependencies..."
cd mcp-server-media
npm install
cd ..

echo
echo "✅ All dependencies installed successfully!"
echo

echo "🧪 Running quick test..."
node test-quick.js