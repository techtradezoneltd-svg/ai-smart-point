import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { startOfDay, endOfDay, format } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  Loader2,
  Wallet,
  BarChart3,
  Truck,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Calendar as CalendarIcon,
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
    myTransactions: 0,
    totalProducts: 0,
    totalExpenses: 0,
    totalCustomers: 0,
    totalSuppliers: 0,
    stockValue: 0,
    loanBalance: 0,
    netProfit: 0,
    yesterdaySales: 0,
    yesterdayTransactions: 0,
    yesterdayExpenses: 0,
    yesterdayNetProfit: 0,
    yesterdayCustomers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  });

  const currentCurrency = settings?.company.currency || "USD";
  const formatCurrency = (amount: number) => formatCurrencyUtil(amount, currentCurrency);

  const pctChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const ChangeLabel = ({ current, previous, label = "vs previous period" }: { current: number; previous: number; label?: string }) => {
    const change = pctChange(current, previous);
    if (change === 0 && current === 0 && previous === 0) {
      return <p className="text-xs text-muted-foreground">No data yet</p>;
    }

    return (
      <p className="text-xs flex items-center gap-1">
        {change >= 0 ? <ArrowUpRight className="w-3 h-3 text-green-500" /> : <ArrowDownRight className="w-3 h-3 text-destructive" />}
        <span className={change >= 0 ? "text-green-500" : "text-destructive"}>
          {change >= 0 ? "+" : ""}
          {change.toFixed(1)}%
        </span>
        <span className="text-muted-foreground">{label}</span>
      </p>
    );
  };

  useEffect(() => {
    if (permissions.loading || !permissions.role) return;
    loadDashboardData();
  }, [permissions.loading, permissions.role, dateRange]);

  const loadDashboardData = async () => {
    setLoading(true);

    try {
      const rangeFrom = dateRange?.from || new Date();
      const rangeTo = dateRange?.to || rangeFrom;
      const normalizedFrom = startOfDay(rangeFrom);
      const normalizedTo = endOfDay(rangeTo);
      const startOfRange = normalizedFrom.toISOString();
      const endOfRange = normalizedTo.toISOString();
      const rangeFromDateStr = format(normalizedFrom, "yyyy-MM-dd");
      const rangeToDateStr = format(normalizedTo, "yyyy-MM-dd");

      const rangeDuration = normalizedTo.getTime() - normalizedFrom.getTime();
      const prevEnd = new Date(normalizedFrom.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - rangeDuration);
      const startOfPrev = startOfDay(prevStart).toISOString();
      const endOfPrev = endOfDay(prevEnd).toISOString();
      const prevFromDateStr = format(startOfDay(prevStart), "yyyy-MM-dd");
      const prevToDateStr = format(endOfDay(prevEnd), "yyyy-MM-dd");

      if (permissions.isAdmin || permissions.isManager || permissions.isSupervisor) {
        const [
          salesData,
          customersData,
          productsResult,
          loansData,
          expensesData,
          allCustomers,
          suppliersData,
          loansFullData,
          previousSalesData,
          previousCustomersData,
          previousExpensesData,
        ] = await Promise.all([
          supabase.from("sales").select("total_amount").gte("created_at", startOfRange).lte("created_at", endOfRange),
          supabase.from("sales").select("customer_id").gte("created_at", startOfRange).lte("created_at", endOfRange).not("customer_id", "is", null),
          supabase.from("products").select("id, current_stock, min_stock_level, cost_price, selling_price, is_active"),
          supabase.from("loans").select("id").in("status", ["active", "overdue"]),
          supabase.from("expenses").select("amount").gte("expense_date", rangeFromDateStr).lte("expense_date", rangeToDateStr),
          supabase.from("customers").select("id", { count: "exact", head: true }),
          supabase.from("suppliers").select("id", { count: "exact", head: true }),
          supabase.from("loans").select("remaining_balance").in("status", ["active", "overdue"]),
          supabase.from("sales").select("total_amount").gte("created_at", startOfPrev).lte("created_at", endOfPrev),
          supabase.from("sales").select("customer_id").gte("created_at", startOfPrev).lte("created_at", endOfPrev).not("customer_id", "is", null),
          supabase.from("expenses").select("amount").gte("expense_date", prevFromDateStr).lte("expense_date", prevToDateStr),
        ]);

        const lowStockItems =
          productsResult.data?.filter(
            (product) =>
              product.current_stock !== null &&
              product.min_stock_level !== null &&
              product.current_stock <= product.min_stock_level
          ) || [];

        const totalSales = salesData.data?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
        const transactions = salesData.data?.length || 0;
        const uniqueCustomers = new Set(customersData.data?.map((sale) => sale.customer_id)).size;
        const totalExpenses = expensesData.data?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
        const activeProducts = productsResult.data?.filter((product) => product.is_active) || [];
        const stockValue = activeProducts.reduce(
          (sum, product) => sum + Number(product.cost_price) * (product.current_stock || 0),
          0
        );
        const loanBalance = loansFullData.data?.reduce((sum, loan) => sum + Number(loan.remaining_balance), 0) || 0;

        const previousSales = previousSalesData.data?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
        const previousTransactions = previousSalesData.data?.length || 0;
        const previousExpenses = previousExpensesData.data?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
        const previousCustomers = new Set(previousCustomersData.data?.map((sale) => sale.customer_id)).size;

        setTodayStats({
          sales: totalSales,
          transactions,
          customers: uniqueCustomers,
          lowStock: lowStockItems.length,
          pendingLoans: loansData.data?.length || 0,
          myTransactions: 0,
          totalProducts: activeProducts.length,
          totalExpenses,
          totalCustomers: allCustomers.count || 0,
          totalSuppliers: suppliersData.count || 0,
          stockValue,
          loanBalance,
          netProfit: totalSales - totalExpenses,
          yesterdaySales: previousSales,
          yesterdayTransactions: previousTransactions,
          yesterdayExpenses: previousExpenses,
          yesterdayNetProfit: previousSales - previousExpenses,
          yesterdayCustomers: previousCustomers,
        });
      } else if (permissions.isCashier) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const [mySalesData, loansData] = await Promise.all([
          supabase
            .from("sales")
            .select("total_amount")
            .eq("created_by", user?.id)
            .gte("created_at", startOfRange)
            .lte("created_at", endOfRange),
          supabase.from("loans").select("id").in("status", ["active", "overdue"]),
        ]);

        const myTotalSales = mySalesData.data?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
        const myTransactions = mySalesData.data?.length || 0;

        setTodayStats({
          sales: myTotalSales,
          transactions: 0,
          customers: 0,
          lowStock: 0,
          pendingLoans: loansData.data?.length || 0,
          myTransactions,
          totalProducts: 0,
          totalExpenses: 0,
          totalCustomers: 0,
          totalSuppliers: 0,
          stockValue: 0,
          loanBalance: 0,
          netProfit: 0,
          yesterdaySales: 0,
          yesterdayTransactions: 0,
          yesterdayExpenses: 0,
          yesterdayNetProfit: 0,
          yesterdayCustomers: 0,
        });
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
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

  const isMultiDayRange = Boolean(
    dateRange?.from &&
      dateRange?.to &&
      startOfDay(dateRange.from).getTime() !== startOfDay(dateRange.to).getTime()
  );

  const dateRangeLabel = dateRange?.from
    ? isMultiDayRange && dateRange.to
      ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d, yyyy")}`
      : format(dateRange.from, "MMM d, yyyy")
    : "Pick dates";

  const renderHeader = (
    title: string,
    description: string,
    badgeLabel: string,
    badgeClassName?: string
  ) => (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full sm:w-[260px] justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRangeLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        <Badge variant="outline" className={badgeClassName}>
          {badgeLabel}
        </Badge>
      </div>
    </div>
  );

  // Admin Dashboard
  if (permissions.isAdmin) {
    return (
      <div className="space-y-6">
        {renderHeader(
          "Admin Dashboard",
          "Complete system overview and control",
          "Administrator",
          "border-primary text-primary"
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("sales-history")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{formatCurrency(todayStats.sales)}</div>
              <ChangeLabel current={todayStats.sales} previous={todayStats.yesterdaySales} />
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("sales-history")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              {todayStats.netProfit >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-destructive" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${todayStats.netProfit >= 0 ? "text-green-500" : "text-destructive"}`}>
                {formatCurrency(todayStats.netProfit)}
              </div>
              <ChangeLabel current={todayStats.netProfit} previous={todayStats.yesterdayNetProfit} />
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("customers")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.customers}</div>
              <ChangeLabel current={todayStats.customers} previous={todayStats.yesterdayCustomers} />
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("stock")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{todayStats.lowStock}</div>
              <p className="text-xs text-muted-foreground">Need restocking</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("loans")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{todayStats.pendingLoans}</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("loans")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loan Balance</CardTitle>
              <CreditCard className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(todayStats.loanBalance)}</div>
              <p className="text-xs text-muted-foreground">Outstanding amount</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("products")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">Active in inventory</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("stock")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(todayStats.stockValue)}</div>
              <p className="text-xs text-muted-foreground">Inventory at cost</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("expenses")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expenses</CardTitle>
              <Wallet className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(todayStats.totalExpenses)}</div>
              <ChangeLabel current={todayStats.totalExpenses} previous={todayStats.yesterdayExpenses} />
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("customers")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">Registered customers</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("suppliers")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
              <Truck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.totalSuppliers}</div>
              <p className="text-xs text-muted-foreground">Active suppliers</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Button onClick={() => onNavigate("staff")} className="h-24 flex flex-col items-center justify-center gap-2">
            <Users className="w-6 h-6" />
            <span>Manage Users</span>
          </Button>
          <Button onClick={() => onNavigate("settings")} className="h-24 flex flex-col items-center justify-center gap-2">
            <Package className="w-6 h-6" />
            <span>System Settings</span>
          </Button>
          <Button onClick={() => onNavigate("reports")} className="h-24 flex flex-col items-center justify-center gap-2">
            <TrendingUp className="w-6 h-6" />
            <span>View Reports</span>
          </Button>
          <Button onClick={() => onNavigate("audit-logs")} className="h-24 flex flex-col items-center justify-center gap-2">
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
        {renderHeader(
          "Manager Dashboard",
          "Operations and performance overview",
          "Manager",
          "border-accent text-accent"
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sales</CardTitle>
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
          <Button onClick={() => onNavigate("products")} className="h-24 flex flex-col items-center justify-center gap-2">
            <Package className="w-6 h-6" />
            <span>Products</span>
          </Button>
          <Button onClick={() => onNavigate("reports")} className="h-24 flex flex-col items-center justify-center gap-2">
            <TrendingUp className="w-6 h-6" />
            <span>Reports</span>
          </Button>
          <Button onClick={() => onNavigate("expenses")} className="h-24 flex flex-col items-center justify-center gap-2">
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
        {renderHeader("Supervisor Dashboard", "Operations monitoring", "Supervisor")}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sales</CardTitle>
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
          <Button onClick={() => onNavigate("stock")} className="h-24 flex flex-col items-center justify-center gap-2">
            <Package className="w-6 h-6" />
            <span>Inventory</span>
          </Button>
          <Button onClick={() => onNavigate("saleshistory")} className="h-24 flex flex-col items-center justify-center gap-2">
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
        {renderHeader("Cashier Dashboard", "Your sales performance", "Cashier")}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Sales</CardTitle>
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
          <Button onClick={() => onNavigate("pos")} size="lg" className="h-32 flex flex-col items-center justify-center gap-3">
            <ShoppingCart className="w-8 h-8" />
            <span className="text-lg">New Sale</span>
          </Button>
          <Button onClick={() => onNavigate("loans")} size="lg" variant="outline" className="h-32 flex flex-col items-center justify-center gap-3">
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
