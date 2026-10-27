import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatUsdPrice,
  formatCurrencyCompact,
  formatCount,
  formatPercentChange,
  truncateAddress,
} from './formatters';

test('formatUsdPrice handles valid numbers and edge cases', () => {
  assert.equal(formatUsdPrice(null), 'N/A');
  assert.equal(formatUsdPrice(undefined), 'N/A');
  assert.equal(formatUsdPrice(''), 'N/A');
  assert.equal(formatUsdPrice(0), '$0.00');
  assert.equal(formatUsdPrice(1234.56), '$1,234.56');
  assert.equal(formatUsdPrice('12.3456'), '$12.3456');
  assert.equal(formatUsdPrice(0.000045), '$0.000045');
});

test('formatCurrencyCompact handles compact scale suffixes and signs', () => {
  assert.equal(formatCurrencyCompact(null), 'N/A');
  assert.equal(formatCurrencyCompact(0), '$0.00');
  assert.equal(formatCurrencyCompact(1500), '$1.5K');
  assert.equal(formatCurrencyCompact(2500000), '$2.50M');
  assert.equal(formatCurrencyCompact(1400000000), '$1.40B');
  assert.equal(formatCurrencyCompact(42.5), '$42.50');
});

test('formatCount formats counts accurately', () => {
  assert.equal(formatCount(null), 'N/A');
  assert.equal(formatCount(0), '0');
  assert.equal(formatCount(500), '500');
  assert.equal(formatCount(12500), '12.5K');
  assert.equal(formatCount(1500000), '1.50M');
});

test('formatPercentChange formats directional percentages', () => {
  const pos = formatPercentChange(5.234);
  assert.equal(pos.text, '+5.23%');
  assert.equal(pos.isPositive, true);

  const neg = formatPercentChange(-12.45);
  assert.equal(neg.text, '-12.45%');
  assert.equal(neg.isNegative, true);

  const zero = formatPercentChange(0);
  assert.equal(zero.text, '0.00%');
  assert.equal(zero.isNeutral, true);

  const na = formatPercentChange(null);
  assert.equal(na.text, 'N/A');
  assert.equal(na.isNeutral, true);
});

test('truncateAddress truncates addresses safely', () => {
  assert.equal(truncateAddress(null), 'N/A');
  assert.equal(truncateAddress('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'), '0x8335...2913');
  assert.equal(truncateAddress('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'), 'DezXAZ...B263');
  assert.equal(truncateAddress('short'), 'short');
});
