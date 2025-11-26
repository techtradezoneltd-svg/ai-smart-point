import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from "date-fns";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Package, 
  Brain, 
  Zap,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  Eye,
  TrendingDown,
  Calendar
} from "lucide-react";

interface DashboardProps {
  onNavigate: (view: string) => void;
}

const Dashboard = ({ onNavigate }: DashboardProps) => {
  const { settings } = useSettings();
  const [profitPeriod, setProfitPeriod] = useState<string>("today");
  const [profitData, setProfitData] = useState({ profit: 0, sales: 0, change: 0 });
  const [loading, setLoading] = useState(false);
  const [todayStats, setTodayStats] = useState({
    sales: 0,
    transactions: 0,
    customers: 0,
    aiInsights: 0
  });
  const [aiAlerts, setAiAlerts] = useState<any[]>([]);
  const [quickActions, setQuickActions] = useState<any[]>([]);

  // Get currency from settings
  const currentCurrency = settings?.company.currency || 'USD';
  
  // Format currency using the centralized utility
  const formatCurrency = (amount: number) => {
    return formatCurrencyUtil(amount, currentCurrency);
  };

  // Calculate profit for selected period
  const calculateProfit = async (period: string) => {
    setLoading(true);
    
    try {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;
      
      switch (period) {
        case "today":
          startDate = startOfDay(now);
          endDate = endOfDay(now);
          break;
        case "week":
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          endDate = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case "month":
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case "year":
          startDate = startOfYear(now);
          endDate = endOfYear(now);
          break;
        default:
          startDate = startOfDay(now);
          endDate = endOfDay(now);
      }

      const { data: salesData, error } = await supabase
        .from('sales')
        .select(`
          id,
          total_amount,
          created_at,
          sale_items (
            quantity,
            unit_price,
            product_id,
            products (
              cost_price
            )
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) {
        console.error('Error fetching sales data:', error);
        return;
      }

      let totalProfit = 0;
      let totalSales = 0;

      salesData?.forEach(sale => {
        totalSales += Number(sale.total_amount);
        
        sale.sale_items?.forEach(item => {
          const costPrice = Number(item.products?.cost_price || 0);
          const sellingPrice = Number(item.unit_price);
          const quantity = Number(item.quantity);
          
          const itemProfit = (sellingPrice - costPrice) * quantity;
          totalProfit += itemProfit;
        });
      });

      // Calculate previous period for comparison
      let prevStartDate: Date;
      let prevEndDate: Date;
      
      const periodDiff = endDate.getTime() - startDate.getTime();
      prevEndDate = new Date(startDate.getTime() - 1);
      prevStartDate = new Date(prevEndDate.getTime() - periodDiff);

      const { data: prevSalesData } = await supabase
        .from('sales')
        .select(`
          sale_items (
            quantity,
            unit_price,
            products (
              cost_price
            )
          )
        `)
        .gte('created_at', prevStartDate.toISOString())
        .lte('created_at', prevEndDate.toISOString());

      let prevProfit = 0;
      prevSalesData?.forEach(sale => {
        sale.sale_items?.forEach(item => {
          const costPrice = Number(item.products?.cost_price || 0);
          const sellingPrice = Number(item.unit_price);
          const quantity = Number(item.quantity);
          
          const itemProfit = (sellingPrice - costPrice) * quantity;
          prevProfit += itemProfit;
        });
      });

      const change = prevProfit > 0 ? ((totalProfit - prevProfit) / prevProfit) * 100 : 0;

      setProfitData({
        profit: totalProfit,
        sales: totalSales,
        change: change
      });

    } catch (error) {
      console.error('Error calculating profit:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load real-time stats
  const loadTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const startOfToday = `${today}T00:00:00`;
      const endOfToday = `${today}T23:59:59`;

      // Get today's sales
      const { data: salesData } = await supabase
        .from('sales')
        .select('total_amount')
        .gte('created_at', startOfToday)
        .lt('created_at', endOfToday);

      const totalSales = salesData?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
      const transactions = salesData?.length || 0;

      // Get unique customers today
      const { data: customersData } = await supabase
        .from('sales')
        .select('customer_id')
        .gte('created_at', startOfToday)
        .lt('created_at', endOfToday)
        .not('customer_id', 'is', null);

      const uniqueCustomers = new Set(customersData?.map(s => s.customer_id)).size;

      // Get unread AI recommendations
      const { data: recommendations } = await supabase
        .from('ai_recommendations')
        .select('id')
        .eq('is_read', false);

      setTodayStats({
        sales: totalSales,
        transactions,
        customers: uniqueCustomers,
        aiInsights: recommendations?.length || 0
      });
    } catch (error) {
      console.error('Error loading today stats:', error);
    }
  };

  // Load AI alerts from database
  const loadAiAlerts = async () => {
    try {
      const { data: recommendations } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(3);

      if (recommendations) {
        setAiAlerts(recommendations.map(rec => ({
          type: rec.type,
          message: rec.message,
          priority: rec.priority
        })));
      }
    } catch (error) {
      console.error('Error loading AI alerts:', error);
    }
  };

  // Load quick actions from database
  const loadQuickActions = async () => {
    try {
      const { data: actions } = await supabase
        .from('quick_actions')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (actions) {
        setQuickActions(actions.map(action => ({
          icon: action.icon === 'ShoppingCart' ? ShoppingCart :
                action.icon === 'Package' ? Package :
                action.icon === 'Users' ? Users :
                action.icon === 'BarChart3' ? BarChart3 : ShoppingCart,
          label: action.label,
          action: action.action,
          color: action.color_class
        })));
      }
    } catch (error) {
      console.error('Error loading quick actions:', error);
    }
  };

  useEffect(() => {
    calculateProfit(profitPeriod);
    loadTodayStats();
    loadAiAlerts();
    loadQuickActions();

    // Set up real-time subscriptions
    const salesChannel = supabase
      .channel('dashboard-sales')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sales'
      }, () => {
        loadTodayStats();
        calculateProfit(profitPeriod);
      })
      .subscribe();

    const recommendationsChannel = supabase
      .channel('dashboard-recommendations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ai_recommendations'
      }, () => {
        loadAiAlerts();
        loadTodayStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(salesChannel);
      supabase.removeChannel(recommendationsChannel);
    };
  }, [profitPeriod]);

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case "today": return "Today";
      case "week": return "This Week";
      case "month": return "This Month";
      case "year": return "This Year";
      default: return "Today";
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            AI-Powered POS Dashboard
          </h1>
          <p className="text-muted-foreground">Intelligent retail management system</p>
        </div>
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary animate-pulse-glow" />
          <Badge variant="outline" className="border-primary text-primary">
            AI Active
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-gradient-card border-primary/20 hover:shadow-glow transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(todayStats.sales)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline w-3 h-3 mr-1" />
              +12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-accent/20 hover:shadow-accent-glow transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{todayStats.transactions}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline w-3 h-3 mr-1" />
              +8% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-primary/20 hover:shadow-glow transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{todayStats.customers}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline w-3 h-3 mr-1" />
              +15% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-warning/20 hover:shadow-elegant transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
            <Brain className="h-4 w-4 text-warning animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{todayStats.aiInsights}</div>
            <p className="text-xs text-muted-foreground">New recommendations</p>
          </CardContent>
        </Card>

        {/* Profit Card */}
        <Card className="bg-gradient-card border-success/20 hover:shadow-success-glow transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Profit</CardTitle>
              <Select value={profitPeriod} onValueChange={setProfitPeriod}>
                <SelectTrigger className="w-auto h-6 text-xs border-none bg-transparent p-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold text-muted-foreground">...</div>
            ) : (
              <>
                <div className="text-2xl font-bold text-success">
                  {formatCurrency(profitData.profit)}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {profitData.change >= 0 ? (
                    <TrendingUp className="inline w-3 h-3 text-success" />
                  ) : (
                    <TrendingDown className="inline w-3 h-3 text-destructive" />
                  )}
                  <span className={profitData.change >= 0 ? "text-success" : "text-destructive"}>
                    {profitData.change >= 0 ? '+' : ''}{profitData.change.toFixed(1)}%
                  </span>
                  <span>vs prev {profitPeriod === 'today' ? 'day' : profitPeriod}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sales: {formatCurrency(profitData.sales)}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                onClick={() => onNavigate(action.action)}
                className={`h-24 flex flex-col items-center justify-center gap-2 ${action.color} hover:scale-105 transition-all duration-300`}
                size="lg"
              >
                <action.icon className="w-6 h-6" />
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Alerts */}
      <Card className="bg-gradient-card border-warning/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-warning animate-pulse" />
            AI Intelligence Center
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {aiAlerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                alert.priority === 'high' 
                  ? 'border-destructive bg-destructive/10' 
                  : 'border-warning bg-warning/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                    alert.priority === 'high' ? 'text-destructive' : 'text-warning'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">{alert.message}</p>
                    <Badge 
                      variant="outline" 
                      className={`mt-2 text-xs ${
                        alert.priority === 'high' 
                          ? 'border-destructive text-destructive' 
                          : 'border-warning text-warning'
                      }`}
                    >
                      {alert.priority} priority
                    </Badge>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="ml-4">
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;