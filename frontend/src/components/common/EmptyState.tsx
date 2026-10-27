import React from 'react';
import { LucideIcon, FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = FolderOpen,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`border border-dashed border-border-subtle rounded-ledger p-10 text-center flex flex-col items-center justify-center bg-paper/50 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center text-ink-muted mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-ink mb-1">{title}</h4>
      <p className="text-xs text-ink-muted max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium rounded-md bg-ledger text-paper hover:bg-ledger-light transition-ledger"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
