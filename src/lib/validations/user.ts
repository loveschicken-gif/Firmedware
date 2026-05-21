import { z } from "zod";
import { LOCALES } from "@/lib/i18n/config";

export function createUserCreateSchema(
  msg: (key: string) => string,
  commonMsg: (key: string) => string
) {
  return z.object({
    email: z.string().email(commonMsg("validation.invalidEmail")),
    name: z.string().min(1),
    password: z.string().min(8, msg("validation.passwordMin8")),
    role: z.enum(["ADMIN", "LAWYER", "STAFF", "VIEWER"]),
    preferredLanguage: z.enum(LOCALES).optional(),
  });
}

export function createUserUpdateSchema(
  msg: (key: string) => string,
  _commonMsg?: (key: string) => string
) {
  return z.object({
    name: z.string().min(1),
    role: z.enum(["ADMIN", "LAWYER", "STAFF", "VIEWER"]),
    active: z.boolean(),
    preferredLanguage: z.enum(LOCALES).optional(),
    password: z
      .string()
      .min(8, msg("validation.passwordMin8"))
      .optional()
      .or(z.literal("")),
  });
}
