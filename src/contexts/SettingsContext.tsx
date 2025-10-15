import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrencySymbol } from '@/lib/currency';
import { toast } from 'sonner';

export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  currency: string;
  timezone: string;
}

export interface SystemSettings {
  autoBackup: boolean;
  lowStockAlert: boolean;
  lowStockThreshold: number;
  enableBarcode: boolean;
  enableCustomerDisplay: boolean;
  defaultPaymentMethod: string;
  enableDiscounts: boolean;
  maxDiscountPercent: number;
}

export interface ReceiptSettings {
  header: string;
  footer: string;
  showLogo: boolean;
  showTaxBreakdown: boolean;
  printCustomerCopy: boolean;
  enableEmail: boolean;
  primaryLogo: string | null;
  secondaryLogo: string | null;
  primaryLogoSize: number;
  secondaryLogoSize: number;
  logoPosition: string;
  secondaryLogoPosition: string;
  receiptWidth: number;
  fontSize: number;
  fontFamily: string;
  paperType: string;
  showDateTime: boolean;
  showOrderNumber: boolean;
  showCashierName: boolean;
  showQRCode: boolean;
  qrCodeData: string;
  showItemCodes: boolean;
  showItemDescription: boolean;
  showUnitPrice: boolean;
  showSubtotal: boolean;
  showDiscounts: boolean;
  currencySymbol: string;
  customFooterText: string;
  showSocialMedia: boolean;
  website: string;
  facebook: string;
  instagram: string;
  twitter: string;
  backgroundColor: string;
  textColor: string;
  headerColor: string;
  borderColor: string;
}

export interface NotificationSettings {
  lowStock: boolean;
  dailySales: boolean;
  systemUpdates: boolean;
  email: boolean;
  sound: boolean;
}

export interface AppearanceSettings {
  theme: string;
  primaryColor: string;
  compactMode: boolean;
  showAnimations: boolean;
}

export interface IntegrationSettings {
  whatsappApiToken: string;
  whatsappPhoneNumberId: string;
}

export interface AllSettings {
  company: CompanySettings;
  system: SystemSettings;
  receipt: ReceiptSettings;
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
  integrations: IntegrationSettings;
}

interface SettingsContextType {
  settings: AllSettings | null;
  loading: boolean;
  updateCompanySettings: (settings: CompanySettings) => Promise<void>;
  updateSystemSettings: (settings: SystemSettings) => Promise<void>;
  updateReceiptSettings: (settings: ReceiptSettings) => Promise<void>;
  updateNotificationSettings: (settings: NotificationSettings) => Promise<void>;
  updateAppearanceSettings: (settings: AppearanceSettings) => Promise<void>;
  updateIntegrationSettings: (settings: IntegrationSettings) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AllSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('key, value');

      if (error) {
        console.error('Error loading settings:', error);
        toast.error('Failed to load settings');
        return;
      }

      if (data) {
        const settingsMap = data.reduce((acc, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {} as Record<string, any>);

        const companySettings = settingsMap.company_info || {
          name: '',
          address: '',
          phone: '',
          email: '',
          taxId: '',
          currency: 'USD',
          timezone: 'UTC'
        };

        setSettings({
          company: companySettings,
          system: settingsMap.system_config || {
            autoBackup: true,
            lowStockAlert: true,
            lowStockThreshold: 10,
            enableBarcode: false,
            enableCustomerDisplay: false,
            defaultPaymentMethod: 'cash',
            enableDiscounts: true,
            maxDiscountPercent: 20
          },
          receipt: settingsMap.receipt_config || {
            header: 'Thank you for your business!',
            footer: 'Visit us again!',
            showLogo: true,
            showTaxBreakdown: true,
            printCustomerCopy: true,
            enableEmail: false,
            primaryLogo: null,
            secondaryLogo: null,
            primaryLogoSize: 100,
            secondaryLogoSize: 60,
            logoPosition: 'center',
            secondaryLogoPosition: 'bottom-center',
            receiptWidth: 80,
            fontSize: 12,
            fontFamily: 'monospace',
            paperType: 'thermal',
            showDateTime: true,
            showOrderNumber: true,
            showCashierName: true,
            showQRCode: false,
            qrCodeData: '',
            showItemCodes: true,
            showItemDescription: true,
            showUnitPrice: true,
            showSubtotal: true,
            showDiscounts: true,
            currencySymbol: getCurrencySymbol(companySettings.currency),
            customFooterText: '',
            showSocialMedia: false,
            website: '',
            facebook: '',
            instagram: '',
            twitter: '',
            backgroundColor: '#ffffff',
            textColor: '#000000',
            headerColor: '#333333',
            borderColor: '#cccccc'
          },
          notifications: settingsMap.notifications || {
            lowStock: true,
            dailySales: true,
            systemUpdates: true,
            email: false,
            sound: true
          },
          appearance: settingsMap.appearance || {
            theme: 'dark',
            primaryColor: 'default',
            compactMode: false,
            showAnimations: true
          },
          integrations: settingsMap.integrations || {
            whatsappApiToken: '',
            whatsappPhoneNumberId: ''
          }
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      // First try to update existing setting
      const { error: updateError } = await supabase
        .from('settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);

      // If update fails, try to insert
      if (updateError) {
        const { error: insertError } = await supabase
          .from('settings')
          .insert({ 
            key, 
            value, 
            category: key.includes('company') ? 'company' : 
                     key.includes('system') ? 'system' : 
                     key.includes('receipt') ? 'receipt' : 
                     key.includes('notification') ? 'notifications' : 'general'
          });

        if (insertError) {
          console.error('Error inserting setting:', insertError);
          toast.error(`Failed to save ${key} settings`);
          throw insertError;
        }
      }

      await loadSettings(); // Refresh settings after update
      toast.success('Settings updated successfully!');
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  };

  const updateCompanySettings = async (companySettings: CompanySettings) => {
    await updateSetting('company_info', companySettings);
  };

  const updateSystemSettings = async (systemSettings: SystemSettings) => {
    await updateSetting('system_config', systemSettings);
  };

  const updateReceiptSettings = async (receiptSettings: ReceiptSettings) => {
    await updateSetting('receipt_config', receiptSettings);
  };

  const updateNotificationSettings = async (notificationSettings: NotificationSettings) => {
    await updateSetting('notifications', notificationSettings);
  };

  const updateAppearanceSettings = async (appearanceSettings: AppearanceSettings) => {
    await updateSetting('appearance', appearanceSettings);
  };

  const updateIntegrationSettings = async (integrationSettings: IntegrationSettings) => {
    await updateSetting('integrations', integrationSettings);
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  useEffect(() => {
    loadSettings();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'settings'
        },
        () => {
          loadSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const value: SettingsContextType = {
    settings,
    loading,
    updateCompanySettings,
    updateSystemSettings,
    updateReceiptSettings,
    updateNotificationSettings,
    updateAppearanceSettings,
    updateIntegrationSettings,
    refreshSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};