@echo off
echo Installing MCP Server Dependencies...
echo.

echo 🐍 Installing Python dependencies...
cd mcp-server-huggingface
pip install -e .
if %errorlevel% neq 0 (
    echo ❌ Python dependencies failed
    pause
    exit /b 1
)
cd ..

echo.
echo 📝 Installing Obsidian server dependencies...
cd mcp-server-obsidian
call npm install
if %errorlevel% neq 0 (
    echo ❌ Obsidian dependencies failed
    pause
    exit /b 1
)
cd ..

echo.
echo 🎬 Installing Media server dependencies...
cd mcp-server-media
call npm install
if %errorlevel% neq 0 (
    echo ❌ Media dependencies failed
    pause
    exit /b 1
)
cd ..

echo.
echo ✅ All dependencies installed successfully!
echo.
echo 🧪 Running quick test...
node test-quick.js

pause