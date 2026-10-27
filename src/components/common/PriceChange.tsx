import React from 'react';
import { formatPercentChange } from '../../utils/formatters';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  value: number | null | undefined;
  className?: string;
  showIcon?: boolean;
}

export const PriceChange: React.FC<Props> = ({ value, className = '', showIcon = true }) => {
  const { text, isPositive, isNegative, isNeutral } = formatPercentChange(value);

  let textColor = 'text-[#71869A]';
  if (isPositive) textColor = 'text-[#69B99A]';
  if (isNegative) textColor = 'text-[#D98282]';

  return (
    <span className={`inline-flex items-center gap-1 font-semibold text-xs tabular-nums ${textColor} ${className}`}>
      {showIcon && (
        <>
          {isPositive && <TrendingUp className="w-3.5 h-3.5 shrink-0" />}
          {isNegative && <TrendingDown className="w-3.5 h-3.5 shrink-0" />}
          {isNeutral && <Minus className="w-3.5 h-3.5 shrink-0 opacity-40" />}
        </>
      )}
      <span>{text}</span>
    </span>
  );
};
