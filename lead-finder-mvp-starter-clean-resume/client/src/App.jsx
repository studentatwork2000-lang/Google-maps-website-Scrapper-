import { useMemo, useState } from 'react';

const API_BASE = 'http://localhost:8787';

export default function App() {
  const [query, setQuery] = useState('Indian restaurants');
  const [location, setLocation] = useState('Vancouver, BC');
  const [limit, setLimit] = useState(50);
  const [leads, setLeads] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filteredLeads = useMemo(() => {
    if (filter === 'gold') return leads.filter((lead) => ['Gold', 'Strong Gold'].includes(lead.leadStatus));
    if (filter === 'noWebsite') return leads.filter((lead) => !lead.website);
    if (filter === 'hasWebsite') return leads.filter((lead) => Boolean(lead.website));
    return leads;
  }, [filter, leads]);

  async function handleSearch(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setLeads([]);

    try {
      const response = await fetch(`${API_BASE}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, location, limit })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Search failed.');
      setLeads(data.leads || []);
    } catch (err) {
      setError(err.message || 'Something broke. Naturally.');
    } finally {
      setLoading(false);
    }
  }

  async function exportCsv() {
    const response = await fetch(`${API_BASE}/api/export/csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leads: filteredLeads })
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
        <div>
          <p className="eyebrow">Local MVP</p>
          <h1>Website Sales Lead Finder</h1>
          <p className="subtext">
            Find businesses, pull website listings through place details, score the lead, export the CSV. No clicking each Google Maps card like a medieval peasant.
          </p>
        </div>
      </section>

      <form className="search-card" onSubmit={handleSearch}>
        <label>
          Business niche
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Indian restaurants" />
        </label>

        <label>
          Location
          <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Vancouver, BC" />
        </label>

        <label>
          Result limit
          <input type="number" min="1" max="200" value={limit} onChange={(event) => setLimit(event.target.value)} />
        </label>

        <button disabled={loading} type="submit">
          {loading ? 'Searching...' : 'Find Leads'}
        </button>
      </form>

      {error && <div className="error-box">{error}</div>}

      <section className="toolbar">
        <div className="filters">
          <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
          <button type="button" className={filter === 'gold' ? 'active' : ''} onClick={() => setFilter('gold')}>Gold only</button>
          <button type="button" className={filter === 'noWebsite' ? 'active' : ''} onClick={() => setFilter('noWebsite')}>No website</button>
          <button type="button" className={filter === 'hasWebsite' ? 'active' : ''} onClick={() => setFilter('hasWebsite')}>Has website</button>
        </div>

        <div className="result-actions">
          <span>{filteredLeads.length} shown / {leads.length} total</span>
          <button type="button" onClick={exportCsv} disabled={!filteredLeads.length}>Export CSV</button>
        </div>
      </section>

      <section className="table-card">
        {!loading && !leads.length && (
          <div className="empty-state">Search something. The leads are not going to manifest themselves through vibes, tragically.</div>
        )}

        {Boolean(filteredLeads.length) && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Status</th>
                  <th>Website</th>
                  <th>Phone</th>
                  <th>Rating</th>
                  <th>Reviews</th>
                  <th>Address</th>
                  <th>Maps</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.placeId || lead.googleMapsUrl || lead.businessName}>
                    <td>
                      <strong>{lead.businessName}</strong>
                      <span>{lead.category}</span>
                    </td>
                    <td>
                      <span className={`badge ${String(lead.leadStatus).toLowerCase().replaceAll(' ', '-')}`}>{lead.leadStatus}</span>
                      <small>{lead.leadReason}</small>
                    </td>
                    <td>{lead.website ? <a href={lead.website} target="_blank" rel="noreferrer">Website</a> : <em>No website</em>}</td>
                    <td>{lead.phone || '—'}</td>
                    <td>{lead.rating || '—'}</td>
                    <td>{lead.reviewCount || '—'}</td>
                    <td>{lead.address || '—'}</td>
                    <td>{lead.googleMapsUrl ? <a href={lead.googleMapsUrl} target="_blank" rel="noreferrer">Open</a> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
