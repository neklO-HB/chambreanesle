import { useMemo, useState } from 'react';

const monthLabels = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre'
];

const formatDate = (date) => date.toISOString().split('T')[0];

const isSameDay = (a, b) => a === b;
const isBeforeToday = (dateStr) => new Date(dateStr) < new Date(new Date().toISOString().split('T')[0]);

const getRangeArray = (start, end) => {
  if (!start || !end) return [];
  const dates = [];
  let cursor = new Date(start);
  const stop = new Date(end);
  while (cursor <= stop) {
    dates.push(formatDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

export default function BookingCalendar({ startDate, endDate, onChange, bookedRanges = [], roomSlug }) {
  const [monthCursor, setMonthCursor] = useState(new Date());

  const disableDates = useMemo(() => {
    const ranges = bookedRanges.filter((range) => !range.roomSlug || range.roomSlug === roomSlug);
    const disabled = new Set();
    ranges.forEach((range) => {
      getRangeArray(range.start, range.end).forEach((day) => disabled.add(day));
    });
    return disabled;
  }, [bookedRanges, roomSlug]);

  const selectDate = (day) => {
    if (disableDates.has(day) || isBeforeToday(day)) return;

    if (!startDate || (startDate && endDate)) {
      onChange({ start: day, end: '' });
      return;
    }

    if (new Date(day) <= new Date(startDate)) {
      onChange({ start: day, end: '' });
      return;
    }

    onChange({ start: startDate, end: day });
  };

  const renderMonth = (baseDate) => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startWeekDay = firstDay.getDay() || 7;

    const days = [];
    for (let i = 1; i < startWeekDay; i += 1) {
      days.push(<div key={`empty-${i}`} />);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateStr = formatDate(new Date(year, month, day));
      const isDisabled = disableDates.has(dateStr) || isBeforeToday(dateStr);
      const isSelectedStart = startDate && isSameDay(startDate, dateStr);
      const isSelectedEnd = endDate && isSameDay(endDate, dateStr);
      const isBetween =
        startDate && endDate && new Date(dateStr) > new Date(startDate) && new Date(dateStr) < new Date(endDate);

      days.push(
        <button
          key={dateStr}
          type="button"
          onClick={() => selectDate(dateStr)}
          disabled={isDisabled}
          className={`calendar-day w-full aspect-square rounded-lg border text-sm font-semibold transition ${
            isDisabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : isSelectedStart || isSelectedEnd
                ? 'bg-black text-white'
                : isBetween
                  ? 'bg-primary/30 text-black'
                  : 'bg-white hover:bg-primary/10'
          }`}
        >
          {day}
        </button>
      );
    }

    return (
      <div className="bg-white rounded-2xl p-4 shadow-md border border-black/5">
        <div className="flex justify-between items-center mb-4">
          <p className="font-semibold text-black">
            {monthLabels[month]} {year}
          </p>
        </div>
        <div className="grid grid-cols-7 text-center gap-2 text-xs text-black/60 uppercase tracking-wide">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 mt-2">{days}</div>
      </div>
    );
  };

  const nextMonth = useMemo(() => {
    const copy = new Date(monthCursor);
    copy.setMonth(copy.getMonth() + 1);
    return copy;
  }, [monthCursor]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-black">Calendrier</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-2 rounded-lg border border-black/10 bg-white"
            onClick={() => setMonthCursor((prev) => {
              const copy = new Date(prev);
              copy.setMonth(copy.getMonth() - 1);
              return copy;
            })}
          >
            <i className="fas fa-arrow-left" aria-hidden />
          </button>
          <button
            type="button"
            className="px-3 py-2 rounded-lg border border-black/10 bg-white"
            onClick={() => setMonthCursor((prev) => {
              const copy = new Date(prev);
              copy.setMonth(copy.getMonth() + 1);
              return copy;
            })}
          >
            <i className="fas fa-arrow-right" aria-hidden />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderMonth(monthCursor)}
        {renderMonth(nextMonth)}
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-black/70">
        <span className="inline-flex items-center gap-2"><span className="w-4 h-4 rounded bg-black" /> Arrivée ou départ</span>
        <span className="inline-flex items-center gap-2"><span className="w-4 h-4 rounded bg-primary/30 border border-primary/40" />
          Nuitée sélectionnée
        </span>
        <span className="inline-flex items-center gap-2"><span className="w-4 h-4 rounded bg-gray-200" /> Indisponible</span>
      </div>
    </div>
  );
}
