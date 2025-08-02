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
  const [notificationForm, setNotificationForm] = useState<any>(null);
  const [appearanceForm, setAppearanceForm] = useState<any>(null);

  // Initialize form state when settings load
  React.useEffect(() => {
    if (settings) {
      setCompanyForm(settings.company);
      setSystemForm(settings.system);
      setReceiptForm(settings.receipt);
      setNotificationForm(settings.notifications);
      setAppearanceForm(settings.appearance);
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

  const handleSaveNotifications = async () => {
    if (!notificationForm) return;
    setIsUpdating(true);
    try {
      await updateNotificationSettings(notificationForm);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveAppearance = async () => {
    if (!appearanceForm) return;
    setIsUpdating(true);
    try {
      await updateAppearanceSettings(appearanceForm);
      // Apply theme immediately
      applyTheme(appearanceForm.theme, appearanceForm.primaryColor);
    } finally {
      setIsUpdating(false);
    }
  };

  const applyTheme = (theme: string, primaryColor: string) => {
    const root = document.documentElement;
    
    // Apply theme class
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply custom primary color
    if (primaryColor) {
      root.style.setProperty('--primary', primaryColor);
      root.style.setProperty('--primary-glow', adjustBrightness(primaryColor, 10));
    }
  };

  const adjustBrightness = (hslColor: string, amount: number) => {
    const match = hslColor.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
    if (match) {
      const [, h, s, l] = match;
      const newL = Math.min(100, Math.max(0, parseInt(l) + amount));
      return `${h} ${s}% ${newL}%`;
    }
    return hslColor;
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

  if (!settings || !companyForm || !systemForm || !receiptForm || !notificationForm || !appearanceForm) {
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

                {systemForm.enableDiscounts && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="max-discount">Maximum Discount Percentage</Label>
                    <Input
                      id="max-discount"
                      type="number"
                      value={systemForm.maxDiscountPercent}
                      onChange={(e) => setSystemForm(prev => prev ? { ...prev, maxDiscountPercent: parseInt(e.target.value) || 0 } : null)}
                      className="w-32"
                      min="0"
                      max="100"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Backup</Label>
                    <p className="text-sm text-muted-foreground">Automatically backup data</p>
                  </div>
                  <Switch
                    checked={systemForm.autoBackup}
                    onCheckedChange={(checked) => setSystemForm(prev => prev ? { ...prev, autoBackup: checked } : null)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Barcode Scanner</Label>
                    <p className="text-sm text-muted-foreground">Use barcode scanning for products</p>
                  </div>
                  <Switch
                    checked={systemForm.enableBarcode}
                    onCheckedChange={(checked) => setSystemForm(prev => prev ? { ...prev, enableBarcode: checked } : null)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Customer Display</Label>
                    <p className="text-sm text-muted-foreground">Show prices to customers</p>
                  </div>
                  <Switch
                    checked={systemForm.enableCustomerDisplay}
                    onCheckedChange={(checked) => setSystemForm(prev => prev ? { ...prev, enableCustomerDisplay: checked } : null)}
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
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
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
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Low Stock Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get alerts when inventory is low</p>
                  </div>
                  <Switch
                    checked={notificationForm.lowStock}
                    onCheckedChange={(checked) => setNotificationForm(prev => prev ? { ...prev, lowStock: checked } : null)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Daily Sales Reports</Label>
                    <p className="text-sm text-muted-foreground">Receive daily sales summaries</p>
                  </div>
                  <Switch
                    checked={notificationForm.dailySales}
                    onCheckedChange={(checked) => setNotificationForm(prev => prev ? { ...prev, dailySales: checked } : null)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Updates</Label>
                    <p className="text-sm text-muted-foreground">Notifications about system updates</p>
                  </div>
                  <Switch
                    checked={notificationForm.systemUpdates}
                    onCheckedChange={(checked) => setNotificationForm(prev => prev ? { ...prev, systemUpdates: checked } : null)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send notifications via email</p>
                  </div>
                  <Switch
                    checked={notificationForm.email}
                    onCheckedChange={(checked) => setNotificationForm(prev => prev ? { ...prev, email: checked } : null)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sound Alerts</Label>
                    <p className="text-sm text-muted-foreground">Play sound for important alerts</p>
                  </div>
                  <Switch
                    checked={notificationForm.sound}
                    onCheckedChange={(checked) => setNotificationForm(prev => prev ? { ...prev, sound: checked } : null)}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveNotifications} disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Notification Settings
                </Button>
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
                Professional Theme Settings
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your POS system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Theme Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Theme Mode</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setAppearanceForm(prev => prev ? { ...prev, theme: 'light' } : null)}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        appearanceForm.theme === 'light' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="bg-white border rounded-md p-2 mb-2">
                        <div className="h-2 bg-gray-200 rounded mb-1"></div>
                        <div className="h-2 bg-gray-100 rounded"></div>
                      </div>
                      <span className="text-sm font-medium">Light</span>
                    </button>
                    
                    <button
                      onClick={() => setAppearanceForm(prev => prev ? { ...prev, theme: 'dark' } : null)}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        appearanceForm.theme === 'dark' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="bg-gray-900 border rounded-md p-2 mb-2">
                        <div className="h-2 bg-gray-700 rounded mb-1"></div>
                        <div className="h-2 bg-gray-800 rounded"></div>
                      </div>
                      <span className="text-sm font-medium">Dark</span>
                    </button>
                  </div>
                </div>

                {/* Primary Color Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Primary Color</Label>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { name: 'Purple', value: '263 70% 60%', color: 'hsl(263, 70%, 60%)' },
                      { name: 'Blue', value: '221 83% 53%', color: 'hsl(221, 83%, 53%)' },
                      { name: 'Green', value: '142 76% 45%', color: 'hsl(142, 76%, 45%)' },
                      { name: 'Orange', value: '25 95% 53%', color: 'hsl(25, 95%, 53%)' },
                      { name: 'Red', value: '0 84% 60%', color: 'hsl(0, 84%, 60%)' },
                      { name: 'Pink', value: '326 78% 66%', color: 'hsl(326, 78%, 66%)' },
                      { name: 'Indigo', value: '262 83% 58%', color: 'hsl(262, 83%, 58%)' },
                      { name: 'Teal', value: '173 80% 40%', color: 'hsl(173, 80%, 40%)' }
                    ].map((colorOption) => (
                      <button
                        key={colorOption.name}
                        onClick={() => setAppearanceForm(prev => prev ? { ...prev, primaryColor: colorOption.value } : null)}
                        className={`w-12 h-12 rounded-lg border-2 transition-all ${
                          appearanceForm.primaryColor === colorOption.value 
                            ? 'border-white shadow-lg scale-110' 
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: colorOption.color }}
                        title={colorOption.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Advanced Options */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Interface Options</Label>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compact Mode</Label>
                    <p className="text-sm text-muted-foreground">Reduce spacing for more content</p>
                  </div>
                  <Switch
                    checked={appearanceForm.compactMode}
                    onCheckedChange={(checked) => setAppearanceForm(prev => prev ? { ...prev, compactMode: checked } : null)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Animations</Label>
                    <p className="text-sm text-muted-foreground">Enable smooth transitions and effects</p>
                  </div>
                  <Switch
                    checked={appearanceForm.showAnimations}
                    onCheckedChange={(checked) => setAppearanceForm(prev => prev ? { ...prev, showAnimations: checked } : null)}
                  />
                </div>
              </div>

              {/* Theme Preview */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Preview</Label>
                <div className={`p-4 rounded-lg border transition-all ${
                  appearanceForm.theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: `hsl(${appearanceForm.primaryColor})` }}
                    />
                    <span className={`font-medium ${
                      appearanceForm.theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Sample POS Interface
                    </span>
                  </div>
                  <div className={`space-y-2 ${
                    appearanceForm.compactMode ? 'space-y-1' : 'space-y-2'
                  }`}>
                    <div className={`h-2 rounded ${
                      appearanceForm.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                    }`} style={{ width: '80%' }} />
                    <div className={`h-2 rounded ${
                      appearanceForm.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                    }`} style={{ width: '60%' }} />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveAppearance} disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Apply Theme
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setAppearanceForm(prev => prev ? { 
                      ...prev, 
                      theme: 'dark', 
                      primaryColor: '263 70% 60%',
                      compactMode: false,
                      showAnimations: true
                    } : null);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;