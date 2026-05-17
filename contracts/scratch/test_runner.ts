/**
 * SilentIntent test harness — evaluateOffer circuit
 *
 * Run:  npm test
 *       (requires proof server on :6300 for real ZK proofs, but local
 *        constraint simulation runs without it)
 *
 * Failure modes:
 *   1. CompactError "Offer price exceeds maximum allowed price"
 *      → offerPriceCents() > maxPriceCents()
 *   2. CompactError "Intent commitment mismatch"
 *      → witness values don't reconstruct the stored intentCommitment
 *   3. CompactError "Required credential not found in offer"
 *      → offerCredentialHashes() doesn't contain requiredCredentialHash()
 *   4. CompactError "Forbidden term detected in offer"
 *      → offerDetectedForbiddenHashes() contains forbiddenTermHash()
 */

import {
  createCircuitContext,
  dummyContractAddress,
  CompactError,
} from '@midnight-ntwrk/compact-runtime';
import {
  Contract,
  ledger,
  type Witnesses,
  type Ledger,
} from '../silentintent/out/contract/index.js';

// ── Shared buyer policy (same across both test cases) ────────────────────────

const MAX_PRICE_CENTS = 12_000n; // $120.00
const CRED_HASH = Uint8Array.from({ length: 32 }, (_, i) => i + 1); // "ISO-27001" stand-in
const FORBID_HASH = Uint8Array.from({ length: 32 }, (_, i) => i + 33); // "Liquidated Damages" stand-in
const INTENT_SALT = Uint8Array.from({ length: 32 }, (_, i) => i + 65);
const OFFER_SALT = Uint8Array.from({ length: 32 }, (_, i) => i + 97);
const ZEROS_32 = new Uint8Array(32);
const DUMMY_COIN_PK = new Uint8Array(32);

type PS = Record<string, never>; // stateless private state — witnesses use closures

// ── Witness factory ──────────────────────────────────────────────────────────

function makeWitnesses(
  offerPriceCents: bigint,
  offerCredHashes: [Uint8Array, Uint8Array, Uint8Array, Uint8Array],
  offerForbidHashes: [Uint8Array, Uint8Array, Uint8Array, Uint8Array],
  offerPriceBand: string,
): Witnesses<PS> {
  return {
    // Buyer's hidden procurement policy
    maxPriceCents:               (_ctx) => [{}, MAX_PRICE_CENTS],
    requiredCredentialHash:      (_ctx) => [{}, CRED_HASH],
    forbiddenTermHash:           (_ctx) => [{}, FORBID_HASH],
    intentSalt:                  (_ctx) => [{}, INTENT_SALT],
    // Vendor offer (extracted by AI in production)
    offerPriceCents:             (_ctx) => [{}, offerPriceCents],
    offerCredentialHashes:       (_ctx) => [{}, [...offerCredHashes]],
    offerDetectedForbiddenHashes:(_ctx) => [{}, [...offerForbidHashes]],
    offerSalt:                   (_ctx) => [{}, OFFER_SALT],
    offerPriceBand:              (_ctx) => [{}, offerPriceBand],
  };
}

// ── Core test runner ─────────────────────────────────────────────────────────

function runScenario(
  label: string,
  witnesses: Witnesses<PS>,
  policyId: string,
  dealId: string,
  expectPass: boolean,
): boolean {
  console.log(`\n[CASE] ${label}`);
  console.log(`  policyId: ${policyId}  dealId: ${dealId}  expectPass: ${expectPass}`);

  const contract = new Contract<PS>(witnesses);

  // 1. Initialise blank ledger state (all fields null/zero)
  const init = contract.initialState({
    initialPrivateState: {} as PS,
    initialZswapLocalState: { coinPublicKey: DUMMY_COIN_PK },
  });

  // 2. registerIntent — hashes buyer's private policy and stores intentCommitment
  const ctxRegister = createCircuitContext(
    dummyContractAddress(),
    init.currentZswapLocalState,
    init.currentContractState,
    init.currentPrivateState,
  );
  const riResult = contract.circuits.registerIntent(ctxRegister, policyId);
  // Use returned context — queryLedgerState updates context, not the input arg

  const intentLedger = ledger(riResult.context.currentQueryContext.state);
  console.log(`  [registerIntent] policyId stored: ${intentLedger.policyId}`);
  console.log(`  [registerIntent] settlementAuthorized: ${intentLedger.settlementAuthorized}`);

  // 3. evaluateOffer — validate vendor offer against stored commitment
  const ctxEval = createCircuitContext(
    dummyContractAddress(),
    riResult.context.currentZswapLocalState,
    riResult.context.currentQueryContext.state,
    riResult.context.currentPrivateState,
  );

  try {
    const eoResult = contract.circuits.evaluateOffer(ctxEval, dealId);

    // Read public outputs from final ledger state
    const finalLedger: Ledger = ledger(eoResult.context.currentQueryContext.state);
    console.log(`  [evaluateOffer] settlementAuthorized: ${finalLedger.settlementAuthorized}`);
    console.log(`  [evaluateOffer] priceBand:            ${finalLedger.priceBand}`);
    console.log(`  [evaluateOffer] dealId:               ${finalLedger.dealId}`);

    if (expectPass) {
      console.log(`  [PASS]`);
      return true;
    } else {
      console.error(`  [FAIL] Expected CompactError but evaluateOffer succeeded`);
      return false;
    }
  } catch (err) {
    if (err instanceof CompactError) {
      console.log(`  CompactError: "${err.message}"`);
      if (!expectPass) {
        console.log(`  [PASS] Constraint violation caught as expected`);
        return true;
      } else {
        console.error(`  [FAIL] Unexpected CompactError: ${err.message}`);
        return false;
      }
    }
    throw err; // unexpected error type — propagate
  }
}

// ── Test data ────────────────────────────────────────────────────────────────

// Case 1: Vendor B — happy path
//   price $110 < $120 max ✓
//   ISO-27001 credential present in slot 0 ✓
//   no forbidden terms detected ✓
const vendorBWitnesses = makeWitnesses(
  11_000n,
  [CRED_HASH, ZEROS_32, ZEROS_32, ZEROS_32],
  [ZEROS_32,  ZEROS_32, ZEROS_32, ZEROS_32],
  '100-150',
);

// Case 2: Vendor A — constraint violation
//   price $115 < $120 max ✓
//   ISO-27001 credential present ✓
//   "Liquidated Damages" detected in slot 0 → FORBIDDEN ✗
const vendorAWitnesses = makeWitnesses(
  11_500n,
  [CRED_HASH,   ZEROS_32, ZEROS_32, ZEROS_32],
  [FORBID_HASH, ZEROS_32, ZEROS_32, ZEROS_32],
  '100-150',
);

// ── Run suite ────────────────────────────────────────────────────────────────

console.log('[PREFLIGHT] @midnight-ntwrk/compact-runtime loaded OK');
console.log('[PREFLIGHT] Running 2 test cases against SilentIntent circuit\n');

const results: boolean[] = [
  runScenario(
    'Vendor B — happy path ($110, ISO-27001 OK, no forbidden terms)',
    vendorBWitnesses,
    'policy-001',
    'deal-vendor-b-001',
    true,
  ),
  runScenario(
    'Vendor A — forbidden term violation ($115, "Liquidated Damages" detected)',
    vendorAWitnesses,
    'policy-001',
    'deal-vendor-a-001',
    false,
  ),
];

const passed = results.filter(Boolean).length;
const failed = results.length - passed;
console.log(`\n[SUMMARY] ${passed}/${results.length} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
