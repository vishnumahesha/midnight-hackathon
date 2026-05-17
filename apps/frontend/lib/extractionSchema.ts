import { z } from "zod";

export const ExtractedOfferFactsSchema = z.object({
    vendorId: z.string().min(1, "vendorId is required"),
    vendorName: z.string().min(1, "vendorName is required"),
    priceCents: z.number().int("priceCents must be an integer").positive("priceCents must be positive"),
    category: z.string().min(1, "category is required"),
    credentials: z.array(z.string()).max(4, "credentials array cannot exceed 4 items (ZK circuit constraint)"),
    forbiddenTermsDetected: z.array(z.string()).max(4, "forbiddenTermsDetected array cannot exceed 4 items (ZK circuit constraint)"),
    summary: z.string().min(1, "summary is required"),
});

export type ExtractedOfferFacts = z.infer<typeof ExtractedOfferFactsSchema>;

export function validateExtraction(data: unknown): ExtractedOfferFacts {
    return ExtractedOfferFactsSchema.parse(data);
}

export function safeValidateExtraction(data: unknown) {
    return ExtractedOfferFactsSchema.safeParse(data);
}