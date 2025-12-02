#!/bin/bash

# Ringoptima GitHub Pages Deploy Script
# Detta script hjälper dig att deploya till GitHub Pages

echo "🚀 Ringoptima GitHub Pages Deploy"
echo "=================================="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git är inte installerat"
    echo "Installera via: brew install git"
    exit 1
fi

# Check if gh (GitHub CLI) is installed
if ! command -v gh &> /dev/null; then
    echo "⚠️  GitHub CLI är inte installerat"
    echo "Installera via: brew install gh"
    echo ""
    echo "Eller fortsätt manuellt via GitHub.com"
    read -p "Fortsätt manuellt? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    MANUAL=true
fi

# Variables
REPO_NAME="ringoptima"
SOURCE_FILE="/Users/a313/Desktop/ringoptima.html"
WORK_DIR="/tmp/ringoptima-deploy"

echo "📁 Förbereder deployment..."

# Create work directory
rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

# Copy and rename file
cp "$SOURCE_FILE" index.html

# Create README
cat > README.md << 'EOF'
# Ringoptima

Smart databehandling för moderna företag.

## Live Demo
Tillgänglig på GitHub Pages: https://[ditt-användarnamn].github.io/ringoptima/

## Funktioner
- 📊 CSV-datatransformation
- 📱 Operatörsfiltrering
- 🔄 Sortering efter telefonnummer
- 🎨 Premium Liquid Glass design
- 📱 Fullständigt responsiv

## Användning
Besök länken ovan och ladda upp din CSV-fil!

## Säkerhet
All data bearbetas lokalt i webbläsaren. Ingen data skickas till servern.

---
Byggt med ❤️ och modern web-teknologi
EOF

# Initialize git if manual
if [ "$MANUAL" = true ]; then
    echo ""
    echo "📋 MANUELLA STEG:"
    echo "================"
    echo ""
    echo "1. Skapa nytt GitHub repository:"
    echo "   - Gå till https://github.com/new"
    echo "   - Repository namn: ringoptima"
    echo "   - Välj 'Public'"
    echo "   - Klicka 'Create repository'"
    echo ""
    echo "2. Följ instruktionerna på GitHub för att pusha denna kod"
    echo "   Filerna finns i: $WORK_DIR"
    echo ""
    echo "3. Aktivera GitHub Pages:"
    echo "   - Settings → Pages"
    echo "   - Source: main branch"
    echo "   - Save"
    echo ""

    git init
    git add .
    git commit -m "Initial commit: Ringoptima app"

    echo "Git repository initierat i: $WORK_DIR"
    echo ""
    read -p "Öppna GitHub i webbläsaren? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "https://github.com/new"
    fi

else
    # Automatic deployment with gh
    echo "🔐 Loggar in på GitHub..."
    gh auth status || gh auth login

    echo "📦 Skapar repository..."
    gh repo create "$REPO_NAME" --public --source=. --remote=origin

    echo "📝 Initierar git..."
    git init
    git add .
    git commit -m "Initial commit: Ringoptima app"

    echo "⬆️  Pushar till GitHub..."
    git branch -M main
    git push -u origin main

    echo "🌐 Aktiverar GitHub Pages..."
    gh api repos/:owner/$REPO_NAME/pages -X POST -f source[branch]=main -f source[path]=/

    echo ""
    echo "✅ KLART! Din app är nu live på:"
    GITHUB_USER=$(gh api user -q .login)
    echo "🔗 https://$GITHUB_USER.github.io/$REPO_NAME/"
    echo ""

    read -p "Öppna i webbläsare? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "https://$GITHUB_USER.github.io/$REPO_NAME/"
    fi
fi

echo ""
echo "✨ Deployment komplett!"
