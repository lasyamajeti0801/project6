/**
 * StockPilot Indian Business Formatting Utilities
 */

export function formatINR(amount: number | string | null | undefined, includeDecimals = true): string {
  if (amount === null || amount === undefined || amount === '') {
    return '₹0.00';
  }
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(val)) return '₹0.00';

  const isNegative = val < 0;
  const absVal = Math.abs(val);

  const parts = absVal.toFixed(includeDecimals ? 2 : 0).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  let formatted = '';
  if (integerPart.length <= 3) {
    formatted = integerPart;
  } else {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    // Group in pairs of 2 from right to left
    const grouped = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formatted = `${grouped},${lastThree}`;
  }

  const sign = isNegative ? '-' : '';
  return includeDecimals ? `₹${sign}${formatted}.${decimalPart}` : `₹${sign}${formatted}`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return dateStr;
  }
}
