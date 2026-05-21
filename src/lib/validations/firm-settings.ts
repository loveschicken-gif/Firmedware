import { z } from "zod";
import { LOCALES } from "@/lib/i18n/config";

function parseCheckbox(value: unknown) {
  return value === "on" || value === "true";
}

export function createFirmSettingsSchema(msg: (key: string) => string) {
  return z.object({
    firmName: z.string().min(1, msg("validation.firmNameRequired")).max(120),
    timezone: z.string().min(1, msg("validation.timezoneRequired")).max(64),
    defaultLanguage: z.enum(LOCALES, {
      message: msg("validation.defaultLanguageRequired"),
    }),
    enableEntityNotes: z.preprocess(parseCheckbox, z.boolean()),
    enableComments: z.preprocess(parseCheckbox, z.boolean()),
    enableBilling: z.preprocess(parseCheckbox, z.boolean()),
  });
}
