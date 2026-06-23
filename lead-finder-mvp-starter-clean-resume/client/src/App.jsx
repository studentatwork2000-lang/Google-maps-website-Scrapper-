import { useMemo, useState } from 'react';

const INITIAL_BATCH = `Indian restaurants | Birmingham\nIndian restaurants near Birmingham\nIndian restaurants, Birmingham`;
const FILTERS = [
  ['all', 'All'],
  ['gold', 'Gold only'],
  ['noWebsite', 'No website'],
  ['hasWebsite', 'Has website']
];

function parseSearchLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  if (trimmed.includes('|')) {
    const [query, ...locationParts] = trimmed.split('|');
    return { query: query.trim(), location: locationParts.join('|').trim(), label: trimmed };
  }

  const nearMatch = trimmed.match(/^(.*?)\s+near\s+(.+)$/i);
  if (nearMatch) {
    return { query: nearMatch[1].trim(), location: nearMatch[2].trim(), label: trimmed };
  }

  const commaIndex = trimmed.lastIndexOf(',');
  if (commaIndex > 0) {
    return {
      query: trimmed.slice(0, commaIndex).trim(),
      location: trimmed.slice(commaIndex + 1).trim(),
      label: trimmed
    };
  }

  return null;
}

function leadKey(lead) {
  if (lead.placeId) return `place:${lead.placeId}`;
  return `fallback:${String(lead.businessName || '').toLowerCase().trim()}|${String(lead.address || '').toLowerCase().trim()}`;
}

function withSerialNumbers(rows) {
  return rows.map((lead, index) => ({ ...lead, slNo: index + 1 }));
}

