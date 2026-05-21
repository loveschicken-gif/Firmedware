import { redirect } from "next/navigation";
import { getFirmSettings } from "@/lib/firm-settings";

export async function isBillingEnabled() {
  const settings = await getFirmSettings();
  return settings.enableBilling;
}

export async function requireBillingEnabled() {
  if (!(await isBillingEnabled())) {
    redirect("/dashboard");
  }
}
