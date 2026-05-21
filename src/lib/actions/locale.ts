"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isValidLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";
import { requireSessionUser } from "@/lib/session";

export async function setPreferredLanguageAction(locale: string): Promise<void> {
  if (!isValidLocale(locale)) return;

  const user = await requireSessionUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { preferredLanguage: locale },
  });

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
}
