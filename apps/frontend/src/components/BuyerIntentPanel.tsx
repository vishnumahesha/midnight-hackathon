"use client";

import { useState } from "react";

export default function BuyerIntentPanel() {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-zinc-200 text-sm font-semibold tracking-wide uppercase">
          Buyer Intent
        </h2>
        <span className="text-xs font-mono text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
          Agent Private View
        </span>
      </div>

      {/* Public visible goal */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest">
          Visible Goal
        </span>
        <p className="text-zinc-200 text-sm leading-relaxed">
          Acquire dental clinic lead data for outreach campaign
        </p>
      </div>

      {/* Hidden constraints */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest">
            Procurement Policy
          </span>
          <button
            onClick={() => setRevealed((r) => !r)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-mono transition-colors"
          >
            {revealed ? "hide" : "reveal (demo only)"}
          </button>
        </div>

        <div className="relative rounded-lg border border-zinc-700 bg-zinc-950 p-4 overflow-hidden">
          {!revealed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-950/90 backdrop-blur-sm z-10">
              <div className="text-2xl">🔒</div>
              <span className="text-zinc-500 text-xs font-mono">committed, not disclosed</span>
              <span className="text-zinc-600 text-xs font-mono">0x4a2f8c1d9e3b7a05…</span>
            </div>
          )}
          <ul className="space-y-2 text-sm font-mono">
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 mt-0.5">›</span>
              <span className="text-zinc-300">Max budget: <span className="text-amber-400">$2,500 USDC</span></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 mt-0.5">›</span>
              <span className="text-zinc-300">Category: <span className="text-amber-400">dental_lead_data</span></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 mt-0.5">›</span>
              <span className="text-zinc-300">Freshness verified: <span className="text-amber-400">required</span></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 mt-0.5">›</span>
              <span className="text-zinc-300">Delivery: <span className="text-amber-400">≤ 72 hours</span></span>
            </li>
            <li className="flex items-start gap-2 text-red-400">
              <span className="mt-0.5">✕</span>
              <span>Forbidden: <span className="font-semibold">campaign_metadata_reuse</span></span>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-zinc-600 text-xs font-mono">intent commitment</span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>
      <p className="text-zinc-600 text-xs font-mono text-center break-all">
        0x4a2f8c1d9e3b7a05f2c6d4e8b1a9c3f7
      </p>
    </div>
  );
}
