// src/types/arrangement.ts

export type SourceType = "manual" | "ai" | "private-bilateral" | "self" | "test";

export type ArrangementSource = {
  type: SourceType;
  conversationId?: string;
  conversationLabel?: string;
  messageIds?: string[];
  excerpt?: string;
};

export type ReminderType = "time-range" | "deadline" | "reminder-only";

export type ArrangementStatus = "active" | "later" | "completed";

/**
 * 主存储的安排实体（本地）
 */
export type Arrangement = {
  id: string;
  title: string;
  note?: string;
  status: ArrangementStatus;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  source?: ArrangementSource;
  scheduledAt?: number;
  scheduledStart?: number;
  scheduledEnd?: number;
  reminderAt?: number;
  reminderType?: ReminderType;
  participants?: string[];
  mergedFrom?: string[];
  needsTimeReview?: boolean;
  confirmedBy?: string[];
};

/**
 * 编辑草稿
 */
export type ArrangementDraft = {
  title: string;
  note?: string;
  scheduledAt?: number | null;
  scheduledStart?: number | null;
  scheduledEnd?: number | null;
  reminderAt?: number | null;
  reminderType?: ReminderType;
  participants?: string[];
  needsTimeReview?: boolean;
};

/**
 * 提议（AI抽取后等待用户确认）
 */
export type ProposedArrangement = {
  id: string;
  draft: ArrangementDraft;
  source: ArrangementSource;
  participants?: string[];
  createdAt: number;
  status: "pending" | "accepted" | "rejected";
  suggestedBy?: "ai" | "local";
};

export type ArrangementAiConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};