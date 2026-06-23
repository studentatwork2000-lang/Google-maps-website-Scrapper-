function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'mock';
}

export function getMockLeads(query, location) {
  const querySlug = slugify(query);
  const locationSlug = slugify(location);
  const sourceSearch = `${query} | ${location}`;

  return [
    {
      businessName: `${query} House One`,
      category: 'Restaurant',
      phone: '+1 604-000-0000',
      email: '',
      website: '',
      rating: 4.7,
      reviewCount: 182,
      address: `101 Mock High Street, ${location}`,
      briefLocation: location,
      googleMapsUrl: `https://maps.google.com/?cid=${querySlug}-${locationSlug}-1`,
      placeId: `mock-${querySlug}-${locationSlug}-1`,
      sourceSearch
    },
    {
      businessName: `${query} Demo Two`,
      category: 'Restaurant',
      phone: '+1 604-111-1111',
      email: '',
      website: 'https://example.com',
      rating: 4.2,
      reviewCount: 73,
      address: `22 Sample Road, ${location}`,
      briefLocation: location,
      googleMapsUrl: `https://maps.google.com/?cid=${querySlug}-${locationSlug}-2`,
      placeId: `mock-${querySlug}-${locationSlug}-2`,
      sourceSearch
    },
    {
      businessName: `${query} Local Three`,
      category: 'Cafe',
      phone: '',
      email: '',
      website: '',
      rating: 4.1,
      reviewCount: 24,
      address: `3 Demo Lane, ${location}`,
      briefLocation: location,
      googleMapsUrl: `https://maps.google.com/?cid=${querySlug}-${locationSlug}-3`,
      placeId: `mock-${querySlug}-${locationSlug}-3`,
      sourceSearch
    }
  ];
}
