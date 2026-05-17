/**
 * SilentIntent test harness — evaluateOffer circuit
 *
 * Run:  npm test
 *       (requires proof server on :6300 for real ZK proofs, but local
 *        constraint simulation runs without it)
 *
 * Constraint violations tested:
 *   1. Price violation: offerPriceCents() > maxPriceCents()
 *   2. Commitment mismatch: witness values don't reconstruct intentCommitment
 *   3. Missing credential: requiredCredentialHash() not in offerCredentialHashes()
 *   4. Forbidden term detected: forbiddenTermHash() in offerDetectedForbiddenHashes()
 *
 * Band codes: 1=$0-$500, 2=$500-$1k, 3=$1k-$2k, 4=$2k-$2.5k,
 *             5=$2.5k-$5k, 6=$5k-$10k, 7=$10k+
 * Prover-supplied but range-checked in-circuit: cannot forge a cheaper-looking band.
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
  bandCode: bigint,
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
    // Band code: prover-supplied, range-checked in-circuit
    offerPriceBandCode:          (_ctx) => [{}, bandCode],
  };
}

// ── Core test runner ─────────────────────────────────────────────────────────

// evalWitnesses — if supplied, a DIFFERENT contract instance is used for evaluateOffer.
// This lets Case 5 register with correct salt but evaluate with wrong salt (mismatch test).
function runScenario(
  label: string,
  witnesses: Witnesses<PS>,
  policyId: string,
  dealId: string,
  expectPass: boolean,
  evalWitnesses?: Witnesses<PS>,
): boolean {
  console.log(`\n[CASE] ${label}`);
  console.log(`  policyId: ${policyId}  dealId: ${dealId}  expectPass: ${expectPass}`);

  const registerContract = new Contract<PS>(witnesses);

  // 1. Initialise blank ledger state (all fields null/zero)
  const init = registerContract.initialState({
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
  const riResult = registerContract.circuits.registerIntent(ctxRegister, policyId);
  // Use returned context — queryLedgerState updates context, not the input arg

  const intentLedger = ledger(riResult.context.currentQueryContext.state);
  console.log(`  [registerIntent] policyId stored: ${intentLedger.policyId}`);
  console.log(`  [registerIntent] policyVerified: ${intentLedger.policyVerified}`);

  // 3. evaluateOffer — validate vendor offer against stored commitment
  // Use evalWitnesses if provided (e.g., wrong salt for commitment mismatch test)
  const evalContract = evalWitnesses ? new Contract<PS>(evalWitnesses) : registerContract;
  const ctxEval = createCircuitContext(
    dummyContractAddress(),
    riResult.context.currentZswapLocalState,
    riResult.context.currentQueryContext.state,
    riResult.context.currentPrivateState,
  );

  try {
    const eoResult = evalContract.circuits.evaluateOffer(ctxEval, dealId);

    // Read public outputs from final ledger state
    const finalLedger: Ledger = ledger(eoResult.context.currentQueryContext.state);
    const bandDescriptions: Record<number, string> = {
      1: "$0-$500",
      2: "$500-$1,000",
      3: "$1,000-$2,000",
      4: "$2,000-$2,500",
      5: "$2,500-$5,000",
      6: "$5,000-$10,000",
      7: "$10,000+",
    };
    console.log(`  [evaluateOffer] policyVerified:       ${finalLedger.policyVerified}`);
    console.log(`  [evaluateOffer] priceBandCode:        ${finalLedger.priceBandCode} (${bandDescriptions[Number(finalLedger.priceBandCode)] || "unknown"})`);
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

// Band code: all test prices are $100-$130 (10,000-13,000 cents) → band 1 ($0-$500).
// For violation cases, the circuit fails before reaching the band check; band 1 is safe to supply.

// Case 1: Happy path — all constraints pass
//   price $110 < $120 max ✓, ISO-27001 in slot 0 ✓, no forbidden terms ✓, band 1 ✓
const case1Happy = makeWitnesses(
  11_000n,
  [CRED_HASH, ZEROS_32, ZEROS_32, ZEROS_32],
  [ZEROS_32,  ZEROS_32, ZEROS_32, ZEROS_32],
  1n,
);

// Case 2: Forbidden term violation ($115, "Liquidated Damages" in slot 0)
const case2Forbidden = makeWitnesses(
  11_500n,
  [CRED_HASH,   ZEROS_32, ZEROS_32, ZEROS_32],
  [FORBID_HASH, ZEROS_32, ZEROS_32, ZEROS_32],
  1n,
);

// Case 3: Price violation ($130 > $120 max)
const case3PriceViolation = makeWitnesses(
  13_000n,
  [CRED_HASH, ZEROS_32, ZEROS_32, ZEROS_32],
  [ZEROS_32,  ZEROS_32, ZEROS_32, ZEROS_32],
  1n,
);

// Case 4: Missing credential (no ISO-27001 in offer hashes)
const case4MissingCred = makeWitnesses(
  10_000n,
  [ZEROS_32, ZEROS_32, ZEROS_32, ZEROS_32],
  [ZEROS_32, ZEROS_32, ZEROS_32, ZEROS_32],
  1n,
);

// Case 5: Commitment mismatch
//   registerIntent uses INTENT_SALT (correct) → stores hash(policy, INTENT_SALT) in ledger
//   evaluateOffer uses WRONG_INTENT_SALT → recomputes hash(policy, WRONG_INTENT_SALT) ≠ stored
const WRONG_INTENT_SALT = Uint8Array.from({ length: 32 }, (_, i) => i + 200);
// Correct witnesses for registerIntent (same as case1Happy but reused here)
const case5RegisterWitnesses = makeWitnesses(
  11_000n, [CRED_HASH, ZEROS_32, ZEROS_32, ZEROS_32], [ZEROS_32, ZEROS_32, ZEROS_32, ZEROS_32], 1n,
);
// Wrong-salt witnesses for evaluateOffer — produces mismatched commitment
const case5EvalWitnesses: Witnesses<PS> = {
  maxPriceCents:               (_ctx) => [{}, MAX_PRICE_CENTS],
  requiredCredentialHash:      (_ctx) => [{}, CRED_HASH],
  forbiddenTermHash:           (_ctx) => [{}, FORBID_HASH],
  intentSalt:                  (_ctx) => [{}, WRONG_INTENT_SALT],
  offerPriceCents:             (_ctx) => [{}, 11_000n],
  offerCredentialHashes:       (_ctx) => [{}, [CRED_HASH, ZEROS_32, ZEROS_32, ZEROS_32]],
  offerDetectedForbiddenHashes:(_ctx) => [{}, [ZEROS_32, ZEROS_32, ZEROS_32, ZEROS_32]],
  offerSalt:                   (_ctx) => [{}, OFFER_SALT],
  offerPriceBandCode:          (_ctx) => [{}, 1n],
};

// ── Run suite ────────────────────────────────────────────────────────────────

console.log('[PREFLIGHT] @midnight-ntwrk/compact-runtime loaded OK');
console.log('[PREFLIGHT] Running 5 test cases against SilentIntent circuit\n');

const results: boolean[] = [
  runScenario(
    'Case 1: Happy path ($110, ISO-27001 OK, no forbidden terms)',
    case1Happy,
    'policy-001',
    'deal-happy-001',
    true,
  ),
  runScenario(
    'Case 2: Forbidden term violation ($115, "Liquidated Damages" detected)',
    case2Forbidden,
    'policy-001',
    'deal-forbidden-001',
    false,
  ),
  runScenario(
    'Case 3: Price violation ($130 > $120 max)',
    case3PriceViolation,
    'policy-001',
    'deal-price-violation-001',
    false,
  ),
  runScenario(
    'Case 4: Missing credential (no ISO-27001)',
    case4MissingCred,
    'policy-001',
    'deal-missing-cred-001',
    false,
  ),
  runScenario(
    'Case 5: Commitment mismatch (correct register salt, wrong eval salt)',
    case5RegisterWitnesses,
    'policy-001',
    'deal-commitment-mismatch-001',
    false,
    case5EvalWitnesses,
  ),
];

const passed = results.filter(Boolean).length;
const failed = results.length - passed;
console.log(`\n[SUMMARY] ${passed}/${results.length} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
