import { SupportedChain, ChainConfig } from '../types/crypto';

export const SUPPORTED_CHAINS: Record<SupportedChain, ChainConfig> = {
  solana: {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    nativeToken: 'SOL',
    iconBg: '#9945FF',
    explorerName: 'Solscan',
    explorerUrl: 'https://solscan.io',
    addressRegex: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    geckoTerminalId: 'solana',
    goPlusChainId: 'solana',
  },
  base: {
    id: 'base',
    name: 'Base',
    symbol: 'BASE',
    nativeToken: 'ETH',
    iconBg: '#0052FF',
    explorerName: 'BaseScan',
    explorerUrl: 'https://basescan.org',
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
    geckoTerminalId: 'base',
    goPlusChainId: '8453',
  },
  bsc: {
    id: 'bsc',
    name: 'BNB Chain',
    symbol: 'BSC',
    nativeToken: 'BNB',
    iconBg: '#F0B90B',
    explorerName: 'BscScan',
    explorerUrl: 'https://bscscan.com',
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
    geckoTerminalId: 'bsc',
    goPlusChainId: '56',
  },
};

export function isSupportedChain(chain: string): chain is SupportedChain {
  return chain === 'solana' || chain === 'base' || chain === 'bsc';
}

export function validateAddress(address: string, chain?: SupportedChain): boolean {
  if (!address || typeof address !== 'string') return false;
  const trimmed = address.trim();

  if (chain) {
    const config = SUPPORTED_CHAINS[chain];
    return config ? config.addressRegex.test(trimmed) : false;
  }

  // Check if matches either Solana base58 or EVM 0x
  return (
    SUPPORTED_CHAINS.solana.addressRegex.test(trimmed) ||
    SUPPORTED_CHAINS.base.addressRegex.test(trimmed)
  );
}

export function detectChainFromAddress(address: string): SupportedChain | null {
  const trimmed = address.trim();
  if (SUPPORTED_CHAINS.solana.addressRegex.test(trimmed)) {
    return 'solana';
  }
  if (SUPPORTED_CHAINS.base.addressRegex.test(trimmed)) {
    // Both Base and BSC use EVM format, default to base unless specified
    return 'base';
  }
  return null;
}

export function getExplorerAddressUrl(chain: SupportedChain, address: string): string {
  const config = SUPPORTED_CHAINS[chain];
  if (!config) return '#';
  if (chain === 'solana') {
    return `${config.explorerUrl}/token/${encodeURIComponent(address)}`;
  }
  return `${config.explorerUrl}/token/${encodeURIComponent(address)}`;
}

export function getExplorerPairUrl(chain: SupportedChain, pairAddress: string): string {
  const config = SUPPORTED_CHAINS[chain];
  if (!config) return '#';
  if (chain === 'solana') {
    return `${config.explorerUrl}/account/${encodeURIComponent(pairAddress)}`;
  }
  return `${config.explorerUrl}/address/${encodeURIComponent(pairAddress)}`;
}

export function getDexScreenerPairUrl(chain: SupportedChain, pairAddress: string): string {
  return `https://dexscreener.com/${chain}/${encodeURIComponent(pairAddress)}`;
}
