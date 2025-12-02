#!/bin/bash

# Ringoptima GitHub Pages Setup
# Detta script skapar en publik URL for Ringoptima

echo "========================================"
echo "  Ringoptima - GitHub Pages Setup"
echo "========================================"
echo ""

# Check for Homebrew
if ! command -v brew &> /dev/null; then
    echo "Homebrew behövs. Installerar..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Check for GitHub CLI
if ! command -v gh &> /dev/null; then
    echo "Installerar GitHub CLI..."
    brew install gh
fi

# Login to GitHub
echo ""
echo "Loggar in på GitHub..."
echo "(En webbläsare öppnas - följ instruktionerna)"
echo ""
gh auth login --web --git-protocol https

# Navigate to project
cd /Users/a313/Desktop/B313

# Initialize git if needed
if [ ! -d ".git" ]; then
    echo ""
    echo "Initierar Git repository..."
    git init
    git branch -M main
fi

# Create index.html from ringoptima-v2.html
echo ""
echo "Förbereder filer..."
cp ringoptima-v2.html index.html

# Add all files
git add index.html ringoptima-v2.html

# Commit
git commit -m "Initial Ringoptima deployment"

# Create GitHub repository
echo ""
echo "Skapar GitHub repository..."
REPO_NAME="ringoptima"

# Check if repo exists, if not create it
if ! gh repo view "$REPO_NAME" &> /dev/null; then
    gh repo create "$REPO_NAME" --public --source=. --push
else
    echo "Repository finns redan, pushar uppdateringar..."
    git remote add origin "https://github.com/$(gh api user --jq .login)/$REPO_NAME.git" 2>/dev/null || true
    git push -u origin main --force
fi

# Enable GitHub Pages
echo ""
echo "Aktiverar GitHub Pages..."
gh api -X POST "/repos/$(gh api user --jq .login)/$REPO_NAME/pages" \
    -f source='{"branch":"main","path":"/"}' 2>/dev/null || \
gh api -X PUT "/repos/$(gh api user --jq .login)/$REPO_NAME/pages" \
    -f source='{"branch":"main","path":"/"}'

# Get the URL
USERNAME=$(gh api user --jq .login)
echo ""
echo "========================================"
echo "  KLART!"
echo "========================================"
echo ""
echo "Din Ringoptima URL:"
echo "  https://$USERNAME.github.io/$REPO_NAME/"
echo ""
echo "Det kan ta 1-2 minuter innan sidan är live."
echo ""
echo "For att uppdatera i framtiden, kör:"
echo "  ./update-live.sh"
echo ""
