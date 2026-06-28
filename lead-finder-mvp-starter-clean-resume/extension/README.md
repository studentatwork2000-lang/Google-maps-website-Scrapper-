# Lead Finder Maps Companion Extension

This unpacked Chrome/Brave extension runs only on Google Maps pages. It adds a floating panel with Start, Pause, Reset, Send / Enrich, Send only, and Open Dashboard controls.

## Local backend

Default backend URL: `http://localhost:8787`. Change it from the extension popup or the floating panel.

## How it collects

The content script watches loaded Google Maps search-result links, auto-scrolls the results feed, and collects stable identifiers that are already present in loaded rows: Google Maps URL, CID when available, place ID when parseable, plus business name/address fallbacks. It does **not** open each business card and does **not** infer website status from Maps preview cards.

## Mock-mode test

1. Run the app with `USE_MOCK=true` for the server.
2. Load this folder as an unpacked extension.
3. Open Google Maps, search manually, click **Start**, then **Send / Enrich**.
4. The backend returns mock enriched lead rows using backend-only website status rules.
