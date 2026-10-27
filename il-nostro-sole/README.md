# Il nostro sole

Visualizzazione radiale di una chat WhatsApp, ispirata a Giorgia Lupi.
Ogni raggio è un giorno; la lunghezza è il numero di segnali, il colore il tipo.

## Avvio
Apri `index.html` nel browser (funziona anche da file locale).
Per servirlo: `python3 -m http.server` nella cartella e vai su http://localhost:8000

## Struttura
- `index.html` – markup della pagina
- `css/style.css` – stile; i colori dei tipi sono le variabili `--t-*` in cima
- `js/parser.js` – parsing dell'export WhatsApp (iPhone/Android, IT/EN)
- `js/example.js` – dati di esempio (eliminabile)
- `js/main.js` – aggregazione per giorno, disegno D3, tooltip, filtri, animazione

Gli script sono normali `<script>` (non moduli ES) così la pagina si apre anche con doppio clic.
