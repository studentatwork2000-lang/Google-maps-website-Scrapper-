# Website Sales Lead Finder MVP

A local lead finder starter project for collecting business leads through the official Google Places API workflow, with a focus on finding whether a business has a listed website **without opening each Google Maps business panel manually**.

This project is intentionally **not** a clone of any paid extension and does not include code from any third-party scraper. It recreates the desired workflow independently:

1. Search businesses by niche + location.
2. Collect place IDs and details through Google Places API.
3. Retrieve key fields like website, phone, rating, review count, address, and Google Maps URL.
4. Score leads for website-sales outreach.
5. Export results as CSV.

## Why this workflow exists

The main problem: Google Maps left-panel preview cards often do not show the website link. A bad scraper clicks each business card one by one to open the details panel. That is slow and fragile.

This workflow avoids that by using place detail data through an API-style workflow. It gets the website field using place data, not by clicking each listing.

## Requirements

- Node.js 20+
- npm
- Google Places API key with Places API enabled
- Billing enabled on Google Cloud for real Google Places API usage

## Setup

```bash
cd lead-finder-mvp-starter
cp .env.example server/.env
```

Edit `server/.env`:

```bash
GOOGLE_PLACES_API_KEY=your_api_key_here
USE_MOCK=false
PORT=8787
```

Install dependencies:

```bash
npm run install:all
```

Run locally:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:8787
```

## Mock mode

If you do not have an API key yet, set:

```bash
USE_MOCK=true
```

The app will return sample leads so you can test the UI/export flow.

## Important note

Do not turn this into a click-each-business-card scraper. The entire point is to avoid the slow frontend panel-click method.
