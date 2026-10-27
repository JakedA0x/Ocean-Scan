import {
  SupportedChain,
  HolderAnalyticsData,
  SecurityRiskAnalysis,
  RiskIndicator,
  TokenPair,
} from '../types/crypto';
import { apiCache } from './apiCache';

const GOPLUS_BASE = 'https://api.gopluslabs.io/api/v1';

export async function fetchTokenSecurityAndHolders(
  chainId: SupportedChain,
  tokenAddress: string,
  pair?: TokenPair
): Promise<{
  holders: HolderAnalyticsData;
  security: SecurityRiskAnalysis;
}> {
  const cacheKey = `security_holders:${chainId}:${tokenAddress.toLowerCase()}`;

  return apiCache.fetchWithCache(
    cacheKey,
    async () => {
      let endpoint = '';
      if (chainId === 'solana') {
        endpoint = `${GOPLUS_BASE}/solana/token_security?contract_addresses=${tokenAddress}`;
      } else if (chainId === 'base') {
        endpoint = `${GOPLUS_BASE}/token_security/8453?contract_addresses=${tokenAddress}`;
      } else if (chainId === 'bsc') {
        endpoint = `${GOPLUS_BASE}/token_security/56?contract_addresses=${tokenAddress}`;
      }

      try {
        const res = await fetch(endpoint);
        if (!res.ok) {
          throw new Error(`GoPlus API response status ${res.status}`);
        }
        const data = await res.json();
        const addressKey = tokenAddress.toLowerCase();
        const rawResult =
          data.result?.[tokenAddress] ||
          data.result?.[addressKey] ||
          Object.values(data.result || {})[0];

        if (!rawResult) {
          return createUnavailableResult(chainId, tokenAddress, 'Token security and holder records not found on indexer.');
        }

        if (chainId === 'solana') {
          return parseSolanaSecurity(tokenAddress, rawResult, pair);
        } else {
          return parseEvmSecurity(chainId, tokenAddress, rawResult, pair);
        }
      } catch (err) {
        return createUnavailableResult(
          chainId,
          tokenAddress,
          err instanceof Error ? err.message : 'Security service unavailable.'
        );
      }
    },
    120_000 // 2 minutes TTL
  );
}

function parseSolanaSecurity(
  tokenAddress: string,
  raw: any,
  pair?: TokenPair
): { holders: HolderAnalyticsData; security: SecurityRiskAnalysis } {
  const holderCountNum = raw.holder_count ? parseInt(raw.holder_count, 10) : null;
  const rawHolders: any[] = Array.isArray(raw.holders) ? raw.holders : [];

  const topHolders = rawHolders.slice(0, 10).map((h) => ({
    address: h.account || h.token_account || 'Unknown Account',
    tokenAccount: h.token_account,
    balance: h.balance?.toString() || '0',
    percent: parseFloat(h.percent || '0') * 100, // normalize to percentage (e.g. 5.2)
    isLocked: h.is_locked === 1,
    tag: h.tag || (h.is_locked === 1 ? 'Locked' : undefined),
  }));

  const top10Concentration = topHolders.reduce((acc, h) => acc + (isNaN(h.percent) ? 0 : h.percent), 0);

  const holders: HolderAnalyticsData = {
    tokenAddress,
    chainId: 'solana',
    holderCount: isNaN(holderCountNum as number) ? null : holderCountNum,
    metricType: 'unique_wallets',
    providerName: 'GoPlus Solana Indexer',
    timestamp: Date.now(),
    isCirculatingSupplyVerified: true,
    topHolders,
    concentrationTop10Percent: top10Concentration > 0 ? top10Concentration : null,
    note: 'GoPlus indexes unique wallet owner accounts on Solana (distinguished from individual SPL token accounts). Known system and pool accounts are highlighted.',
  };

  // Evaluate risk indicators
  const indicators: RiskIndicator[] = [];

  // Mint authority
  const isMintable = raw.mintable?.status === '1' || (Array.isArray(raw.mintable?.authority) && raw.mintable.authority.length > 0);
  indicators.push({
    id: 'sol_mint_auth',
    title: 'Mint Authority Status',
    description: isMintable ? 'Mint authority is still active (creator can inflate token supply)' : 'Mint authority has been revoked',
    severity: isMintable ? 'warning' : 'info',
    triggered: isMintable,
    details: isMintable ? `Active authorities: ${raw.mintable?.authority?.join(', ') || 'Enabled'}` : 'Revoked (Immutable supply)',
  });

  // Freeze authority
  const isFreezable = raw.freezable?.status === '1' || (Array.isArray(raw.freezable?.authority) && raw.freezable.authority.length > 0);
  indicators.push({
    id: 'sol_freeze_auth',
    title: 'Freeze Authority Status',
    description: isFreezable ? 'Freeze authority is active (creator can freeze token transfers)' : 'Freeze authority is disabled/revoked',
    severity: isFreezable ? 'danger' : 'info',
    triggered: isFreezable,
    details: isFreezable ? 'Tokens can potentially be frozen in holder wallets' : 'Revoked / Disabled',
  });

  // Top 10 concentration
  const highConcentration = top10Concentration > 70;
  indicators.push({
    id: 'concentration',
    title: 'Top 10 Holder Concentration',
    description: highConcentration
      ? `Top 10 holders control ${top10Concentration.toFixed(1)}% of total supply`
      : `Top 10 holders control ${top10Concentration.toFixed(1)}% of supply`,
    severity: highConcentration ? 'warning' : 'info',
    triggered: highConcentration,
  });

  // Liquidity checks
  const liqUsd = pair?.liquidity?.usd ?? null;
  const vol24h = pair?.volume?.h24 ?? null;
  const lowLiquidity = liqUsd !== null && liqUsd < 5000;
  indicators.push({
    id: 'low_liquidity',
    title: 'DEX Pool Liquidity Depth',
    description: lowLiquidity
      ? `Low liquidity ($${liqUsd?.toLocaleString() || '0'}). Higher slippage and rug pull vulnerability.`
      : `Healthy pool liquidity ($${liqUsd?.toLocaleString() || 'N/A'}).`,
    severity: lowLiquidity ? 'warning' : 'info',
    triggered: lowLiquidity,
  });

  // Volume to liquidity ratio check
  let volToLiqRatio: number | null = null;
  if (liqUsd && vol24h && liqUsd > 0) {
    volToLiqRatio = vol24h / liqUsd;
    const unusualRatio = volToLiqRatio > 25;
    indicators.push({
      id: 'vol_to_liq',
      title: '24h Volume to Liquidity Ratio',
      description: unusualRatio
        ? `Extremely high volume/liquidity ratio (${volToLiqRatio.toFixed(1)}x), indicative of rapid churn or manipulation.`
        : `Volume to liquidity ratio is ${volToLiqRatio.toFixed(1)}x.`,
      severity: unusualRatio ? 'warning' : 'info',
      triggered: unusualRatio,
    });
  }

  // Determine status
  const hasDanger = indicators.some((i) => i.severity === 'danger' && i.triggered);
  const hasWarning = indicators.some((i) => i.severity === 'warning' && i.triggered);

  let status: SecurityRiskAnalysis['status'] = 'No Listed Warning Indicators';
  if (hasDanger) {
    status = 'Elevated Risk Indicators';
  } else if (hasWarning) {
    status = 'Warning';
  }

  const security: SecurityRiskAnalysis = {
    tokenAddress,
    chainId: 'solana',
    status,
    overallScore: hasDanger ? 35 : hasWarning ? 65 : 92,
    indicators,
    mintAuthorityRevoked: !isMintable,
    freezeAuthorityRevoked: !isFreezable,
    isContractVerified: null, // N/A for Solana SPL tokens
    isHoneypot: null,
    buyTaxPercent: null,
    sellTaxPercent: null,
    top10ConcentrationPercent: top10Concentration > 0 ? top10Concentration : null,
    liquidityUsd: liqUsd,
    volumeToLiquidityRatio: volToLiqRatio,
    provider: 'GoPlus Security Engine',
    timestamp: Date.now(),
    limitationsNote:
      'Solana token risk heuristics inspect SPL mint authority, freeze authority, and top holder distribution. Automated analysis cannot guarantee immunity from market volatility or developer liquidation.',
  };

  return { holders, security };
}

