import Anthropic from "@anthropic-ai/sdk";
import { validateExtraction, type ExtractedOfferFacts } from "./extractionSchema";
import vendorAExtracted from "../../../data/vendorA.extracted.json";
import vendorBExtracted from "../../../data/vendorB.extracted.json";

const CACHED_EXTRACTIONS: Record<string, ExtractedOfferFacts> = {
    vendor_a: vendorAExtracted as ExtractedOfferFacts,
    vendor_b: vendorBExtracted as ExtractedOfferFacts,
};

const EXTRACTION_PROMPT = `You are a procurement compliance extraction engine. Your job is to read a vendor proposal and extract structured facts.

You will receive:
1. A vendor ID and vendor name
2. Raw vendor proposal text

Extract the following fields and return ONLY valid JSON with no other text:

{
  "vendorId": "<the vendor ID provided>",
  "vendorName": "<the vendor name provided>",
  "priceCents": <price in cents as integer, e.g. $1,900 = 190000>,
  "category": "<one of: lead_data, analytics, infrastructure, saas, consulting>",
  "credentials": [<up to 4 strings describing verifiable capabilities, e.g. "freshness_verified", "weekly_refresh", "licensed_sources", "opt_out_screening", "audit_logs", "high_volume", "crm_enrichment">],
  "forbiddenTermsDetected": [<use ONLY identifiers from the canonical list below. Map ALL variations of each concept to the exact canonical identifier shown. If none apply, return an empty array.

CANONICAL VOCABULARY (these are the only valid strings):
- "campaign_metadata_reuse" — matches ANY of: cross-client modeling, audience expansion, benchmark optimization across clients or similar customers, campaign metadata sharing, partner enrichment using buyer data, cross-customer data use, shared audience profiling, resale of buyer data to partners

Return ONLY these exact canonical strings. Never paraphrase or invent new identifiers.>],
  "summary": "<one sentence: what makes this vendor good or risky>"
}

CRITICAL RULES:
- Return ONLY the JSON object. No markdown, no backticks, no explanation.
- priceCents must be an integer (dollars * 100).
- credentials and forbiddenTermsDetected arrays must each have AT MOST 4 items.
- For forbiddenTermsDetected: read the ENTIRE proposal carefully. Risky clauses are often buried in mid-paragraph legalese. You MUST map any detected risk to a canonical identifier from the vocabulary above — never return a paraphrase.
- If no risky clauses exist, return an empty array for forbiddenTermsDetected.
- Do not invent credentials or forbidden terms that aren't in the text.`;

/**
 * Extract structured offer facts from raw vendor proposal text using Claude API.
 *
 * Falls back to cached extraction if:
 * - API key is not provided
 * - API call fails
 * - Response fails schema validation
 *
 * @param vendorId - e.g. "vendor_a"
 * @param vendorName - e.g. "BrightReach Data"
 * @param proposalText - raw vendor proposal text
 * @param options.apiKey - Anthropic API key, passed in by caller
 * @param options.useCached - force cached mode (for demo reliability)
 */
export async function extractOffer(vendorId: string, vendorName: string, proposalText: string, options: { apiKey?: string; useCached?: boolean } = {}): Promise<{ result: ExtractedOfferFacts; source: "live" | "cached" }> {
    const { apiKey, useCached = false } = options;

    if (useCached || !apiKey) {
        if (!apiKey && !useCached) {
            console.warn("[extractOffer] No API key provided. Using cached fallback.");
        }
        return getCachedFallback(vendorId);
    }

    try {
        const client = new Anthropic({ apiKey });

        const message = await client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 1024,
            messages: [
            {
                role: "user",
                content: `Vendor ID: ${vendorId}\nVendor Name: ${vendorName}\n\nProposal:\n${proposalText}`,
            },
            ],
            system: EXTRACTION_PROMPT,
        });

        const textBlock = message.content.find((block: any) => block.type === "text");
        if (!textBlock || textBlock.type !== "text") {
            console.warn("[extractOffer] No text in API response. Using cached fallback.");
            return getCachedFallback(vendorId);
        }

        const raw = JSON.parse(textBlock.text);
        const validated = validateExtraction(raw);

        return { result: validated, source: "live" };
    } catch (error) {
        console.error("[extractOffer] API or validation error:", error);
        console.warn("[extractOffer] Falling back to cached extraction.");
        return getCachedFallback(vendorId);
    }
}

function getCachedFallback(vendorId: string): {
    result: ExtractedOfferFacts;
    source: "cached";
} {
    const cached = CACHED_EXTRACTIONS[vendorId];
    if (!cached) {
        throw new Error(
            `[extractOffer] No cached extraction for vendorId "${vendorId}". ` +
            `Known vendors: ${Object.keys(CACHED_EXTRACTIONS).join(", ")}`
        );
    }
    return { result: cached, source: "cached" };
}

export async function extractBothVendors(
    vendorAText: string,
    vendorBText: string,
    options: { apiKey?: string; useCached?: boolean } = {}
): Promise<{
    vendorA: { result: ExtractedOfferFacts; source: "live" | "cached" };
    vendorB: { result: ExtractedOfferFacts; source: "live" | "cached" };
}> {
    const [vendorA, vendorB] = await Promise.all([
        extractOffer("vendor_a", "BrightReach Data", vendorAText, options),
        extractOffer("vendor_b", "CleanList Pro", vendorBText, options),
    ]);
    return { vendorA, vendorB };
}