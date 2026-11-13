import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showDescriptor?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showDescriptor = false,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7 text-xs rounded-md',
    md: 'w-8 h-8 text-sm rounded-lg',
    lg: 'w-10 h-10 text-base rounded-xl',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Restrained geometric tech-fintech icon */}
      <div
        className={`${iconSizes[size]} bg-ledger flex items-center justify-center text-lime font-bold tracking-tight shadow-sm shrink-0 border border-ledger-light/30 relative overflow-hidden`}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        <span className="font-sans font-bold">CT</span>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-semibold tracking-tight text-ink font-sans ${textSizes[size]}`}>
            Campus<span className="text-ledger dark:text-lime">Tech</span>
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-lime shrink-0 mb-1" />
        </div>

        {showDescriptor && (
          <span className="text-[10px] uppercase tracking-wider text-ink-muted font-medium mt-0.5">
            Student Financial Intelligence
          </span>
        )}
      </div>
    </div>
  );
};
