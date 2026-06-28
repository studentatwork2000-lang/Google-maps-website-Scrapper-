(() => {
  const DEFAULT_BACKEND = 'http://localhost:8787';
  const state = { running: false, collected: new Map(), sent: 0, enriched: 0, errors: [], backendUrl: DEFAULT_BACKEND, timer: null };

  chrome.storage?.sync?.get({ backendUrl: DEFAULT_BACKEND }, (items) => {
    state.backendUrl = items.backendUrl || DEFAULT_BACKEND;
    render();
  });

  function text(selector, root = document) { return root.querySelector(selector)?.textContent?.trim() || ''; }
  function clean(value) { return String(value || '').replace(/\s+/g, ' ').trim(); }
  function currentSearch() { return decodeURIComponent(location.href.split('/search/')[1]?.split('/')[0] || '').replaceAll('+', ' '); }
  function parseCid(url) { try { const u = new URL(url); return u.searchParams.get('cid') || u.searchParams.get('ludocid') || ''; } catch { return ''; } }
  function parsePlaceId(url) { const match = String(url || '').match(/!1s([^!]+)|place_id:([^/&?]+)/); return match ? decodeURIComponent(match[1] || match[2]) : ''; }
  function keyFor(place) { return place.placeId ? `place:${place.placeId}` : place.cid ? `cid:${place.cid}` : place.googleMapsUrl ? `url:${place.googleMapsUrl}` : `fallback:${place.businessName.toLowerCase()}|${place.address.toLowerCase()}`; }

  function findFeed() {
    return document.querySelector('[role="feed"]') || document.querySelector('div[aria-label*="Results for"]') || document.querySelector('div[aria-label*="Search results"]');
  }

  function collectRows() {
    const feed = findFeed() || document;
    const anchors = [...feed.querySelectorAll('a[href*="/maps/place/"], a[href*="?cid="], a[href*="ludocid="]')];
    let loaded = 0;
    for (const anchor of anchors) {
      const row = anchor.closest('[role="article"]') || anchor.closest('.Nv2PK') || anchor.closest('div[jsaction]') || anchor.parentElement;
      const googleMapsUrl = anchor.href;
      const businessName = clean(anchor.getAttribute('aria-label')) || clean(anchor.textContent) || text('[role="heading"]', row);
      if (!businessName || !googleMapsUrl) continue;
      const bits = clean(row?.textContent || '').split('·').map(clean).filter(Boolean);
      const address = bits.find((part) => /\d|street|road|lane|avenue|ave|st\b|birmingham/i.test(part)) || '';
      const ratingMatch = clean(row?.textContent || '').match(/([0-5]\.[0-9])\s*\(?([0-9,]+)?\)?/);
      const place = {
        businessName,
        address,
        googleMapsUrl,
        placeId: parsePlaceId(googleMapsUrl),
        cid: parseCid(googleMapsUrl),
        rating: ratingMatch?.[1] || '',
        reviewCount: ratingMatch?.[2]?.replace(/,/g, '') || '',
        sourceSearch: currentSearch(),
        collectedAt: new Date().toISOString()
      };
      state.collected.set(keyFor(place), place);
      loaded += 1;
    }
    return loaded;
  }

  function autoScroll() {
    if (!state.running) return;
    const loaded = collectRows();
    const feed = findFeed();
    if (feed) feed.scrollTop = feed.scrollHeight;
    setStatus(loaded ? `Collected ${loaded} loaded row links.` : 'Waiting for more loaded Maps rows...');
    renderStats();
  }

  async function send(enrich = false) {
    const places = [...state.collected.values()];
    const endpoint = enrich ? '/api/extension/enrich' : '/api/extension/places';
    const response = await fetch(`${state.backendUrl.replace(/\/$/, '')}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ places, sourceSearch: currentSearch() }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Backend request failed');
    state.sent = places.length;
    state.enriched = data.count || data.leads?.length || state.enriched;
    window.localStorage.setItem('leadFinderExtensionLeads', JSON.stringify(data.leads || []));
    setStatus(enrich ? `Enriched ${state.enriched} leads. Open dashboard to view/import.` : `Sent ${data.accepted || places.length} places.`);
    renderStats();
  }

  function start() { state.running = true; collectRows(); clearInterval(state.timer); state.timer = setInterval(autoScroll, 1600); autoScroll(); render(); }
  function pause() { state.running = false; clearInterval(state.timer); render(); }
  function reset() { pause(); state.collected.clear(); state.sent = 0; state.enriched = 0; state.errors = []; render(); }
  function setStatus(message, error = false) { const el = document.querySelector('#lead-finder-status'); if (el) { el.textContent = message; el.className = error ? 'lf-error' : 'lf-ok'; } if (error) state.errors.push(message); }
  function saveBackend(value) { state.backendUrl = value || DEFAULT_BACKEND; chrome.storage?.sync?.set({ backendUrl: state.backendUrl }); }
  function openDashboard() { window.open('http://localhost:5173', '_blank', 'noopener'); }

  function renderStats() {
    const panel = document.querySelector('#lead-finder-panel'); if (!panel) return;
    panel.querySelector('[data-loaded]').textContent = document.querySelectorAll('a[href*="/maps/place/"], a[href*="?cid="], a[href*="ludocid="]').length;
    panel.querySelector('[data-unique]').textContent = state.collected.size;
    panel.querySelector('[data-sent]').textContent = state.sent;
    panel.querySelector('[data-enriched]').textContent = state.enriched;
    panel.querySelector('[data-errors]').textContent = state.errors.length;
  }

  function render() {
    let panel = document.querySelector('#lead-finder-panel');
    if (!panel) { panel = document.createElement('aside'); panel.id = 'lead-finder-panel'; document.documentElement.appendChild(panel); }
    panel.innerHTML = `<h2>Lead Finder</h2><p>Search Google Maps manually, then collect loaded result rows without opening each card.</p><label>Backend URL<input id="lf-backend" value="${state.backendUrl}"></label><div class="lf-grid"><button id="lf-start">Start</button><button class="secondary" id="lf-pause">Pause</button><button class="secondary" id="lf-reset">Reset</button><button id="lf-send">Send / Enrich</button><button class="secondary" id="lf-send-only">Send only</button><button class="secondary" id="lf-dashboard">Open Dashboard</button></div><dl><dt>Loaded links</dt><dd data-loaded>0</dd><dt>Unique</dt><dd data-unique>0</dd><dt>Sent</dt><dd data-sent>0</dd><dt>Enriched</dt><dd data-enriched>0</dd><dt>Errors</dt><dd data-errors>0</dd></dl><div id="lead-finder-status" class="lf-ok">${state.running ? 'Running' : 'Paused'}</div>`;
    panel.querySelector('#lf-backend').addEventListener('change', (e) => saveBackend(e.target.value));
    panel.querySelector('#lf-start').addEventListener('click', start);
    panel.querySelector('#lf-pause').addEventListener('click', pause);
    panel.querySelector('#lf-reset').addEventListener('click', reset);
    panel.querySelector('#lf-send').addEventListener('click', () => send(true).catch((e) => setStatus(e.message, true)));
    panel.querySelector('#lf-send-only').addEventListener('click', () => send(false).catch((e) => setStatus(e.message, true)));
    panel.querySelector('#lf-dashboard').addEventListener('click', openDashboard);
    renderStats();
  }

  render();
})();
