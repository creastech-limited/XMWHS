const CURRENCY = "NGN";

export const formatMoney = (amount: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: CURRENCY }).format(amount);

export const formatDate = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : "—";

export const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

export const formatDateTime = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export const formatSeconds = (s: number | null | undefined) => {
  if (s == null || Number.isNaN(s)) return "—";
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};

// Per-minute rates rounded to the nearest whole unit: 13.99 -> NGN 14
export const formatRate = (amount: number | null | undefined) =>
  amount == null
    ? "—"
    : new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: CURRENCY,
        maximumFractionDigits: 0,
      }).format(Math.round(amount));