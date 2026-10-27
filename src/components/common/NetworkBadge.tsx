import React from 'react';
import { SupportedChain } from '../../types/crypto';
import { SUPPORTED_CHAINS } from '../../utils/chains';

interface Props {
  chain: SupportedChain;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export const NetworkBadge: React.FC<Props> = ({ chain, size = 'sm', showName = true }) => {
  const config = SUPPORTED_CHAINS[chain];
  if (!config) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3 py-1.5 gap-2.5',
  };

  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border border-[#DCE8F0] bg-white text-[#243B53] shadow-xs ${sizeClasses[size]}`}
      title={`${config.name} (${config.symbol}) Network`}
    >
      <span
        className={`rounded-full shrink-0 ${dotSize[size]}`}
        style={{ backgroundColor: config.iconBg }}
      />
      {showName && <span>{config.name}</span>}
    </span>
  );
};
