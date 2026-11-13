# Ask TastyDose – AI chatbot za stranke

Samostojna stran za klepet (isti stil kot *Swipe your Daily Dose*), ki odgovarja na vprašanja strank
iz baze znanja (tastydose.com + strankam namenjeni deli CS handbooka). Odgovarja v jeziku stranke.

## Datoteke
- `index.html` – stran za klepet (21 jezikov za pozdrav in gumbe, jezik se izbere iz brskalnika; za test dodaj `?lang=de`)
- `api/chat.js` – Vercel funkcija, ki pokliče AI (Gemini brezplačno ali Claude)
- `lib/knowledge.js` – **baza znanja in pravila bota**. Tukaj urejaš, kaj bot ve (cene, okusi, dostava …).

## Kateri AI
V Vercelu nastavi ENEGA od ključev (če jih je več, velja prvi po vrsti):
1. `OPENAI_API_KEY` – OpenAI (neobvezno `OPENAI_MODEL`, privzeto `gpt-4.1-mini`)
2. `GEMINI_API_KEY` – Google Gemini (ima brezplačen paket)
3. `ANTHROPIC_API_KEY` – Claude

## Deploy (GitHub + Vercel) – BREZPLAČNO
1. Na GitHubu ustvari nov repo, npr. `tastydose-chat`, in naloži vse datoteke (z mapama `api` in `lib`).
2. Na vercel.com: **Add New → Project** → izberi repo → **Deploy**.
3. Brezplačen ključ: https://aistudio.google.com/apikey → prijava z Google računom → **Create API key** → kopiraj.
4. V Vercelu: **Settings → Environment Variables** → `GEMINI_API_KEY` = ključ → **Save**.
5. **Deployments → ⋯ → Redeploy**. Gotovo.

Gemini brezplačni paket ima omejitev števila vprašanj na minuto/dan (za hackathon dovolj) in Google lahko
brezplačne pogovore uporabi za izboljšave svojih modelov. Za resno rabo na spletni strani je bolje plačljiv ključ.

Neobvezno: `GEMINI_MODEL` (privzeto `gemini-2.5-flash`). Namesto Gemini lahko uporabiš tudi Claude:
nastavi samo `ANTHROPIC_API_KEY` (plačljivo, privzeti model `claude-haiku-4-5`).

## Posodabljanje znanja
Uredi `lib/knowledge.js` (na GitHubu klikni svinčnik), shrani → Vercel sam objavi novo verzijo.
Ko se podatki na spletni strani in v handbooku razlikujejo, velja spletna stran.

## Varnost
- Bot ne vidi naročil in ne more ničesar spreminjati; za naročila usmeri na support@tastydose.com.
- Ne deli kod za popust ali internih podatkov, ne daje zdravniških nasvetov.
- API ključ je samo v Vercelu, nikoli v kodi.
