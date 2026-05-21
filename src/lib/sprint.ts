export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

import type { Translator } from "@/lib/i18n/messages";

export function formatSprintLabel(
  weekStart: Date,
  t: Translator,
  locale = "th"
) {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const fmt = new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return t("tasks.sprint.label", {
    start: fmt.format(weekStart),
    end: fmt.format(end),
  });
}

/** Parse HTML week input value (YYYY-Www) to Monday week start */
export function parseWeekInput(value: string): Date | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);
  const jan4 = new Date(year, 0, 4);
  const weekOneMonday = getWeekStart(jan4);
  const result = new Date(weekOneMonday);
  result.setDate(result.getDate() + (week - 1) * 7);
  return result;
}

export function toWeekInputValue(weekStart: Date): string {
  const d = getWeekStart(weekStart);
  const year = d.getFullYear();
  const jan4 = new Date(year, 0, 4);
  const weekOneMonday = getWeekStart(jan4);
  const diffDays = Math.round(
    (d.getTime() - weekOneMonday.getTime()) / (24 * 60 * 60 * 1000)
  );
  const weekNum = Math.floor(diffDays / 7) + 1;
  return `${year}-W${String(weekNum).padStart(2, "0")}`;
}

export function resolveSprintWeekStart(
  dueAt: Date | null | undefined,
  manualWeekStart: Date | null | undefined,
  sprintWeekInput: string | undefined
): Date | null {
  if (sprintWeekInput) {
    const parsed = parseWeekInput(sprintWeekInput);
    if (parsed) return getWeekStart(parsed);
  }
  if (manualWeekStart) return getWeekStart(manualWeekStart);
  if (dueAt) return getWeekStart(dueAt);
  return null;
}
