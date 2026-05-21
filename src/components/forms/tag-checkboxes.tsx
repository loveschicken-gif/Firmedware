"use client";

import { useTranslations } from "@/lib/i18n/client";
import type { Tag } from "@prisma/client";

export function TagCheckboxes({
  tags,
  selectedIds = [],
}: {
  tags: Tag[];
  selectedIds?: string[];
}) {
  const t = useTranslations("common");

  if (tags.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">{t("tags")}</p>
      <div className="flex flex-wrap gap-3">
        {tags.map((tag) => (
          <label
            key={tag.id}
            className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
          >
            <input
              type="checkbox"
              name="tagIds"
              value={tag.id}
              defaultChecked={selectedIds.includes(tag.id)}
              className="rounded border-slate-300"
            />
            {tag.name}
          </label>
        ))}
      </div>
    </div>
  );
}
