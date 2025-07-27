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
  RotateCcw
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
      header: 'Thank you for your purchase!',
      footer: 'Please come again!',
      showLogo: true,
      showTaxBreakdown: true,
      printCustomerCopy: true,
      enableEmail: false
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="receipt-header">Receipt Header</Label>
                  <Input
                    id="receipt-header"
                    value={settings.receipt.header}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      receipt: { ...prev.receipt, header: e.target.value }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receipt-footer">Receipt Footer</Label>
                  <Input
                    id="receipt-footer"
                    value={settings.receipt.footer}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      receipt: { ...prev.receipt, footer: e.target.value }
                    }))}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Logo</Label>
                    <p className="text-sm text-muted-foreground">Display company logo on receipt</p>
                  </div>
                  <Switch
                    checked={settings.receipt.showLogo}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      receipt: { ...prev.receipt, showLogo: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Tax Breakdown</Label>
                    <p className="text-sm text-muted-foreground">Display detailed tax information</p>
                  </div>
                  <Switch
                    checked={settings.receipt.showTaxBreakdown}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      receipt: { ...prev.receipt, showTaxBreakdown: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Print Customer Copy</Label>
                    <p className="text-sm text-muted-foreground">Automatically print customer receipt</p>
                  </div>
                  <Switch
                    checked={settings.receipt.printCustomerCopy}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      receipt: { ...prev.receipt, printCustomerCopy: checked }
                    }))}
                  />
                </div>

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
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleSave('Receipt')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => handleReset('Receipt')}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
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