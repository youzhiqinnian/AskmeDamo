// src/components/arrangements/ArrangementAiSettingsView.tsx
import { useState } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { usePreferences } from "@/settings/preferences";
import {
  readArrangementAiConfig,
  writeArrangementAiConfig,
} from "@/data/arrangementAiConfigStorage";

export default function ArrangementAiSettingsView({ onBack }: { onBack: () => void }) {
  const { t } = usePreferences();
  const config = readArrangementAiConfig();
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [model, setModel] = useState(config.model);

  const handleSave = () => {
    writeArrangementAiConfig({ apiKey, baseUrl, model });
    onBack();
  };

  return (
    <div className="flex h-full flex-col bg-bg p-4">
      <header className="mb-4 flex items-center">
        <button className="mr-3 h-10 w-10" onClick={onBack}>
          {t("common.back")}
        </button>
        <h1 className="text-lg font-semibold">{t("arrangements.aiSettingsTitle")}</h1>
      </header>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">API Key</label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Base URL</label>
          <Input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.openai.com/v1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Model</label>
          <Input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="gpt-3.5-turbo"
          />
        </div>

        <Button onClick={handleSave}>{t("common.save")}</Button>
      </div>
    </div>
  );
}