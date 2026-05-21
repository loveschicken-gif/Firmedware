"use client";

import { Badge } from "@/components/ui/badge";
import type { DocumentSensitivity } from "@prisma/client";
import { useTranslations } from "@/lib/i18n/client";

const VARIANT: Record<
  DocumentSensitivity,
  "outline" | "warning" | "secondary"
> = {
  NORMAL: "outline",
  CONFIDENTIAL: "warning",
  HIGHLY_CONFIDENTIAL: "warning",
  PRIVILEGED: "secondary",
};

export function SensitivityBadge({
  sensitivity,
}: {
  sensitivity: DocumentSensitivity;
}) {
  const t = useTranslations("documents");
  if (sensitivity === "NORMAL") return null;
  return (
    <Badge variant={VARIANT[sensitivity]}>
      {t(`sensitivity.${sensitivity}`)}
    </Badge>
  );
}
