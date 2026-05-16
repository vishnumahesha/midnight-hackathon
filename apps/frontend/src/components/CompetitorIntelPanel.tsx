"use client";

import type { PublicPanelState } from "@/lib/types";

type Props = {
  publicState: PublicPanelState;
};

export default function CompetitorIntelPanel({ publicState }: Props) {
  const vendorAResult = publicState.vendorAResult;
  const vendorBResult = publicState.vendorBResult;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-zinc-200 text-sm font-semibold tracking-wide uppercase">
          Competitor Intelligence
        </h2>
        <span className="text-xs font-mono text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
          Privacy Analysis
        </span>
      </div>

      <p className="text-zinc-500 text-xs leading-relaxed">
        If a procurement agent reveals its policy, vendors can optimize against it.
        SilentIntent keeps the policy private while still proving whether an offer satisfies it.
      </p>

      <div className="grid grid-cols-2 gap-4">
        {/* Left — leaked policy (red) */}
        <div className="border border-red-800/60 bg-red-950/10 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-red-400 text-xs font-semibold uppercase tracking-wider">
              What vendors learn if policy leaks
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="text-zinc-400 font-semibold mb-1">Leaked policy:</div>
            <div className="space-y-1 pl-2">
              <div className="text-zinc-400">› Max budget: <span className="text-red-300">$2,500</span></div>
              <div className="text-zinc-400">› Required: <span className="text-red-300">freshness verified</span></div>
              <div className="text-zinc-400">› Forbidden: <span className="text-red-300">campaign metadata reuse</span></div>
              <div className="text-zinc-400">› Delivery: <span className="text-red-300">within 72 hours</span></div>
              <div className="text-zinc-400">› Priority: <span className="text-red-300">quality over volume</span></div>
            </div>

            <div className="border-t border-red-900/40 pt-2 mt-2">
              <div className="text-zinc-400 font-semibold mb-1">How Vendor A exploits this:</div>
              <div className="space-y-1 pl-2">
                <div className="flex items-start gap-1.5 text-red-400">
                  <span className="shrink-0 mt-0.5">⚠</span>
                  <span>Prices low enough to look like the obvious winner</span>
                </div>
                <div className="flex items-start gap-1.5 text-red-400">
                  <span className="shrink-0 mt-0.5">⚠</span>
                  <span>Advertises freshness prominently</span>
                </div>
                <div className="flex items-start gap-1.5 text-red-400">
                  <span className="shrink-0 mt-0.5">⚠</span>
                  <span>Buries reuse clause in &quot;partner enrichment&quot;</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right — public view with SilentIntent (neutral/green) */}
        <div className="border border-emerald-800/40 bg-emerald-950/10 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              What the public sees with SilentIntent
            </span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            {/* Vendor A result */}
            <div className="bg-zinc-950/60 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-zinc-400 font-semibold">Vendor A</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                    vendorAResult?.status === "REJECTED"
                      ? "bg-red-950/50 border-red-800/50 text-red-400"
                      : "bg-zinc-800 border-zinc-700 text-zinc-500"
                  }`}
                >
                  {vendorAResult?.status ?? "PENDING"}
                </span>
              </div>
              {vendorAResult ? (
                <>
                  <HashRow label="Reason" value={vendorAResult.reason ?? "—"} isText />
                  <HashRow label="Deal ID" value={vendorAResult.dealId} />
                  <HashRow label="Intent" value={vendorAResult.intentCommitment} />
                  <HashRow label="Offer" value={vendorAResult.offerCommitment} />
                </>
              ) : (
                <div className="text-zinc-700">Awaiting authorization attempt…</div>
              )}
            </div>

            {/* Vendor B result */}
            <div className="bg-zinc-950/60 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-zinc-400 font-semibold">Vendor B</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                    vendorBResult?.status === "AUTHORIZED"
                      ? "bg-emerald-950/50 border-emerald-800/50 text-emerald-400"
                      : "bg-zinc-800 border-zinc-700 text-zinc-500"
                  }`}
                >
                  {vendorBResult?.status ?? "PENDING"}
                </span>
              </div>
              {vendorBResult ? (
                <>
                  <HashRow label="Price band" value={vendorBResult.priceBand ?? "—"} isText />
                  <HashRow label="Deal ID" value={vendorBResult.dealId} />
                  <HashRow label="Treasury" value={vendorBResult.treasuryCommitmentAfter ?? "—"} />
                </>
              ) : (
                <div className="text-zinc-700">Awaiting authorization attempt…</div>
              )}
            </div>

            {/* What stays private */}
            <div className="border-t border-zinc-800 pt-2 space-y-1">
              <div className="text-zinc-600 font-semibold mb-1">What stays private:</div>
              {["Exact budget", "Exact offer price", "Hidden constraints", "Vendor's full terms", "Procurement strategy"].map((item) => (
                <div key={item} className="flex items-center gap-1.5 text-zinc-600">
                  <span>🔒</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="text-zinc-600 text-xs leading-relaxed">
        The public can verify the outcome without seeing the company&apos;s procurement strategy or the vendor&apos;s full offer.
      </p>
    </div>
  );
}

function HashRow({ label, value, isText }: { label: string; value: string; isText?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-zinc-600 shrink-0">{label}:</span>
      <span className={`truncate ${isText ? "text-zinc-400" : "text-zinc-500"}`}>{value}</span>
    </div>
  );
}
