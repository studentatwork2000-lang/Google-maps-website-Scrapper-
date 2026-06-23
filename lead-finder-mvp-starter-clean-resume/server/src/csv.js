export const COLUMNS = [
  'slNo',
  'businessName',
  'category',
  'phone',
  'email',
  'website',
  'rating',
  'reviewCount',
  'address',
  'briefLocation',
  'googleMapsUrl',
  'placeId',
  'sourceSearch',
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
  leads.forEach((lead, index) => {
    const row = { slNo: lead.slNo || index + 1, ...lead };
    rows.push(COLUMNS.map((column) => escapeCsv(row[column])).join(','));
  });
  return rows.join('\n');
}
