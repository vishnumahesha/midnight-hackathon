"use client";

import type { ProofResult, TreasuryState } from "@/lib/types";

type Props = {
  vendorAResult: ProofResult | null;
  vendorBResult: ProofResult | null;
  treasury: TreasuryState;
  loading: boolean;
};

export default function PublicVerifier({ vendorAResult, vendorBResult, treasury, loading }: Props) {
  const formatUSDC = (cents: number) =>
    `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })} USDC`;

  const anyResult = vendorAResult ?? vendorBResult;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-zinc-200 text-sm font-semibold tracking-wide uppercase">
          Public Verifier
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-500">Midnight Ledger</span>
          <div className={`w-2 h-2 rounded-full ${loading ? "bg-amber-400 animate-pulse" : anyResult ? "bg-emerald-500" : "bg-zinc-600"}`} />
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <span className="text-zinc-500 text-sm font-mono">Generating Compact proof…</span>
          <span className="text-zinc-700 text-xs font-mono">Verifying constraints on private witnesses</span>
        </div>
      )}

      {!loading && !anyResult && (
        <div className="text-center py-6 text-zinc-600 text-sm font-mono">
          No authorization attempts yet
        </div>
      )}

      {!loading && anyResult && (
        <div className="space-y-3">
          {/* Vendor A result */}
          {vendorAResult && (
            <ResultCard
              vendorLabel="Vendor A — BrightReach Data"
              result={vendorAResult}
            />
          )}

          {/* Vendor B result */}
          {vendorBResult && (
            <ResultCard
              vendorLabel="Vendor B — CleanList Pro"
              result={vendorBResult}
            />
          )}

          {/* Treasury state */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col gap-2">
            <span className="text-zinc-600 text-[10px] font-mono uppercase tracking-widest">
              Treasury State
            </span>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-xs font-mono">Balance</span>
              <span className={`text-sm font-mono font-bold ${vendorBResult ? "text-emerald-400" : "text-zinc-300"}`}>
                {formatUSDC(treasury.balanceCents)}
              </span>
            </div>
            {treasury.lastDebitCents && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-xs font-mono">Debited</span>
                <span className="text-red-400 text-sm font-mono">−{formatUSDC(treasury.lastDebitCents)}</span>
              </div>
            )}
            {treasury.vendorCommitment && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-400 text-xs font-mono shrink-0">Vendor commitment</span>
                <span className="text-zinc-500 text-xs font-mono truncate">{treasury.vendorCommitment}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultCard({ vendorLabel, result }: { vendorLabel: string; result: ProofResult }) {
  const isAuthorized = result.status === "AUTHORIZED";

  return (
    <div
      className={`border rounded-lg p-4 flex flex-col gap-2.5 transition-colors ${
        isAuthorized
          ? "border-emerald-800/60 bg-emerald-950/20"
          : "border-red-800/60 bg-red-950/15"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-zinc-400 text-xs font-mono">{vendorLabel}</span>
        <span
          className={`text-sm font-mono font-bold px-2.5 py-0.5 rounded border ${
            isAuthorized
              ? "text-emerald-400 bg-emerald-950/50 border-emerald-700"
              : "text-red-400 bg-red-950/50 border-red-700"
          }`}
        >
          {result.status}
        </span>
      </div>

      <div className="space-y-1.5 text-xs font-mono">
        {result.reason && (
          <Row label="Reason" value={result.reason} />
        )}
        {result.priceBand && (
          <Row label="Price band" value={result.priceBand} valueClass="text-amber-300" />
        )}
        <Row label="Deal ID" value={result.dealId} />
        <Row label="Intent commitment" value={result.intentCommitment} />
        <Row label="Offer commitment" value={result.offerCommitment} />
        {result.treasuryCommitmentAfter && (
          <Row label="Treasury commitment" value={result.treasuryCommitmentAfter} />
        )}
      </div>
    </div>
  );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-zinc-600 shrink-0">{label}:</span>
      <span className={`truncate ${valueClass ?? "text-zinc-500"}`}>{value}</span>
    </div>
  );
}
