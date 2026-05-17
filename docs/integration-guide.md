# SilentIntent — Integration Guide

---

## Integration Owner

### What you need from the contract

**Import path:** `contracts/silentintent/out/contract/index.js`  
**Runtime dep:** `@midnight-ntwrk/compact-runtime@0.16.0`  
**Install it at:** `contracts/` (parent of both `scratch/` and
`silentintent/out/`) so both the test harness and the
contract resolve the same runtime instance.

You must supply 9 witness callbacks. Each returns
`[privateState, value]`. Types are exact — no wiggle room:

| Witness | TypeScript type |
|---|---|
| `maxPriceCents()` | `bigint` (cents, e.g. `250000n`) |
| `requiredCredentialHash()` | `Uint8Array(32)` |
| `forbiddenTermHash()` | `Uint8Array(32)` |
| `intentSalt()` | `Uint8Array(32)` |
| `offerPriceCents()` | `bigint` (cents) |
| `offerCredentialHashes()` | `Uint8Array[4]` each exactly 32 bytes |
| `offerDetectedForbiddenHashes()` | `Uint8Array[4]` each exactly 32 bytes |
| `offerSalt()` | `Uint8Array(32)` |
| `offerPriceBandCode()` | `bigint` (`1n`–`7n`) |

**Call order:**

```
1. contract.initialState({ initialPrivateState: {},
     initialZswapLocalState: { coinPublicKey: Uint8Array(32) } })
2. createCircuitContext(...) + contract.circuits.registerIntent(ctx, policyId)
3. Use riResult.context (not the input ctx) for the next call
4. createCircuitContext(...) + contract.circuits.evaluateOffer(ctx2, dealId)
5. Read ledger: ledger(eoResult.context.currentQueryContext.state)
```

### What you must NEVER do

- Use `ctx` after a circuit call — the circuit returns a new context in `result.context`. Use that for the next step.
- Install `compact-runtime` in two different `node_modules` locations. It must be ONE shared install or `ContractState` instanceof checks will silently break everything.
- Pass a regular JS number for prices — it must be `bigint`.
- Pass fewer than 4 elements in credential/forbidden arrays. Pad unused slots with `new Uint8Array(32)` (all zeros).

### Start now

Wire up `registerIntent` end-to-end with hardcoded witness values.
Confirm `policyId` and `intentCommitment` appear in the returned
ledger. Reference `contracts/scratch/test_runner.ts` for working
call patterns.

---

## Frontend Owner

### What you need from the contract

After `evaluateOffer` you get a `Ledger` object:

| Field | Type | Notes |
|---|---|---|
| `policyId` | `string` | which policy was used |
| `dealId` | `string` | which deal was evaluated |
| `policyVerified` | `boolean` | `true` = AUTHORIZED |
| `priceBandCode` | `bigint` | 1–7 (map to display string) |
| `intentCommitment` | `Uint8Array(32)` | show as `0x` hex |
| `offerCommitment` | `Uint8Array(32)` | show as `0x` hex |

**Band code → display string:**

| Code | Display |
|---|---|
| 1 | "$0–$500" |
| 2 | "$500–$1,000" |
| 3 | "$1,000–$2,000" |
| 4 | "$2,000–$2,500" ← Vendor B ($2,250) lands here |
| 5 | "$2,500–$5,000" |
| 6 | "$5,000–$10,000" |
| 7 | "$10,000+" |

**There are exactly three states to render:**

- `pending` — proof is being generated
- `authorized` — `policyVerified == true`, show ledger fields
- `rejected` — `CompactError` was thrown; nothing on-chain

### What you must NEVER do

- Show the raw `CompactError` message publicly. Use **"REJECTED — Hidden intent violation."** instead.
- Show the exact price. You only have the band code.
- Assume the proof is fast. It may take seconds. Show a loading state.
- Try to read private witnesses from the contract. They are not accessible. Only the `Ledger` fields above.

### Start now

Build the three UI states (pending / authorized / rejected) with
hardcoded mock data. The authorized card should show `policyId`,
`dealId`, `priceBandCode` as display string, `policyVerified`,
and both commitments as `0x`-prefixed hex. Don't wait for real
proof data.

---

## AI/Data Owner

### What you need to produce

From each vendor proposal you must extract:

| Field | Type | Notes |
|---|---|---|
| `priceCents` | `number` | dollars × 100, integer |
| `credentials` | `string[]` | e.g. `["ISO-27001", "SOC2"]` |
| `forbiddenTermsDetected` | `string[]` | e.g. `["liquidated damages"]` |

Integration will hash each string and pack the arrays.
Your job is accurate extraction. The circuit fails hard
on wrong data — there are no second chances per run.

### What you must NEVER do

- Return fractional prices. `$2,250.50` must become `225050`, not `2250.50`. Integration converts: `price * 100`, integer.
- Return more than 4 credentials or 4 forbidden terms. The circuit only has 4 slots. Integration takes the first 4; extras are silently ignored.
- Vary how you name credentials between vendor runs. `"ISO 27001"` and `"ISO-27001"` will hash to different values and the credential check will fail. Pick one canonical form and use it everywhere.
- Include the forbidden term in the list if it wasn't actually found. False positives cause real rejections.

### Start now

Produce extraction JSON for both demo vendors in this exact
shape and share it with Integration:

```json
{
  "vendorId": "vendor_b",
  "priceCents": 225000,
  "credentials": ["freshness_verified", "licensed_sources"],
  "forbiddenTermsDetected": []
}
```

---

## PM/Demo (Vishnu)

### What you need from the contract

**Two on-chain outcomes to show in the demo:**

**Vendor A (REJECTED):**
- `policyVerified: false`
- Nothing written to chain
- UI shows: "REJECTED — Hidden intent violation"
- You do NOT say why it failed

**Vendor B (AUTHORIZED):**
- `policyVerified: true`
- `priceBandCode: 4` ("$2,000–$2,500")
- `intentCommitment: 0x...` (buyer's criteria fingerprint)
- `offerCommitment: 0x...` (vendor's offer fingerprint)
- UI shows deal authorized with price range, not exact price

The key demo claim: the buyer evaluated both vendors
against a secret policy. One passed, one didn't.
Nobody — not the vendors, not the audience — knows
the exact budget or what the forbidden term was.
The on-chain record proves the evaluation was fair.

### What you must NEVER do

- Say "the exact price is hidden in the proof" — the proof doesn't store the price at all. Say instead: "the buyer's budget never left their browser."
- Promise real-time on-chain settlement. This is a proof-of-concept. Call it "proof generation."
- Show the raw error message for Vendor A. "Hidden intent violation" is the correct public-facing copy.

### Start now

Write the demo script with two vendor cards. Card 1 (Vendor A):
pending → rejected. Card 2 (Vendor B): pending → authorized
with band "$2,000–$2,500". Confirm with Frontend what the
loading/result states look like. Lock the script before the
demo — do not improvise claims about what the ZK proof
guarantees.
