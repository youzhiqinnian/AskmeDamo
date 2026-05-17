// src/hooks/useArrangements.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Arrangement, ArrangementDraft, ProposedArrangement } from "@/types/arrangement";
import { readArrangementsStorage, writeArrangementsStorage } from "@/data/arrangementsStorage";

function generateId(prefix = "arr") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

const REMINDER_CHECK_INTERVAL = 30 * 1000;

export function useArrangements() {
  const init = readArrangementsStorage();
  const [items, setItems] = useState<Arrangement[]>(init.arrangements);
  const [proposed, setProposed] = useState<ProposedArrangement[]>(init.proposed);

  useEffect(() => {
    writeArrangementsStorage(items, proposed);
  }, [items, proposed]);

  const activeItems = useMemo(() => items.filter((i) => i.status === "active"), [items]);
  const laterItems = useMemo(() => items.filter((i) => i.status === "later"), [items]);
  const completedItems = useMemo(() => items.filter((i) => i.status === "completed"), [items]);

  const findById = useCallback((id: string) => items.find((i) => i.id === id) ?? null, [items]);

  const createArrangement = useCallback((draft: ArrangementDraft, source?: any): Arrangement => {
    const now = Date.now();
    const arr: Arrangement = {
      id: generateId("arr"),
      title: draft.title,
      note: draft.note,
      status: "active",
      createdAt: now,
      updatedAt: now,
      scheduledAt: draft.scheduledAt ?? undefined,
      scheduledStart: draft.scheduledStart ?? undefined,
      scheduledEnd: draft.scheduledEnd ?? undefined,
      reminderAt: draft.reminderAt ?? undefined,
      reminderType: draft.reminderType,
      participants: draft.participants,
      needsTimeReview: Boolean(draft.needsTimeReview),
      source: source,
      mergedFrom: [],
      confirmedBy: [],
    };
    setItems((prev) => [arr, ...prev]);
    return arr;
  }, []);

  const updateArrangement = useCallback((id: string, patch: Partial<ArrangementDraft>) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              ...patch,
              updatedAt: Date.now(),
            }
          : it
      )
    );
  }, []);

  const deleteArrangement = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const setStatus = useCallback((id: string, status: Arrangement["status"]) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status, updatedAt: Date.now() } : it)));
  }, []);

  const createProposed = useCallback((draft: ArrangementDraft, source: any, participants?: string[]) => {
    const p: ProposedArrangement = {
      id: generateId("prop"),
      draft,
      source,
      participants,
      createdAt: Date.now(),
      status: "pending",
      suggestedBy: "ai",
    };
    setProposed((prev) => [p, ...prev]);
    return p;
  }, []);

  const acceptProposed = useCallback((proposalId: string, acceptorId?: string) => {
    setProposed((prev) => prev.map((p) => (p.id === proposalId ? { ...p, status: "accepted" } : p)));
    let createdArrangement: Arrangement | null = null;
    setProposed((prev) => {
      const proposal = prev.find((p) => p.id === proposalId);
      if (!proposal) return prev;
      createdArrangement = createArrangement(proposal.draft, proposal.source);
      if (proposal.participants?.length) {
        setItems((prevItems) =>
          prevItems.map((it) =>
            it.id === createdArrangement!.id
              ? { ...it, participants: proposal.participants, confirmedBy: acceptorId ? [acceptorId] : [] }
              : it
          )
        );
      }
      return prev.map((p) => (p.id === proposalId ? { ...p, status: "accepted" } : p));
    });
    return createdArrangement;
  }, [createArrangement]);

  const rejectProposed = useCallback((proposalId: string) => {
    setProposed((prev) => prev.map((p) => (p.id === proposalId ? { ...p, status: "rejected" } : p)));
  }, []);

  function normalizeTitleForMerge(title: string) {
    return title
      .toLowerCase()
      .replace(/\d{1,2}[:：]\d{2}/g, "")
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 6)
      .join(" ");
  }

  const tryMergeOrCreate = useCallback(
    (draft: ArrangementDraft, source?: any, participants?: string[]) => {
      const key = `${source?.type ?? "manual"}:${source?.conversationId ?? ""}:${normalizeTitleForMerge(draft.title)}`;
      const existing = items.find((it) => {
        const itkey = `${it.source?.type ?? "manual"}:${it.source?.conversationId ?? ""}:${normalizeTitleForMerge(it.title)}`;
        return itkey === key && it.status !== "completed";
      });
      if (existing) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === existing.id
              ? {
                  ...it,
                  note: it.note || draft.note,
                  excerpt: (it as any).excerpt || source?.excerpt,
                  updatedAt: Date.now(),
                  mergedFrom: Array.from(new Set([...(it.mergedFrom ?? []), ...(draft.title ? [normalizeTitleForMerge(draft.title)] : [])])),
                }
              : it
          )
        );
        return existing;
      }
      return createArrangement(draft, source);
    },
    [items, createArrangement]
  );

  const detectConflicts = useCallback(
    (candidate: ArrangementDraft, participantIds: string[] = []) => {
      const conflicts: { arrangement: Arrangement; reason: string }[] = [];
      const candStart = candidate.scheduledStart ?? candidate.scheduledAt ?? null;
      const candEnd = candidate.scheduledEnd ?? candidate.scheduledAt ?? null;
      for (const it of items) {
        if (!it.participants || it.participants.length === 0) continue;
        if (participantIds.length && !participantIds.some((p) => it.participants!.includes(p))) continue;
        const itStart = it.scheduledStart ?? it.scheduledAt ?? null;
        const itEnd = it.scheduledEnd ?? it.scheduledAt ?? null;
        if (!itStart || !candStart) continue;
        const overlap = candStart <= (itEnd ?? itStart) && itStart <= (candEnd ?? candStart);
        if (overlap) {
          conflicts.push({ arrangement: it, reason: "time-overlap" });
        }
      }
      return conflicts;
    },
    [items]
  );

  const alreadyFiredRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      for (const it of items) {
        if (it.status === "completed") continue;
        const id = it.id;
        if (alreadyFiredRef.current.has(id)) continue;
        let shouldFire = false;
        if (it.reminderType === "reminder-only" && it.reminderAt && it.reminderAt <= now) shouldFire = true;
        if (it.reminderType === "deadline" && it.scheduledAt && it.scheduledAt <= now) shouldFire = true;
        if (it.reminderType === "time-range" && it.scheduledStart && it.scheduledStart <= now && it.scheduledEnd && now <= it.scheduledEnd) shouldFire = true;
        if (shouldFire) {
          try {
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              const n = new Notification(it.title || "提醒", {
                body: it.note ?? "",
                tag: `arrangement-${it.id}`,
              });
              n.onclick = () => {
                try {
                  n.close();
                } catch {}
                if (typeof window !== "undefined") {
                  window.focus();
                }
              };
            }
          } catch {}
          alreadyFiredRef.current.add(id);
        }
      }
    }, REMINDER_CHECK_INTERVAL);
    return () => clearInterval(timer);
  }, [items]);

  return {
    items,
    proposed,
    activeItems,
    laterItems,
    completedItems,
    findById,
    createArrangement,
    updateArrangement,
    deleteArrangement,
    setStatus,
    createProposed,
    acceptProposed,
    rejectProposed,
    tryMergeOrCreate,
    detectConflicts,
  } as const;
}