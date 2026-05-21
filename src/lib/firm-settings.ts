import { prisma } from "@/lib/prisma";

const SETTINGS_ID = "default";

export async function getFirmSettings() {
  return prisma.firmSettings.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      firmName: "Firmedware",
      timezone: "Asia/Bangkok",
    },
    update: {},
  });
}
