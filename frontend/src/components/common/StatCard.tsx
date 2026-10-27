import React from 'react';
import { CurrencyDisplay } from './CurrencyDisplay';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  amount?: number;
  valueText?: string;
  subtext?: string;
  icon?: LucideIcon;
  badge?: {
    text: string;
    variant: 'positive' | 'warning' | 'alert' | 'neutral' | 'lime';
  };
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  amount,
  valueText,
  subtext,
  icon: Icon,
  badge,
  onClick,
  className = '',
}) => {
  const badgeClasses = {
    positive: 'bg-ledger-soft text-ledger border-ledger/20',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    alert: 'bg-terracotta-light text-terracotta border-terracotta/20',
    neutral: 'bg-surface-muted text-ink-muted border-border-subtle',
    lime: 'bg-lime text-ledger-dark font-medium border-lime-dark/30',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle transition-ledger ${
        onClick ? 'cursor-pointer hover:border-ledger/30 hover:shadow-elevated' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          {label}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-md bg-surface-muted flex items-center justify-center text-ledger">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <div className="text-2xl lg:text-3xl font-semibold tracking-tight text-ink font-tabular">
          {amount !== undefined ? (
            <CurrencyDisplay amount={amount} />
          ) : (
            valueText || '—'
          )}
        </div>
        {badge && (
          <span
            className={`text-xs px-2 py-0.5 rounded border text-[11px] font-medium tracking-tight whitespace-nowrap ${badgeClasses[badge.variant]}`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-2 text-xs text-ink-muted leading-relaxed">
          {subtext}
        </p>
      )}
    </div>
  );
};
