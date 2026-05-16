"use client";

import { useState } from "react";
import TreasuryHeader from "@/components/TreasuryHeader";
import BuyerIntentPanel from "@/components/BuyerIntentPanel";
import VendorCard from "@/components/VendorCard";
import AIExtractionPanel from "@/components/AIExtractionPanel";
import CompetitorIntelPanel from "@/components/CompetitorIntelPanel";
import PublicVerifier from "@/components/PublicVerifier";
import DemoControls from "@/components/DemoControls";
import type { AuthStatus, DemoMode, ProofResult, TreasuryState, VendorId } from "@/lib/types";
import {
  VENDOR_A_EXTRACTED,
  VENDOR_B_EXTRACTED,
  VENDOR_A_PROOF,
  VENDOR_B_PROOF,
  INITIAL_TREASURY_CENTS,
  VENDOR_B_PRICE_CENTS,
} from "@/lib/mockData";

const PROOF_DELAY_MS = 2200;

export default function Home() {
  const [demoMode, setDemoMode] = useState<DemoMode>("idle");
  const [activeVendor, setActiveVendor] = useState<VendorId>("A");
  const [vendorAStatus, setVendorAStatus] = useState<AuthStatus>("PENDING");
  const [vendorBStatus, setVendorBStatus] = useState<AuthStatus>("PENDING");
  const [vendorAResult, setVendorAResult] = useState<ProofResult | null>(null);
  const [vendorBResult, setVendorBResult] = useState<ProofResult | null>(null);
  const [treasury, setTreasury] = useState<TreasuryState>({
    balanceCents: INITIAL_TREASURY_CENTS,
  });

  const isLoading = demoMode === "authorizing-a" || demoMode === "authorizing-b";

  function handleAuthorizeA() {
    if (demoMode !== "idle" && demoMode !== "rejected-a") return;
    setActiveVendor("A");
    setDemoMode("authorizing-a");

    setTimeout(() => {
      setVendorAStatus("REJECTED");
      setVendorAResult(VENDOR_A_PROOF);
      setDemoMode("rejected-a");
    }, PROOF_DELAY_MS);
  }

  function handleAuthorizeB() {
    if (demoMode !== "rejected-a") return;
    setActiveVendor("B");
    setDemoMode("authorizing-b");

    setTimeout(() => {
      setVendorBStatus("AUTHORIZED");
      setVendorBResult(VENDOR_B_PROOF);
      setTreasury({
        balanceCents: INITIAL_TREASURY_CENTS - VENDOR_B_PRICE_CENTS,
        lastDebitCents: VENDOR_B_PRICE_CENTS,
        vendorCommitment: VENDOR_B_PROOF.offerCommitment,
      });
      setDemoMode("authorized-b");
    }, PROOF_DELAY_MS);
  }

  function handleReset() {
    setDemoMode("idle");
    setActiveVendor("A");
    setVendorAStatus("PENDING");
    setVendorBStatus("PENDING");
    setVendorAResult(null);
    setVendorBResult(null);
    setTreasury({ balanceCents: INITIAL_TREASURY_CENTS });
  }

  const extracted = activeVendor === "A" ? VENDOR_A_EXTRACTED : VENDOR_B_EXTRACTED;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <TreasuryHeader
        balanceCents={treasury.balanceCents}
        lastDebitCents={treasury.lastDebitCents}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 flex flex-col gap-5">
        {/* Row 1: Buyer intent + AI extraction */}
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-4">
            <BuyerIntentPanel />
          </div>
          <div className="col-span-8">
            <AIExtractionPanel activeVendor={activeVendor} extracted={extracted} />
          </div>
        </div>

        {/* Row 2: Vendor cards + Public verifier + Demo controls */}
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-3 flex flex-col gap-4">
            <VendorCard
              offer={VENDOR_A_EXTRACTED}
              status={vendorAStatus}
              onAuthorize={handleAuthorizeA}
              loading={demoMode === "authorizing-a"}
              disabled={demoMode !== "idle" && demoMode !== "rejected-a"}
            />
            <VendorCard
              offer={VENDOR_B_EXTRACTED}
              status={vendorBStatus}
              onAuthorize={handleAuthorizeB}
              loading={demoMode === "authorizing-b"}
              disabled={demoMode !== "rejected-a"}
            />
          </div>

          <div className="col-span-6">
            <PublicVerifier
              vendorAResult={vendorAResult}
              vendorBResult={vendorBResult}
              treasury={treasury}
              loading={isLoading}
            />
          </div>

          <div className="col-span-3">
            <DemoControls
              mode={demoMode}
              onReset={handleReset}
              onAuthorizeA={handleAuthorizeA}
              onAuthorizeB={handleAuthorizeB}
            />
          </div>
        </div>

        {/* Row 3: Competitor intel */}
        <CompetitorIntelPanel
          publicState={{ vendorAResult, vendorBResult }}
        />
      </main>
    </div>
  );
}
