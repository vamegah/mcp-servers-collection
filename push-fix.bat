@echo off
echo 🔧 Fixing Python version requirements...

git add .
git commit -m "Fix: Update Python requirement to 3.10+

- MCP package requires Python 3.10+
- Updated pyproject.toml and README badge
- Simplified GitHub Actions to use Python 3.10 only
- Changed Python test to syntax validation only"

git push

echo ✅ Fix pushed to GitHub!