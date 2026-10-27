import React, { useState } from 'react';
import { X, Sparkles, Check, ArrowRight } from 'lucide-react';
import { api } from '../../api/client';
import { CurrencyDisplay } from '../common/CurrencyDisplay';

interface NLPEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NLPEntryModal: React.FC<NLPEntryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [inputText, setInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedResult, setParsedResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const samplePrompts = [
    'Spent ₹140 on lunch at campus canteen today',
    'Paid 450 rs for operating systems textbook yesterday',
    'Metro recharge 650 via UPI',
    'Chai and snacks with roommates 95 rs',
  ];

  const handleParse = async (textToParse?: string) => {
    const text = textToParse || inputText;
    if (!text.trim()) return;

    setIsParsing(true);
    setError(null);
    try {
      const res = await api.parseNLPExpense(text.trim());
      setParsedResult(res);
      if (!res.parsed_successfully) {
        setError(res.explanation);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to parse natural language text');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!parsedResult || !parsedResult.amount) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await api.createExpense({
        amount: parsedResult.amount,
        description: parsedResult.description,
        category_id: parsedResult.suggested_category_id || 1,
        date: parsedResult.date,
        payment_method: parsedResult.payment_method || 'UPI',
        notes: `Extracted via Natural Entry: "${inputText}"`,
      });
      setInputText('');
      setParsedResult(null);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save parsed expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-paper border border-border-subtle rounded-ledger shadow-elevated w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-surface-soft/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-ledger flex items-center justify-center text-lime">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">Natural-Language Expense Entry</h3>
              <p className="text-[11px] text-ink-muted">Quick entry using plain conversational phrasing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-muted transition-ledger"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">
              Describe your expense in natural language:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setParsedResult(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleParse();
                  }
                }}
                placeholder="e.g. Spent ₹160 on lunch at campus canteen today"
                className="flex-1 px-3.5 py-2.5 bg-canvas border border-border-subtle rounded-md text-sm text-ink focus:border-ledger focus:bg-paper transition-ledger"
              />
              <button
                type="button"
                onClick={() => handleParse()}
                disabled={isParsing || !inputText.trim()}
                className="px-4 py-2.5 bg-ledger text-paper text-xs font-medium rounded-md hover:bg-ledger-light transition-ledger disabled:opacity-50"
              >
                {isParsing ? 'Parsing...' : 'Analyze'}
              </button>
            </div>
          </div>

          {/* Sample quick pills */}
          <div>
            <span className="text-[10px] uppercase font-semibold text-ink-subtle tracking-wider block mb-1.5">
              Try an example:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {samplePrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setInputText(prompt);
                    handleParse(prompt);
                  }}
                  className="text-[11px] px-2.5 py-1 bg-surface-muted text-ink-light rounded border border-border-subtle hover:border-ledger/30 hover:text-ink transition-ledger"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 text-xs bg-terracotta-light text-terracotta rounded-md border border-terracotta/20">
              {error}
            </div>
          )}

          {/* Parsed Result Confirmation Card */}
          {parsedResult && parsedResult.parsed_successfully && (
            <div className="p-4 bg-surface-soft border border-border-subtle rounded-ledger space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                <span className="text-xs font-semibold text-ink uppercase tracking-wider flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-ledger" />
                  Proposed Transaction
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-lime text-ledger-dark font-medium">
                  {parsedResult.confidence.toUpperCase()} CONFIDENCE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-ink-muted block text-[11px]">Amount</span>
                  <span className="font-semibold text-base text-ink font-tabular">
                    <CurrencyDisplay amount={parsedResult.amount} />
                  </span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Suggested Category</span>
                  <span className="font-medium text-ink bg-paper px-2 py-0.5 rounded border border-border-subtle inline-block mt-0.5">
                    {parsedResult.suggested_category_name}
                  </span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Description</span>
                  <span className="font-medium text-ink">{parsedResult.description}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Date</span>
                  <span className="font-medium text-ink">{parsedResult.date}</span>
                </div>
              </div>

              <p className="text-[11px] text-ink-muted border-t border-border-subtle pt-2">
                {parsedResult.explanation}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-ink-muted hover:text-ink hover:bg-surface-muted rounded-md transition-ledger"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting || !parsedResult || !parsedResult.parsed_successfully}
              onClick={handleConfirmSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-ledger text-paper rounded-md hover:bg-ledger-light transition-ledger disabled:opacity-40"
            >
              <Check className="w-3.5 h-3.5 text-lime" />
              <span>{isSubmitting ? 'Saving...' : 'Confirm & Save Expense'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
