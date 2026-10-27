import React from 'react';

export const toNum = (val: any): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const parsed = parseFloat(String(val));
  return isNaN(parsed) ? 0 : parsed;
};

export const formatINR = (val: any, showDecimals = true): string => {
  const numeric = toNum(val);
  const parts = Math.abs(numeric).toFixed(showDecimals ? 2 : 0).split('.');
  let lastThree = parts[0].substring(parts[0].length - 3);
  const otherNumbers = parts[0].substring(0, parts[0].length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  const dec = showDecimals && parts[1] ? `.${parts[1]}` : '';
  const sign = numeric < 0 ? '-' : '';
  return `${sign}₹${formatted}${dec}`;
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
