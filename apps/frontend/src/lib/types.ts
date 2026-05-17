export type AuthStatus = "PENDING" | "REJECTED" | "AUTHORIZED";
export type DemoMode = "idle" | "authorizing-a" | "rejected-a" | "authorizing-b" | "authorized-b";

export type VendorId = "A" | "B";

export type ExtractedOffer = {
  vendorId: VendorId;
  vendorName: string;
  priceCents: number;
  category: string;
  freshnessVerified: boolean;
  deliveryHours: number;
  credentialPresent: boolean;
  forbiddenTermsDetected: string[];
};

export type ProofResult = {
  status: AuthStatus;
  dealId: string;
  intentCommitment: string;
  offerCommitment: string;
  treasuryCommitmentAfter?: string;
  priceBand?: string;
  reason?: string;
};

export type TreasuryState = {
  balanceCents: number;
  lastDebitCents?: number;
  vendorCommitment?: string;
};

export type PublicPanelState = {
  vendorAResult: ProofResult | null;
  vendorBResult: ProofResult | null;
};
