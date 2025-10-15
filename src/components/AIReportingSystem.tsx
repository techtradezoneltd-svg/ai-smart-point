import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bot, 
  MessageSquare, 
  FileText, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Send,
  Smartphone,
  Settings,
  Activity,
  DollarSign,
  Package,
  Users,
  BarChart3,
  PieChart,
  Calendar,
  Zap
} from "lucide-react";

interface WhatsAppSettings {
  ownerPhone: string;
  businessHours: {
    open: string;
    close: string;
  };
  autoReportsEnabled: boolean;
  instantAlertsEnabled: boolean;
  queryResponseEnabled: boolean;
}

interface ShopActivity {
  type: 'open' | 'close' | 'sale' | 'expense' | 'refund' | 'stock_low';
  timestamp: string;
  data: any;
}

const AIReportingSystem = () => {
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const [settings, setSettings] = useState<WhatsAppSettings>({
    ownerPhone: '',
    businessHours: { open: '09:00', close: '18:00' },
    autoReportsEnabled: true,
    instantAlertsEnabled: true,
    queryResponseEnabled: true
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [dailyReport, setDailyReport] = useState(null);
  const [recentActivities, setRecentActivities] = useState<ShopActivity[]>([]);
  const [whatsappQueries, setWhatsappQueries] = useState([]);

  useEffect(() => {
    loadSettings();
    loadDailyReport();
    loadRecentActivities();
    setupRealtimeMonitoring();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'whatsapp_reporting')
        .maybeSingle();

      if (data?.value) {
        setSettings(data.value as unknown as WhatsAppSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await supabase
        .from('settings')
        .upsert({
          key: 'whatsapp_reporting',
          value: settings as any,
          category: 'reporting'
        });

      toast({
        title: "Settings Saved",
        description: "WhatsApp reporting settings have been updated.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    }
  };

  const loadDailyReport = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const startOfDay = `${today}T00:00:00`;
      const endOfDay = `${today}T23:59:59`;
      
      // Get today's sales
      const { data: sales } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (*, products (cost_price))
        `)
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay);

      // Get today's expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('expense_date', today);

      // Get low stock items
      const { data: lowStock } = await supabase
        .from('products')
        .select('*')
        .filter('current_stock', 'lt', 'min_stock_level')
        .eq('is_active', true);

      // Get stock movements
      const { data: stockMovements } = await supabase
        .from('stock_movements')
        .select('*')
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay);

      // Get loans data
      const { data: newLoans } = await supabase
        .from('loans')
        .select('*')
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay);

      const { data: loanPayments } = await supabase
        .from('loan_payments')
        .select('*')
        .gte('payment_date', startOfDay)
        .lt('payment_date', endOfDay);

      const { data: activeLoans } = await supabase
        .from('loans')
        .select('*')
        .in('status', ['active', 'overdue']);

      // Get products for inventory value
      const { data: allProducts } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      // Get staff count
      const { data: activeStaff } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_active', true);

      // Calculate metrics
      const totalSales = sales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
      const totalProfit = sales?.reduce((sum, sale) => {
        const saleItems = sale.sale_items || [];
        const profit = saleItems.reduce((itemSum: number, item: any) => {
          const costPrice = item.products?.cost_price || 0;
          return itemSum + ((Number(item.unit_price) - Number(costPrice)) * Number(item.quantity));
        }, 0);
        return sum + profit;
      }, 0) || 0;
      const totalExpenses = expenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
      
      const inventoryValue = allProducts?.reduce((sum, product) => {
        return sum + (Number(product.current_stock) * Number(product.cost_price || 0));
      }, 0) || 0;

      const stockIn = stockMovements?.filter(m => m.type === 'in' || m.type === 'return')
        .reduce((sum, m) => sum + Number(m.quantity), 0) || 0;
      const stockOut = stockMovements?.filter(m => m.type === 'out')
        .reduce((sum, m) => sum + Number(m.quantity), 0) || 0;
      const stockAdjustments = stockMovements?.filter(m => m.type === 'damage' || m.type === 'adjustment')
        .reduce((sum, m) => sum + Number(m.quantity), 0) || 0;

      const newLoanAmount = newLoans?.reduce((sum, loan) => sum + Number(loan.total_amount), 0) || 0;
      const loanPaymentsAmount = loanPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
      const totalOutstanding = activeLoans?.reduce((sum, loan) => sum + Number(loan.remaining_balance), 0) || 0;

      setDailyReport({
        date: today,
        totalSales,
        totalProfit,
        totalExpenses,
        netProfit: totalProfit - totalExpenses,
        transactionCount: sales?.length || 0,
        lowStockCount: lowStock?.length || 0,
        lowStockItems: lowStock || [],
        
        // Loan metrics
        newLoansCount: newLoans?.length || 0,
        newLoanAmount,
        loanPaymentsCount: loanPayments?.length || 0,
        loanPaymentsAmount,
        activeLoanCount: activeLoans?.length || 0,
        totalOutstanding,
        
        // Inventory metrics
        inventoryValue,
        stockMovementsCount: stockMovements?.length || 0,
        stockIn,
        stockOut,
        stockAdjustments,
        
        // Staff & customer metrics
        activeStaffCount: activeStaff?.length || 0,
        customerInteractions: sales?.length || 0,
        newCustomers: 0 // Will be enhanced later with actual new customer tracking
      });
    } catch (error) {
      console.error('Error loading daily report:', error);
    }
  };

  const loadRecentActivities = async () => {
    // Load recent activities from various tables
    const activities: ShopActivity[] = [];
    
    try {
      // Recent sales
      const { data: recentSales } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      recentSales?.forEach(sale => {
        activities.push({
          type: 'sale',
          timestamp: sale.created_at,
          data: sale
        });
      });

      setRecentActivities(activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const setupRealtimeMonitoring = () => {
    if (!isMonitoring) {
      setIsMonitoring(true);
      
      // Monitor sales for real-time alerts
      const salesChannel = supabase
        .channel('sales-monitoring')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'sales'
        }, (payload) => {
          handleNewSale(payload.new);
        })
        .subscribe();

      // Monitor expenses for unusual activity
      const expensesChannel = supabase
        .channel('expenses-monitoring')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'expenses'
        }, (payload) => {
          handleNewExpense(payload.new);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(salesChannel);
        supabase.removeChannel(expensesChannel);
      };
    }
  };

  const handleNewSale = async (sale: any) => {
    // Check for unusual activity
    if (Number(sale.total_amount) > 1000) {
      sendAlert('Large Sale Alert', `High-value transaction: ${formatCurrency(sale.total_amount)} - Sale #${sale.sale_number}`);
    }
    
    loadDailyReport();
    loadRecentActivities();
  };

  const handleNewExpense = async (expense: any) => {
    // Check for unusual expenses
    if (Number(expense.amount) > 500) {
      sendAlert('Large Expense Alert', `High expense recorded: ${formatCurrency(expense.amount)} - ${expense.title}`);
    }
    
    loadDailyReport();
  };

  const sendAlert = async (title: string, message: string) => {
    if (!settings.instantAlertsEnabled || !settings.ownerPhone) return;

    try {
      await supabase.functions.invoke('whatsapp-notification', {
        body: {
          phone: settings.ownerPhone,
          title,
          message,
          type: 'alert'
        }
      });
    } catch (error) {
      console.error('Error sending alert:', error);
    }
  };

  const generateDailyReport = async () => {
    if (!dailyReport) return;

    try {
      // Generate AI summary
      const aiSummary = await supabase.functions.invoke('generate-ai-summary', {
        body: { reportData: dailyReport }
      });

      // Generate detailed report
      const detailedReport = await supabase.functions.invoke('generate-detailed-report', {
        body: { reportData: dailyReport }
      });

      // Send via WhatsApp
      if (settings.autoReportsEnabled && settings.ownerPhone) {
        await supabase.functions.invoke('whatsapp-notification', {
          body: {
            phone: settings.ownerPhone,
            title: 'Daily Business Report',
            message: aiSummary.data?.summary || 'Daily report generated',
            reportUrl: detailedReport.data?.url,
            type: 'daily_report'
          }
        });

        toast({
          title: "Report Sent",
          description: "Daily report has been generated and sent via WhatsApp.",
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate daily report.",
        variant: "destructive",
      });
    }
  };

  const sendShopOpenNotification = async () => {
    if (!settings.ownerPhone) return;

    try {
      await supabase.functions.invoke('whatsapp-notification', {
        body: {
          phone: settings.ownerPhone,
          title: 'Shop Opened',
          message: `🏪 Shop opened at ${new Date().toLocaleTimeString()}. Ready for business!`,
          type: 'shop_status'
        }
      });

      toast({
        title: "Notification Sent",
        description: "Shop open notification sent to owner.",
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const sendShopCloseNotification = async () => {
    if (!settings.ownerPhone) return;

    await generateDailyReport();
    
    try {
      await supabase.functions.invoke('whatsapp-notification', {
        body: {
          phone: settings.ownerPhone,
          title: 'Shop Closed',
          message: `🔒 Shop closed at ${new Date().toLocaleTimeString()}. Daily report has been generated.`,
          type: 'shop_status'
        }
      });

      toast({
        title: "Notification Sent",
        description: "Shop close notification and daily report sent to owner.",
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            AI Reporting System
          </h1>
          <p className="text-muted-foreground">Automated WhatsApp reports and real-time monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isMonitoring ? "default" : "secondary"} className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            {isMonitoring ? "Monitoring Active" : "Monitoring Inactive"}
          </Badge>
          <Button onClick={generateDailyReport} className="bg-gradient-primary">
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-1">
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                WhatsApp Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ownerPhone">Owner's WhatsApp Number</Label>
                <Input
                  id="ownerPhone"
                  placeholder="+1234567890"
                  value={settings.ownerPhone}
                  onChange={(e) => setSettings({...settings, ownerPhone: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="openTime">Opening Time</Label>
                  <Input
                    id="openTime"
                    type="time"
                    value={settings.businessHours.open}
                    onChange={(e) => setSettings({
                      ...settings,
                      businessHours: {...settings.businessHours, open: e.target.value}
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closeTime">Closing Time</Label>
                  <Input
                    id="closeTime"
                    type="time"
                    value={settings.businessHours.close}
                    onChange={(e) => setSettings({
                      ...settings,
                      businessHours: {...settings.businessHours, close: e.target.value}
                    })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoReports">Auto Daily Reports</Label>
                  <Switch
                    id="autoReports"
                    checked={settings.autoReportsEnabled}
                    onCheckedChange={(checked) => setSettings({...settings, autoReportsEnabled: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="instantAlerts">Instant Alerts</Label>
                  <Switch
                    id="instantAlerts"
                    checked={settings.instantAlertsEnabled}
                    onCheckedChange={(checked) => setSettings({...settings, instantAlertsEnabled: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="queryResponse">Query Response</Label>
                  <Switch
                    id="queryResponse"
                    checked={settings.queryResponseEnabled}
                    onCheckedChange={(checked) => setSettings({...settings, queryResponseEnabled: checked})}
                  />
                </div>
              </div>

              <Button onClick={saveSettings} className="w-full bg-gradient-primary">
                <Send className="w-4 h-4 mr-2" />
                Save Settings
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={sendShopOpenNotification} variant="outline" size="sm">
                  <Zap className="w-3 h-3 mr-1" />
                  Shop Open
                </Button>
                <Button onClick={sendShopCloseNotification} variant="outline" size="sm">
                  <Zap className="w-3 h-3 mr-1" />
                  Shop Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Report & Monitoring */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Summary */}
          {dailyReport && (
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Today's Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 border border-border rounded-lg">
                    <DollarSign className="w-6 h-6 text-success mx-auto mb-2" />
                    <div className="text-2xl font-bold">{formatCurrency(dailyReport.totalSales)}</div>
                    <div className="text-sm text-muted-foreground">Total Sales</div>
                  </div>
                  <div className="text-center p-3 border border-border rounded-lg">
                    <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">{formatCurrency(dailyReport.netProfit)}</div>
                    <div className="text-sm text-muted-foreground">Net Profit</div>
                  </div>
                  <div className="text-center p-3 border border-border rounded-lg">
                    <Package className="w-6 h-6 text-warning mx-auto mb-2" />
                    <div className="text-2xl font-bold">{dailyReport.lowStockCount}</div>
                    <div className="text-sm text-muted-foreground">Low Stock</div>
                  </div>
                  <div className="text-center p-3 border border-border rounded-lg">
                    <Users className="w-6 h-6 text-accent mx-auto mb-2" />
                    <div className="text-2xl font-bold">{dailyReport.transactionCount}</div>
                    <div className="text-sm text-muted-foreground">Transactions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activities */}
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Real-time Activity Monitor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'sale' ? 'bg-success/10 text-success' :
                      activity.type === 'expense' ? 'bg-destructive/10 text-destructive' :
                      'bg-warning/10 text-warning'
                    }`}>
                      {activity.type === 'sale' && <DollarSign className="w-4 h-4" />}
                      {activity.type === 'expense' && <TrendingDown className="w-4 h-4" />}
                      {activity.type === 'stock_low' && <Package className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {activity.type === 'sale' && `Sale: ${formatCurrency(activity.data.total_amount)}`}
                        {activity.type === 'expense' && `Expense: ${formatCurrency(activity.data.amount)}`}
                        {activity.type === 'stock_low' && `Low Stock Alert`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="bg-gradient-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                AI Insights & Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <span className="font-medium text-success">Performance Insight</span>
                  </div>
                  <p className="text-sm">Sales are 12% higher than yesterday. Peak hours: 2-4 PM.</p>
                </div>

                <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <span className="font-medium text-warning">Stock Alert</span>
                  </div>
                  <p className="text-sm">5 products below minimum stock. Reorder recommended.</p>
                </div>

                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span className="font-medium text-primary">WhatsApp Ready</span>
                  </div>
                  <p className="text-sm">Send messages like "Today's profit?" to get instant reports.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIReportingSystem;