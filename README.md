# midnight-hackathon
Midnight Hackathon May 2026 - Confidential Agent Wallets

## SilentIntent: Privacy-Preserving Procurement Policy Validation

## Implementation Status

**Status: Ready for integration**

The Compact source, generated artifacts, and TypeScript harness are aligned:
1. Generated artifacts in `contracts/silentintent/out/` expose `offerPriceBandCode`, `policyVerified`, and `priceBandCode`.
2. `npm test` passes from `contracts/scratch/`.
3. Integration can wire against the TypeScript signatures in `contracts/silentintent/out/contract/index.d.ts`.

Note: on Windows, `compact` resolves to the OS file-compression utility. Use WSL2 or a cloud dev box for Compact compiler regeneration.

---

## Team Responsibilities & Scope

### Compact Owner (This Repository)
**Owns:**
- Private witness definitions (buyer policy, vendor offer, salts)
- Public ledger outputs (deal/policy IDs, commitments, authorization state, price band)
- Proof constraints (price ≤ max, credential membership, forbidden-term exclusion, commitment consistency)
- Bounded circuit design (fixed Vector<4>, zero-padding semantics, no dynamic arrays)
- Compact tests (happy path + constraint violations)
- Proof README (what is proven, what is not, scope cuts)

**Does NOT own:**
- Frontend UI, display logic, error handling for users
- AI/Data extraction quality, schema normalization, cached extraction JSON
- Integration layer (witness construction, hashing, adapter calls, proof caching, demo modes)
- Demo script, Devpost copy, schedule decisions

### Integration Owner
**Owns:**
- Building adapter to translate extracted offer → Compact witness types
- Normalizing strings (lowercase, snake_case) before hashing
- Constructing commit objects with exact bigint, Uint8Array(32), and array-of-4 shapes
- Catching and sanitizing Compact exceptions (never display exact constraint errors)
- Mapping priceBandCode → display string
- Caching proof results (no re-proof on cache hit)
- Maintaining deal/offer result history (ledger is single-cell; history must be external)

