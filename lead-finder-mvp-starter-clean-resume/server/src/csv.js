const COLUMNS = [
  'businessName',
  'category',
  'phone',
  'website',
  'rating',
  'reviewCount',
  'address',
  'googleMapsUrl',
  'placeId',
  'leadStatus',
  'leadReason'
];

function escapeCsv(value) {
  const text = value === undefined || value === null ? '' : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function createCsv(leads) {
  const rows = [COLUMNS.join(',')];
  for (const lead of leads) {
    rows.push(COLUMNS.map((column) => escapeCsv(lead[column])).join(','));
  }
  return rows.join('\n');
}
