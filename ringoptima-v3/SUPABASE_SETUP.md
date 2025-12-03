# Supabase Setup Guide - Ringoptima V3

Detta är en steg-för-steg-guide för att konfigurera Supabase så att din data synkas mellan alla enheter och webbläsare.

## Varför Supabase?

Med Supabase får du:
- ✅ **Data synkas mellan alla enheter** (mobil, desktop, olika datorer)
- ✅ **Data synkas mellan alla webbläsare** (Chrome, Safari, Firefox, etc.)
- ✅ **Automatisk backup** av all data i molnet
- ✅ **Real-time synkning** - ändringar visas omedelbart överallt
- ✅ **Gratis tier** - 500MB databas + 2GB bandwidth/månad
- ✅ **Säker** - Row Level Security (RLS) skyddar din data

## Steg 1: Skapa Supabase-konto (5 minuter)

1. Gå till https://supabase.com
2. Klicka på "Start your project"
3. Logga in med GitHub (rekommenderat) eller email
4. Skapa ett nytt projekt:
   - **Organization**: Skapa en ny eller välj befintlig
   - **Project name**: `ringoptima` (eller valfritt namn)
   - **Database Password**: Välj ett starkt lösenord (spara detta!)
   - **Region**: `North Europe (Stockholm)` (närmast Sverige)
   - **Pricing Plan**: Free (gratis)
5. Klicka "Create new project"
6. Vänta 1-2 minuter medan projektet skapas

## Steg 2: Konfigurera databasen (3 minuter)

1. I din Supabase dashboard, klicka på "SQL Editor" i vänstermenyn
2. Klicka på "+ New query" överst
3. Öppna filen `supabase-schema.sql` från detta projekt
4. Kopiera HELA innehållet från `supabase-schema.sql`
5. Klistra in i SQL Editor
6. Klicka "Run" (eller tryck Cmd/Ctrl + Enter)
7. Du ska se "Success. No rows returned" - perfekt!

**Vad gör detta SQL-script?**
- Skapar tabeller för contacts, batches, call_logs, saved_filters
- Skapar index för snabbare sökningar
- Aktiverar Row Level Security (RLS) så endast du kan se din data
- Skapar automatisk trigger för updated_at timestamps

## Steg 3: Hämta API-nycklar (2 minuter)

1. I Supabase dashboard, klicka på "Project Settings" (kugghjulet) längst ner i vänstermenyn
2. Klicka på "API" i undermenyn
3. Under "Project API keys" hittar du två nycklar:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbG...` (lång sträng)
4. Kopiera dessa två värden

## Steg 4: Konfigurera lokalt projekt (2 minuter)

1. Öppna filen `.env` i projektets rot-mapp
2. Ersätt platsehållarna med dina riktiga värden:

```env
VITE_SUPABASE_URL=https://ditt-projekt-id.supabase.co
VITE_SUPABASE_ANON_KEY=din-anon-key-här
```

**Exempel:**
```env
VITE_SUPABASE_URL=https://abc123xyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
```

3. Spara filen
4. Dev-servern startar om automatiskt

## Steg 5: Testa! (1 minut)

1. Öppna appen i webbläsaren: `http://localhost:5174`
2. Du ska se "Ansluten! Din data synkas nu mellan enheter" (grön toast)
3. Importera några kontakter
4. Öppna samma URL i en annan webbläsare (t.ex. Safari om du använder Chrome)
5. **Samma data ska visas!** 🎉

## Testa på mobilen

1. I terminalen, starta dev-servern med host-flag:
```bash
npm run dev -- --host
```

2. Du får en Network URL, t.ex.: `http://192.168.1.100:5174`
3. Öppna den URL:en på din mobil (samma WiFi-nätverk)
4. **Samma data visas på mobilen!** 🎉

## Viktiga säkerhetspunkter

### Row Level Security (RLS) är aktiverat
- Varje användare får automatiskt ett anonymt ID
- Användare kan endast se sin egen data
- Ingen kan se andras kontakter eller information

### Anon key är säker att dela
- `anon public` key är designad för att användas i frontend-kod
- Den kan bara användas för att läsa/skriva data som tillhör den autentiserade användaren
- Service role key (visas också) ska ALDRIG användas i frontend!

## Felsökning

### "Missing Supabase environment variables"
- Kontrollera att `.env` filen finns i projektets rot
- Kontrollera att du har rätt variabelnamn: `VITE_SUPABASE_URL` och `VITE_SUPABASE_ANON_KEY`
- Starta om dev-servern efter att ha ändrat `.env`

### "User not authenticated"
- Appen loggar in automatiskt anonymt
- Öppna DevTools Console och leta efter auth-fel
- Kontrollera att Supabase Project URL är korrekt

### "Permission denied" eller RLS-fel
- Kontrollera att du körde hela `supabase-schema.sql`
- I Supabase dashboard → Authentication → Policies, verifiera att policies finns för alla tabeller

### Data synkas inte mellan enheter
- Kontrollera att båda enheterna använder samma Supabase-projekt
- Öppna Network tab i DevTools - ska se API-anrop till Supabase
- Testa att ladda om sidan på båda enheterna

## Produktion och deployment

### För GitHub Pages / Vercel / Netlify deployment:

1. **Skapa production environment variables:**
   - GitHub Pages: Settings → Secrets and variables → Actions
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site settings → Build & deploy → Environment

2. **Lägg till dessa variabler:**
```
VITE_SUPABASE_URL=https://ditt-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=din-anon-key
```

3. **Deploy som vanligt:**
   - GitHub Pages: Push till main branch
   - Vercel: `vercel --prod`
   - Netlify: Drag & drop dist-mappen

4. **Viktigt:** Lägg till din production URL i Supabase:
   - Supabase dashboard → Authentication → URL Configuration
   - Lägg till din site URL under "Site URL"
   - Lägg till under "Redirect URLs": `https://din-site.com/**`

## Kostnader och begränsningar (Gratis tier)

Supabase Free tier ger dig:
- ✅ 500MB databas (ca 50,000-100,000 kontakter)
- ✅ 2GB bandwidth/månad (ca 100,000 API-anrop)
- ✅ 50,000 Monthly Active Users
- ✅ Unlimited API requests
- ✅ Social OAuth providers
- ✅ Obegränsad tid (projektet pausas efter 1 vecka inaktivitet)

**För de flesta småföretag är free tier mer än tillräckligt!**

Om du behöver mer:
- Pro plan: $25/månad (8GB databas, 50GB bandwidth, ingen paus)

## Support

Om du stöter på problem:
1. Kolla Supabase dokumentation: https://supabase.com/docs
2. Supabase Discord: https://discord.supabase.com
3. GitHub Issues för Ringoptima V3

## Nästa steg

Nu när du har Supabase uppsatt:
1. ✅ Data synkas mellan alla enheter
2. ✅ Redo för produktion-deployment
3. ✅ Automatisk backup i molnet
4. Överväg att implementera:
   - Email/Password autentisering (istället för anonym)
   - Team-funktionalitet (dela kontakter mellan användare)
   - Real-time subscriptions (se ändringar live)

Lycka till med din Ringoptima V3-app! 🚀
