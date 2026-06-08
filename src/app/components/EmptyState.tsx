import { FileText, Plus, Database } from "lucide-react";

interface EmptyStateProps {
  icon?: "file" | "database" | "table";
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "file",
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const icons = {
    file: FileText,
    database: Database,
    table: FileText,
  };

  const Icon = icons[icon];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-gray-900 font-medium mb-2">{title}</h3>
      <p className="text-sm text-gray-500 text-center mb-6 max-w-sm">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
