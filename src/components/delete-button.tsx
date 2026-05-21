"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";

export function DeleteButton({
  action,
  label,
}: {
  action: () => Promise<void>;
  label?: string;
}) {
  const { t } = useI18n();
  const displayLabel = label ?? t("common.archive.default");
  const verb = displayLabel.toLowerCase();

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(t("common.archive.confirm", { verb }))) {
          e.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="destructive" size="sm">
        {displayLabel}
      </Button>
    </form>
  );
}