export default function App() {
  const [query, setQuery] = useState('Indian restaurants');
  const [location, setLocation] = useState('Birmingham');
  const [limit, setLimit] = useState(50);
  const [batchInput, setBatchInput] = useState(INITIAL_BATCH);
  const [leads, setLeads] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(null);

  const filteredLeads = useMemo(() => {
    if (filter === 'gold') return leads.filter((lead) => ['Gold', 'Strong Gold'].includes(lead.leadStatus));
    if (filter === 'noWebsite') return leads.filter((lead) => !lead.website);
    if (filter === 'hasWebsite') return leads.filter((lead) => Boolean(lead.website));
    return leads;
  }, [filter, leads]);

  const counts = useMemo(() => ({
    total: leads.length,
    gold: leads.filter((lead) => ['Gold', 'Strong Gold'].includes(lead.leadStatus)).length,
    noWebsite: leads.filter((lead) => !lead.website).length,
    hasWebsite: leads.filter((lead) => Boolean(lead.website)).length
  }), [leads]);

  async function runSearch(search) {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: search.query, location: search.location, limit })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Search failed.');
    return data.leads || [];
  }

  async function handleSearch(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setProgress({ current: `${query} | ${location}`, completed: 0, total: 1, totalLeads: 0 });

    try {
      const rows = await runSearch({ query, location });
      setLeads(withSerialNumbers(rows));
      setProgress({ current: 'Done', completed: 1, total: 1, totalLeads: rows.length });
    } catch (err) {
      setError(err.message || 'Something broke.');
    } finally {
      setLoading(false);
    }
  }

  async function handleBatchSearch() {
    const searches = batchInput.split('\n').map(parseSearchLine).filter(Boolean);
    if (!searches.length) {
      setError('Add at least one batch search, for example: Indian restaurants | Birmingham');
      return;
    }

    setLoading(true);
    setError('');
    setLeads([]);
    const seen = new Set();
    const collected = [];

    try {
      for (let index = 0; index < searches.length; index += 1) {
        const search = searches[index];
        setProgress({ current: search.label, completed: index, total: searches.length, totalLeads: collected.length });
        const rows = await runSearch(search);

        for (const row of rows) {
          const key = leadKey(row);
          if (!key || seen.has(key)) continue;
          seen.add(key);
          collected.push({ ...row, sourceSearch: row.sourceSearch || search.label });
        }

        setLeads(withSerialNumbers(collected));
        setProgress({ current: search.label, completed: index + 1, total: searches.length, totalLeads: collected.length });
      }
    } catch (err) {
      setError(err.message || 'Batch search failed.');
    } finally {
      setLoading(false);
    }
  }

  async function exportCsv() {
    const response = await fetch('/api/export/csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leads: withSerialNumbers(filteredLeads) })
    });

    if (!response.ok) {
      setError('CSV export failed.');
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `website-sales-leads-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">Local MVP</p>
        <h1>Website Sales Lead Finder</h1>
        <p className="subtext">Find businesses through the backend Places workflow, score website-sales leads, dedupe batch results, and export outreach-ready CSV rows.</p>
      </section>

      <form className="search-card" onSubmit={handleSearch}>
        <label>Business niche<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Indian restaurants" /></label>
        <label>Location<input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Birmingham" /></label>
        <label>Result limit<input type="number" min="1" max="200" value={limit} onChange={(event) => setLimit(event.target.value)} /></label>
        <button disabled={loading} type="submit">{loading ? 'Searching...' : 'Find Leads'}</button>
      </form>

      <section className="batch-card">
        <div>
          <h2>Batch search</h2>
          <p>Paste one search per line. Supported: <code>niche | city</code>, <code>niche near city</code>, or <code>niche, city</code>.</p>
        </div>
        <textarea value={batchInput} onChange={(event) => setBatchInput(event.target.value)} rows={5} />
        <button type="button" disabled={loading} onClick={handleBatchSearch}>{loading ? 'Running batch...' : 'Run Batch Sequentially'}</button>
      </section>

      {progress && <section className="progress-card"><strong>{progress.completed} / {progress.total} searches complete</strong><span>Current: {progress.current}</span><span>{progress.totalLeads} deduped leads found</span></section>}
      {error && <div className="error-box">{error}</div>}

      <section className="toolbar">
        <div className="filters">{FILTERS.map(([key, label]) => <button key={key} type="button" className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>{label}</button>)}</div>
        <div className="result-actions"><span>Total {counts.total} · Gold {counts.gold} · No website {counts.noWebsite} · Has website {counts.hasWebsite}</span><span>{filteredLeads.length} shown</span><button type="button" onClick={exportCsv} disabled={!filteredLeads.length}>Export CSV</button></div>
      </section>

      <section className="table-card">
        {!loading && !leads.length && <div className="empty-state">Run a single search or batch search to show mock leads.</div>}
        {Boolean(filteredLeads.length) && <div className="table-wrap"><table><thead><tr><th>#</th><th>Business</th><th>Status</th><th>Website</th><th>Phone</th><th>Rating</th><th>Reviews</th><th>Location</th><th>Source</th><th>Maps</th></tr></thead><tbody>{filteredLeads.map((lead) => <tr key={leadKey(lead)}><td>{lead.slNo}</td><td><strong>{lead.businessName}</strong><span>{lead.category}</span></td><td><span className={`badge ${String(lead.leadStatus).toLowerCase().replaceAll(' ', '-')}`}>{lead.leadStatus}</span><small>{lead.leadReason}</small></td><td>{lead.website ? <a href={lead.website} target="_blank" rel="noreferrer">Website</a> : <em>No website</em>}</td><td>{lead.phone || '—'}</td><td>{lead.rating || '—'}</td><td>{lead.reviewCount || '—'}</td><td>{lead.address || lead.briefLocation || '—'}</td><td>{lead.sourceSearch || '—'}</td><td>{lead.googleMapsUrl ? <a href={lead.googleMapsUrl} target="_blank" rel="noreferrer">Open</a> : '—'}</td></tr>)}</tbody></table></div>}
      </section>
    </main>
  );
}
