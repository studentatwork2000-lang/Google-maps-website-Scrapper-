const TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const PLACE_DETAILS_BASE_URL = 'https://places.googleapis.com/v1/places';

const TEXT_SEARCH_FIELD_MASK = [
  'places.id',
  'places.name',
  'places.displayName',
  'places.formattedAddress',
  'places.primaryTypeDisplayName',
  'places.rating',
  'places.userRatingCount',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.googleMapsUri',
  'nextPageToken'
].join(',');

const DETAILS_FIELD_MASK = [
  'id',
  'name',
  'displayName',
  'formattedAddress',
  'primaryTypeDisplayName',
  'rating',
  'userRatingCount',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'websiteUri',
  'googleMapsUri'
].join(',');

function getApiKey() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY is missing. Add it to server/.env or use USE_MOCK=true.');
  }
  return apiKey;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizePlace(place) {
  const phone = place.internationalPhoneNumber || place.nationalPhoneNumber || '';
  const category = place.primaryTypeDisplayName?.text || place.primaryTypeDisplayName || '';

  return {
    businessName: place.displayName?.text || '',
    category,
    phone,
    website: place.websiteUri || '',
    rating: place.rating ?? '',
    reviewCount: place.userRatingCount ?? '',
    address: place.formattedAddress || '',
    googleMapsUrl: place.googleMapsUri || '',
    placeId: place.id || String(place.name || '').replace(/^places\//, '') || ''
  };
}

async function fetchTextSearchPage({ textQuery, pageToken }) {
  const apiKey = getApiKey();
  const body = pageToken
    ? { textQuery, pageToken }
    : { textQuery, pageSize: 20 };

  const response = await fetch(TEXT_SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': TEXT_SEARCH_FIELD_MASK
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Text Search failed (${response.status}): ${text}`);
  }

  return response.json();
}

async function fetchPlaceDetails(placeId) {
  if (!placeId) return null;

  const apiKey = getApiKey();
  const cleanPlaceId = String(placeId).replace(/^places\//, '');
  const url = `${PLACE_DETAILS_BASE_URL}/${encodeURIComponent(cleanPlaceId)}`;

  const response = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': DETAILS_FIELD_MASK
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Place Details failed (${response.status}): ${text}`);
  }

  return response.json();
}

function needsDetails(lead) {
  return !lead.website || !lead.phone || !lead.googleMapsUrl;
}

export async function searchPlaces({ query, location, limit }) {
  const textQuery = `${query} in ${location}`.trim();
  const collected = [];
  const seen = new Set();
  let nextPageToken = null;

  do {
    const page = await fetchTextSearchPage({ textQuery, pageToken: nextPageToken });
    const places = Array.isArray(page.places) ? page.places : [];

    for (const place of places) {
      const lead = normalizePlace(place);
      if (!lead.placeId || seen.has(lead.placeId)) continue;
      seen.add(lead.placeId);
      collected.push(lead);
      if (collected.length >= limit) break;
    }

    nextPageToken = page.nextPageToken || null;
    if (nextPageToken && collected.length < limit) {
      await sleep(1800);
    }
  } while (nextPageToken && collected.length < limit);

  const enriched = [];
  for (const lead of collected) {
    if (!needsDetails(lead)) {
      enriched.push(lead);
      continue;
    }

    try {
      const details = await fetchPlaceDetails(lead.placeId);
      const normalizedDetails = details ? normalizePlace(details) : {};
      enriched.push({ ...lead, ...removeEmptyValues(normalizedDetails) });
      await sleep(120);
    } catch (error) {
      console.warn(`Details fallback failed for ${lead.businessName || lead.placeId}: ${error.message}`);
      enriched.push(lead);
    }
  }

  return enriched;
}

function removeEmptyValues(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_key, value]) => value !== '' && value !== undefined && value !== null)
  );
}
