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
import ReceiptPreview from '@/components/ReceiptPreview';
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
      // Map theme names to the new system
      const themeMapping: Record<string, string> = {
        'default': 'default',
        'ocean-blue': 'ocean-blue',
        'forest-green': 'forest-green',
        'sunset-orange': 'sunset-orange',
        'ruby-red': 'ruby-red',
        'royal-purple': 'royal-purple',
        'midnight-blue': 'midnight-blue',
        'emerald-teal': 'emerald-teal',
        'rose-pink': 'rose-pink'
      };

      const appearance = {
        theme: appearanceForm.theme,
        primaryColor: themeMapping[appearanceForm.primaryColor] || 'default',
        compactMode: appearanceForm.compactMode,
        showAnimations: appearanceForm.showAnimations
      };

      await updateAppearanceSettings(appearance);
      
      // Apply theme immediately using the new theme system
      if (typeof window !== 'undefined') {
        // Import and use the new theme system
        const { getThemeByName } = await import('@/lib/themes');
        const selectedTheme = getThemeByName(appearance.primaryColor);
        applyThemeToDOM(selectedTheme, appearance.theme);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const applyThemeToDOM = (theme: any, mode: string) => {
    const root = document.documentElement;
    
    // Apply mode class
    root.classList.remove('dark', 'light');
    root.classList.add(mode === 'dark' ? 'dark' : 'light');
    
    // Apply theme colors
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--primary-glow', theme.primaryGlow);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--accent-glow', theme.accentGlow);
    root.style.setProperty('--ring', theme.primary);
    root.style.setProperty('--sidebar-primary', theme.primary);
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
                      <SelectItem value="RWF">RWF - Rwandan Franc</SelectItem>
                      <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                      <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
                      <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                      <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                      <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                      <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                      <SelectItem value="UGX">UGX - Ugandan Shilling</SelectItem>
                      <SelectItem value="TZS">TZS - Tanzanian Shilling</SelectItem>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Receipt Settings Form */}
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
              </div>
            </CardContent>
          </Card>

          {/* Receipt Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
              </CardTitle>
              <CardDescription>
                See how your receipt will look
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReceiptPreview 
                isOpen={false} 
                onClose={() => {}} 
                cart={[
                  { id: '1', name: 'Sample Product', price: 29.99, quantity: 2, category: 'Electronics', stock: 100, sku: 'SKU001' },
                  { id: '2', name: 'Another Item', price: 15.50, quantity: 1, category: 'Accessories', stock: 50, sku: 'SKU002' }
                ]} 
                subtotal={75.48} 
                tax={6.04} 
                total={81.52} 
                paymentMethod="Credit Card" 
                onConfirmSale={() => {}} 
                processing={false}
                previewMode={true}
                settings={receiptForm}
              />
            </CardContent>
          </Card>
        </div>
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
          <div className="space-y-6">
            {/* Theme Mode Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Display Mode
                </CardTitle>
                <CardDescription>
                  Choose between light, dark, or system preference
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: 'light', title: 'Light Mode', desc: 'Clean bright interface' },
                    { name: 'dark', title: 'Dark Mode', desc: 'Modern dark interface' },
                    { name: 'auto', title: 'System Default', desc: 'Follows system preference' }
                  ].map((mode) => (
                    <button
                      key={mode.name}
                      onClick={() => setAppearanceForm(prev => prev ? { ...prev, theme: mode.name } : null)}
                      className={`p-4 border-2 rounded-lg transition-all text-left ${
                        appearanceForm.theme === mode.name 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className={`h-12 rounded-md mb-3 flex items-center justify-center ${
                        mode.name === 'light' ? 'bg-white border' :
                        mode.name === 'dark' ? 'bg-gray-900' :
                        'bg-gradient-to-r from-white via-gray-500 to-gray-900'
                      }`}>
                        <div className={`w-6 h-6 rounded ${
                          mode.name === 'light' ? 'bg-gray-200' :
                          mode.name === 'dark' ? 'bg-gray-700' :
                          'bg-gradient-to-r from-gray-200 to-gray-700'
                        }`} />
                      </div>
                      <h3 className="font-medium">{mode.title}</h3>
                      <p className="text-sm text-muted-foreground">{mode.desc}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Professional Color Themes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Professional Color Themes
                </CardTitle>
                <CardDescription>
                  Choose from our carefully crafted professional color schemes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'default', title: 'Professional Purple', primary: 'hsl(263, 70%, 60%)', secondary: 'hsl(197, 100%, 55%)' },
                    { name: 'ocean-blue', title: 'Ocean Blue', primary: 'hsl(221, 83%, 53%)', secondary: 'hsl(199, 89%, 48%)' },
                    { name: 'forest-green', title: 'Forest Green', primary: 'hsl(142, 76%, 45%)', secondary: 'hsl(160, 84%, 39%)' },
                    { name: 'sunset-orange', title: 'Sunset Orange', primary: 'hsl(25, 95%, 53%)', secondary: 'hsl(43, 96%, 56%)' },
                    { name: 'ruby-red', title: 'Ruby Red', primary: 'hsl(0, 84%, 60%)', secondary: 'hsl(346, 77%, 49%)' },
                    { name: 'royal-purple', title: 'Royal Purple', primary: 'hsl(262, 83%, 58%)', secondary: 'hsl(280, 100%, 70%)' },
                    { name: 'midnight-blue', title: 'Midnight Blue', primary: 'hsl(237, 100%, 68%)', secondary: 'hsl(200, 100%, 70%)' },
                    { name: 'emerald-teal', title: 'Emerald Teal', primary: 'hsl(173, 80%, 40%)', secondary: 'hsl(180, 100%, 35%)' },
                    { name: 'rose-pink', title: 'Rose Pink', primary: 'hsl(326, 78%, 66%)', secondary: 'hsl(340, 82%, 52%)' }
                  ].map((theme) => (
                    <button
                      key={theme.name}
                      onClick={() => setAppearanceForm(prev => prev ? { 
                        ...prev, 
                        primaryColor: theme.name 
                      } : null)}
                      className={`p-4 border-2 rounded-lg transition-all text-left ${
                        appearanceForm.primaryColor === theme.name 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex gap-2 mb-3">
                        <div 
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: theme.primary }}
                        />
                        <div 
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: theme.secondary }}
                        />
                      </div>
                      <h3 className="font-medium text-sm">{theme.title}</h3>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Interface Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Interface Preferences</CardTitle>
                <CardDescription>
                  Customize the interface behavior and visual effects
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    <Label>Smooth Animations</Label>
                    <p className="text-sm text-muted-foreground">Enable transitions and visual effects</p>
                  </div>
                  <Switch
                    checked={appearanceForm.showAnimations}
                    onCheckedChange={(checked) => setAppearanceForm(prev => prev ? { ...prev, showAnimations: checked } : null)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Live Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>
                  See how your theme will look
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`p-6 rounded-lg border transition-all ${
                  appearanceForm.theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-5 h-5 rounded"
                      style={{ 
                        backgroundColor: appearanceForm.primaryColor === 'default' ? 'hsl(263, 70%, 60%)' :
                        appearanceForm.primaryColor === 'ocean-blue' ? 'hsl(221, 83%, 53%)' :
                        appearanceForm.primaryColor === 'forest-green' ? 'hsl(142, 76%, 45%)' :
                        appearanceForm.primaryColor === 'sunset-orange' ? 'hsl(25, 95%, 53%)' :
                        appearanceForm.primaryColor === 'ruby-red' ? 'hsl(0, 84%, 60%)' :
                        appearanceForm.primaryColor === 'royal-purple' ? 'hsl(262, 83%, 58%)' :
                        appearanceForm.primaryColor === 'midnight-blue' ? 'hsl(237, 100%, 68%)' :
                        appearanceForm.primaryColor === 'emerald-teal' ? 'hsl(173, 80%, 40%)' :
                        appearanceForm.primaryColor === 'rose-pink' ? 'hsl(326, 78%, 66%)' :
                        'hsl(263, 70%, 60%)'
                      }}
                    />
                    <span className={`font-medium ${
                      appearanceForm.theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Sample POS Interface
                    </span>
                  </div>
                  <div className={`space-y-3 ${
                    appearanceForm.compactMode ? 'space-y-2' : 'space-y-3'
                  }`}>
                    <div className={`h-3 rounded ${
                      appearanceForm.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                    }`} style={{ width: '80%' }} />
                    <div className={`h-3 rounded ${
                      appearanceForm.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                    }`} style={{ width: '60%' }} />
                    <div className={`h-8 rounded flex items-center px-3 text-white font-medium`}
                      style={{ 
                        backgroundColor: appearanceForm.primaryColor === 'default' ? 'hsl(263, 70%, 60%)' :
                        appearanceForm.primaryColor === 'ocean-blue' ? 'hsl(221, 83%, 53%)' :
                        appearanceForm.primaryColor === 'forest-green' ? 'hsl(142, 76%, 45%)' :
                        appearanceForm.primaryColor === 'sunset-orange' ? 'hsl(25, 95%, 53%)' :
                        appearanceForm.primaryColor === 'ruby-red' ? 'hsl(0, 84%, 60%)' :
                        appearanceForm.primaryColor === 'royal-purple' ? 'hsl(262, 83%, 58%)' :
                        appearanceForm.primaryColor === 'midnight-blue' ? 'hsl(237, 100%, 68%)' :
                        appearanceForm.primaryColor === 'emerald-teal' ? 'hsl(173, 80%, 40%)' :
                        appearanceForm.primaryColor === 'rose-pink' ? 'hsl(326, 78%, 66%)' :
                        'hsl(263, 70%, 60%)'
                      }}
                    >
                      Sample Button
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button onClick={handleSaveAppearance} disabled={isUpdating} size="lg">
                {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Apply Theme Settings
              </Button>
               <Button 
                 variant="outline" 
                 onClick={() => {
                   setAppearanceForm(prev => prev ? { 
                     ...prev, 
                     theme: 'dark', 
                     primaryColor: 'default',
                     compactMode: false,
                     showAnimations: true
                   } : null);
                 }}
                 size="lg"
               >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

export default Settings;