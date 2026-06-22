export function getMockLeads(query, location) {
  return [
    {
      businessName: `${query} House One`,
      category: 'Restaurant',
      phone: '+1 604-000-0000',
      website: '',
      rating: 4.7,
      reviewCount: 182,
      address: location,
      googleMapsUrl: 'https://maps.google.com/?cid=mock1',
      placeId: 'mock-place-1'
    },
    {
      businessName: `${query} Demo Two`,
      category: 'Restaurant',
      phone: '+1 604-111-1111',
      website: 'https://example.com',
      rating: 4.2,
      reviewCount: 73,
      address: location,
      googleMapsUrl: 'https://maps.google.com/?cid=mock2',
      placeId: 'mock-place-2'
    },
    {
      businessName: `${query} Local Three`,
      category: 'Cafe',
      phone: '',
      website: '',
      rating: 4.1,
      reviewCount: 24,
      address: location,
      googleMapsUrl: 'https://maps.google.com/?cid=mock3',
      placeId: 'mock-place-3'
    }
  ];
}
