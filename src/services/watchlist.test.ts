import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePriceAlerts } from './watchlist';
import { PriceAlert } from '../types/crypto';

test('evaluatePriceAlerts triggers ABOVE alert only when threshold is crossed', () => {
  const alerts: PriceAlert[] = [
    {
      id: 'a1',
      pairAddress: '0xabc',
      tokenAddress: '0x123',
      symbol: 'PEPE',
      name: 'Pepe',
      chainId: 'base',
      condition: 'ABOVE',
      targetPriceUsd: 1.5,
      initialPriceUsd: 1.0,
      triggered: false,
      createdAt: 1000,
      isActive: true,
    },
  ];

  // Price below threshold: no trigger
  const res1 = evaluatePriceAlerts(alerts, { '0xabc': 1.2 });
  assert.equal(res1.newlyTriggered.length, 0);
  assert.equal(res1.updatedAlerts[0].triggered, false);

  // Price reaches or exceeds threshold: triggers once
  const res2 = evaluatePriceAlerts(alerts, { '0xabc': 1.6 });
  assert.equal(res2.newlyTriggered.length, 1);
  assert.equal(res2.updatedAlerts[0].triggered, true);
  assert.equal(res2.updatedAlerts[0].triggeredPrice, 1.6);

  // Still above threshold: does not re-trigger repeatedly
  const res3 = evaluatePriceAlerts(res2.updatedAlerts, { '0xabc': 1.7 });
  assert.equal(res3.newlyTriggered.length, 0);
  assert.equal(res3.updatedAlerts[0].triggered, true);

  // Price falls back below threshold: resets trigger
  const res4 = evaluatePriceAlerts(res3.updatedAlerts, { '0xabc': 1.4 });
  assert.equal(res4.newlyTriggered.length, 0);
  assert.equal(res4.updatedAlerts[0].triggered, false);
});

test('evaluatePriceAlerts triggers BELOW alert correctly', () => {
  const alerts: PriceAlert[] = [
    {
      id: 'b1',
      pairAddress: 'pair_sol_1',
      tokenAddress: 'token_sol_1',
      symbol: 'BONK',
      name: 'Bonk',
      chainId: 'solana',
      condition: 'BELOW',
      targetPriceUsd: 0.00002,
      initialPriceUsd: 0.00003,
      triggered: false,
      createdAt: 1000,
      isActive: true,
    },
  ];

  // Price above threshold: no trigger
  const res1 = evaluatePriceAlerts(alerts, { pair_sol_1: 0.000025 });
  assert.equal(res1.newlyTriggered.length, 0);

  // Price drops below threshold: triggers
  const res2 = evaluatePriceAlerts(alerts, { pair_sol_1: 0.000018 });
  assert.equal(res2.newlyTriggered.length, 1);
  assert.equal(res2.updatedAlerts[0].triggered, true);
});
