"use client";

import type { AuthStatus, ExtractedOffer } from "@/lib/types";

type Props = {
  offer: ExtractedOffer;
  status: AuthStatus;
  onAuthorize: () => void;
  loading: boolean;
  disabled: boolean;
};

const statusStyles: Record<AuthStatus, string> = {
  PENDING: "text-zinc-400 bg-zinc-800 border-zinc-700",
  REJECTED: "text-red-400 bg-red-950/50 border-red-800",
  AUTHORIZED: "text-emerald-400 bg-emerald-950/50 border-emerald-800",
};

const statusLabel: Record<AuthStatus, string> = {
  PENDING: "Pending",
  REJECTED: "Rejected",
  AUTHORIZED: "Authorized",
};

export default function VendorCard({ offer, status, onAuthorize, loading, disabled }: Props) {
  const formatPrice = (cents: number) =>
    `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

  const cardBorder =
    status === "REJECTED"
      ? "border-red-900/60"
      : status === "AUTHORIZED"
      ? "border-emerald-900/60"
      : "border-zinc-800";

  return (
    <div className={`bg-zinc-900 border rounded-xl p-5 flex flex-col gap-4 transition-colors duration-500 ${cardBorder}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-zinc-500 text-xs font-mono">
              Vendor {offer.vendorId}
            </span>
            <span className={`text-xs font-mono px-2 py-0.5 rounded border ${statusStyles[status]}`}>
              {statusLabel[status]}
            </span>
          </div>
          <h3 className="text-zinc-100 text-base font-semibold">{offer.vendorName}</h3>
        </div>
        <div className="text-right shrink-0">
          <div className="text-zinc-100 text-xl font-mono font-bold">
            {formatPrice(offer.priceCents)}
          </div>
          <div className="text-zinc-500 text-xs font-mono">USDC</div>
        </div>
      </div>

      {/* Specs */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="bg-zinc-950 rounded-lg p-2.5 flex flex-col gap-0.5">
          <span className="text-zinc-600 uppercase tracking-wider text-[10px]">Category</span>
          <span className="text-zinc-300">{offer.category}</span>
        </div>
        <div className="bg-zinc-950 rounded-lg p-2.5 flex flex-col gap-0.5">
          <span className="text-zinc-600 uppercase tracking-wider text-[10px]">Delivery</span>
          <span className="text-zinc-300">{offer.deliveryHours}h</span>
        </div>
        <div className="bg-zinc-950 rounded-lg p-2.5 flex flex-col gap-0.5">
          <span className="text-zinc-600 uppercase tracking-wider text-[10px]">Freshness</span>
          <span className={offer.freshnessVerified ? "text-emerald-400" : "text-zinc-500"}>
            {offer.freshnessVerified ? "Verified" : "Unverified"}
          </span>
        </div>
        <div className="bg-zinc-950 rounded-lg p-2.5 flex flex-col gap-0.5">
          <span className="text-zinc-600 uppercase tracking-wider text-[10px]">Credential</span>
          <span className={offer.credentialPresent ? "text-emerald-400" : "text-zinc-500"}>
            {offer.credentialPresent ? "Present" : "Absent"}
          </span>
        </div>
      </div>

      {/* Forbidden terms */}
      {offer.forbiddenTermsDetected.length > 0 && (
        <div className="bg-red-950/30 border border-red-900/40 rounded-lg p-3 flex flex-col gap-1.5">
          <span className="text-red-500 text-[10px] font-mono uppercase tracking-widest">
            Forbidden Terms Detected
          </span>
          <div className="flex flex-wrap gap-1.5">
            {offer.forbiddenTermsDetected.map((term) => (
              <span
                key={term}
                className="text-red-400 bg-red-950/60 border border-red-800/50 text-xs font-mono px-2 py-0.5 rounded"
              >
                {term}
              </span>
            ))}
          </div>
        </div>
      )}

      {offer.forbiddenTermsDetected.length === 0 && (
        <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-3">
          <span className="text-emerald-500 text-xs font-mono">✓ No forbidden terms detected</span>
        </div>
      )}

      {/* Action */}
      <button
        onClick={onAuthorize}
        disabled={disabled || loading || status !== "PENDING"}
        className={`w-full py-2.5 rounded-lg text-sm font-mono font-semibold transition-all duration-200 border
          ${
            status === "REJECTED"
              ? "bg-red-950/30 border-red-800/50 text-red-500 cursor-not-allowed"
              : status === "AUTHORIZED"
              ? "bg-emerald-950/30 border-emerald-800/50 text-emerald-500 cursor-not-allowed"
              : disabled
              ? "bg-zinc-800/50 border-zinc-700/50 text-zinc-600 cursor-not-allowed"
              : loading
              ? "bg-indigo-950/50 border-indigo-700/50 text-indigo-400 cursor-wait"
              : "bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white cursor-pointer"
          }
        `}
      >
        {loading
          ? "Generating proof…"
          : status === "REJECTED"
          ? "✕ Rejected by policy"
          : status === "AUTHORIZED"
          ? "✓ Authorized"
          : `Authorize ${offer.vendorName}`}
      </button>
    </div>
  );
}
