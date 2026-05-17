import Button from "@/components/ui/button";
import { usePreferences } from "@/settings/preferences";

type ConversationExtractBarProps = {
  loading: boolean;
  error?: string | null;
  resultMessage?: string | null;
  onExtract: () => void;
  onOpenAiSettings: () => void;
  onOpenArrangements: () => void;
};

export default function ConversationExtractBar({
  loading,
  error,
  resultMessage,
  onExtract,
  onOpenAiSettings,
  onOpenArrangements,
}: ConversationExtractBarProps) {
  const { t } = usePreferences();

  return (
    <div className="shrink-0 border-b border-border-light bg-surface-2/50 px-4 py-3">
      <p className="text-[12px] leading-5 text-text-muted">{t("arrangements.extractHint")}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          className="min-w-0 flex-1"
          loading={loading}
          disabled={loading}
          onClick={onExtract}
        >
          {t("arrangements.extractAction")}
        </Button>
        <Button variant="ghost" className="shrink-0" onClick={onOpenAiSettings}>
          {t("arrangements.aiSettingsShort")}
        </Button>
      </div>
      {error && (
        <p className="mt-2 text-[12px] leading-5 text-text-muted" role="alert">
          {error}
        </p>
      )}
      {resultMessage && !error && (
        <p className="mt-2 text-[12px] leading-5 text-primary">
          {resultMessage}{" "}
          <button
            type="button"
            className="underline decoration-primary/40 underline-offset-2"
            onClick={onOpenArrangements}
          >
            {t("arrangements.openList")}
          </button>
        </p>
      )}
    </div>
  );
}
