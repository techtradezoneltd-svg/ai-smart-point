import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency as formatCurrencyUtil, getCurrencySymbol } from "@/lib/currency";

export const useCurrency = () => {
  const { settings } = useSettings();
  
  const currentCurrency = settings?.company.currency || 'USD';
  
  const formatCurrency = (amount: number) => {
    return formatCurrencyUtil(amount, currentCurrency);
  };
  
  const currencySymbol = getCurrencySymbol(currentCurrency);
  
  return {
    formatCurrency,
    currencySymbol,
    currentCurrency,
  };
};