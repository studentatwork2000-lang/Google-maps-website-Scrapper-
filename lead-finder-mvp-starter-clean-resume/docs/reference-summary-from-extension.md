# Reference Summary From Inspected Extension

This is a sanitized product-behavior summary only. It does not include copied source code.

Observed concept:

- Chrome extension overlays a scraper panel on Google Maps.
- It auto-scrolls the results panel.
- It captures result batches without opening each business card manually.
- It deduplicates by place identifier.
- It displays live result count.
- It exports CSV/XLSX.
- Its useful backend parsing/enrichment is remote and not included in the extension ZIP.

What to recreate independently:

- Fast collection workflow.
- No click-each-business details panel loop.
- Results table.
- Field selector/export.
- Website-first lead qualification.

What not to recreate:

- Exact UI, branding, icons, CSS, wording, or code.
- Private backend calls.
- Membership or paywall behavior.
