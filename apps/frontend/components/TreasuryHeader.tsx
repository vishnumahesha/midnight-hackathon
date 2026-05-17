"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  balanceCents: number;
  lastDebitCents?: number;
};

function formatUSDC(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function TreasuryHeader({ balanceCents, lastDebitCents }: Props) {
  const [displayed, setDisplayed] = useState(balanceCents);
  const [showDebit, setShowDebit] = useState(false);
  const prevBalance = useRef(balanceCents);

  useEffect(() => {
    if (balanceCents === prevBalance.current) return;

    const start = prevBalance.current;
    const end = balanceCents;
    const duration = 1200;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
    setShowDebit(true);
    prevBalance.current = balanceCents;

    const timer = setTimeout(() => setShowDebit(false), 4000);
    return () => clearTimeout(timer);
  }, [balanceCents]);

  return (
    <header className="w-full bg-zinc-900 border-b border-zinc-800 px-8 py-5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-zinc-400 text-sm font-mono tracking-widest uppercase">
            SilentIntent
          </span>
          <span className="text-zinc-700 text-sm">·</span>
          <span className="text-zinc-500 text-xs font-mono">Confidential Procurement Agent</span>
        </div>

        <div className="flex items-center gap-6">
          {showDebit && lastDebitCents && (
            <div className="flex items-center gap-2 text-red-400 text-sm font-mono animate-pulse">
              <span>−${formatUSDC(lastDebitCents)}</span>
              <span className="text-zinc-600">→ vendor commitment</span>
              <span className="text-zinc-500 text-xs truncate max-w-32">0x5e2b8f4c…</span>
            </div>
          )}

          <div className="flex flex-col items-end">
            <span className="text-zinc-500 text-xs font-mono tracking-widest uppercase mb-0.5">
              Agent Treasury
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-mono font-bold tracking-tight transition-colors duration-300 ${
                  showDebit ? "text-red-400" : "text-emerald-400"
                }`}
              >
                ${formatUSDC(displayed)}
              </span>
              <span className="text-zinc-500 text-sm font-mono">USDC</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 rounded px-2.5 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span className="text-zinc-400 text-xs font-mono">Midnight Network</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
