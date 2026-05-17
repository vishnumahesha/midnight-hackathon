# AI Extraction Layer

## What it does

The AI extraction layer reads raw vendor proposal text and converts it into a fixed, validated schema that the ZK circuit can hash and verify. It calls the Claude API, parses the response, and validates the output with Zod. If the API is unavailable or no key is provided, it falls back to pre-cached extractions automatically — keeping the demo reliable under any network condition.

---

## Output schema — `ExtractedOfferFacts`

Defined in `apps/frontend/lib/extractionSchema.ts`.

| Field | Type | Constraint | Description |
|---|---|---|---|
| `vendorId` | `string` | non-empty | Matches the key used in cached fallback (`vendor_a`, `vendor_b`) |
| `vendorName` | `string` | non-empty | Display name of the vendor |
| `priceCents` | `number` | positive integer | Price in cents (e.g. $1,900 → `190000`) |
| `category` | `string` | non-empty | One of: `lead_data`, `analytics`, `infrastructure`, `saas`, `consulting` |
| `credentials` | `string[]` | max 4 items | Verifiable capabilities detected in the proposal |
| `forbiddenTermsDetected` | `string[]` | max 4 items | Canonical identifiers for risky clauses (see vocabulary below) |
| `summary` | `string` | non-empty | One sentence describing what makes the vendor good or risky |

The 4-item array cap on `credentials` and `forbiddenTermsDetected` is a hard ZK circuit constraint — the Compact contract is built around fixed-size arrays.

---

## Canonical vocabulary for `forbiddenTermsDetected`

The circuit hashes forbidden terms against exact strings from the buyer's policy. The AI must return canonical identifiers, not free-form descriptions. The extraction prompt enforces a closed vocabulary.

| Canonical identifier | Matches any of |
|---|---|
| `campaign_metadata_reuse` | cross-client modeling, audience expansion, benchmark optimization across clients, campaign metadata sharing, partner enrichment using buyer data, cross-customer data use, shared audience profiling, resale of buyer data to partners |

If none of the above concepts appear in the proposal, `forbiddenTermsDetected` must be an empty array.

> **Why this matters:** The buyer's `forbiddenTermHash` is computed from the exact string `"campaign_metadata_reuse"`. Any variant (e.g. `"cross_client_modeling"`) will not match the hash, causing the circuit to falsely authorize the proposal. The canonical vocabulary table in the prompt prevents this.

---

## Cached fallback data

Pre-extracted outputs live in `data/`. They are loaded automatically when no API key is provided or when `useCached: true` is passed.

**`data/vendorA.extracted.json` — BrightReach Data (FAILS)**
```json
{
  "vendorId": "vendor_A",
  "vendorName": "BrightReach Data",
  "priceCents": 190000,
  "category": "lead_data",
  "credentials": ["weekly_refresh", "high_volume", "crm_enrichment"],
  "forbiddenTermsDetected": ["campaign_metadata_reuse"],
  "summary": "Cheap and fast, but reuses campaign metadata for partner enrichment across similar customers."
}
```

**`data/vendorB.extracted.json` — CleanList Pro (PASSES)**
```json
{
  "vendorId": "vendor_B",
  "vendorName": "CleanList Pro",
  "priceCents": 225000,
  "category": "lead_data",
  "credentials": ["freshness_verified", "licensed_sources", "opt_out_screening", "audit_logs"],
  "forbiddenTermsDetected": [],
  "summary": "More expensive and slower, but explicitly siloed by engagement with no partner enrichment or resale."
}
```

---

## API

### `extractOffer(vendorId, vendorName, proposalText, options?)`

Extracts structured facts from a single vendor proposal.

```ts
const { result, source } = await extractOffer(
  "vendor_a",
  "BrightReach Data",
  proposalText,
  { apiKey: process.env.ANTHROPIC_API_KEY }
);
// source: "live" | "cached"
```

- `apiKey` is injected by the caller — never read from `process.env` inside the function.
- Falls back to cached if `apiKey` is missing, the API call fails, or the response fails schema validation.
- `source` tells the frontend whether to show a "Live AI" or "Cached" badge.

### `extractBothVendors(vendorAText, vendorBText, options?)`

Convenience wrapper that runs both vendors in parallel via `Promise.all`.

```ts
const { vendorA, vendorB } = await extractBothVendors(textA, textB, { apiKey });
```

---

## Integration notes

- **API key**: read `process.env.ANTHROPIC_API_KEY` in the API route and pass it as `options.apiKey`. Do not import it inside `extractOffer.ts`.
- **JSON imports**: `vendorA.extracted.json` and `vendorB.extracted.json` are imported with relative paths (`../../../data/`). Verify these resolve correctly once the Integration Owner wires the API route.
- **Demo reliability**: default `DEMO_MODE` is `cached-ai-live-proof`. The `useCached` flag can be forced to `true` when `DEMO_MODE` is `cached-ai-*` so the API is never called during the recorded demo.