/**
 * Centralized Currency & Number Formatting for DistriFlow ERP
 * Default currency representation: Nepalese Rupee (Rs.)
 */

export const CURRENCY_SYMBOL = 'Rs.';

/**
 * Formats a monetary amount into the standard ERP currency format: Rs. 1,500.00
 */
export const formatCurrency = (amount: number | string | undefined | null): string => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount || '0') || 0;
  return `Rs. ${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Formats a monetary amount into a compact or integer currency format: Rs. 1,500
 */
export const formatCurrencyCompact = (amount: number | string | undefined | null): string => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount || '0') || 0;
  return `Rs. ${num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};
