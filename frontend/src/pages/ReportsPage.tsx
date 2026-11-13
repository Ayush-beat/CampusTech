import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  School,
  User as UserIcon,
  CheckCircle2,
  PieChart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { CurrencyDisplay, toNum } from '../components/common/CurrencyDisplay';
import { BrandLogo } from '../components/common/BrandLogo';

export const ReportsPage: React.FC = () => {
  const { year, month, user } = useAuth();
  const [reportData, setReportData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const data = await api.getReportSummary(year, month);
      setReportData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [year, month]);

  const handleDownloadCSV = () => {
    const url = api.getCSVDownloadUrl(year, month);
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading && !reportData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ledger" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Actions Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle print:hidden">
        <div>
          <h2 className="text-xl font-semibold text-ink tracking-tight font-sans">
            Reports & Financial Statements
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Export transaction histories as CSV or generate printable student financial statements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-paper border border-border-subtle text-xs font-medium text-ink hover:border-ledger/40 hover:bg-surface-soft transition-ledger shadow-subtle"
          >
            <Download className="w-3.5 h-3.5 text-ink-muted" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-ledger text-paper text-xs font-medium hover:bg-ledger-light transition-ledger shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-lime" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Statement Document */}
      <div className="bg-paper border border-border-subtle rounded-ledger p-8 sm:p-10 shadow-subtle print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex items-start justify-between border-b-2 border-ledger pb-6 mb-6">
          <div>
            <div className="mb-2">
              <BrandLogo size="md" />
            </div>
            <p className="text-xs text-ink-muted uppercase tracking-wider font-semibold">
              Student Financial Intelligence Statement
            </p>
            <h3 className="text-xl font-serif text-ink mt-2">
              {reportData?.report_title}
            </h3>
          </div>

          <div className="text-right text-xs text-ink-muted space-y-1">
            <p className="font-semibold text-ink">{reportData?.user_profile?.name}</p>
            <p>{reportData?.user_profile?.college}</p>
            <p>ID: {reportData?.user_profile?.student_id || 'N/A'}</p>
            <p className="text-[11px] text-ink-subtle">Generated: {reportData?.generated_on}</p>
          </div>
        </div>

        {/* Financial Overview Table */}
        <div className="mb-8">
          <h4 className="text-xs font-semibold text-ink uppercase tracking-wider mb-3">
            1. Period Financial Overview
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-md bg-canvas border border-border-subtle text-xs">
            <div>
              <span className="text-[11px] text-ink-muted block uppercase">Allowance (Funds In)</span>
              <span className="text-base font-semibold text-ink font-tabular mt-0.5 block">
                <CurrencyDisplay amount={reportData?.financial_overview?.monthly_allowance} />
              </span>
            </div>
            <div>
              <span className="text-[11px] text-ink-muted block uppercase">Monthly Budget</span>
              <span className="text-base font-semibold text-ink font-tabular mt-0.5 block">
                <CurrencyDisplay amount={reportData?.financial_overview?.total_budget} />
              </span>
            </div>
            <div>
              <span className="text-[11px] text-ink-muted block uppercase">Actual Spent MTD</span>
              <span className="text-base font-semibold text-ink font-tabular mt-0.5 block">
                <CurrencyDisplay amount={reportData?.financial_overview?.total_spent} />
              </span>
            </div>
            <div>
              <span className="text-[11px] text-ink-muted block uppercase">Remaining Budget</span>
              <span className="text-base font-semibold text-emerald-700 font-tabular mt-0.5 block">
                <CurrencyDisplay amount={reportData?.financial_overview?.remaining_budget} />
              </span>
            </div>
          </div>
        </div>

        {/* Category Breakdown Table */}
        <div className="mb-8">
          <h4 className="text-xs font-semibold text-ink uppercase tracking-wider mb-3">
            2. Category Expenditure Breakdown
          </h4>
          <table className="w-full text-left text-xs border border-border-subtle rounded-md overflow-hidden">
            <thead>
              <tr className="bg-surface-muted border-b border-border-subtle text-ink-muted font-medium">
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-center">Transactions</th>
                <th className="py-2.5 px-3 text-right">Share (%)</th>
                <th className="py-2.5 px-3 text-right">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {reportData?.categories?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-ink-muted">
                    No transactions recorded for this period.
                  </td>
                </tr>
              ) : (
                reportData?.categories?.map((c: any) => (
                  <tr key={c.name}>
                    <td className="py-2.5 px-3 font-medium text-ink flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                      <span>{c.name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-ink-muted">{c.count}</td>
                    <td className="py-2.5 px-3 text-right text-ink-muted font-tabular">
                      {toNum(c.percentage).toFixed(0)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-ink font-tabular">
                      <CurrencyDisplay amount={c.amount} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Reserved Commitments */}
        {reportData?.upcoming_commitments?.length > 0 && (
          <div className="mb-8">
            <h4 className="text-xs font-semibold text-ink uppercase tracking-wider mb-3">
              3. Reserved Semester Commitments in Period
            </h4>
            <div className="space-y-2">
              {reportData.upcoming_commitments.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-md bg-canvas border border-border-subtle flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-ink">{item.title}</span>
                    <span className="text-[11px] text-ink-muted block mt-0.5">
                      Due: {item.due_date} • {item.priority.toUpperCase()} priority
                    </span>
                  </div>
                  <span className="font-semibold text-ink font-tabular">
                    <CurrencyDisplay amount={item.amount} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Statement */}
        <div className="pt-6 border-t border-border-subtle text-center text-[11px] text-ink-muted space-y-1">
          <p className="font-medium text-ink">
            CampusTech — Student Financial Intelligence
          </p>
          <p>This statement summarizes student-managed financial records for educational tracking purposes.</p>
        </div>
      </div>
    </div>
  );
};
