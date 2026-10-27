import React, { useState } from 'react';
import { SupportedChain } from '../../types/crypto';
import { truncateAddress } from '../../utils/formatters';
import { getExplorerAddressUrl, SUPPORTED_CHAINS } from '../../utils/chains';
import { Copy, Check, ExternalLink } from 'lucide-react';

interface Props {
  address: string;
  chain: SupportedChain;
  chars?: number;
  showExplorerLink?: boolean;
  className?: string;
}

export const AddressDisplay: React.FC<Props> = ({
  address,
  chain,
  chars = 4,
  showExplorerLink = true,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const explorerUrl = getExplorerAddressUrl(chain, address);
  const explorerName = SUPPORTED_CHAINS[chain]?.explorerName || 'Explorer';

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs text-[#71869A] ${className}`}>
      <span className="font-mono">{truncateAddress(address, chars)}</span>
      <button
        onClick={handleCopy}
        type="button"
        className="p-1 hover:text-[#243B53] hover:bg-[#E8F3FA] rounded transition-colors"
        title={copied ? 'Copied!' : 'Copy Address'}
        aria-label={`Copy address ${address}`}
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-[#69B99A]" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
      {showExplorerLink && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-1 hover:text-[#78AFCB] hover:bg-[#E8F3FA] rounded transition-colors"
          title={`View on ${explorerName}`}
          aria-label={`View on ${explorerName}`}
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
};
