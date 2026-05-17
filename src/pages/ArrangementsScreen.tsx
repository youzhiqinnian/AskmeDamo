import React, { useEffect, useState } from "react";
import ArrangementAiSettingsView from "@/components/arrangements/ArrangementAiSettingsView";
import ArrangementCalendarView from "@/components/arrangements/ArrangementCalendarView";
import ArrangementRow from "@/components/arrangements/ArrangementRow";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import EmptyState from "@/components/EmptyState";
import { useArrangements } from "@/hooks/useArrangements";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/settings/preferences";
import type { Arrangement, ArrangementDraft } from "@/types/arrangement";

type ArrangementsScreenProps = {
  onBack: () => void;
  initialView?: "list" | "aiSettings";
};

type ScreenView =
  | { type: "list" }
  | { type: "detail"; id: string }
  | { type: "form"; mode: "create" | "edit"; id?: string }
  | { type: "calendar" }
  | { type: "aiSettings" };

export default function ArrangementsScreen({
  onBack,
  initialView = "list",
}: ArrangementsScreenProps) {
  const [view, setView] = useState<ScreenView>(
    initialView === "aiSettings" ? { type: "aiSettings" } : { type: "list" }
  );
  const arrangements = useArrangements();

  useEffect(() => {
    if (initialView === "aiSettings") {
      setView({ type: "aiSettings" });
    }
  }, [initialView]);

  const findById = (id: string) => arrangements.items.find((item) => item.id === id);

  const openDetail = (id: string) => setView({ type: "detail", id });
  const openCreate = () => setView({ type: "form", mode: "create" });
  const openEdit = (id: string) => setView({ type: "form", mode: "edit", id });
  const backToList = () => setView({ type: "list" });

  if (view.type === "aiSettings") {
    return <ArrangementAiSettingsView onBack={backToList} />;
  }

  if (view.type === "calendar") {
    return (
      <ArrangementCalendarView
        items={arrangements.items}
        onBack={backToList}
        onOpenItem={openDetail}
      />
    );
  }

  if (view.type === "form") {
    const editing = view.mode === "edit" && view.id ? findById(view.id) ?? null : null;
    return (
      <ArrangementFormView
        mode={view.mode}
        editing={editing}
        onBack={() => {
          if (view.mode === "edit" && view.id) {
            openDetail(view.id);
            return;
          }
          backToList();
        }}
        onSave={(draft) => {
          if (view.mode === "edit" && view.id) {
            arrangements.updateArrangement(view.id, draft);
            openDetail(view.id);
            return;
          }
          const created = arrangements.createArrangement(draft);
          if (created) openDetail(created.id);
          else backToList();
        }}
        onDelete={
          view.mode === "edit" && view.id
            ? () => {
                arrangements.deleteArrangement(view.id!);
                backToList();
              }
            : undefined
        }
      />
    );
  }

  if (view.type === "detail") {
    const item = findById(view.id);
    if (!item) {
      return (
        <ArrangementListView
          arrangements={arrangements}
          onBack={onBack}
          onOpenDetail={openDetail}
          onOpenCreate={openCreate}
          onOpenCalendar={() => setView({ type: "calendar" })}
          onOpenAiSettings={() => setView({ type: "aiSettings" })}
        />
      );
    }

    return (
      <ArrangementDetailView
        item={item}
        onBack={backToList}
        onEdit={() => openEdit(item.id)}
        onToggleComplete={() =>
          arrangements.setStatus(
            item.id,
            item.status === "completed" ? "active" : "completed"
          )
        }
        onMoveLater={() => arrangements.setStatus(item.id, "later")}
        onRestoreActive={() => arrangements.setStatus(item.id, "active")}
        onDelete={() => {
          arrangements.deleteArrangement(item.id);
          backToList();
        }}
      />
    );
  }

  return (
    <ArrangementListView
      arrangements={arrangements}
      onBack={onBack}
      onOpenDetail={openDetail}
      onOpenCreate={openCreate}
      onOpenCalendar={() => setView({ type: "calendar" })}
      onOpenAiSettings={() => setView({ type: "aiSettings" })}
    />
  );
}

type ArrangementsApi = ReturnType<typeof useArrangements>;

