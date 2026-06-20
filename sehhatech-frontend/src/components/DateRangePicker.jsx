import { useState, useRef, useEffect } from "react";

const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isBetween(d, start, end) {
  if (!start || !end) return false;
  return d > start && d < end;
}

function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

const PRESETS = [
  { label: "Last 7 Days",  days: 7 },
  { label: "Last 30 Days", days: 30 },
  { label: "Last 90 Days", days: 90 },
  { label: "This Month",   thisMonth: true },
];

export default function DateRangePicker({ startDate, endDate, onApply, onClose }) {
  const [start, setStart] = useState(startDate || null);
  const [end, setEnd] = useState(endDate || null);
  const [hoverDate, setHoverDate] = useState(null);
  const [baseMonth, setBaseMonth] = useState(() => {
    const ref = startDate || new Date();
    return new Date(ref.getFullYear(), ref.getMonth(), 1);
  });
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  function handleDayClick(day) {
    if (!day) return;
    if (!start || (start && end)) {
      setStart(day);
      setEnd(null);
    } else if (day < start) {
      setStart(day);
      setEnd(null);
    } else {
      setEnd(day);
    }
  }

  function applyPreset(preset) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (preset.thisMonth) {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      setStart(s);
      setEnd(today);
      setBaseMonth(new Date(s.getFullYear(), s.getMonth(), 1));
    } else {
      const s = new Date(today);
      s.setDate(s.getDate() - (preset.days - 1));
      setStart(s);
      setEnd(today);
      setBaseMonth(new Date(s.getFullYear(), s.getMonth(), 1));
    }
  }

  function handleApply() {
    if (start && end) onApply(start, end);
  }

  const nextMonth = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 1, 1);

  function renderMonth(monthDate) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const cells = buildMonthGrid(year, month);
    return (
      <div className="w-full">
        <p className="text-center text-sm font-semibold text-slate-800 mb-3">
          {MONTHS_FULL[month]} {year}
        </p>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map((d) => (
            <span key={d} className="text-[10px] font-bold text-slate-400 text-center uppercase">{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const isStart = isSameDay(day, start);
            const isEnd = isSameDay(day, end);
            const inRange = isBetween(day, start, end) || (start && !end && hoverDate && isBetween(day, start, hoverDate));
            const isToday = isSameDay(day, new Date());
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleDayClick(day)}
                onMouseEnter={() => setHoverDate(day)}
                className={`h-8 w-8 text-xs rounded-lg flex items-center justify-center transition-colors
                  ${isStart || isEnd ? "bg-slate-800 text-white font-bold" : ""}
                  ${inRange && !isStart && !isEnd ? "bg-slate-100 text-slate-700" : ""}
                  ${!isStart && !isEnd && !inRange ? "hover:bg-slate-100 text-slate-700" : ""}
                  ${isToday && !isStart && !isEnd ? "ring-1 ring-slate-300" : ""}
                `}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="absolute right-0 mt-2 z-50 bg-white rounded-xl border border-slate-200 shadow-xl p-5 w-[640px]"
    >
      <div className="flex gap-6">
        <div className="w-40 shrink-0 border-r border-slate-100 pr-4 space-y-1">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-600 font-medium"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setBaseMonth(new Date(baseMonth.getFullYear(), baseMonth.getMonth() - 1, 1))}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={() => setBaseMonth(new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 1, 1))}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
          <div className="flex gap-6">
            {renderMonth(baseMonth)}
            {renderMonth(nextMonth)}
          </div>

          <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              {start ? toISO(start) : "Start date"} → {end ? toISO(end) : "End date"}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!start || !end}
                className="px-4 py-1.5 text-sm font-semibold text-white bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}