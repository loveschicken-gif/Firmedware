import { z } from "zod";
import {
  isValidReferenceValue,
  normalizeReferenceValue,
} from "@/lib/validations/reference";

const referenceTypeEnum = z.enum([
  "EXTERNAL_URL",
  "LOCAL_PATH",
  "MANUAL_REFERENCE",
]);

const externalProviders = z.enum([
  "GOOGLE_DRIVE",
  "ONEDRIVE",
  "SHAREPOINT",
  "DROPBOX",
  "OTHER",
]);

export function createDocumentSchema(msg: (key: string) => string) {
  return z
    .object({
      clientId: z.string().min(1, msg("validation.clientRequired")),
      matterId: z.string().optional(),
      title: z.string().min(1, msg("validation.titleRequired")),
      referenceType: referenceTypeEnum,
      url: z.string().min(1, msg("validation.referenceRequired")),
      provider: z.enum([
        "GOOGLE_DRIVE",
        "ONEDRIVE",
        "SHAREPOINT",
        "DROPBOX",
        "LOCAL_FOLDER",
        "OTHER",
      ]),
      providerLabel: z.string().optional(),
      notes: z.string().optional(),
      sensitivity: z.enum([
        "NORMAL",
        "CONFIDENTIAL",
        "HIGHLY_CONFIDENTIAL",
        "PRIVILEGED",
      ]),
    })
    .superRefine((data, ctx) => {
      const refType = data.referenceType;

      if (!isValidReferenceValue(refType, data.url)) {
        const key =
          refType === "EXTERNAL_URL"
            ? "validation.urlInvalid"
            : refType === "LOCAL_PATH"
              ? "validation.pathInvalid"
              : "validation.manualReferenceInvalid";
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: msg(key),
          path: ["url"],
        });
        return;
      }

      if (refType === "EXTERNAL_URL") {
        const parsed = externalProviders.safeParse(data.provider);
        if (!parsed.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: msg("validation.providerInvalid"),
            path: ["provider"],
          });
        }
        if (data.provider === "OTHER") {
          const label = data.providerLabel?.trim();
          if (!label) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: msg("validation.providerNameRequired"),
              path: ["providerLabel"],
            });
          }
        }
      }
    })
    .transform((data) => {
      const referenceType = data.referenceType;
      const url = normalizeReferenceValue(referenceType, data.url);

      let provider = data.provider;
      let providerLabel = data.providerLabel?.trim() || null;

      if (referenceType === "LOCAL_PATH") {
        provider = "LOCAL_FOLDER";
        providerLabel = null;
      } else if (referenceType === "MANUAL_REFERENCE") {
        provider = "OTHER";
        providerLabel = null;
      } else if (provider !== "OTHER") {
        providerLabel = null;
      }

      return {
        ...data,
        url,
        provider,
        providerLabel,
        referenceType,
      };
    });
}

export type DocumentFormData = z.infer<ReturnType<typeof createDocumentSchema>>;
