import { z } from "zod";

export function createClientSchema(
  msg: (key: string) => string,
  commonMsg: (key: string) => string = msg
) {
  return z.object({
    displayName: z.string().min(1, msg("validation.displayNameRequired")),
    companyName: z.string().optional(),
    clientType: z.enum(["INDIVIDUAL", "COMPANY"]),
    email: z
      .string()
      .email(commonMsg("validation.invalidEmail"))
      .optional()
      .or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "PROSPECT"]),
    notes: z.string().optional(),
  });
}

export type ClientFormData = z.infer<ReturnType<typeof createClientSchema>>;
