# SilentIntent — Circuit Specification

## What the contract does

A buyer wants to evaluate vendor proposals without revealing
their budget, required credentials, or red-flag terms to
anyone — including the vendors themselves. This contract
lets the buyer lock in their secret criteria first, then
later prove that a specific vendor's offer either passes
or fails those criteria. The proof is posted on-chain.
Nobody learns the buyer's actual price limit or what
terms they were screening for.

---

## Step 1 — registerIntent

**When it runs:** before any vendor is evaluated. The buyer
runs this once per procurement policy.

**What it does:** takes the buyer's four secret values —
max price, required credential, forbidden term, and a
random salt — mashes them together into a 32-byte
fingerprint (the "commitment"), and stores that
fingerprint on-chain. The secrets never leave the buyer's
machine. The chain only sees the fingerprint.

**What goes on-chain after:**

| Field | Value |
|---|---|
| `policyId` | `"policy-abc"` (buyer's label) |
| `intentCommitment` | `0x3a7f...` (32-byte fingerprint) |
| `policyVerified` | `false` |

---

## Step 2 — evaluateOffer

**When it runs:** once per vendor, after registerIntent.

**What it does:** the buyer feeds in their same secrets PLUS
the AI-extracted data from the vendor's proposal. The
contract checks four things:

1. Vendor price ≤ buyer's max price
2. The buyer's secrets still hash to the same fingerprint that was stored in Step 1 (proves the buyer didn't change their criteria)
3. The vendor has the required credential
4. The vendor's proposal does NOT contain the forbidden term

If all four pass: the chain records the deal as verified.
If any one fails: the whole thing throws an error and
nothing is written on-chain.

**What goes on-chain only if ALL checks pass:**

| Field | Value |
|---|---|
| `dealId` | `"deal-vendor-b-001"` |
| `policyVerified` | `true` |
| `priceBandCode` | `4` (means $2,000–$2,500 range, not exact price) |
| `offerCommitment` | `0x9c2d...` (fingerprint of vendor's offer) |

---

## What stays private vs what becomes public

**PRIVATE (never leaves buyer's machine):**
- Exact max price in dollars/cents
- The required credential name
- The forbidden term
- The random salts
- The vendor's exact price
- The vendor's raw credential list
- The vendor's raw proposal text

**PUBLIC (visible to anyone on-chain):**
- `policyId` — which procurement policy was used
- `intentCommitment` — buyer's criteria fingerprint
- `dealId` — which vendor deal was evaluated
- `policyVerified` — did the offer pass? (true/false)
- `priceBandCode` — price range (1–7), NOT exact price
- `offerCommitment` — vendor's offer fingerprint

---

## Price band table

| Code | Range |
|---|---|
| 1 | $0–$500 |
| 2 | $500–$1,000 |
| 3 | $1,000–$2,000 |
| 4 | $2,000–$2,500 |
| 5 | $2,500–$5,000 |
| 6 | $5,000–$10,000 |
| 7 | $10,000+ |

`priceBandCode` is range-checked inside the proof. The vendor
cannot claim a cheaper-looking band than the actual price.
E.g. a $2,250 offer will always produce band 4 ($2,000–$2,500)
— it can't be faked as band 3.

---

## What happens when a proof fails

The contract throws a `CompactError` with one of these messages:

```
"Offer price exceeds maximum allowed price"
"Intent commitment mismatch"
"Required credential not found in offer"
"Forbidden term detected in offer"
"Band 1: price must be <= $500"   (or whichever band was claimed)
```

Nothing is written on-chain. `policyVerified` stays `false`.
The calling code must catch this error. Frontend should
show **"REJECTED — Hidden intent violation."** Do NOT show
the exact error message to external viewers.
