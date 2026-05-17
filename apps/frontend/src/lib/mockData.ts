import type { ExtractedOffer, ProofResult } from "./types";

export const VENDOR_A_PROPOSAL = `BrightReach Data provides high-volume dental practice lead datasets
refreshed weekly from commercial web sources and verified partner networks.
Our standard package includes 10,000 clinic contacts, optional CRM enrichment,
and delivery within 48 hours. To improve accuracy across future campaigns,
BrightReach may use anonymized campaign metadata, segment performance, and
buyer interaction signals for partner enrichment, audience modeling, and
benchmark optimization across similar customers. Price: $1,900.`;

export const VENDOR_B_PROPOSAL = `CleanList Pro delivers verified dental clinic contact data with a
freshness guarantee — all records confirmed within 30 days of delivery.
Our 8,500-contact package is sourced exclusively from direct opt-in registries
and professional licensing databases. We do not share, resell, or use buyer
data for any enrichment, modeling, or benchmarking purpose. Delivery within
24 hours. Price: $2,250.`;

export const VENDOR_A_EXTRACTED: ExtractedOffer = {
  vendorId: "A",
  vendorName: "BrightReach Data",
  priceCents: 190000,
  category: "dental_lead_data",
  freshnessVerified: false,
  deliveryHours: 48,
  credentialPresent: false,
  forbiddenTermsDetected: ["campaign_metadata_reuse", "partner_enrichment", "audience_modeling"],
};

export const VENDOR_B_EXTRACTED: ExtractedOffer = {
  vendorId: "B",
  vendorName: "CleanList Pro",
  priceCents: 225000,
  category: "dental_lead_data",
  freshnessVerified: true,
  deliveryHours: 24,
  credentialPresent: true,
  forbiddenTermsDetected: [],
};

export const VENDOR_A_PROOF: ProofResult = {
  status: "REJECTED",
  dealId: "0x7f3a9c2e1b4d8f06",
  intentCommitment: "0x4a2f8c1d9e3b7a05f2c6d4e8b1a9c3f7",
  offerCommitment: "0x8b1c4e2a7f3d9b06c5a1e8f4d2b7c3a9",
  reason: "hidden policy violation",
};

export const VENDOR_B_PROOF: ProofResult = {
  status: "AUTHORIZED",
  dealId: "0x2c8e4a1f9d3b7c05",
  intentCommitment: "0x4a2f8c1d9e3b7a05f2c6d4e8b1a9c3f7",
  offerCommitment: "0x1d7c3f8a2e5b9d04a6c2f7e1b4d8a3c5",
  treasuryCommitmentAfter: "0x5e2b8f4c1a7d3e09b4c8f2a5d1e7b3c6",
  priceBand: "$2k–$2.5k",
};

export const INITIAL_TREASURY_CENTS = 1_000_000; // $10,000 in cents
export const VENDOR_B_PRICE_CENTS = 225000;      // $2,250 in cents