function parseEvmSecurity(
  chainId: SupportedChain,
  tokenAddress: string,
  raw: any,
  pair?: TokenPair
): { holders: HolderAnalyticsData; security: SecurityRiskAnalysis } {
  const holderCountNum = raw.holder_count ? parseInt(raw.holder_count, 10) : null;
  const rawHolders: any[] = Array.isArray(raw.holders) ? raw.holders : [];

  const topHolders = rawHolders.slice(0, 10).map((h) => ({
    address: h.address || '0x0',
    balance: h.balance?.toString() || '0',
    percent: parseFloat(h.percent || '0') * 100,
    isContract: h.is_contract === 1,
    isLocked: h.is_locked === 1,
    tag: h.tag || (h.is_contract === 1 ? 'Smart Contract / Pool' : undefined),
  }));

  const top10Concentration = topHolders.reduce((acc, h) => acc + (isNaN(h.percent) ? 0 : h.percent), 0);

  const holders: HolderAnalyticsData = {
    tokenAddress,
    chainId,
    holderCount: isNaN(holderCountNum as number) ? null : holderCountNum,
    metricType: 'indexed_holders',
    providerName: `GoPlus ${chainId.toUpperCase()} Indexer`,
    timestamp: Date.now(),
    isCirculatingSupplyVerified: raw.is_open_source === '1',
    topHolders,
    concentrationTop10Percent: top10Concentration > 0 ? top10Concentration : null,
    note: `Indexed token holder count on ${chainId.toUpperCase()} network. Contracts, pairs, and individual addresses are marked.`,
  };

  const indicators: RiskIndicator[] = [];

  // Honeypot check
  const isHoneypot = raw.is_honeypot === '1';
  indicators.push({
    id: 'is_honeypot',
    title: 'Honeypot Simulator',
    description: isHoneypot ? 'Simulation detected selling restrictions (Honeypot!)' : 'No sell restrictions detected in simulated transaction',
    severity: isHoneypot ? 'danger' : 'info',
    triggered: isHoneypot,
  });

  // Open source / Contract verification
  const isOpenSource = raw.is_open_source === '1';
  indicators.push({
    id: 'is_open_source',
    title: 'Contract Source Verification',
    description: isOpenSource ? 'Contract source code is verified on the blockchain explorer' : 'Contract source code is unverified (Note: unverified does not automatically mean malicious)',
    severity: isOpenSource ? 'info' : 'warning',
    triggered: !isOpenSource,
  });

  // Buy & Sell Tax
  const buyTax = parseFloat(raw.buy_tax || '0') * 100;
  const sellTax = parseFloat(raw.sell_tax || '0') * 100;
  const highTax = buyTax > 10 || sellTax > 10;
  indicators.push({
    id: 'trading_taxes',
    title: 'Trading Taxes',
    description: `Buy Tax: ${buyTax.toFixed(1)}% | Sell Tax: ${sellTax.toFixed(1)}%`,
    severity: highTax ? 'warning' : 'info',
    triggered: highTax,
    details: highTax ? 'Tax rates above 10% reduce trader net proceeds.' : 'Standard or zero tax rate.',
  });

  // Proxy / Mintable
  const isMintable = raw.is_mintable === '1';
  indicators.push({
    id: 'is_mintable',
    title: 'Mint Function Presence',
    description: isMintable ? 'Smart contract contains a callable mint function' : 'No arbitrary mint function detected',
    severity: isMintable ? 'warning' : 'info',
    triggered: isMintable,
  });

  // Concentration
  const highConcentration = top10Concentration > 70;
  indicators.push({
    id: 'concentration',
    title: 'Top 10 Holder Concentration',
    description: `Top 10 addresses hold ${top10Concentration.toFixed(1)}% of total supply`,
    severity: highConcentration ? 'warning' : 'info',
    triggered: highConcentration,
  });

  // Liquidity
  const liqUsd = pair?.liquidity?.usd ?? null;
  const lowLiquidity = liqUsd !== null && liqUsd < 5000;
  indicators.push({
    id: 'low_liquidity',
    title: 'DEX Pool Liquidity Depth',
    description: lowLiquidity
      ? `Low liquidity ($${liqUsd?.toLocaleString() || '0'}). Higher slippage risk.`
      : `Adequate liquidity ($${liqUsd?.toLocaleString() || 'N/A'}).`,
    severity: lowLiquidity ? 'warning' : 'info',
    triggered: lowLiquidity,
  });

  let volToLiqRatio: number | null = null;
  const vol24h = pair?.volume?.h24 ?? null;
  if (liqUsd && vol24h && liqUsd > 0) {
    volToLiqRatio = vol24h / liqUsd;
    const unusualRatio = volToLiqRatio > 25;
    indicators.push({
      id: 'vol_to_liq',
      title: '24h Volume to Liquidity Ratio',
      description: unusualRatio
        ? `Extremely high volume relative to liquidity (${volToLiqRatio.toFixed(1)}x)`
        : `Volume to liquidity ratio is ${volToLiqRatio.toFixed(1)}x`,
      severity: unusualRatio ? 'warning' : 'info',
      triggered: unusualRatio,
    });
  }

  const hasDanger = indicators.some((i) => i.severity === 'danger' && i.triggered);
  const hasWarning = indicators.some((i) => i.severity === 'warning' && i.triggered);

  let status: SecurityRiskAnalysis['status'] = 'No Listed Warning Indicators';
  if (hasDanger) {
    status = 'Elevated Risk Indicators';
  } else if (hasWarning) {
    status = 'Warning';
  }

  const security: SecurityRiskAnalysis = {
    tokenAddress,
    chainId,
    status,
    overallScore: hasDanger ? 25 : hasWarning ? 60 : 90,
    indicators,
    mintAuthorityRevoked: !isMintable,
    freezeAuthorityRevoked: null,
    isContractVerified: isOpenSource,
    isHoneypot,
    buyTaxPercent: buyTax,
    sellTaxPercent: sellTax,
    top10ConcentrationPercent: top10Concentration > 0 ? top10Concentration : null,
    liquidityUsd: liqUsd,
    volumeToLiquidityRatio: volToLiqRatio,
    provider: 'GoPlus Security Engine',
    timestamp: Date.now(),
    limitationsNote:
      'Contract inspection is automated via GoPlus. An unverified contract or warning indicator is not an audit; always exercise discretion.',
  };

  return { holders, security };
}

