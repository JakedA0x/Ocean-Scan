import React from 'react';

interface Props {
  title: string;
  value: string;
  subtext?: string;
  icon?: React.ReactNode;
  badge?: string;
  className?: string;
}

export const StatCard: React.FC<Props> = ({
  title,
  value,
  subtext,
  icon,
  badge,
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-[#DCE8F0] p-5 shadow-xs transition-shadow hover:shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#71869A]">
          {title}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-[#E8F3FA] flex items-center justify-center text-[#78AFCB]">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold tracking-tight text-[#243B53] tabular-nums">
          {value}
        </div>
        {badge && (
          <span className="text-xs font-medium text-[#78AFCB] bg-[#F2F8FC] px-2 py-0.5 rounded border border-[#DCE8F0]">
            {badge}
          </span>
        )}
      </div>
      {subtext && (
        <div className="mt-1.5 text-xs text-[#71869A] leading-relaxed">
          {subtext}
        </div>
      )}
    </div>
  );
};
