#!/bin/bash
echo "🚀 Preparing GitHub push..."

git add .
git commit -m "Fix GitHub Actions and finalize v0.1.0

🔧 Fixed Dependencies:
- Updated mcp>=1.0.0 to mcp (correct PyPI package)
- Fixed pyproject.toml and requirements.txt

🧪 Improved CI/CD:
- Separated Node.js and Python testing jobs
- Node.js: Full functional testing (Obsidian + Media)
- Python: Import validation (HuggingFace)
- Test matrix: Node 18/20, Python 3.9/3.10/3.11

✅ All servers tested and working locally
📚 Complete documentation and setup guides"

echo
echo "📤 Pushing to GitHub..."
git push

echo
echo "✅ Push complete!"
echo "🌐 Check GitHub Actions: https://github.com/YOURUSERNAME/mcp-servers-collection/actions"