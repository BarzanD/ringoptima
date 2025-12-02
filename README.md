# 📊 Data Transformer - iOS Liquid Glass Edition

En elegant web-applikation för att transformera CSV-data med en vacker iOS Liquid Glass-design.

## ✨ Funktioner

- **Drag & Drop**: Släpp din CSV-fil direkt i webbläsaren
- **Automatisk transformation**: Konverterar "Före"-format till "Efter"-format
- **Visuell feedback**: Se resultaten i en elegant glasmorfism-design
- **Statistik**: Få omedelbar överblick över antal rader, telefonnummer och företag
- **Export**: Ladda ner den transformerade datan som CSV

## 🎨 Design

Applikationen använder iOS Liquid Glass-design med:
- Frostat glas-effekter (backdrop-filter)
- Gradient-bakgrunder
- Mjuka skuggor och rundade hörn
- Subtila animationer
- Responsiv design för alla skärmstorlekar

## 🚀 Användning

1. Öppna `data-transformer.html` i din webbläsare
2. Dra och släpp din CSV-fil (eller klicka för att välja fil)
3. Klicka på "✨ Transformera Data"
4. Se resultaten och statistik
5. Ladda ner den transformerade filen

## 📋 Vad transformeras?

Applikationen extraherar och strukturerar:
- **Telefonnummer**: Rensar och separerar alla telefonnummer
- **Operatörer**: Extraherar mobiloperatörer (Tele2, Telenor, Telia, etc.)
- **Företag**: Hämtar företagsnamn från Bolagsengagemang-sektionen
- **Roller**: Extraherar styrelseroller (Styrelseledamot, Styrelsesuppleant, etc.)

Flera värden i samma kategori separeras med nyradstecken.

## 🔧 Teknisk information

- **Ingen server krävs**: Allt körs lokalt i din webbläsare
- **Ingen data laddas upp**: Din data stannar på din dator
- **Modern JavaScript**: Använder ES6+ funktioner
- **CSV-parsing**: Hanterar komplexa CSV-filer med citattecken och nyradstecken

## 📂 Filer

- `data-transformer.html` - Huvudapplikationen (allt-i-ett fil)
- `transform_fil.py` - Python-version av transformationslogiken
- `README.md` - Denna fil

## 💡 Tips

- Applikationen fungerar bäst i moderna webbläsare (Chrome, Safari, Firefox, Edge)
- För stora filer kan transformationen ta några sekunder
- Scrolla i tabellen för att se alla resultat
- Exporterade filer får automatiskt suffix `_transformed.csv`

## 🎯 Kompatibilitet

- ✅ Google Chrome (rekommenderas)
- ✅ Safari
- ✅ Firefox
- ✅ Microsoft Edge
- ✅ Mobila webbläsare (iOS Safari, Chrome Mobile)

Skapad med ❤️ och CSS backdrop-filter magic!
