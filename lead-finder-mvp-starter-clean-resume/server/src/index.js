import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { searchPlaces } from './placesApi.js';
import { scoreLead } from './scorer.js';
import { createCsv } from './csv.js';
import { getMockLeads } from './mockData.js';
import { receiveExtensionPlaces, enrichExtensionPlaces } from './extensionEnrichment.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(cors({ origin: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mode: process.env.USE_MOCK === 'true' ? 'mock' : 'real' });
});

app.post('/api/search', async (req, res) => {
  try {
    const { query, location, limit = 50 } = req.body || {};

    if (!query || !String(query).trim()) {
      return res.status(400).json({ error: 'Search phrase is required.' });
    }

    if (!location || !String(location).trim()) {
      return res.status(400).json({ error: 'Location is required.' });
    }

    const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));

    let leads;
    if (process.env.USE_MOCK === 'true') {
      leads = getMockLeads(query, location).slice(0, safeLimit);
    } else {
      leads = await searchPlaces({ query, location, limit: safeLimit });
    }

    const scored = leads.map((lead) => ({ ...lead, ...scoreLead(lead) }));

    res.json({ leads: scored, count: scored.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Search failed.' });
  }
});


app.post('/api/extension/places', (req, res) => {
  try {
    const result = receiveExtensionPlaces(req.body || {});
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Could not receive extension places.' });
  }
});

app.post('/api/extension/enrich', async (req, res) => {
  try {
    const leads = await enrichExtensionPlaces(req.body || {});
    res.json({ ok: true, leads, count: leads.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Extension enrichment failed.' });
  }
});

app.post('/api/export/csv', (req, res) => {
  try {
    const leads = Array.isArray(req.body?.leads) ? req.body.leads : [];
    const csv = createCsv(leads);
    const filename = `website-sales-leads-${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message || 'CSV export failed.' });
  }
});

app.listen(port, () => {
  console.log(`Lead Finder server running on http://localhost:${port}`);
});
