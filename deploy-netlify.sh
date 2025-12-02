#!/bin/bash

# Ringoptima Netlify Deploy Script
# Detta script deplouar till Netlify automatiskt

echo "🚀 Ringoptima Netlify Deploy"
echo "============================"
echo ""

# Check if netlify-cli is installed
if ! command -v netlify &> /dev/null; then
    echo "📦 Installerar Netlify CLI..."
    npm install -g netlify-cli
fi

# Variables
SOURCE_FILE="/Users/a313/Desktop/ringoptima.html"
DEPLOY_DIR="/tmp/ringoptima-netlify"

echo "📁 Förbereder deployment..."

# Create deploy directory
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Copy and rename file
cp "$SOURCE_FILE" "$DEPLOY_DIR/index.html"

# Create netlify.toml for configuration
cat > "$DEPLOY_DIR/netlify.toml" << 'EOF'
[build]
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
EOF

cd "$DEPLOY_DIR"

echo "🔐 Loggar in på Netlify..."
netlify login

echo ""
echo "Välj deployment-metod:"
echo "1) Ny site (första gången)"
echo "2) Uppdatera befintlig site"
read -p "Val (1/2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "🌐 Skapar ny Netlify site..."
    netlify deploy --prod

    echo ""
    echo "✅ KLART! Din site är nu live!"
    echo ""
    echo "📋 Nästa steg:"
    echo "1. Gå till Netlify dashboard"
    echo "2. Hitta din nya site"
    echo "3. Kopiera URL:en"

else
    echo ""
    echo "⬆️  Deplouar uppdatering..."
    netlify deploy --prod

    echo ""
    echo "✅ Uppdatering klar!"
fi

echo ""
echo "💡 Tips:"
echo "- Custom domän: netlify.com → Domain settings"
echo "- Lösenordsskydd: Site settings → Access control"
echo "- Analytics: Site settings → Analytics"

# Open Netlify dashboard
read -p "Öppna Netlify dashboard? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open "https://app.netlify.com"
fi
