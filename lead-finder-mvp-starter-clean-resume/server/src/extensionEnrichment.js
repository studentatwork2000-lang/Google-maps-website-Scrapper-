import { getMockLeads } from './mockData.js';
import { searchPlaces, getPlaceDetailsLead } from './placesApi.js';
import { scoreLead } from './scorer.js';

function safeString(value) {
  return String(value || '').trim();
}

function parseCid(url = '') {
  const text = safeString(url);
  if (!text) return '';
  try {
    const parsed = new URL(text);
    return parsed.searchParams.get('cid') || parsed.searchParams.get('ludocid') || '';
  } catch (_error) {
    const match = text.match(/[?&](?:cid|ludocid)=([^&]+)/i);
    return match ? decodeURIComponent(match[1]) : '';
  }
}

function keyForPlace(place) {
  const placeId = safeString(place.placeId);
  const cid = safeString(place.cid) || parseCid(place.googleMapsUrl || place.mapsUrl || place.url);
  const mapsUrl = safeString(place.googleMapsUrl || place.mapsUrl || place.url);
  const name = safeString(place.businessName || place.name).toLowerCase();
  const address = safeString(place.address).toLowerCase();

  if (placeId) return `place:${placeId}`;
  if (cid) return `cid:${cid}`;
  if (mapsUrl) return `url:${mapsUrl}`;
  return `fallback:${name}|${address}`;
}

function normalizeCollectedPlace(place = {}, sourceSearch = '') {
  const googleMapsUrl = safeString(place.googleMapsUrl || place.mapsUrl || place.url);
  const cid = safeString(place.cid) || parseCid(googleMapsUrl);
  return {
    businessName: safeString(place.businessName || place.name || place.title),
    category: safeString(place.category),
    phone: '',
    email: '',
    website: '',
    websiteStatus: 'Unknown until backend enrichment',
    rating: place.rating || '',
    reviewCount: place.reviewCount || '',
    address: safeString(place.address),
    briefLocation: safeString(place.briefLocation || place.address),
    googleMapsUrl,
    placeId: safeString(place.placeId),
    cid,
    sourceSearch: safeString(place.sourceSearch) || sourceSearch,
    collectedAt: place.collectedAt || new Date().toISOString()
  };
}

function dedupePlaces(places, sourceSearch) {
  const seen = new Set();
  const normalized = [];
  for (const place of Array.isArray(places) ? places : []) {
    const row = normalizeCollectedPlace(place, sourceSearch);
    const key = keyForPlace(row);
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(row);
  }
  return normalized;
}

function withLeadStatus(rows) {
  return rows.map((lead, index) => ({
    slNo: index + 1,
    ...lead,
    websiteStatus: lead.website ? 'Has website listed on Google Maps' : 'No website listed on Google Maps',
    ...scoreLead(lead)
  }));
}

export function receiveExtensionPlaces({ places, sourceSearch = '' }) {
  const normalized = dedupePlaces(places, sourceSearch);
  return {
    accepted: normalized.length,
    places: normalized
  };
}

export async function enrichExtensionPlaces({ places, sourceSearch = '', limit = 100 }) {
  const normalized = dedupePlaces(places, sourceSearch).slice(0, Math.max(1, Math.min(Number(limit) || 100, 200)));

  if (process.env.USE_MOCK === 'true') {
    const mockSeed = getMockLeads(sourceSearch || 'Google Maps extension lead', 'Extension session');
    const mockRows = normalized.map((place, index) => {
      const seed = mockSeed[index % mockSeed.length];
      return {
        ...seed,
        ...place,
        businessName: place.businessName || seed.businessName,
        address: place.address || seed.address,
        briefLocation: place.briefLocation || seed.briefLocation,
        googleMapsUrl: place.googleMapsUrl || seed.googleMapsUrl,
        placeId: place.placeId || seed.placeId,
        cid: place.cid || seed.cid || parseCid(place.googleMapsUrl || seed.googleMapsUrl),
        website: index % 2 === 0 ? '' : seed.website,
        sourceSearch: place.sourceSearch || sourceSearch || seed.sourceSearch
      };
    });
    return withLeadStatus(mockRows);
  }

  const enriched = [];
  for (const place of normalized) {
    let lead = { ...place };
    try {
      if (place.placeId) {
        lead = { ...lead, ...(await getPlaceDetailsLead(place.placeId)) };
      } else if (place.businessName && place.address) {
        const results = await searchPlaces({ query: place.businessName, location: place.address, limit: 1 });
        lead = { ...lead, ...(results[0] || {}) };
      }
    } catch (error) {
      console.warn(`Extension enrichment fallback kept collected row: ${error.message}`);
    }
    enriched.push({ ...lead, cid: lead.cid || parseCid(lead.googleMapsUrl), sourceSearch: lead.sourceSearch || sourceSearch });
  }

  return withLeadStatus(enriched);
}
