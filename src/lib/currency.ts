// Comprehensive currency formatting utility
export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  symbolPosition: 'before' | 'after';
  decimalPlaces: number;
}

export const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', symbolPosition: 'before', decimalPlaces: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE', symbolPosition: 'before', decimalPlaces: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB', symbolPosition: 'before', decimalPlaces: 2 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA', symbolPosition: 'before', decimalPlaces: 2 },
  RWF: { code: 'RWF', symbol: 'FRw', name: 'Rwandan Franc', locale: 'rw', symbolPosition: 'after', decimalPlaces: 0 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', symbolPosition: 'before', decimalPlaces: 0 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', symbolPosition: 'before', decimalPlaces: 2 },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH', symbolPosition: 'before', decimalPlaces: 2 },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN', symbolPosition: 'before', decimalPlaces: 2 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', symbolPosition: 'before', decimalPlaces: 2 },
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', locale: 'en-NG', symbolPosition: 'before', decimalPlaces: 2 },
  KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', locale: 'en-KE', symbolPosition: 'before', decimalPlaces: 2 },
  UGX: { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', locale: 'en-UG', symbolPosition: 'before', decimalPlaces: 0 },
  TZS: { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', locale: 'en-TZ', symbolPosition: 'before', decimalPlaces: 0 },
};

export const formatCurrency = (amount: number, currencyCode: string = 'USD'): string => {
  const config = CURRENCY_CONFIGS[currencyCode] || CURRENCY_CONFIGS.USD;
  
  try {
    // Use Intl.NumberFormat for proper localization
    const formatter = new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: config.decimalPlaces,
      maximumFractionDigits: config.decimalPlaces,
    });
    
    const formattedNumber = formatter.format(amount);
    
    // Position symbol correctly
    if (config.symbolPosition === 'before') {
      return `${config.symbol}${formattedNumber}`;
    } else {
      return `${formattedNumber} ${config.symbol}`;
    }
  } catch (error) {
    // Fallback for unsupported locales
    const formattedNumber = amount.toLocaleString('en-US', {
      minimumFractionDigits: config.decimalPlaces,
      maximumFractionDigits: config.decimalPlaces,
    });
    
    if (config.symbolPosition === 'before') {
      return `${config.symbol}${formattedNumber}`;
    } else {
      return `${formattedNumber} ${config.symbol}`;
    }
  }
};

export const getCurrencySymbol = (currencyCode: string = 'USD'): string => {
  return CURRENCY_CONFIGS[currencyCode]?.symbol || '$';
};

export const getCurrencyName = (currencyCode: string = 'USD'): string => {
  return CURRENCY_CONFIGS[currencyCode]?.name || 'US Dollar';
};

export const getAllCurrencies = (): CurrencyConfig[] => {
  return Object.values(CURRENCY_CONFIGS);
};