import { z } from "zod";
import { BILLING_STATUSES } from "@/lib/billing-status";
import { isValidDocumentUrl, normalizeDocumentUrl } from "@/lib/validations/url";

export function createBillingSchema(msg: (key: string) => string) {
  return z
    .object({
      clientId: z.string().min(1, msg("validation.clientRequired")),
      matterId: z.string().optional(),
      invoiceNumber: z.string().optional(),
      title: z.string().min(1, msg("validation.titleRequired")),
      description: z.string().optional(),
      amount: z
        .string()
        .min(1, msg("validation.amountRequired"))
        .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, msg("validation.amountInvalid")),
      currency: z.string().min(1, msg("validation.currencyRequired")).max(8),
      issueDate: z.string().optional(),
      dueDate: z.string().optional(),
      paidAt: z.string().optional(),
      status: z.enum(BILLING_STATUSES, { message: msg("validation.statusInvalid") }),
      externalLink: z
        .string()
        .optional()
        .refine(
          (v) => !v || v.trim() === "" || isValidDocumentUrl(v),
          msg("validation.externalLinkInvalid")
        )
        .transform((v) => (v?.trim() ? normalizeDocumentUrl(v) : undefined)),
      notes: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.paidAt && data.status !== "PAID" && data.status !== "PARTIALLY_PAID") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: msg("validation.paidAtRequiresPaidStatus"),
          path: ["paidAt"],
        });
      }
    });
}

export type BillingFormData = z.infer<ReturnType<typeof createBillingSchema>>;