function ArrangementListView({
  arrangements,
  onBack,
  onOpenDetail,
  onOpenCreate,
  onOpenCalendar,
  onOpenAiSettings,
}: {
  arrangements: ArrangementsApi;
  onBack: () => void;
  onOpenDetail: (id: string) => void;
  onOpenCreate: () => void;
  onOpenCalendar: () => void;
  onOpenAiSettings: () => void;
}) {
  const { resolvedLocale, t } = usePreferences();
  const [showCompleted, setShowCompleted] = useState(false);

  const hasAny =
    arrangements.activeItems.length > 0 ||
    arrangements.laterItems.length > 0 ||
    arrangements.completedItems.length > 0;

  return (
    <div className="flex h-full flex-col bg-bg">
      <ScreenHeader
        title={t("arrangements.title")}
        onBack={onBack}
        action={
          <div className="flex items-center gap-0.5">
            <HeaderIconButton
              label={t("arrangements.calendarTitle")}
              onClick={onOpenCalendar}
            >
              <CalendarIcon />
            </HeaderIconButton>
            <HeaderIconButton
              label={t("arrangements.aiSettingsTitle")}
              onClick={onOpenAiSettings}
            >
              <SettingsIcon />
            </HeaderIconButton>
            <button
              type="button"
              onClick={onOpenCreate}
              className="rounded-full px-2.5 py-1.5 text-[14px] font-medium text-primary transition active:scale-95"
            >
              {t("arrangements.create")}
            </button>
          </div>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        {!hasAny ? (
          <EmptyState
            title={t("arrangements.emptyTitle")}
            description={t("arrangements.emptyDesc")}
            action={
              <Button onClick={onOpenCreate}>{t("arrangements.create")}</Button>
            }
          />
        ) : (
          <div className="space-y-6 pt-1">
            {arrangements.activeItems.length > 0 && (
              <section>
                <SectionLabel>{t("arrangements.activeSection")}</SectionLabel>
                <ul className="mt-2 space-y-2">
                  {arrangements.activeItems.map((item: Arrangement) => (
                    <li key={item.id}>
                      <ArrangementRow
                        item={item}
                        onOpen={() => onOpenDetail(item.id)}
                        onToggleComplete={() =>
                          arrangements.setStatus(item.id, "completed")
                        }
                        onMoveLater={() => arrangements.setStatus(item.id, "later")}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {arrangements.laterItems.length > 0 && (
              <section>
                <SectionLabel>{t("arrangements.laterSection")}</SectionLabel>
                <p className="mt-1 text-[12px] leading-5 text-text-tertiary">
                  {t("arrangements.laterHint")}
                </p>
                <ul className="mt-2 space-y-2">
                  {arrangements.laterItems.map((item: Arrangement) => (
                    <li key={item.id}>
                      <LaterRow
                        item={item}
                        locale={resolvedLocale}
                        onOpen={() => onOpenDetail(item.id)}
                        onRestore={() => arrangements.setStatus(item.id, "active")}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {arrangements.completedItems.length > 0 && (
              <section>
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-left"
                  onClick={() => setShowCompleted((value) => !value)}
                >
                  <SectionLabel>{t("arrangements.completedSection")}</SectionLabel>
                  <span className="text-[12px] text-text-tertiary">
                    {showCompleted
                      ? t("arrangements.collapse")
                      : t("arrangements.expand")}
                  </span>
                </button>
                {showCompleted && (
                  <ul className="mt-2 space-y-2">
                    {arrangements.completedItems.map((item: Arrangement) => (
                      <li key={item.id}>
                        <ArrangementRow
                          item={item}
                          onOpen={() => onOpenDetail(item.id)}
                          onToggleComplete={() =>
                            arrangements.setStatus(item.id, "active")
                          }
                          onMoveLater={() => {}}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LaterRow({
  item,
  locale,
  onOpen,
  onRestore,
}: {
  item: Arrangement;
  locale: string;
  onOpen: () => void;
  onRestore: () => void;
}) {
  const { t } = usePreferences();
  const scheduleLabel =
    typeof item.scheduledAt === "number"
      ? formatArrangementSchedule(item.scheduledAt, locale, {
          today: t("arrangements.timeToday"),
          tomorrow: t("arrangements.timeTomorrow"),
          yesterday: t("arrangements.timeYesterday"),
        })
      : null;

  return (
    <div className="rounded-[14px] border border-border-light bg-surface-2/80 px-3 py-3">
      <button type="button" onClick={onOpen} className="w-full text-left">
        <p className="text-[15px] leading-[1.45] text-text-muted">{item.title}</p>
        {scheduleLabel && (
          <p className="mt-1.5 text-[12px] text-text-tertiary">{scheduleLabel}</p>
        )}
      </button>
      <button
        type="button"
        onClick={onRestore}
        className="mt-2 text-[13px] text-primary transition active:scale-95"
      >
        {t("arrangements.restoreActive")}
      </button>
    </div>
  );
}

function ArrangementDetailView({
  item,
  onBack,
  onEdit,
  onToggleComplete,
  onMoveLater,
  onRestoreActive,
  onDelete,
}: {
  item: Arrangement;
  onBack: () => void;
  onEdit: () => void;
  onToggleComplete: () => void;
  onMoveLater: () => void;
  onRestoreActive: () => void;
  onDelete: () => void;
}) {
  const { resolvedLocale, t } = usePreferences();
  const scheduleLabel =
    typeof item.scheduledAt === "number"
      ? formatArrangementSchedule(item.scheduledAt, resolvedLocale, {
          today: t("arrangements.timeToday"),
          tomorrow: t("arrangements.timeTomorrow"),
          yesterday: t("arrangements.timeYesterday"),
        })
      : t("arrangements.noTime");

  const statusLabel =
    item.status === "completed"
      ? t("arrangements.statusCompleted")
      : item.status === "later"
        ? t("arrangements.statusLater")
        : t("arrangements.statusActive");

  return (
    <div className="flex h-full flex-col bg-bg">
      <ScreenHeader title={t("arrangements.detailTitle")} onBack={onBack} />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">
        <div className="rounded-[16px] border border-border-light bg-surface px-4 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <span className="inline-flex rounded-full bg-surface-2 px-2.5 py-0.5 text-[12px] text-text-muted">
            {statusLabel}
          </span>
          <h2
            className={cn(
              "mt-3 text-[20px] font-semibold leading-snug text-text",
              item.status === "completed" && "text-text-muted line-through"
            )}
          >
            {item.title}
          </h2>
          {item.note && (
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-text-muted">
              {item.note}
            </p>
          )}
          {item.source?.type === "ai" && item.source.excerpt && (
            <p className="mt-3 rounded-[10px] bg-surface-2/80 px-3 py-2 text-[12px] leading-5 text-text-tertiary">
              {t("arrangements.sourceExcerpt")}：{item.source.excerpt}
            </p>
          )}
          <p className="mt-4 text-[13px] text-text-tertiary">{scheduleLabel}</p>
          {item.needsTimeReview && (
            <p className="mt-2 text-[12px] text-primary">{t("arrangements.needsTimeHint")}</p>
          )}
        </div>

        <div className="mt-6 space-y-2">
          {item.status !== "completed" && (
            <Button className="w-full" variant="secondary" onClick={onToggleComplete}>
              {t("arrangements.markComplete")}
            </Button>
          )}
          {item.status === "completed" && (
            <Button className="w-full" variant="secondary" onClick={onToggleComplete}>
              {t("arrangements.markIncomplete")}
            </Button>
          )}
          {item.status === "active" && (
            <Button className="w-full" variant="ghost" onClick={onMoveLater}>
              {t("arrangements.moveLater")}
            </Button>
          )}
          {item.status === "later" && (
            <Button className="w-full" variant="ghost" onClick={onRestoreActive}>
              {t("arrangements.restoreActive")}
            </Button>
          )}
          <Button className="w-full" variant="secondary" onClick={onEdit}>
            {t("arrangements.editAction")}
          </Button>
          <Button className="w-full" variant="ghost" onClick={onDelete}>
            {t("arrangements.delete")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ArrangementFormView({
  mode,
  editing,
  onBack,
  onSave,
  onDelete,
}: {
  mode: "create" | "edit";
  editing: Arrangement | null;
  onBack: () => void;
  onSave: (draft: ArrangementDraft) => void;
  onDelete?: () => void;
}) {
  const { t } = usePreferences();
  const [title, setTitle] = useState(editing?.title ?? "");
  const [note, setNote] = useState(editing?.note ?? "");
  const [scheduleValue, setScheduleValue] = useState(() =>
    toDateTimeLocalValue(editing?.scheduledAt)
  );

  const pageTitle =
    mode === "edit" ? t("arrangements.editTitle") : t("arrangements.createTitle");

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    onSave({
      title: trimmedTitle,
      note,
      scheduledAt: fromDateTimeLocalValue(scheduleValue),
      needsTimeReview:
        editing?.needsTimeReview === true && !fromDateTimeLocalValue(scheduleValue),
    });
  };

  const showTimeHint = Boolean(editing?.needsTimeReview && !scheduleValue);

  return (
    <div className="flex h-full flex-col bg-bg">
      <ScreenHeader title={pageTitle} onBack={onBack} />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {showTimeHint && (
          <p className="mb-4 rounded-[12px] bg-primary-soft/70 px-3 py-2.5 text-[13px] leading-5 text-text-muted">
            {t("arrangements.needsTimeHint")}
          </p>
        )}
        <label className="block">
          <span className="mb-1.5 block text-[13px] text-text-muted">
            {t("arrangements.fieldTitle")}
          </span>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("arrangements.fieldTitlePlaceholder")}
            autoFocus
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-[13px] text-text-muted">
            {t("arrangements.fieldNote")}
          </span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t("arrangements.fieldNotePlaceholder")}
            rows={4}
            className="w-full resize-none rounded-[12px] border border-transparent bg-white/80 px-3 py-2.5 text-sm text-text backdrop-blur-sm placeholder:text-input-placeholder focus:outline-none focus-visible:shadow-[0_0_0_1px_rgba(9,184,62,0.2),0_0_12px_rgba(9,184,62,0.15)]"
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-[13px] text-text-muted">
            {t("arrangements.fieldTime")}
          </span>
          <input
            type="datetime-local"
            value={scheduleValue}
            onChange={(event) => setScheduleValue(event.target.value)}
            className="w-full rounded-[12px] border border-transparent bg-white/80 px-3 py-2.5 text-sm text-text backdrop-blur-sm focus:outline-none focus-visible:shadow-[0_0_0_1px_rgba(9,184,62,0.2),0_0_12px_rgba(9,184,62,0.15)]"
          />
          {scheduleValue && (
            <button
              type="button"
              onClick={() => setScheduleValue("")}
              className="mt-2 text-[12px] text-text-tertiary transition hover:text-text-muted"
            >
              {t("arrangements.clearTime")}
            </button>
          )}
          <p className="mt-2 text-[12px] leading-5 text-text-tertiary">
            {t("arrangements.fieldTimeHint")}
          </p>
        </label>
      </div>

      <footer className="shrink-0 space-y-2 border-t border-border-light px-4 py-4 pb-6">
        <Button className="w-full" onClick={handleSave} disabled={!title.trim()}>
          {t("common.done")}
        </Button>
        {onDelete && (
          <Button variant="ghost" className="w-full text-text-muted" onClick={onDelete}>
            {t("arrangements.delete")}
          </Button>
        )}
      </footer>
    </div>
  );
}

function ScreenHeader({
  title,
  onBack,
  action,
}: {
  title: string;
  onBack: () => void;
  action?: React.ReactNode;
}) {
  const { t } = usePreferences();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border-light/80 bg-bg px-2">
      <button
        type="button"
        onClick={onBack}
        className="flex h-10 w-10 items-center justify-center rounded-full text-text transition hover:bg-hover-overlay active:scale-[0.96]"
        aria-label={t("common.back")}
      >
        <BackIcon />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-[17px] font-semibold text-text">{title}</h1>
      {action ?? <div className="w-10 shrink-0" aria-hidden />}
    </header>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[13px] font-medium tracking-wide text-text-tertiary">{children}</h2>
  );
}

function BackIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function HeaderIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition hover:bg-hover-overlay active:scale-95"
      aria-label={label}
    >
      {children}
    </button>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3.5v3M16 3.5v3M4 10h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M19 12a7 7 0 0 0 .1-1l2-1.5-2-3.5-2.4.4a7 7 0 0 0-1.7-1L15 3h-6l-.9 2.4a7 7 0 0 0-1.7 1L4 6l-2 3.5 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.4-.4a7 7 0 0 0 1.7 1L9 21h6l.9-2.4a7 7 0 0 0 1.7-1l2.4.4 2-3.5-2-1.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
