import React from 'react';

export const toNum = (val: any): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) || !isFinite(val) ? 0 : val;
  const parsed = parseFloat(String(val));
  return isNaN(parsed) || !isFinite(parsed) ? 0 : parsed;
};

export const roundPaise = (val: any): number => {
  const num = toNum(val);
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const formatINR = (val: any, showDecimals = true): string => {
  const numeric = roundPaise(val);
  const isNegative = numeric < 0;
  const absVal = Math.abs(numeric);

  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(absVal);

  return `${isNegative ? '-' : ''}₹${formatted}`;
};

interface CurrencyDisplayProps {
  amount: number | string | undefined | null;
  currency?: string;
  className?: string;
  showDecimals?: boolean;
  prefix?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  className = '',
  showDecimals = true,
  prefix = '',
}) => {
  const formatted = formatINR(amount, showDecimals);

  return (
    <span className={`font-tabular inline-flex items-baseline ${className}`}>
      {prefix && <span className="mr-0.5">{prefix}</span>}
      {formatted}
    </span>
  );
};
