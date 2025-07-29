import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useSettings, CompanySettings, SystemSettings, ReceiptSettings } from '@/contexts/SettingsContext';
import {
  Building2,
  Settings as SettingsIcon,
  Users,
  Receipt,
  Bell,
  Palette,
  Download,
  Upload,
  Save,
  RotateCcw,
  ImageIcon,
  Trash2,
  Eye,
  Loader2
} from 'lucide-react';

const Settings = () => {
  const { 
    settings, 
    loading, 
    updateCompanySettings, 
    updateSystemSettings, 
    updateReceiptSettings, 
    updateNotificationSettings, 
    updateAppearanceSettings 
  } = useSettings();

  const [isUpdating, setIsUpdating] = useState(false);

  // Local state for form editing
  const [companyForm, setCompanyForm] = useState<CompanySettings | null>(null);
  const [systemForm, setSystemForm] = useState<SystemSettings | null>(null);
  const [receiptForm, setReceiptForm] = useState<ReceiptSettings | null>(null);

  // Initialize form state when settings load
  React.useEffect(() => {
    if (settings) {
      setCompanyForm(settings.company);
      setSystemForm(settings.system);
      setReceiptForm(settings.receipt);
    }
  }, [settings]);

  const handleSaveCompany = async () => {
    if (!companyForm) return;
    setIsUpdating(true);
    try {
      await updateCompanySettings(companyForm);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveSystem = async () => {
    if (!systemForm) return;
    setIsUpdating(true);
    try {
      await updateSystemSettings(systemForm);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveReceipt = async () => {
    if (!receiptForm) return;
    setIsUpdating(true);
    try {
      await updateReceiptSettings(receiptForm);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogoUpload = (type: 'primary' | 'secondary', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && receiptForm) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPG, PNG, GIF, WebP, SVG)');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setReceiptForm(prev => prev ? {
          ...prev,
          [type === 'primary' ? 'primaryLogo' : 'secondaryLogo']: result
        } : null);
        toast.success(`${type} logo uploaded successfully!`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = (type: 'primary' | 'secondary') => {
    if (receiptForm) {
      setReceiptForm(prev => prev ? {
        ...prev,
        [type === 'primary' ? 'primaryLogo' : 'secondaryLogo']: null
      } : null);
      toast.success(`${type} logo removed`);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings || !companyForm || !systemForm || !receiptForm) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No settings found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <SettingsIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground">Manage all aspects of your POS system</p>
        </div>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto">
          <TabsTrigger value="company" className="flex items-center gap-2 py-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Company</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2 py-2">
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
          <TabsTrigger value="receipt" className="flex items-center gap-2 py-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Receipt</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2 py-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2 py-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Theme</span>
          </TabsTrigger>
        </TabsList>

        {/* Company Settings */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Configure your business details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-id">Tax ID</Label>
                  <Input
                    id="tax-id"
                    value={companyForm.taxId}
                    onChange={(e) => setCompanyForm(prev => prev ? { ...prev, taxId: e.target.value } : null)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm(prev => prev ? { ...prev, address: e.target.value } : null)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm(prev => prev ? { ...prev, phone: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm(prev => prev ? { ...prev, email: e.target.value } : null)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={companyForm.currency} 
                    onValueChange={(value) => setCompanyForm(prev => prev ? { ...prev, currency: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={companyForm.timezone} 
                    onValueChange={(value) => setCompanyForm(prev => prev ? { ...prev, timezone: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">EST - Eastern Time</SelectItem>
                      <SelectItem value="PST">PST - Pacific Time</SelectItem>
                      <SelectItem value="CST">CST - Central Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveCompany} disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                System Configuration
              </CardTitle>
              <CardDescription>
                Configure system behavior and operational settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Low Stock Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when stock is low</p>
                  </div>
                  <Switch
                    checked={systemForm.lowStockAlert}
                    onCheckedChange={(checked) => setSystemForm(prev => prev ? { ...prev, lowStockAlert: checked } : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock-threshold">Low Stock Threshold</Label>
                  <Input
                    id="stock-threshold"
                    type="number"
                    value={systemForm.lowStockThreshold}
                    onChange={(e) => setSystemForm(prev => prev ? { ...prev, lowStockThreshold: parseInt(e.target.value) || 0 } : null)}
                    className="w-32"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Discounts</Label>
                    <p className="text-sm text-muted-foreground">Allow discount application</p>
                  </div>
                  <Switch
                    checked={systemForm.enableDiscounts}
                    onCheckedChange={(checked) => setSystemForm(prev => prev ? { ...prev, enableDiscounts: checked } : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-method">Default Payment Method</Label>
                  <Select 
                    value={systemForm.defaultPaymentMethod} 
                    onValueChange={(value) => setSystemForm(prev => prev ? { ...prev, defaultPaymentMethod: value } : null)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="mobile">Mobile Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveSystem} disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receipt Settings */}
        <TabsContent value="receipt">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Receipt Configuration
              </CardTitle>
              <CardDescription>
                Customize receipt appearance and content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="receipt-header">Receipt Header Text</Label>
                  <Input
                    id="receipt-header"
                    value={receiptForm.header}
                    onChange={(e) => setReceiptForm(prev => prev ? { ...prev, header: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receipt-footer">Receipt Footer Text</Label>
                  <Input
                    id="receipt-footer"
                    value={receiptForm.footer}
                    onChange={(e) => setReceiptForm(prev => prev ? { ...prev, footer: e.target.value } : null)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency-symbol">Currency Symbol</Label>
                <Input
                  id="currency-symbol"
                  value={receiptForm.currencySymbol}
                  onChange={(e) => setReceiptForm(prev => prev ? { ...prev, currencySymbol: e.target.value } : null)}
                  className="w-32"
                  maxLength={3}
                />
              </div>

              {/* Logo Upload Section */}
              <Separator />
              <div className="space-y-4">
                <Label className="text-base font-medium">Logo Management</Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Primary Logo */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Primary Logo</Label>
                      <Badge variant="secondary">Main receipt logo</Badge>
                    </div>
                    
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      {receiptForm.primaryLogo ? (
                        <div className="space-y-2">
                          <img 
                            src={receiptForm.primaryLogo} 
                            alt="Primary Logo" 
                            className="max-h-24 mx-auto object-contain"
                            style={{ width: `${receiptForm.primaryLogoSize}px` }}
                          />
                          <Button size="sm" variant="outline" onClick={() => handleRemoveLogo('primary')}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto" />
                          <p className="text-sm text-muted-foreground">Upload primary logo</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="relative">
                      <Button variant="outline" className="w-full" asChild>
                        <label htmlFor="primary-logo" className="cursor-pointer">
                          <Upload className="h-4 w-4 mr-2" />
                          {receiptForm.primaryLogo ? 'Replace Logo' : 'Upload Logo'}
                        </label>
                      </Button>
                      <input
                        id="primary-logo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLogoUpload('primary', e)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Size: {receiptForm.primaryLogoSize}px</Label>
                      <input
                        type="range"
                        min="50"
                        max="200"
                        value={receiptForm.primaryLogoSize}
                        onChange={(e) => setReceiptForm(prev => prev ? { ...prev, primaryLogoSize: parseInt(e.target.value) } : null)}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Secondary Logo */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Secondary Logo</Label>
                      <Badge variant="outline">Additional branding</Badge>
                    </div>
                    
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      {receiptForm.secondaryLogo ? (
                        <div className="space-y-2">
                          <img 
                            src={receiptForm.secondaryLogo} 
                            alt="Secondary Logo" 
                            className="max-h-16 mx-auto object-contain"
                            style={{ width: `${receiptForm.secondaryLogoSize}px` }}
                          />
                          <Button size="sm" variant="outline" onClick={() => handleRemoveLogo('secondary')}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto" />
                          <p className="text-sm text-muted-foreground">Upload secondary logo</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="relative">
                      <Button variant="outline" className="w-full" asChild>
                        <label htmlFor="secondary-logo" className="cursor-pointer">
                          <Upload className="h-4 w-4 mr-2" />
                          {receiptForm.secondaryLogo ? 'Replace Logo' : 'Upload Logo'}
                        </label>
                      </Button>
                      <input
                        id="secondary-logo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLogoUpload('secondary', e)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Size: {receiptForm.secondaryLogoSize}px</Label>
                      <input
                        type="range"
                        min="30"
                        max="120"
                        value={receiptForm.secondaryLogoSize}
                        onChange={(e) => setReceiptForm(prev => prev ? { ...prev, secondaryLogoSize: parseInt(e.target.value) } : null)}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveReceipt} disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Receipt Settings
                </Button>
                <Button variant="outline" onClick={() => toast.info('Receipt preview coming soon!')}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Receipt
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure system alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Notification settings</p>
                <p className="text-sm text-muted-foreground">Configure alerts and notifications</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance Settings
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your POS system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Appearance settings</p>
                <p className="text-sm text-muted-foreground">Theme and visual customization</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;