### Frontend Owner
**Owns:**
- Loading states (proof/witness generation in progress)
- Display states (authorized → show offer details, rejected → show "Hidden intent violation")
- Error handling (never display exact CompactError; use sanitized messages)
- Price band display (use Frontend's bandMap, not exact Compact numbers)
- Proof UX (show commitment hashes, deal ID, intent commitment for transparency)

### AI/Data Owner
**Owns:**
- Extraction JSON schema and canonicalization rules
- Normalizing vendor offers before passing to Integration
- Producing credentials[] and forbiddenTermsDetected[] arrays with ≤ 4 entries
- Mapping raw extraction to Compact-ready format

**Note:** Compact currently consumes only:
- priceCents (→ bigint cents)
- credentials[] (→ offerCredentialHashes[4])
- forbiddenTermsDetected[] (→ offerDetectedForbiddenHashes[4])

Category, vendorId, summary are not yet used (see "Scope Cuts from Briefing v1").

---

SilentIntent is a zero-knowledge circuit that enables buyers to prove procurement policy compliance without disclosing:
- Hidden maximum price budgets
- Required credentials or certifications
- Forbidden contract terms

---

## What This Proof Guarantees

### ✅ Cryptographically Enforced

The `evaluateOffer` circuit verifies:

1. **Price constraint**: Vendor price ≤ buyer's hidden maximum
2. **Intent commitment**: Offer matches the buyer's original registered policy
3. **Credential verification**: Vendor offer contains required credential(s)
4. **Forbidden term exclusion**: Vendor offer does NOT contain buyer's forbidden term(s)

### Public Outputs (Disclosed)

- `dealId`: Deal identifier (arbitrary string)
- `priceBandCode`: Range-checked band code (1-7) for the actual vendor price
  - 1 = $0-$500, 2 = $500-$1k, 3 = $1k-$2k, 4 = $2k-$2.5k, etc.
  - `offerPriceBandCode` is supplied as a private witness and proven consistent with `offerPriceCents`
  - The prover cannot claim a different band without failing the proof
- `offerCommitment`: Hash of vendor offer (deterministic proof of offer structure)
- `policyVerified`: Boolean flag indicating proof success

---

## What This Proof Does NOT Guarantee

### ⚠️ Scope Limitations (v1)

**1. No Replay Protection**
- Same proof can authorize the same offer multiple times
- Requires external mechanism (nonce storage, consumed commitment tracking) to prevent replay
- Acceptable for v1: assume integration layer prevents re-use

**2. No Actual Settlement**
- Circuit proves policy compliance, NOT that:
  - funds move
  - escrow is locked
  - contracts execute
- `policyVerified` flag means compliance verified, not settlement occurred
- Requires separate settlement/execution layer

**3. AI Extraction Not Proven**
- We do NOT prove that vendor offer was correctly extracted by AI
- We verify constraints over *already-extracted* structured values
- Trust boundary: extraction layer must be trusted or independently verified

**4. Offer Commitment Is Informational**
- We disclose `offerCommitment` but do NOT verify an existing prior vendor commitment
- There is no binding across extraction → proof phases
- Prevents offer tampering only through off-chain practices
- Cryptographic binding would require vendor to pre-commit on-chain

**5. Price Band Mapping Is Enum-Based**
- Price band is represented as `priceBandCode`, not as a public string
- The circuit proves the supplied code matches the private `offerPriceCents` range
- Frontend must use the same 1-7 mapping table documented below

---

## Architecture

### Circuit 1: `registerIntent()`

Buyer commits to a hidden procurement policy:

```compact
const commitment: Bytes<32> = persistentHash<[
  Uint<64>,        // max price
  Bytes<32>,       // required credential hash
  Bytes<32>,       // forbidden term hash
  Bytes<32>        // salt
]>(...)
```

Stored on-chain: `intentCommitment`

### Circuit 2: `evaluateOffer()`

Vendor submits an offer against stored buyer policy:

1. Verifies offer price ≤ buyer's hidden max
2. Rebuilds commitment from private witnesses → must equal stored `intentCommitment`
3. Checks required credential is present
4. Checks forbidden term is NOT present
5. Range-checks the supplied price band code against the actual offer price

---

## Test Coverage

### Test Cases

- **Case 1**: Happy path — all constraints pass ✓
- **Case 2**: Forbidden term detected — constraint violation ✗
- **Case 3**: Price exceeds maximum — constraint violation ✗
- **Case 4**: Missing required credential — constraint violation ✗
- **Case 5**: Intent commitment mismatch — constraint violation ✗

Run: `npm test` (from `contracts/scratch/`)

---

## Known Design Decisions

### Fixed-Size Vectors
- `offerCredentialHashes`: Vector<4, Bytes<32>> (max 4 credentials)
- `offerDetectedForbiddenHashes`: Vector<4, Bytes<32>> (max 4 forbidden terms)
- Reason: Compact circuits must be statically bounded
- Unused slots are zero-padded; does not affect correctness

### Range-Checked Price Band Code
- `offerPriceBandCode` is supplied as a private witness
- The circuit asserts that the code matches the private `offerPriceCents` range
- Frontend maps code → display string (e.g., 4 → "$2,000-$2,500")

### Hashed Credentials & Forbidden Terms
- We hash these values (not plain text) for privacy
- Prevents disclosure of credential names / contract terms
- Verification: credential/term hash must appear in offer hashes

---

## Future Work (Beyond v1)

- **Replay protection**: Integrate with on-chain commitment consumption
- **Vendor commitment**: Pre-commitment protocol for offer integrity across phases
- **Dynamic arrays**: Assume future Compact versions support runtime-bounded collections
- **Semantic verification**: NLP or domain-specific constraints inside proof
- **Escrow integration**: Settlement circuit tied to proof verification

---

## Technical Notes

### Price Band Encoding

| Code | Range      |
|------|-----------|
| 1    | $0-$500       |
| 2    | $500-$1,000   |
| 3    | $1,000-$2,000 |
| 4    | $2,000-$2,500 |
| 5    | $2,500-$5,000 |
| 6    | $5,000-$10,000 |
| 7    | $10,000+      |

### Constraint Error Messages

If a constraint fails, the circuit throws `CompactError` with a descriptive message:
- `"Offer price exceeds maximum allowed price"` → price constraint
- `"Intent commitment mismatch"` → commitment doesn't match stored value
- `"Required credential not found in offer"` → credential constraint
- `"Forbidden term detected in offer"` → forbidden term constraint

---

## Hackathon Submission Notes

This circuit demonstrates:
- **Real Midnight architecture**: two-phase circuit design (register + evaluate)
- **Privacy boundaries**: private witnesses (policy) vs. disclosed outputs (band, commitment)
- **Cryptographic integrity**: deterministic hashing, no manual concatenation
- **Realistic constraints**: bounded vectors, static circuit size
- **Honest scoping**: explicitly documented what is NOT guaranteed

**Not production-grade**, but competent hackathon work with clear cryptographic reasoning and defensible architectural choices.

---

## Artifact Status

Generated artifacts are current with the Compact source:
- `contracts/silentintent/out/contract/index.d.ts` exposes `offerPriceBandCode`, `policyVerified`, and `priceBandCode`
- `contracts/silentintent/out/compiler/contract-info.json` lists 9 witnesses and 6 ledger fields
- `npm test` passes from `contracts/scratch/`

If the Compact source changes again, regenerate artifacts from a Linux/WSL2 environment with the Midnight Compact compiler, then rerun the test harness.

---

## Scope Cuts from Briefing (v1)

The briefing included several fields that are **not** implemented in v1. These are intentional cuts:

### ❌ Not Implemented

1. **Category verification** — Briefing requires `requiredCategoryHash` / `offerCategoryHash` constraint
   - Status: Deferred to v2
   - Reason: Adds complexity; v1 focuses on price + credentials + forbidden terms

2. **Vendor identity** — Briefing expects `vendorHash` and `buyerAgentHash`
   - Status: Deferred; can be added to `intentCommitment` later
   - Reason: Not needed for core v1 validation

3. **Settlement nonce** — Briefing mentions `settlementNonce` for replay protection
   - Status: Documented as limitation (see "What This Proof Does NOT Guarantee")
   - Reason: Requires on-chain consumed-commitment tracking; v1 assumes external handling

4. **Rejected verifier output** — Briefing expects on-chain `REJECTED` state for failed offers
   - Status: Not produced; failed offers revert/throw locally
   - Reason: Compact does not expose failed circuit state; Integration layer catches the error and updates frontend state locally
   - Workaround: Frontend/Integration treats caught `CompactError` as rejection and updates UI accordingly

5. **Public rejected proof** — Briefing may expect Compact to produce cryptographic rejection proof
   - Status: Not included; too complex for v1 ZK
   - Reason: Would require result-style circuit or monad; standard Midnight approach is assert/revert

### ✅ Implemented

- Price <= max ✅
- Credential membership ✅
- Forbidden-term non-membership ✅
- Intent commitment consistency ✅
- Offer commitment derivation ✅
- Price band derivation ✅
- Two-phase circuit design ✅

---

## Naming Clarifications

### `policyVerified` is NOT "settlement authorized"

**What it actually means**:
- The latest `evaluateOffer()` call succeeded
- All constraints (price, credential, forbidden term, commitment) passed
- It does NOT mean:
  - Escrow is locked
  - Funds move
  - Contract executes
  - Previous offers are remembered

**Recommendation for Frontend**:
- Display as `AUTHORIZED` when `policyVerified = true`
- Display as `REJECTED` when Compact throws `CompactError`
- Add integration layer state (e.g., "PROPOSED", "PENDING", "SETTLED") for actual deal lifecycle

### `priceBandCode` is witnessed and range-checked

**How it works**:
- Compact receives `vendorPrice` (e.g., 225000 cents = $2,250)
- Integration supplies `offerPriceBandCode` as a private witness
- Circuit proves the code is consistent: 225000 cents must use bandCode = 4 = "$2,000-$2,500"
- Prover cannot claim code 1 or code 7 for price 225000

**Frontend mapping required**:
```ts
const bandMap: Record<number, string> = {
  1: "$0-$500",
  2: "$500-$1,000",
  3: "$1,000-$2,000",
  4: "$2,000-$2,500",
  5: "$2,500-$5,000",
  6: "$5,000-$10,000",
  7: "$10,000+",
};
const displayBand = bandMap[priceBandCode];
```

---

## Error Message Handling

### Public vs. Private Error Disclosure

**Do NOT display to end-user**:
- `"Forbidden term detected in offer"` → Leaks what buyer is hiding
- `"Required credential not found"` → Leaks exact requirement
- `"Offer price exceeds maximum"` → Leaks buyer's max price
- Stack traces or detailed CompactError messages

**Display instead**:
- `"Hidden intent violation"` (covers all constraint failures)
- `"Policy verification failed"`
- `"Authorization denied"`

**Backend logging**:
- Log the exact constraint error for debugging
- Never log private witnesses, salts, or exact prices
- Tag logs `[PROOF_DEBUG]` for audit trails

---

## Data Shape Validation

### Witness Input Format (TS → Compact)

Integration must provide witnesses in exact Compact types:

```ts
// Buyer policy (same for both circuits)
maxPriceCents: bigint;                              // Uint<64>
requiredCredentialHash: Uint8Array(32);            // Bytes<32>
forbiddenTermHash: Uint8Array(32);                 // Bytes<32>
intentSalt: Uint8Array(32);                        // Bytes<32>

// Vendor offer (evaluateOffer only)
offerPriceCents: bigint;                           // Uint<64>
offerCredentialHashes: [Uint8Array(32), ...×4];   // Vector<4, Bytes<32>>
offerDetectedForbiddenHashes: [Uint8Array(32), ...×4]; // Vector<4, Bytes<32>>
offerSalt: Uint8Array(32);                         // Bytes<32>
```

### Zero-Padding Semantics

If vendor offer has fewer than 4 credentials, pad with `Uint8Array(32)` (all zeros):

```ts
const padding = new Uint8Array(32);
const hashes: [Uint8Array, Uint8Array, Uint8Array, Uint8Array] = [
  credHash1,
  credHash2,
  padding,  // unused slot
  padding   // unused slot
];
```

Compact handles this correctly; zero-padded slots do not match legitimate hashes.

### Hashing Normalization

Before converting strings to hashes, normalize them:
- Lowercase
- Trim whitespace
- Use canonical snake_case (e.g., `iso_27001`, not `ISO-27001` or `ISO 27001`)
- Apply consistently for both buyer intent and vendor facts

This ensures commitment reconstruction works deterministically.

---

## Ledger State Semantics

### Single-Cell Ledger Behavior

The Midnight ledger is single-cell state per contract. Multiple offers overwrite:

```ts
// Offer A evaluation:
ledger = { dealId: "deal-a", policyVerified: true, priceBandCode: 3, ... };

// Offer B evaluation (new call):
ledger = { dealId: "deal-b", policyVerified: true, priceBandCode: 4, ... }; // Previous successful offer overwritten

// Failed evaluation:
// CompactError is thrown; failed calls do not create a public rejected ledger row.
```

**Implication**: Compact does NOT maintain offer history.

**Workaround**: Integration layer must:
- Cache proof results before new evaluation
- Maintain a separate result history (off-chain or external DB)
- Use `dealId` + `intentCommitment` as composite keys to track offers

---

---

## Briefing vs. Implementation Mapping

### Field Names Changed

| Briefing             | Implementation   | Status                                    |
|----------------------|------------------|-------------------------------------------|
| `settlementAuthorized` | `policyVerified` | ✅ Renamed for semantic clarity (see "Naming Clarifications") |
| `priceBand` (string) | `priceBandCode` (Uint<8>) | ✅ Changed to enum; Frontend must map code → string |
| N/A                  | `offerCommitment` | ✅ New field; hash of vendor offer |
| N/A                  | `intentCommitment` | ✅ Replaces `policyCommitment` for consistency |

### Fields Not Implemented (v1)

| Briefing Field        | Status            | Reason                          |
|-----------------------|-------------------|---------------------------------|
| `requiredCategoryHash` / `offerCategoryHash` | ❌ Deferred v2 | Adds constraint complexity |
| `vendorHash`          | ❌ Deferred v2 | Can be added to `intentCommitment` later |
| `buyerAgentHash`      | ❌ Deferred v2 | Can be added to `intentCommitment` later |
| `settlementNonce`     | ❌ Scope cut | Replay protection in v2; v1 assumes external handling |
| Public `REJECTED` proof | ❌ Scope cut | Failed offers revert; Integration catches error |

### Constraint Implementation

| Briefing Requirement            | Implementation   | Notes |
|---------------------------------|------------------|-------|
| Price <= max                    | ✅ assert(vendorPrice <= buyerMaxPrice) | Cryptographically enforced |
| Credential in offer             | ✅ Membership check over 4 slots | Fixed-size vector |
| Forbidden term NOT in offer     | ✅ Non-membership check over 4 slots | Fixed-size vector; zero-padded |
| Intent commitment matches       | ✅ persistentHash reconstruction | Deterministic hashing |
| Offer commitment derivation     | ✅ persistentHash over price + hashes | Cryptographically bound |
| Price band disclosure           | ✅ Range-checked witness | No independent claiming |

---

Before connecting Integration layer:

- [x] Generated artifacts exist and match current TS signatures
- [ ] Witness types are provided in exact Compact format (bigint, Uint8Array(32), arrays of 4)
- [ ] Hashing normalization rules are documented in AI/Data schema
- [ ] Error handling sanitizes Compact exceptions before Frontend
- [ ] `priceBandCode` → display string mapping exists in Frontend
- [ ] Proof caching strategy is defined (no re-proof on cached results)
- [ ] Ledger overwrite behavior is accounted for in result history strategy

---

## References

- **Compact Language**: Version 0.14+
- **Midnight Runtime**: `@midnight-ntwrk/compact-runtime@0.16.0`
- **Test Framework**: TSX + Node.js (local constraint simulation, no proof server required for CI)
