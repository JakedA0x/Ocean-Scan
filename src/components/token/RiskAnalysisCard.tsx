import React from 'react';
import { SecurityRiskAnalysis, SupportedChain } from '../../types/crypto';
import { formatDateTime } from '../../utils/formatters';
import { ShieldAlert, ShieldCheck, AlertTriangle, HelpCircle, CheckCircle2, XCircle, Info } from 'lucide-react';

interface Props {
  analysis: SecurityRiskAnalysis | null;
  chainId: SupportedChain;
  loading?: boolean;
}

export const RiskAnalysisCard: React.FC<Props> = ({ analysis, chainId, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#DCE8F0] p-5 shadow-xs animate-pulse">
        <div className="h-5 w-44 bg-[#E8F3FA] rounded mb-4" />
        <div className="space-y-3">
          <div className="h-10 bg-[#F2F8FC] rounded-lg" />
          <div className="h-10 bg-[#F2F8FC] rounded-lg" />
          <div className="h-10 bg-[#F2F8FC] rounded-lg" />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-white rounded-xl border border-[#DCE8F0] p-5 shadow-xs text-center text-xs text-[#71869A]">
        Security risk data not loaded.
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (analysis.status) {
      case 'No Listed Warning Indicators':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[#EBF7F2] text-[#34785E] border border-[#BCE4D3]">
            <CheckCircle2 className="w-4 h-4" />
            <span>No Listed Warning Indicators</span>
          </div>
        );
      case 'Warning':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[#FEF6EC] text-[#975A16] border border-[#FBDCAE]">
            <AlertTriangle className="w-4 h-4" />
            <span>Warning (Check details)</span>
          </div>
        );
      case 'Elevated Risk Indicators':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[#FDF0F0] text-[#B83E3E] border border-[#F7C6C6]">
            <ShieldAlert className="w-4 h-4" />
            <span>Elevated Risk Indicators</span>
          </div>
        );
      case 'Insufficient Data':
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[#F2F8FC] text-[#71869A] border border-[#DCE8F0]">
            <HelpCircle className="w-4 h-4" />
            <span>Insufficient Data</span>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#DCE8F0] p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#DCE8F0]">
        <div>
          <h3 className="text-sm font-bold text-[#243B53] flex items-center gap-2">
            <span>Security & Risk Heuristics</span>
            <span className="text-xs font-normal text-[#71869A]">
              ({chainId === 'solana' ? 'Solana SPL Program' : 'EVM Smart Contract'})
            </span>
          </h3>
          <p className="text-xs text-[#71869A] mt-0.5">
            Objective verification from {analysis.provider}. Not an audited financial guarantee.
          </p>
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      {/* Checklist of indicators */}
      <div className="space-y-2.5 mb-4">
        {analysis.indicators.map((ind) => (
          <div
            key={ind.id}
            className={`p-3 rounded-lg border flex items-start gap-3 transition-colors ${
              ind.triggered
                ? ind.severity === 'danger'
                  ? 'bg-[#FDF0F0] border-[#F7C6C6]'
                  : 'bg-[#FEF6EC] border-[#FBDCAE]'
                : 'bg-[#F9FCFE] border-[#E2EEF5]'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {ind.triggered ? (
                ind.severity === 'danger' ? (
                  <XCircle className="w-4 h-4 text-[#D98282]" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-[#D99B26]" />
                )
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#69B99A]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#243B53]">{ind.title}</span>
                <span
                  className={`text-[11px] font-medium ${
                    ind.triggered
                      ? ind.severity === 'danger'
                        ? 'text-[#B83E3E]'
                        : 'text-[#975A16]'
                      : 'text-[#34785E]'
                  }`}
                >
                  {ind.triggered ? (ind.severity === 'danger' ? 'FLAGGED' : 'CAUTION') : 'PASS'}
                </span>
              </div>
              <p className="text-xs text-[#71869A] mt-0.5 leading-relaxed">{ind.description}</p>
              {ind.details && (
                <div className="mt-1 text-[11px] text-[#243B53] font-mono bg-white/70 px-2 py-0.5 rounded border border-black/5 inline-block">
                  {ind.details}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Limitations and methodology note */}
      <div className="p-3 bg-[#E8F3FA] rounded-lg border border-[#DCE8F0] flex items-start gap-2.5 text-xs text-[#243B53]">
        <Info className="w-4 h-4 text-[#78AFCB] shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <strong>Methodology & Limitations:</strong> {analysis.limitationsNote}
          <div className="mt-1 text-[#71869A]">
            Provider: {analysis.provider} • Last inspected: {formatDateTime(analysis.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
};
