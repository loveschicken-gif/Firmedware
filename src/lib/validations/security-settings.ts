import { z } from "zod";

function parseCheckbox(value: unknown) {
  return value === "on" || value === "true";
}

export function createSecuritySettingsSchema(msg: (key: string) => string) {
  return z.object({
    confidentialityNoticeEnabled: z.preprocess(parseCheckbox, z.boolean()),
    requireDocumentPermissionConfirm: z.preprocess(parseCheckbox, z.boolean()),
    failedLoginLockoutThreshold: z.coerce
      .number()
      .int()
      .min(1, msg("validation.lockoutThresholdMin"))
      .max(50, msg("validation.lockoutThresholdMax")),
    failedLoginLockoutMinutes: z.coerce
      .number()
      .int()
      .min(1, msg("validation.lockoutMinutesMin"))
      .max(1440, msg("validation.lockoutMinutesMax")),
  });
}
