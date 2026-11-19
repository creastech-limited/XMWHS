export type DateRange = { from: string; to: string };
export type PresetKey = "today" | "7d" | "30d" | "lastMonth" | "custom";

const pad = (n: number) => String(n).padStart(2, "0");
export const toYMD = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const PRESETS: { key: Exclude<PresetKey, "custom">; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "lastMonth", label: "Last month" },
];

export const presetRange = (key: Exclude<PresetKey, "custom">): DateRange => {
  const now = new Date();
  switch (key) {
    case "today":
      return { from: toYMD(now), to: toYMD(now) };
    case "7d": {
      const s = new Date();
      s.setDate(now.getDate() - 6);
      return { from: toYMD(s), to: toYMD(now) };
    }
    case "30d": {
      const s = new Date();
      s.setDate(now.getDate() - 29);
      return { from: toYMD(s), to: toYMD(now) };
    }
    case "lastMonth":
      return {
        from: toYMD(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: toYMD(new Date(now.getFullYear(), now.getMonth(), 0)), // day 0 = last day of previous month
      };
  }
};