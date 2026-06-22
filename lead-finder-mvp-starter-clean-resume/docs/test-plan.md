# Test Plan

## Mock mode

1. Set `USE_MOCK=true` in `server/.env`.
2. Run `npm run dev` from root.
3. Search anything.
4. Confirm table appears.
5. Confirm filters work.
6. Confirm CSV export downloads.

## Real API mode

1. Set `USE_MOCK=false`.
2. Add a real `GOOGLE_PLACES_API_KEY`.
3. Search: `Indian restaurants` + `Vancouver, BC`.
4. Confirm rows include:
   - businessName
   - phone when available
   - website when available
   - rating
   - reviewCount
   - googleMapsUrl
5. Confirm no website rows are marked Gold.
6. Export CSV and open in Google Sheets/Excel.

## Failure cases

- Missing API key should return a clear backend error.
- API errors should show in frontend error box.
- Empty results should show a clean no-results message.
- Result limit should not crash when set above one page.
