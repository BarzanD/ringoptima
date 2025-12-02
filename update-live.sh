#!/bin/bash

# Ringoptima Update Script
# Kör detta efter att Claude har gjort ändringar

echo "Uppdaterar Ringoptima live..."
echo ""

cd /Users/a313/Desktop/B313

# Copy latest version to index.html
cp ringoptima-v2.html index.html

# Stage changes
git add -A

# Commit with timestamp
TIMESTAMP=$(date "+%Y-%m-%d %H:%M")
git commit -m "Update: $TIMESTAMP"

# Push to GitHub
git push origin main

echo ""
echo "Klart! Ändringarna är live inom 1-2 minuter."
echo ""
