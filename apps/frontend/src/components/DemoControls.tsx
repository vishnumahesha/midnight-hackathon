"use client";

import type { DemoMode } from "@/lib/types";

type Props = {
  mode: DemoMode;
  onReset: () => void;
  onAuthorizeA: () => void;
  onAuthorizeB: () => void;
};

export default function DemoControls({ mode, onReset, onAuthorizeA, onAuthorizeB }: Props) {
  const steps: { id: DemoMode | DemoMode[]; label: string; done: boolean; active: boolean }[] = [
    {
      id: "idle",
      label: "Treasury initialized",
      done: mode !== "idle",
      active: mode === "idle",
    },
    {
      id: ["authorizing-a", "rejected-a"],
      label: "Authorize Vendor A",
      done: mode === "rejected-a" || mode === "authorizing-b" || mode === "authorized-b",
      active: mode === "authorizing-a",
    },
    {
      id: "rejected-a",
      label: "Policy rejects Vendor A",
      done: mode === "authorizing-b" || mode === "authorized-b",
      active: mode === "rejected-a",
    },
    {
      id: ["authorizing-b", "authorized-b"],
      label: "Authorize Vendor B",
      done: mode === "authorized-b",
      active: mode === "authorizing-b",
    },
    {
      id: "authorized-b",
      label: "Treasury debited",
      done: false,
      active: mode === "authorized-b",
    },
  ];

  const canAuthorizeA = mode === "idle" || mode === "rejected-a";
  const canAuthorizeB = mode === "rejected-a";
  const isLoading = mode === "authorizing-a" || mode === "authorizing-b";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-zinc-200 text-sm font-semibold tracking-wide uppercase">
          Demo Controls
        </h2>
        <button
          onClick={onReset}
          className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors border border-zinc-700 hover:border-zinc-600 px-2.5 py-1 rounded"
        >
          ↺ Reset
        </button>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-1">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-1 flex-1">
            <div
              className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                step.done
                  ? "bg-emerald-500"
                  : step.active
                  ? "bg-indigo-400 animate-pulse"
                  : "bg-zinc-700"
              }`}
            />
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px transition-colors ${step.done ? "bg-emerald-800" : "bg-zinc-800"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`text-xs font-mono transition-colors ${
              step.active
                ? "text-indigo-400"
                : step.done
                ? "text-emerald-600"
                : "text-zinc-700"
            }`}
          >
            {step.done ? "✓" : step.active ? "›" : "·"} {step.label}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2 pt-1 border-t border-zinc-800">
        <button
          onClick={onAuthorizeA}
          disabled={!canAuthorizeA || isLoading}
          className={`w-full py-2 rounded-lg text-sm font-mono font-medium transition-all border
            ${
              !canAuthorizeA || isLoading
                ? "border-zinc-700/50 bg-zinc-800/30 text-zinc-600 cursor-not-allowed"
                : "border-indigo-700 bg-indigo-950/50 text-indigo-300 hover:bg-indigo-900/50 cursor-pointer"
            }
          `}
        >
          {mode === "authorizing-a" ? "Generating proof…" : "Attempt Vendor A"}
        </button>

        <button
          onClick={onAuthorizeB}
          disabled={!canAuthorizeB || isLoading}
          className={`w-full py-2 rounded-lg text-sm font-mono font-medium transition-all border
            ${
              !canAuthorizeB || isLoading
                ? "border-zinc-700/50 bg-zinc-800/30 text-zinc-600 cursor-not-allowed"
                : "border-emerald-700 bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/50 cursor-pointer"
            }
          `}
        >
          {mode === "authorizing-b" ? "Generating proof…" : "Attempt Vendor B"}
        </button>
      </div>

      <div className="text-[10px] font-mono text-zinc-700 text-center">
        Mode 3: cached-ai · cached-proof
      </div>
    </div>
  );
}
