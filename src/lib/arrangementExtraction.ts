import type { ArrangementAiConfig } from "@/data/arrangementAiConfigStorage";
import { requestArrangementAiCompletion } from "@/lib/arrangementAiClient";

export type ConversationMessageForExtraction = {
  id: string;
  text: string;
  sentAt: number;
  senderLabel: string;
  isSelf: boolean;
};

export type ExtractedArrangementItem = {
  title: string;
  note?: string;
  scheduledAt?: number;
  needsTimeReview: boolean;
  messageIds: string[];
  excerpt: string;
};

type RawExtractedItem = {
  title?: unknown;
  note?: unknown;
  scheduledAt?: unknown;
  messageIds?: unknown;
};

function parseJsonPayload(text: string): { items?: RawExtractedItem[] } | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? text).trim();

  try {
    return JSON.parse(candidate) as { items?: RawExtractedItem[] };
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(candidate.slice(start, end + 1)) as { items?: RawExtractedItem[] };
    } catch {
      return null;
    }
  }
}

function parseScheduledAt(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;

  const parsed = Date.parse(value.trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildSystemPrompt(nowIso: string) {
  return [
    "你是即我 App 的安排识别助手。只根据对话提取「尚未完成、需要用户后续执行」的事项。",
    "不要臆造对话里没有的内容；若无明确安排，返回空数组。",
    "当前时间（ISO）：" + nowIso,
    "返回严格 JSON，不要 markdown，格式：",
    '{"items":[{"title":"简短标题","note":"可选备注","scheduledAt":"ISO8601 或 null","messageIds":["消息id"]}]}',
    "scheduledAt 仅在对话中有可推断时间时填写；无法确定则填 null。",
  ].join("\n");
}

function buildUserPrompt(
  conversationLabel: string,
  messages: ConversationMessageForExtraction[]
) {
  const lines = messages.map((message) => {
    const role = message.isSelf ? "我" : message.senderLabel;
    return `[${message.id}] ${role}：${message.text}`;
  });

  return [
    `对话：${conversationLabel}`,
    "以下为最近消息：",
    ...lines,
  ].join("\n");
}

export async function extractArrangementsFromConversation(
  config: ArrangementAiConfig,
  input: {
    conversationLabel: string;
    messages: ConversationMessageForExtraction[];
  },
  options: { signal?: AbortSignal } = {}
): Promise<ExtractedArrangementItem[]> {
  if (input.messages.length === 0) return [];

  const content = await requestArrangementAiCompletion(
    config,
    [
      { role: "system", content: buildSystemPrompt(new Date().toISOString()) },
      {
        role: "user",
        content: buildUserPrompt(input.conversationLabel, input.messages),
      },
    ],
    options
  );

  const parsed = parseJsonPayload(content);
  const items = Array.isArray(parsed?.items) ? parsed.items : [];

  // 直接用 for 循环构建结果，不依赖 filter 类型守卫
  const result: ExtractedArrangementItem[] = [];

  for (const item of items) {
    const title = typeof item.title === "string" ? item.title.trim() : "";
    if (!title) continue;

    const scheduledAt = parseScheduledAt(item.scheduledAt);
    const messageIds = Array.isArray(item.messageIds)
      ? item.messageIds.filter((id): id is string => typeof id === "string")
      : [];

    const excerptSource = input.messages.find((message) =>
      messageIds.includes(message.id)
    );
    const excerpt = excerptSource?.text ?? input.messages.at(-1)?.text ?? title;

    result.push({
      title,
      note: typeof item.note === "string" && item.note.trim() ? item.note.trim() : undefined,
      scheduledAt,
      needsTimeReview: !scheduledAt,
      messageIds,
      excerpt: excerpt.slice(0, 120),
    });
  }

  return result;
}