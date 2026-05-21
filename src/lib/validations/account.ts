import { z } from "zod";
import { LOCALES } from "@/lib/i18n/config";

export function createProfileUpdateSchema(msg: (key: string) => string) {
  return z.object({
    name: z.string().min(1, msg("validation.nameRequired")).max(120),
    preferredLanguage: z.enum(LOCALES, {
      message: msg("validation.languageRequired"),
    }),
  });
}

export function createPasswordChangeSchema(msg: (key: string) => string) {
  return z
    .object({
      currentPassword: z.string().min(1, msg("validation.currentPasswordRequired")),
      newPassword: z.string().min(8, msg("validation.passwordMin8")),
      confirmPassword: z.string().min(8, msg("validation.passwordMin8")),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: msg("validation.passwordMismatch"),
      path: ["confirmPassword"],
    });
}
