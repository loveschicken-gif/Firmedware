"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/lib/i18n/client";

export type GroupOption = {
  id: string;
  name: string;
};

export type GroupAssignmentDefaults = {
  groupId: string;
  label: string;
  directoryPath: string;
};

export function MatterGroupFields({
  groups,
  defaults = [],
}: {
  groups: GroupOption[];
  defaults?: GroupAssignmentDefaults[];
}) {
  const t = useTranslations("matters");
  const defaultMap = new Map(defaults.map((d) => [d.groupId, d]));
  const [selected, setSelected] = useState<Set<string>>(
    new Set(defaults.map((d) => d.groupId))
  );

  function toggle(groupId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  if (groups.length === 0) {
    return (
      <p className="text-sm text-slate-500">{t("groups.none")}</p>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const isSelected = selected.has(group.id);
        const def = defaultMap.get(group.id);
        return (
          <div
            key={group.id}
            className="rounded-md border border-slate-200 p-4"
          >
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name="groupIds"
                value={group.id}
                checked={isSelected}
                onChange={() => toggle(group.id)}
              />
              {group.name}
            </label>
            {isSelected && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor={`groupLabel_${group.id}`}>
                    {t("groups.labelOnMatter")}
                  </Label>
                  <Input
                    id={`groupLabel_${group.id}`}
                    name={`groupLabel_${group.id}`}
                    defaultValue={def?.label ?? group.name}
                    placeholder={group.name}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`groupDirectory_${group.id}`}>
                    {t("groups.directoryPath")}
                  </Label>
                  <Input
                    id={`groupDirectory_${group.id}`}
                    name={`groupDirectory_${group.id}`}
                    defaultValue={def?.directoryPath ?? ""}
                    placeholder={t("groups.directoryPlaceholder")}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