function createUnavailableResult(
  chainId: SupportedChain,
  tokenAddress: string,
  message: string
): { holders: HolderAnalyticsData; security: SecurityRiskAnalysis } {
  return {
    holders: {
      tokenAddress,
      chainId,
      holderCount: null,
      metricType: 'unavailable',
      providerName: 'Unavailable',
      timestamp: Date.now(),
      isCirculatingSupplyVerified: false,
      topHolders: [],
      concentrationTop10Percent: null,
      note: `Holder data unavailable for this token on ${chainId.toUpperCase()}. Reason: ${message}`,
    },
    security: {
      tokenAddress,
      chainId,
      status: 'Insufficient Data',
      overallScore: 0,
      indicators: [
        {
          id: 'unavailable',
          title: 'Security Data Unavailable',
          description: message,
          severity: 'info',
          triggered: false,
        },
      ],
      mintAuthorityRevoked: null,
      freezeAuthorityRevoked: null,
      isContractVerified: null,
      isHoneypot: null,
      buyTaxPercent: null,
      sellTaxPercent: null,
      top10ConcentrationPercent: null,
      liquidityUsd: null,
      volumeToLiquidityRatio: null,
      provider: 'N/A',
      timestamp: Date.now(),
      limitationsNote: 'No verified security provider response was available for this token address.',
    },
  };
}
