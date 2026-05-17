import type { Arrangement } from "@/types/arrangement";
import { format } from "date-fns";

type ArrangementRowProps = {
  item: Arrangement;
  onClick?: () => void;
};

export default function ArrangementRow({ item, onClick }: ArrangementRowProps) {
  const statusText = {
    active: "进行中",
    later: "待办",
    completed: "已完成",
  }[item.status];

  const statusColor = {
    active: "bg-blue-500",
    later: "bg-yellow-500",
    completed: "bg-gray-400",
  }[item.status];

  const displayTime = item.scheduledStart
    ? format(new Date(item.scheduledStart), "MM-dd HH:mm")
    : item.scheduledAt
    ? format(new Date(item.scheduledAt), "MM-dd HH:mm")
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${statusColor}`} />
          <p className="truncate font-medium">{item.title}</p>
        </div>
        {item.note && <p className="mt-1 truncate text-sm text-gray-500">{item.note}</p>}
      </div>
      {displayTime && <span className="ml-2 text-sm text-gray-400">{displayTime}</span>}
    </button>
  );
}