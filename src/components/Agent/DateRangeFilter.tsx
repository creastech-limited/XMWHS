import { useState } from "react";
import { PRESETS, presetRange, type DateRange, type PresetKey } from "../../utils/dateRange";

const inputCls =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#0f1535] focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100";
const primaryBtn =
  "rounded-lg bg-[#0B1437] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0B1437]/90 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:opacity-50";

interface Props {
  preset: PresetKey;
  range: DateRange; // the range currently applied
  onChange: (preset: PresetKey, range: DateRange) => void;
}

const chip = (active: boolean) =>
  `rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
    active
      ? "border-[#0B1437] bg-[#0B1437] text-white"
      : "border-slate-200 bg-white text-[#0f1535] hover:bg-slate-100"
  }`;

const DateRangeFilter = ({ preset, range, onChange }: Props) => {
  const [customOpen, setCustomOpen] = useState(preset === "custom");
  const [draft, setDraft] = useState<DateRange>(range);

  const active: PresetKey = customOpen ? "custom" : preset;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          className={chip(active === p.key)}
          onClick={() => {
            setCustomOpen(false);
            onChange(p.key, presetRange(p.key));
          }}
        >
          {p.label}
        </button>
      ))}

      <button
        type="button"
        className={chip(active === "custom")}
        onClick={() => {
          setDraft(range);
          setCustomOpen(true);
        }}
      >
        Custom
      </button>

      {customOpen && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={draft.from}
            max={draft.to || undefined}
            onChange={(e) => setDraft({ ...draft, from: e.target.value })}
            className={inputCls}
            aria-label="From date"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={draft.to}
            min={draft.from || undefined}
            onChange={(e) => setDraft({ ...draft, to: e.target.value })}
            className={inputCls}
            aria-label="To date"
          />
          <button
            type="button"
            className={primaryBtn}
            disabled={!draft.from || !draft.to}
            onClick={() => onChange("custom", draft)}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;