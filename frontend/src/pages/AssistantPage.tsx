import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  facts?: Array<{ label: string; value: string }>;
  isPrediction?: boolean;
  suggestedFollowups?: string[];
  timestamp: string;
}

export const AssistantPage: React.FC = () => {
  const { year, month } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: "Hello! I am your deterministic financial assistant. I query your actual recorded transactions and budgets directly without arbitrary SQL or fabricated numbers. Ask me about category totals, upcoming exam fees, safe-to-spend allowances, or month-over-month trends.",
      timestamp: 'Just now',
      suggestedFollowups: [
        'How much did I spend on food this month?',
        'What is my safe to spend today?',
        'Compare my spending with last month',
        'What are my upcoming planned expenses?',
        'Which category has the highest spending?',
      ],
    },
  ]);
  const [queryInput, setQueryInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || queryInput;
    if (!text.trim() || isAsking) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQueryInput('');
    setIsAsking(true);

    try {
      const res = await api.askAssistant(text.trim(), year, month);
      const assistantMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: res.answer,
        facts: res.facts,
        isPrediction: res.is_prediction,
        suggestedFollowups: res.suggested_followups,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: 'Sorry, I encountered an issue querying your records. Please try asking again or select one of the suggested queries below.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-border-subtle">
        <h2 className="text-xl font-semibold text-ink tracking-tight font-sans">
          Ask Your Expenses Assistant
        </h2>
        <p className="text-xs text-ink-muted mt-0.5">
          Deterministic question answering over your personal student database records
        </p>
      </div>

      {/* Notice Card */}
      <div className="p-3.5 rounded-ledger bg-surface-soft border border-border-subtle flex items-start gap-2.5 text-xs text-ink-muted">
        <ShieldCheck className="w-4 h-4 text-ledger shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-ink">Analytical Safety Guarantee:</span>{' '}
          Answers are generated using validated Python analytical calculations on your isolated user records. 
          No external language model has direct SQL access. Predictions are clearly labeled as estimates.
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="bg-paper border border-border-subtle rounded-ledger p-5 shadow-subtle min-h-[450px] flex flex-col justify-between">
        <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 text-xs ${
                m.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-ledger text-lime flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-xl rounded-ledger p-4 space-y-2.5 ${
                  m.sender === 'user'
                    ? 'bg-ledger text-paper rounded-br-none ml-10'
                    : 'bg-canvas border border-border-subtle rounded-bl-none text-ink'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-[11px] opacity-80 uppercase tracking-wider">
                    {m.sender === 'user' ? 'You' : 'CampusTech Intelligence'}
                  </span>
                  <div className="flex items-center gap-2">
                    {m.isPrediction && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-medium">
                        ESTIMATE / PROJECTION
                      </span>
                    )}
                    <span className="text-[10px] opacity-60 font-tabular">{m.timestamp}</span>
                  </div>
                </div>

                <p className="leading-relaxed text-sm">{m.text}</p>

                {/* Facts Pills */}
                {m.facts && m.facts.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-subtle/50">
                    {m.facts.map((f, idx) => (
                      <div key={idx} className="p-2 rounded bg-paper border border-border-subtle text-[11px]">
                        <span className="text-ink-muted block text-[10px] uppercase font-semibold">
                          {f.label}
                        </span>
                        <span className="font-semibold text-ink font-tabular mt-0.5 block">
                          {f.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested follow-up buttons */}
                {m.suggestedFollowups && m.suggestedFollowups.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-semibold uppercase text-ink-subtle tracking-wider block mb-1">
                      Suggested questions:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {m.suggestedFollowups.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(q)}
                          className="text-[11px] px-2.5 py-1 rounded bg-paper border border-border-subtle text-ink-light hover:border-ledger/40 hover:text-ink transition-ledger"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {m.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-surface-muted text-ink-muted flex items-center justify-center shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isAsking && (
            <div className="flex gap-3 text-xs items-center text-ink-muted">
              <div className="w-8 h-8 rounded-full bg-ledger text-lime flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <span className="italic">Querying financial records...</span>
            </div>
          )}
        </div>

        {/* Query Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mt-6 pt-3 border-t border-border-subtle flex gap-2"
        >
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Ask anything about your expenses (e.g. How much did I spend on food?)"
            className="flex-1 px-4 py-2.5 bg-canvas border border-border-subtle rounded-md text-xs sm:text-sm text-ink focus:border-ledger focus:bg-paper transition-ledger"
          />
          <button
            type="submit"
            disabled={isAsking || !queryInput.trim()}
            className="px-4 py-2.5 rounded-md bg-ledger text-paper text-xs font-medium hover:bg-ledger-light transition-ledger disabled:opacity-40 flex items-center gap-1.5"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5 text-lime" />
          </button>
        </form>
      </div>
    </div>
  );
};
