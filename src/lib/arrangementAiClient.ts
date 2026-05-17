import type { ArrangementAiConfig } from "@/data/arrangementAiConfigStorage";

export type ArrangementAiChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export class ArrangementAiRequestError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ArrangementAiRequestError";
    this.status = status;
  }
}

/**
 * 直连用户配置的大模型接口；密钥仅保存在本机，不经由本项目服务端。
 */
export async function requestArrangementAiCompletion(
  config: ArrangementAiConfig,
  messages: ArrangementAiChatMessage[],
  options: { signal?: AbortSignal } = {}
): Promise<string> {
  const apiKey = config.apiKey.trim();
  const baseUrl = config.baseUrl.trim().replace(/\/+$/, "");
  const model = config.model.trim();

  if (!apiKey || !baseUrl || !model) {
    throw new ArrangementAiRequestError("请先完成 AI 接口配置");
  }

  const endpoint = `${baseUrl}/chat/completions`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages,
    }),
    signal: options.signal,
  });

  const payload = (await response.json().catch(() => null)) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  } | null;

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      `模型请求失败（${response.status}）`;
    throw new ArrangementAiRequestError(message, response.status);
  }

  const content = payload?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new ArrangementAiRequestError("模型未返回可用内容");
  }

  return content;
}
