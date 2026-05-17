import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/settings/preferences";
import type { Arrangement } from "@/types/arrangement";

type ArrangementCalendarViewProps = {
  items: Arrangement[];
  onBack: () => void;
  onOpenItem: (id: string) => void;
};

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function dayKey(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function ArrangementCalendarView({
  items,
  onBack,
  onOpenItem,
}: ArrangementCalendarViewProps) {
  const { resolvedLocale, t } = usePreferences();
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const scheduledItems = useMemo(
    () =>
      items.filter(
        (item) => item.status !== "completed" && typeof item.scheduledAt === "number"
      ),
    [items]
  );

  const unscheduledItems = useMemo(
    () =>
      items.filter(
        (item) => item.status !== "completed" && typeof item.scheduledAt !== "number"
      ),
    [items]
  );

  const itemsByDay = useMemo(() => {
    const map = new Map<string, Arrangement[]>();
    for (const item of scheduledItems) {
      const key = dayKey(item.scheduledAt!);
      const bucket = map.get(key) ?? [];
      bucket.push(item);
      map.set(key, bucket);
    }
    return map;
  }, [scheduledItems]);

  const monthLabel = new Intl.DateTimeFormat(resolvedLocale, {
    year: "numeric",
    month: "long",
  }).format(monthCursor);

  const grid = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ date: Date | null; key: string }> = [];

    for (let i = 0; i < firstWeekday; i += 1) {
      cells.push({ date: null, key: `empty-${i}` });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      cells.push({ date, key: dayKey(date.getTime()) });
    }
    return cells;
  }, [monthCursor]);

  const selectedItems =
    selectedDay && itemsByDay.has(selectedDay) ? itemsByDay.get(selectedDay)! : [];

  return (
    <div className="flex h-full flex-col bg-bg">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border-light/80 bg-bg px-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full text-text transition hover:bg-hover-overlay active:scale-[0.96]"
          aria-label={t("common.back")}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="min-w-0 flex-1 truncate text-center text-[17px] font-semibold text-text">
          {t("arrangements.calendarTitle")}
        </h1>
        <div className="w-10 shrink-0" aria-hidden />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            className="rounded-full px-2 py-1 text-text-muted transition active:scale-95"
            onClick={() => setMonthCursor((value) => addMonths(value, -1))}
            aria-label={t("arrangements.calendarPrev")}
          >
            ‹
          </button>
          <p className="text-[15px] font-medium text-text">{monthLabel}</p>
          <button
            type="button"
            className="rounded-full px-2 py-1 text-text-muted transition active:scale-95"
            onClick={() => setMonthCursor((value) => addMonths(value, 1))}
            aria-label={t("arrangements.calendarNext")}
          >
            ›
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] text-text-tertiary">
          {["日", "一", "二", "三", "四", "五", "六"].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {grid.map((cell) => {
            if (!cell.date) {
              return <div key={cell.key} className="aspect-square" />;
            }

            const count = itemsByDay.get(cell.key)?.length ?? 0;
            const isSelected = selectedDay === cell.key;
            const isToday = dayKey(Date.now()) === cell.key;

            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelectedDay(cell.key)}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center rounded-[10px] text-[13px] transition active:scale-95",
                  isSelected && "bg-primary-soft text-primary",
                  !isSelected && isToday && "ring-1 ring-primary/30",
                  !isSelected && !isToday && "text-text"
                )}
              >
                <span>{cell.date.getDate()}</span>
                {count > 0 && (
                  <span className="mt-0.5 h-1 w-1 rounded-full bg-primary" aria-hidden />
                )}
              </button>
            );
          })}
        </div>

        {selectedDay && (
          <section className="mt-5">
            <h2 className="text-[13px] font-medium text-text-tertiary">
              {t("arrangements.calendarDayList")}
            </h2>
            <ul className="mt-2 space-y-2">
              {selectedItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onOpenItem(item.id)}
                    className="w-full rounded-[12px] border border-border-light bg-surface px-3 py-2.5 text-left transition active:scale-[0.99]"
                  >
                    <p className="text-[14px] text-text">{item.title}</p>
                    {typeof item.scheduledAt === "number" && (
                      <p className="mt-1 text-[12px] text-text-tertiary">
                        {formatArrangementSchedule(item.scheduledAt, resolvedLocale, {
                          today: t("arrangements.timeToday"),
                          tomorrow: t("arrangements.timeTomorrow"),
                          yesterday: t("arrangements.timeYesterday"),
                        })}
                      </p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {unscheduledItems.length > 0 && (
          <section className="mt-6">
            <h2 className="text-[13px] font-medium text-text-tertiary">
              {t("arrangements.calendarUnscheduled")}
            </h2>
            <p className="mt-1 text-[12px] leading-5 text-text-tertiary">
              {t("arrangements.calendarUnscheduledHint")}
            </p>
            <ul className="mt-2 space-y-2">
              {unscheduledItems.slice(0, 6).map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onOpenItem(item.id)}
                    className="w-full rounded-[12px] border border-dashed border-border-light bg-surface-2/60 px-3 py-2 text-left text-[14px] text-text-muted transition active:scale-[0.99]"
                  >
                    {item.title}
                    {item.needsTimeReview && (
                      <span className="mt-1 block text-[12px] text-primary">
                        {t("arrangements.needsTimeHint")}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
