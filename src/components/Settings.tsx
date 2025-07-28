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
import {
  Building2,
  Settings as SettingsIcon,
  Users,
  Package,
  Receipt,
  CreditCard,
  Database,
  Shield,
  Bell,
  Palette,
  Download,
  Upload,
  Save,
  RotateCcw,
  ImageIcon,
  Trash2,
  Eye
} from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    company: {
      name: 'My Store',
      address: '123 Main Street',
      phone: '+1234567890',
      email: 'info@mystore.com',
      taxId: 'TAX123456',
      currency: 'USD',
      timezone: 'UTC'
    },
    system: {
      autoBackup: true,
      lowStockAlert: true,
      lowStockThreshold: 10,
      enableBarcode: true,
      enableCustomerDisplay: false,
      defaultPaymentMethod: 'cash',
      enableDiscounts: true,
      maxDiscountPercent: 50
    },
    receipt: {
      // Basic Receipt Content
      header: 'Thank you for your purchase!',
      footer: 'Please come again!',
      showLogo: true,
      showTaxBreakdown: true,
      printCustomerCopy: true,
      enableEmail: false,
      
      // Logo Settings
      primaryLogo: null as string | null,
      secondaryLogo: null as string | null,
      primaryLogoSize: 100,
      secondaryLogoSize: 60,
      logoPosition: 'top',
      
      // Receipt Layout & Design
      receiptWidth: 80,
      fontSize: 12,
      fontFamily: 'monospace',
      paperType: 'thermal',
      showDateTime: true,
      showOrderNumber: true,
      showCashierName: true,
      showQRCode: false,
      qrCodeData: 'receipt-url',
      
      // Content Customization
      showItemCodes: true,
      showItemDescription: true,
      showUnitPrice: true,
      showSubtotal: true,
      showDiscounts: true,
      currencySymbol: '$',
      
      // Footer Content
      customFooterText: '',
      showSocialMedia: false,
      website: '',
      facebook: '',
      instagram: '',
      twitter: '',
      
      // Colors (for digital receipts)
      backgroundColor: '#ffffff',
      textColor: '#000000',
      headerColor: '#333333',
      borderColor: '#cccccc'
    },
    notifications: {
      lowStock: true,
      dailySales: true,
      systemUpdates: true,
      email: true,
      sound: true
    },
    appearance: {
      theme: 'light',
      primaryColor: 'blue',
      compactMode: false,
      showAnimations: true
    }
  });

  const handleSave = (section: string) => {
    toast.success(`${section} settings saved successfully!`);
  };

  const handleReset = (section: string) => {
    toast.info(`${section} settings reset to defaults`);
  };

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pos-settings.json';
    link.click();
    toast.success('Settings exported successfully!');
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          setSettings(importedSettings);
          toast.success('Settings imported successfully!');
        } catch (error) {
          toast.error('Invalid settings file format');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleLogoUpload = (type: 'primary' | 'secondary', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPG, PNG, GIF, WebP, SVG)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSettings(prev => ({
          ...prev,
          receipt: {
            ...prev.receipt,
            [type === 'primary' ? 'primaryLogo' : 'secondaryLogo']: result
          }
        }));
        toast.success(`${type} logo uploaded successfully!`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = (type: 'primary' | 'secondary') => {
    setSettings(prev => ({
      ...prev,
      receipt: {
        ...prev.receipt,
        [type === 'primary' ? 'primaryLogo' : 'secondaryLogo']: null
      }
    }));
    toast.success(`${type} logo removed`);
  };

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
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto">
          <TabsTrigger value="company" className="flex items-center gap-2 py-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Company</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2 py-2">
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2 py-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
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
                    value={settings.company.name}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      company: { ...prev.company, name: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-id">Tax ID</Label>
                  <Input
                    id="tax-id"
                    value={settings.company.taxId}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      company: { ...prev.company, taxId: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={settings.company.address}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    company: { ...prev.company, address: e.target.value }
                  }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={settings.company.phone}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      company: { ...prev.company, phone: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.company.email}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      company: { ...prev.company, email: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={settings.company.currency} onValueChange={(value) => setSettings(prev => ({
                    ...prev,
                    company: { ...prev.company, currency: value }
                  }))}>
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
                  <Select value={settings.company.timezone} onValueChange={(value) => setSettings(prev => ({
                    ...prev,
                    company: { ...prev.company, timezone: value }
                  }))}>
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
                <Button onClick={() => handleSave('Company')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => handleReset('Company')}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
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
                    <Label>Auto Backup</Label>
                    <p className="text-sm text-muted-foreground">Automatically backup data daily</p>
                  </div>
                  <Switch
                    checked={settings.system.autoBackup}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      system: { ...prev.system, autoBackup: checked }
                    }))}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Low Stock Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when stock is low</p>
                  </div>
                  <Switch
                    checked={settings.system.lowStockAlert}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      system: { ...prev.system, lowStockAlert: checked }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock-threshold">Low Stock Threshold</Label>
                  <Input
                    id="stock-threshold"
                    type="number"
                    value={settings.system.lowStockThreshold}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      system: { ...prev.system, lowStockThreshold: parseInt(e.target.value) }
                    }))}
                    className="w-32"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Barcode Scanner</Label>
                    <p className="text-sm text-muted-foreground">Enable barcode scanning support</p>
                  </div>
                  <Switch
                    checked={settings.system.enableBarcode}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      system: { ...prev.system, enableBarcode: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Customer Display</Label>
                    <p className="text-sm text-muted-foreground">Show prices to customers</p>
                  </div>
                  <Switch
                    checked={settings.system.enableCustomerDisplay}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      system: { ...prev.system, enableCustomerDisplay: checked }
                    }))}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="payment-method">Default Payment Method</Label>
                  <Select value={settings.system.defaultPaymentMethod} onValueChange={(value) => setSettings(prev => ({
                    ...prev,
                    system: { ...prev.system, defaultPaymentMethod: value }
                  }))}>
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

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Discounts</Label>
                    <p className="text-sm text-muted-foreground">Allow discount application</p>
                  </div>
                  <Switch
                    checked={settings.system.enableDiscounts}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      system: { ...prev.system, enableDiscounts: checked }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-discount">Maximum Discount (%)</Label>
                  <Input
                    id="max-discount"
                    type="number"
                    value={settings.system.maxDiscountPercent}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      system: { ...prev.system, maxDiscountPercent: parseInt(e.target.value) }
                    }))}
                    className="w-32"
                    max="100"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleSave('System')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => handleReset('System')}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user roles and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">User management features</p>
                  <p className="text-sm text-muted-foreground">Configure user roles, permissions, and access levels</p>
                  <Button className="mt-4" onClick={() => toast.info('User management coming soon!')}>
                    <Shield className="h-4 w-4 mr-2" />
                    Manage Users
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receipt Settings */}
        <TabsContent value="receipt">
          <div className="space-y-6">
            {/* Logo Management Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Logo Management
                </CardTitle>
                <CardDescription>
                  Upload and configure your receipt logos (supports PNG, JPG, GIF, WebP, SVG)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Primary Logo */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Primary Logo</Label>
                    <Badge variant="secondary">Main receipt logo</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                        {settings.receipt.primaryLogo ? (
                          <div className="space-y-2">
                            <img 
                              src={settings.receipt.primaryLogo} 
                              alt="Primary Logo" 
                              className="max-h-24 mx-auto object-contain"
                              style={{ width: `${settings.receipt.primaryLogoSize}px` }}
                            />
                            <div className="flex gap-2 justify-center">
                              <Button size="sm" variant="outline" onClick={() => handleRemoveLogo('primary')}>
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>
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
                            {settings.receipt.primaryLogo ? 'Replace Logo' : 'Upload Logo'}
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
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="primary-logo-size">Size (pixels): {settings.receipt.primaryLogoSize}px</Label>
                        <input
                          type="range"
                          id="primary-logo-size"
                          min="50"
                          max="200"
                          value={settings.receipt.primaryLogoSize}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            receipt: { ...prev.receipt, primaryLogoSize: parseInt(e.target.value) }
                          }))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Secondary Logo */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Secondary Logo</Label>
                    <Badge variant="outline">Additional branding</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                        {settings.receipt.secondaryLogo ? (
                          <div className="space-y-2">
                            <img 
                              src={settings.receipt.secondaryLogo} 
                              alt="Secondary Logo" 
                              className="max-h-16 mx-auto object-contain"
                              style={{ width: `${settings.receipt.secondaryLogoSize}px` }}
                            />
                            <div className="flex gap-2 justify-center">
                              <Button size="sm" variant="outline" onClick={() => handleRemoveLogo('secondary')}>
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>
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
                            {settings.receipt.secondaryLogo ? 'Replace Logo' : 'Upload Logo'}
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
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="secondary-logo-size">Size (pixels): {settings.receipt.secondaryLogoSize}px</Label>
                        <input
                          type="range"
                          id="secondary-logo-size"
                          min="30"
                          max="120"
                          value={settings.receipt.secondaryLogoSize}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            receipt: { ...prev.receipt, secondaryLogoSize: parseInt(e.target.value) }
                          }))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logo Position */}
                <div className="space-y-2">
                  <Label>Logo Position</Label>
                  <Select value={settings.receipt.logoPosition} onValueChange={(value) => setSettings(prev => ({
                    ...prev,
                    receipt: { ...prev.receipt, logoPosition: value }
                  }))}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Top of Receipt</SelectItem>
                      <SelectItem value="header">In Header</SelectItem>
                      <SelectItem value="footer">In Footer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Receipt Layout & Design */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Receipt Design & Layout
                </CardTitle>
                <CardDescription>
                  Customize the appearance and formatting of your receipts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="receipt-header">Receipt Header Text</Label>
                    <Input
                      id="receipt-header"
                      value={settings.receipt.header}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        receipt: { ...prev.receipt, header: e.target.value }
                      }))}
                      placeholder="Thank you for your purchase!"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="receipt-footer">Receipt Footer Text</Label>
                    <Input
                      id="receipt-footer"
                      value={settings.receipt.footer}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        receipt: { ...prev.receipt, footer: e.target.value }
                      }))}
                      placeholder="Please come again!"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-footer">Custom Footer Message</Label>
                  <Textarea
                    id="custom-footer"
                    value={settings.receipt.customFooterText}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      receipt: { ...prev.receipt, customFooterText: e.target.value }
                    }))}
                    placeholder="Add any additional information, policies, or promotional text"
                    rows={3}
                  />
                </div>

                <Separator />

                {/* Layout Settings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="receipt-width">Receipt Width (mm)</Label>
                    <Input
                      id="receipt-width"
                      type="number"
                      value={settings.receipt.receiptWidth}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        receipt: { ...prev.receipt, receiptWidth: parseInt(e.target.value) }
                      }))}
                      min="50"
                      max="120"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="font-size">Font Size</Label>
                    <Input
                      id="font-size"
                      type="number"
                      value={settings.receipt.fontSize}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        receipt: { ...prev.receipt, fontSize: parseInt(e.target.value) }
                      }))}
                      min="8"
                      max="20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency-symbol">Currency Symbol</Label>
                    <Input
                      id="currency-symbol"
                      value={settings.receipt.currencySymbol}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        receipt: { ...prev.receipt, currencySymbol: e.target.value }
                      }))}
                      maxLength={3}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Font Family</Label>
                    <Select value={settings.receipt.fontFamily} onValueChange={(value) => setSettings(prev => ({
                      ...prev,
                      receipt: { ...prev.receipt, fontFamily: value }
                    }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monospace">Monospace</SelectItem>
                        <SelectItem value="sans-serif">Sans Serif</SelectItem>
                        <SelectItem value="serif">Serif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Paper Type</Label>
                    <Select value={settings.receipt.paperType} onValueChange={(value) => setSettings(prev => ({
                      ...prev,
                      receipt: { ...prev.receipt, paperType: value }
                    }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="thermal">Thermal Paper</SelectItem>
                        <SelectItem value="regular">Regular Paper</SelectItem>
                        <SelectItem value="digital">Digital Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Content Display Options */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Content Display Options</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Show Date & Time</Label>
                        <Switch
                          checked={settings.receipt.showDateTime}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            receipt: { ...prev.receipt, showDateTime: checked }
                          }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Show Order Number</Label>
                        <Switch
                          checked={settings.receipt.showOrderNumber}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            receipt: { ...prev.receipt, showOrderNumber: checked }
                          }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Show Cashier Name</Label>
                        <Switch
                          checked={settings.receipt.showCashierName}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            receipt: { ...prev.receipt, showCashierName: checked }
                          }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Show Item Codes</Label>
                        <Switch
                          checked={settings.receipt.showItemCodes}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            receipt: { ...prev.receipt, showItemCodes: checked }
                          }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Show Item Description</Label>
                        <Switch
                          checked={settings.receipt.showItemDescription}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            receipt: { ...prev.receipt, showItemDescription: checked }
                          }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Show Unit Prices</Label>
                        <Switch
                          checked={settings.receipt.showUnitPrice}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            receipt: { ...prev.receipt, showUnitPrice: checked }
                          }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Show Tax Breakdown</Label>
                        <Switch
                          checked={settings.receipt.showTaxBreakdown}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            receipt: { ...prev.receipt, showTaxBreakdown: checked }
                          }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Show Discounts</Label>
                        <Switch
                          checked={settings.receipt.showDiscounts}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            receipt: { ...prev.receipt, showDiscounts: checked }
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* QR Code & Digital Features */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Digital Features</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>QR Code</Label>
                          <p className="text-sm text-muted-foreground">Add QR code for digital features</p>
                        </div>
                        <Switch
                          checked={settings.receipt.showQRCode}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            receipt: { ...prev.receipt, showQRCode: checked }
                          }))}
                        />
                      </div>
                      {settings.receipt.showQRCode && (
                        <div className="space-y-2">
                          <Label htmlFor="qr-data">QR Code Data</Label>
                          <Input
                            id="qr-data"
                            value={settings.receipt.qrCodeData}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              receipt: { ...prev.receipt, qrCodeData: e.target.value }
                            }))}
                            placeholder="URL or text for QR code"
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Email Receipts</Label>
                          <p className="text-sm text-muted-foreground">Send receipts via email</p>
                        </div>
                        <Switch
                          checked={settings.receipt.enableEmail}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            receipt: { ...prev.receipt, enableEmail: checked }
                          }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Print Customer Copy</Label>
                          <p className="text-sm text-muted-foreground">Auto-print customer receipt</p>
                        </div>
                        <Switch
                          checked={settings.receipt.printCustomerCopy}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            receipt: { ...prev.receipt, printCustomerCopy: checked }
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Social Media & Contact */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Social Media & Contact</Label>
                    <Switch
                      checked={settings.receipt.showSocialMedia}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        receipt: { ...prev.receipt, showSocialMedia: checked }
                      }))}
                    />
                  </div>
                  {settings.receipt.showSocialMedia && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={settings.receipt.website}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            receipt: { ...prev.receipt, website: e.target.value }
                          }))}
                          placeholder="www.yourstore.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="facebook">Facebook</Label>
                        <Input
                          id="facebook"
                          value={settings.receipt.facebook}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            receipt: { ...prev.receipt, facebook: e.target.value }
                          }))}
                          placeholder="@yourstore"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input
                          id="instagram"
                          value={settings.receipt.instagram}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            receipt: { ...prev.receipt, instagram: e.target.value }
                          }))}
                          placeholder="@yourstore"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="twitter">Twitter/X</Label>
                        <Input
                          id="twitter"
                          value={settings.receipt.twitter}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            receipt: { ...prev.receipt, twitter: e.target.value }
                          }))}
                          placeholder="@yourstore"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Color Customization for Digital Receipts */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Digital Receipt Colors</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bg-color">Background</Label>
                      <Input
                        id="bg-color"
                        type="color"
                        value={settings.receipt.backgroundColor}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          receipt: { ...prev.receipt, backgroundColor: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="text-color">Text Color</Label>
                      <Input
                        id="text-color"
                        type="color"
                        value={settings.receipt.textColor}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          receipt: { ...prev.receipt, textColor: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="header-color">Header Color</Label>
                      <Input
                        id="header-color"
                        type="color"
                        value={settings.receipt.headerColor}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          receipt: { ...prev.receipt, headerColor: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="border-color">Border Color</Label>
                      <Input
                        id="border-color"
                        type="color"
                        value={settings.receipt.borderColor}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          receipt: { ...prev.receipt, borderColor: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={() => handleSave('Receipt')}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Receipt Settings
                  </Button>
                  <Button variant="outline" onClick={() => handleReset('Receipt')}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Defaults
                  </Button>
                  <Button variant="outline" onClick={() => toast.info('Receipt preview coming soon!')}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Receipt
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure alerts and notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Low Stock Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get alerted when products are low in stock</p>
                  </div>
                  <Switch
                    checked={settings.notifications.lowStock}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, lowStock: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Daily Sales Reports</Label>
                    <p className="text-sm text-muted-foreground">Receive daily sales summaries</p>
                  </div>
                  <Switch
                    checked={settings.notifications.dailySales}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, dailySales: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Updates</Label>
                    <p className="text-sm text-muted-foreground">Get notified about system updates</p>
                  </div>
                  <Switch
                    checked={settings.notifications.systemUpdates}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, systemUpdates: checked }
                    }))}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send notifications via email</p>
                  </div>
                  <Switch
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, email: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sound Alerts</Label>
                    <p className="text-sm text-muted-foreground">Play sound for important alerts</p>
                  </div>
                  <Switch
                    checked={settings.notifications.sound}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, sound: checked }
                    }))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleSave('Notifications')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => handleReset('Notifications')}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance & Theme
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your POS system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={settings.appearance.theme} onValueChange={(value) => setSettings(prev => ({
                    ...prev,
                    appearance: { ...prev.appearance, theme: value }
                  }))}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <Select value={settings.appearance.primaryColor} onValueChange={(value) => setSettings(prev => ({
                    ...prev,
                    appearance: { ...prev.appearance, primaryColor: value }
                  }))}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                      <SelectItem value="orange">Orange</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compact Mode</Label>
                    <p className="text-sm text-muted-foreground">Use compact interface layout</p>
                  </div>
                  <Switch
                    checked={settings.appearance.compactMode}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, compactMode: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Animations</Label>
                    <p className="text-sm text-muted-foreground">Enable interface animations</p>
                  </div>
                  <Switch
                    checked={settings.appearance.showAnimations}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, showAnimations: checked }
                    }))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleSave('Appearance')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => handleReset('Appearance')}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Import/Export Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup & Restore
          </CardTitle>
          <CardDescription>
            Export or import your complete system settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleExportSettings} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Settings
            </Button>
            <div className="relative">
              <Button variant="outline" asChild>
                <label htmlFor="import-settings" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Settings
                </label>
              </Button>
              <input
                id="import-settings"
                type="file"
                accept=".json"
                onChange={handleImportSettings}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;