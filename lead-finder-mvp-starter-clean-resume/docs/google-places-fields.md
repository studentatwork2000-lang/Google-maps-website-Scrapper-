# Google Places API Fields

Use the official Places API. Do not use third-party scraper endpoints.

## Text Search fields

Initial search field mask should include:

```text
places.id,
places.name,
places.displayName,
places.formattedAddress,
places.primaryTypeDisplayName,
places.rating,
places.userRatingCount,
places.nationalPhoneNumber,
places.internationalPhoneNumber,
places.websiteUri,
places.googleMapsUri,
nextPageToken
```

## Place Details fields

Fallback/details field mask should include:

```text
id,
name,
displayName,
formattedAddress,
primaryTypeDisplayName,
rating,
userRatingCount,
nationalPhoneNumber,
internationalPhoneNumber,
websiteUri,
googleMapsUri
```

## Why details fallback exists

Text Search may not always include every contact field depending on field mask, availability, API behavior, and pricing tier. The fallback requests Place Details by place ID to fill missing website, phone, and maps URL.

## Notes

- The Google Places API requires field masks for Text Search, Nearby Search, and Place Details.
- Only request fields actually needed to reduce cost and latency.
- Keep the API key on the backend only.
