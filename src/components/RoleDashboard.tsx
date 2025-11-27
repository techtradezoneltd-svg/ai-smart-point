import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePermissions } from "@/hooks/usePermissions";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { startOfDay, endOfDay } from "date-fns";
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  Loader2
} from "lucide-react";

interface RoleDashboardProps {
  onNavigate: (view: string) => void;
}

export const RoleDashboard = ({ onNavigate }: RoleDashboardProps) => {
  const permissions = usePermissions();
  const { settings } = useSettings();
  const [todayStats, setTodayStats] = useState({
    sales: 0,
    transactions: 0,
    customers: 0,
    lowStock: 0,
    pendingLoans: 0,
    myTransactions: 0
  });
  const [loading, setLoading] = useState(true);

  const currentCurrency = settings?.company.currency || 'USD';
  const formatCurrency = (amount: number) => formatCurrencyUtil(amount, currentCurrency);

  useEffect(() => {
    loadDashboardData();
  }, [permissions.role]);

  const loadDashboardData = async () => {
    try {
      const today = new Date();
      const startOfToday = startOfDay(today).toISOString();
      const endOfToday = endOfDay(today).toISOString();

      // Load data based on role
      if (permissions.isAdmin || permissions.isManager || permissions.isSupervisor) {
        // Full access to all stats
        const [salesData, customersData, productsResult, loansData] = await Promise.all([
          supabase.from('sales').select('total_amount').gte('created_at', startOfToday).lt('created_at', endOfToday),
          supabase.from('sales').select('customer_id').gte('created_at', startOfToday).lt('created_at', endOfToday).not('customer_id', 'is', null),
          supabase.from('products').select('id, current_stock, min_stock_level'),
          supabase.from('loans').select('id').in('status', ['active', 'overdue'])
        ]);

        // Filter low stock products
        const productsData = {
          data: productsResult.data?.filter(p => 
            p.current_stock !== null && 
            p.min_stock_level !== null && 
            p.current_stock <= p.min_stock_level
          ) || []
        };

        const totalSales = salesData.data?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
        const transactions = salesData.data?.length || 0;
        const uniqueCustomers = new Set(customersData.data?.map(s => s.customer_id)).size;
        const lowStock = productsData.data?.length || 0;
        const pendingLoans = loansData.data?.length || 0;

        setTodayStats({
          sales: totalSales,
          transactions,
          customers: uniqueCustomers,
          lowStock,
          pendingLoans,
          myTransactions: 0
        });
      } else if (permissions.isCashier) {
        // Limited to own transactions
        const { data: { user } } = await supabase.auth.getUser();
        
        const [mySalesData, loansData] = await Promise.all([
          supabase.from('sales').select('total_amount').eq('created_by', user?.id).gte('created_at', startOfToday).lt('created_at', endOfToday),
          supabase.from('loans').select('id').in('status', ['active', 'overdue'])
        ]);

        const myTotalSales = mySalesData.data?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
        const myTransactions = mySalesData.data?.length || 0;

        setTodayStats({
          sales: myTotalSales,
          transactions: 0,
          customers: 0,
          lowStock: 0,
          pendingLoans: loansData.data?.length || 0,
          myTransactions
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (permissions.loading || loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Admin Dashboard
  if (permissions.isAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Complete system overview and control</p>
          </div>
          <Badge variant="outline" className="border-primary text-primary">Administrator</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{formatCurrency(todayStats.sales)}</div>
              <p className="text-xs text-muted-foreground">{todayStats.transactions} transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.customers}</div>
              <p className="text-xs text-muted-foreground">Served today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{todayStats.lowStock}</div>
              <p className="text-xs text-muted-foreground">Need restocking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{todayStats.pendingLoans}</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Button onClick={() => onNavigate('users')} className="h-24 flex flex-col items-center justify-center gap-2">
            <Users className="w-6 h-6" />
            <span>Manage Users</span>
          </Button>
          <Button onClick={() => onNavigate('settings')} className="h-24 flex flex-col items-center justify-center gap-2">
            <Package className="w-6 h-6" />
            <span>System Settings</span>
          </Button>
          <Button onClick={() => onNavigate('reports')} className="h-24 flex flex-col items-center justify-center gap-2">
            <TrendingUp className="w-6 h-6" />
            <span>View Reports</span>
          </Button>
          <Button onClick={() => onNavigate('audit')} className="h-24 flex flex-col items-center justify-center gap-2">
            <CheckCircle className="w-6 h-6" />
            <span>Audit Logs</span>
          </Button>
        </div>
      </div>
    );
  }

  // Manager Dashboard
  if (permissions.isManager) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manager Dashboard</h1>
            <p className="text-muted-foreground">Operations and performance overview</p>
          </div>
          <Badge variant="outline" className="border-accent text-accent">Manager</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{formatCurrency(todayStats.sales)}</div>
              <p className="text-xs text-muted-foreground">{todayStats.transactions} transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{todayStats.lowStock}</div>
              <p className="text-xs text-muted-foreground">Items to restock</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{todayStats.pendingLoans}</div>
              <p className="text-xs text-muted-foreground">Need follow-up</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Button onClick={() => onNavigate('products')} className="h-24 flex flex-col items-center justify-center gap-2">
            <Package className="w-6 h-6" />
            <span>Products</span>
          </Button>
          <Button onClick={() => onNavigate('reports')} className="h-24 flex flex-col items-center justify-center gap-2">
            <TrendingUp className="w-6 h-6" />
            <span>Reports</span>
          </Button>
          <Button onClick={() => onNavigate('expenses')} className="h-24 flex flex-col items-center justify-center gap-2">
            <DollarSign className="w-6 h-6" />
            <span>Expenses</span>
          </Button>
        </div>
      </div>
    );
  }

  // Supervisor Dashboard
  if (permissions.isSupervisor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Supervisor Dashboard</h1>
            <p className="text-muted-foreground">Daily operations monitoring</p>
          </div>
          <Badge variant="outline">Supervisor</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{formatCurrency(todayStats.sales)}</div>
              <p className="text-xs text-muted-foreground">{todayStats.transactions} transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Alerts</CardTitle>
              <Package className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{todayStats.lowStock}</div>
              <p className="text-xs text-muted-foreground">Low stock items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loans</CardTitle>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{todayStats.pendingLoans}</div>
              <p className="text-xs text-muted-foreground">Active loans</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button onClick={() => onNavigate('stock')} className="h-24 flex flex-col items-center justify-center gap-2">
            <Package className="w-6 h-6" />
            <span>Inventory</span>
          </Button>
          <Button onClick={() => onNavigate('sales-history')} className="h-24 flex flex-col items-center justify-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            <span>Sales History</span>
          </Button>
        </div>
      </div>
    );
  }

  // Cashier Dashboard
  if (permissions.isCashier) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cashier Dashboard</h1>
            <p className="text-muted-foreground">Your daily performance</p>
          </div>
          <Badge variant="outline">Cashier</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Sales Today</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{formatCurrency(todayStats.sales)}</div>
              <p className="text-xs text-muted-foreground">{todayStats.myTransactions} transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{todayStats.pendingLoans}</div>
              <p className="text-xs text-muted-foreground">Requiring payment</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button onClick={() => onNavigate('pos')} size="lg" className="h-32 flex flex-col items-center justify-center gap-3">
            <ShoppingCart className="w-8 h-8" />
            <span className="text-lg">New Sale</span>
          </Button>
          <Button onClick={() => onNavigate('loans')} size="lg" variant="outline" className="h-32 flex flex-col items-center justify-center gap-3">
            <Clock className="w-8 h-8" />
            <span className="text-lg">Manage Loans</span>
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default RoleDashboard;
