# Architecture

## Goal

Build a fast lead finder for website-sales outreach. The tool must retrieve the website listing for businesses without opening each Google Maps details panel manually.

## Correct architecture

```text
React frontend
    ↓
Express backend
    ↓
Google Places API
    ↓
Normalize + score leads
    ↓
CSV export
```

## Why not a click scraper?

A click-each-card scraper is slow because it must:

1. Click a result.
2. Wait for the details panel.
3. Scrape fields.
4. Go back.
5. Repeat.

This is fragile and breaks when Google Maps UI changes.

## Backend modules

```text
server/src/index.js
- Express server
- API routes

server/src/placesApi.js
- Text Search request
- Place Details request
- fallback detail enrichment

server/src/scorer.js
- lead scoring logic

server/src/csv.js
- CSV creation

server/src/mockData.js
- sample leads when no API key is available
```

## Frontend modules

```text
client/src/App.jsx
- main app state
- search form
- filter buttons
- results table
- export button

client/src/App.css
- simple dashboard styling
```

## Future additions

- SQLite storage
- website status checker queue
- website quality score
- outreach-ready CSV columns
- optional Chrome extension wrapper after backend works
