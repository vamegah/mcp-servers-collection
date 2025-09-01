@echo off
echo 🔧 Installing missing dependencies and testing servers...
echo.

echo 📦 Installing MCP SDK for Node.js servers...
cd mcp-server-obsidian
call npm install @modelcontextprotocol/sdk front-matter glob
cd ..

cd mcp-server-media  
call npm install @modelcontextprotocol/sdk fluent-ffmpeg sharp glob
cd ..

echo.
echo 🐍 Installing Python MCP dependencies...
pip install mcp

echo.
echo 🧪 Running tests...
node test-quick.js

echo.
echo ✅ Setup complete! 
echo.
echo 🚀 To start servers manually:
echo   Obsidian: cd mcp-server-obsidian ^&^& set OBSIDIAN_VAULT_PATH=C:\path\to\vault ^&^& npm start
echo   Media:    cd mcp-server-media ^&^& npm start  
echo   HF:       cd mcp-server-huggingface ^&^& python -m mcp_server_huggingface.server

pause