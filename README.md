# Il nostro sole

Visualizzazione radiale della nostra chat WhatsApp, ispirata a Giorgia Lupi.
Ogni raggio è un giorno; la lunghezza è il numero di segnali, il colore il tipo.

## Struttura
- `web/` – il sito statico (nessuna build)
  - `index.html` – markup della pagina
  - `css/style.css` – stile; i colori dei tipi sono le variabili `--t-*` in cima
  - `js/parser.js` – parsing dell'export WhatsApp (iPhone/Android, IT/EN)
  - `js/example.js` – dati di esempio (eliminabile)
  - `js/main.js` – aggregazione per giorno, disegno D3, tooltip, filtri, animazione
- `scripts/` – script Node da lanciare in locale (preparazione e upload delle foto)
- `supabase/migrations/` – migrazioni SQL
- `tests/fixtures/` – dati di test **inventati**: mai la chat vera nella repo

## Avvio del sito
Apri `web/index.html` nel browser (funziona anche da file locale).
Per servirlo: `python3 -m http.server -d web` e vai su http://localhost:8000

Gli script del sito sono normali `<script>` (non moduli ES) così la pagina si apre anche con doppio clic.

## Privacy
Export della chat, media e `.env` sono esclusi da `.gitignore`. Non vanno committati, né citati nei log o nei messaggi di commit.
