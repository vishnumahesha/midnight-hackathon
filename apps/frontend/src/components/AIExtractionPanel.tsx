"use client";

import type { ExtractedOffer, VendorId } from "@/lib/types";
import { VENDOR_A_PROPOSAL, VENDOR_B_PROPOSAL } from "@/lib/mockData";

type Props = {
  activeVendor: VendorId;
  extracted: ExtractedOffer;
};

export default function AIExtractionPanel({ activeVendor, extracted }: Props) {
  const proposalText = activeVendor === "A" ? VENDOR_A_PROPOSAL : VENDOR_B_PROPOSAL;

  const formatPrice = (cents: number) =>
    `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-zinc-200 text-sm font-semibold tracking-wide uppercase">
          AI Extraction
        </h2>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-xs font-mono text-zinc-500">Claude claude-sonnet-4-6</span>
        </div>
      </div>

      <div className="flex gap-1 bg-zinc-950 rounded-lg p-1">
        {(["A", "B"] as VendorId[]).map((v) => (
          <div
            key={v}
            className={`flex-1 text-center text-xs font-mono py-1.5 rounded-md transition-colors ${
              activeVendor === v
                ? "bg-zinc-800 text-zinc-200"
                : "text-zinc-600"
            }`}
          >
            Vendor {v}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
        {/* Proposal text */}
        <div className="flex flex-col gap-2">
          <span className="text-zinc-600 text-[10px] font-mono uppercase tracking-widest">
            Vendor Proposal
          </span>
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex-1 overflow-auto">
            <p className="text-zinc-400 text-xs font-mono leading-relaxed whitespace-pre-wrap">
              {proposalText}
            </p>
          </div>
        </div>

        {/* Extracted JSON */}
        <div className="flex flex-col gap-2">
          <span className="text-zinc-600 text-[10px] font-mono uppercase tracking-widest">
            Extracted Facts
          </span>
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex-1 overflow-auto">
            <div className="text-xs font-mono space-y-1.5">
              <Field label="vendor" value={extracted.vendorName} />
              <Field label="price" value={formatPrice(extracted.priceCents)} />
              <Field label="category" value={extracted.category} />
              <Field
                label="freshnessVerified"
                value={String(extracted.freshnessVerified)}
                highlight={extracted.freshnessVerified ? "green" : "neutral"}
              />
              <Field label="deliveryHours" value={String(extracted.deliveryHours)} />
              <Field
                label="credentialPresent"
                value={String(extracted.credentialPresent)}
                highlight={extracted.credentialPresent ? "green" : "neutral"}
              />
              <div className="pt-1 border-t border-zinc-800">
                <span className="text-zinc-600">forbiddenTermsDetected</span>
                <span className="text-zinc-700">: [</span>
                {extracted.forbiddenTermsDetected.length === 0 ? (
                  <span className="text-emerald-400">]</span>
                ) : (
                  <div className="pl-3">
                    {extracted.forbiddenTermsDetected.map((t) => (
                      <div key={t} className="text-red-400">
                        &quot;{t}&quot;,
                      </div>
                    ))}
                    <span className="text-zinc-700">]</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
  highlight?: "green" | "red" | "neutral";
};

function Field({ label, value, highlight }: FieldProps) {
  const valueColor =
    highlight === "green"
      ? "text-emerald-400"
      : highlight === "red"
      ? "text-red-400"
      : "text-amber-300";

  return (
    <div>
      <span className="text-zinc-600">{label}</span>
      <span className="text-zinc-700">: </span>
      <span className={valueColor}>{value}</span>
    </div>
  );
}
