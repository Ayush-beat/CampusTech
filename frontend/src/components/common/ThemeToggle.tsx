import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme, ThemePreference } from '../../context/ThemeContext';

interface ThemeToggleProps {
  compact?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ compact = false }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const options: { label: string; value: ThemePreference; icon: React.ReactNode }[] = [
    { label: 'Light', value: 'light', icon: <Sun className="w-3.5 h-3.5" /> },
    { label: 'Dark', value: 'dark', icon: <Moon className="w-3.5 h-3.5" /> },
    { label: 'System', value: 'system', icon: <Laptop className="w-3.5 h-3.5" /> },
  ];

  const currentIcon = resolvedTheme === 'dark' ? (
    <Moon className="w-4 h-4 text-lime" />
  ) : (
    <Sun className="w-4 h-4 text-ledger" />
  );

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Theme settings: currently set to ${theme} (${resolvedTheme} active). Click to choose light, dark, or system mode.`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="inline-flex items-center justify-center gap-1.5 p-2 rounded-md bg-paper border border-border-subtle text-ink hover:border-ledger/40 hover:bg-surface-soft transition-campustech shadow-subtle focus-visible:ring-2 focus-visible:ring-ledger"
        title={`Theme: ${theme}`}
      >
        {currentIcon}
        {!compact && (
          <span className="text-xs font-medium capitalize hidden sm:inline text-ink">
            {theme}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Theme options"
          className="absolute right-0 mt-1.5 w-36 py-1 bg-paper border border-border-subtle rounded-ledger shadow-elevated z-50 animate-fade-in"
        >
          <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-muted border-b border-border-subtle mb-1">
            Theme Mode
          </div>
          {options.map((opt) => {
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="menuitem"
                onClick={() => {
                  setTheme(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-1.5 text-xs text-left flex items-center justify-between hover:bg-surface-soft transition-campustech ${
                  isSelected ? 'text-ledger font-semibold bg-surface-muted/60' : 'text-ink'
                }`}
              >
                <span className="flex items-center gap-2">
                  {opt.icon}
                  <span>{opt.label}</span>
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 text-ledger dark:text-lime" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
