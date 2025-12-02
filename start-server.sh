#!/bin/bash

# Ringoptima Local Server Starter
# Detta script startar en lokal webbserver

echo "🚀 Startar Ringoptima lokal server..."
echo ""

# Hitta IP-adress
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")

echo "📡 Server startar på:"
echo "   Denna dator: http://localhost:8000/ringoptima.html"
echo "   Andra enheter: http://$IP:8000/ringoptima.html"
echo ""
echo "📱 Öppna ovanstående länk på din mobil (samma WiFi)"
echo ""
echo "⚠️  Tryck Ctrl+C för att stoppa servern"
echo ""

# Starta Python server
cd /Users/a313/Desktop
python3 -m http.server 8000
