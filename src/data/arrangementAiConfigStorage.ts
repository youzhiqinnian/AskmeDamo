// src/data/arrangementAiConfigStorage.ts
import type { ArrangementAiConfig } from "@/types/arrangement";

const CONFIG_KEY = "arkme-demo.arrangementAiConfig";

const defaultConfig: ArrangementAiConfig = {
  apiKey: "",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-3.5-turbo",
};

export function readArrangementAiConfig(): ArrangementAiConfig {
  if (typeof window === "undefined") return defaultConfig;
  try {
    const raw = window.localStorage.getItem(CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return defaultConfig;
}

export function writeArrangementAiConfig(config: Partial<ArrangementAiConfig>) {
  if (typeof window === "undefined") return;
  const current = readArrangementAiConfig();
  const updated = { ...current, ...config };
  window.localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
}

export function isArrangementAiConfigReady(config: ArrangementAiConfig): boolean {
  return !!config.apiKey;
}