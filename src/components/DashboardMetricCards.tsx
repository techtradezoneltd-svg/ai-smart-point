import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency";
import { useSettings } from "@/contexts/SettingsContext";
import {
  Package,
  AlertTriangle,
  Wallet,
  Users,
  Truck,
  CreditCard,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from "lucide-react";

interface MetricDetail {
  label: string;
  value: string;
}

interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  subtitle: string;
  icon: any;
  color: string;
  borderColor: string;
  details: MetricDetail[];
}

const DashboardMetricCards = () => {
  const { settings } = useSettings();
  const currentCurrency = settings?.company.currency || "USD";
  const formatCurrency = (amount: number) => formatCurrencyUtil(amount, currentCurrency);

  const [selectedCard, setSelectedCard] = useState<MetricCard | null>(null);
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllMetrics();
  }, []);

  const loadAllMetrics = async () => {
    try {
      const [
        productsRes,
        expensesRes,
        customersRes,
        suppliersRes,
        loansRes,
        salesRes,
      ] = await Promise.all([
        supabase.from("products").select("id, name, cost_price, selling_price, current_stock, min_stock_level, is_active"),
        supabase.from("expenses").select("id, title, amount, category, expense_date"),
        supabase.from("customers").select("id, name, phone, is_active"),
        supabase.from("suppliers").select("id, name, status, total_orders, total_value"),
        supabase.from("loans").select("id, total_amount, remaining_balance, paid_amount, status, customers(name)"),
        supabase.from("sales").select("id, total_amount, sale_items(quantity, unit_price, products(cost_price))"),
      ]);

      const products = productsRes.data || [];
      const expenses = expensesRes.data || [];
      const customers = customersRes.data || [];
      const suppliers = suppliersRes.data || [];
      const loans = loansRes.data || [];
      const sales = salesRes.data || [];

      // 1. Total Products & Net Profit in Products
      const activeProducts = products.filter((p) => p.is_active);
      const totalStockValue = activeProducts.reduce(
        (sum, p) => sum + (p.current_stock || 0) * (p.cost_price || 0), 0
      );
      const totalRetailValue = activeProducts.reduce(
        (sum, p) => sum + (p.current_stock || 0) * (p.selling_price || 0), 0
      );
      const potentialProfit = totalRetailValue - totalStockValue;

      // 2. Low stock
      const lowStockItems = activeProducts.filter(
        (p) => (p.current_stock || 0) <= (p.min_stock_level || 10)
      );

      // 3. Total Expenses
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const expensesByCategory: Record<string, number> = {};
      expenses.forEach((e) => {
        expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + Number(e.amount);
      });

      // 4. Total Customers
      const activeCustomers = customers.filter((c) => c.is_active);

      // 5. Total Suppliers
      const activeSuppliers = suppliers.filter((s) => s.status === "active");
      const totalSupplierValue = suppliers.reduce((sum, s) => sum + Number(s.total_value || 0), 0);

      // 6. Loans Summary
      const activeLoans = loans.filter((l) => l.status === "active" || l.status === "overdue");
      const totalLoanAmount = activeLoans.reduce((sum, l) => sum + Number(l.remaining_balance), 0);
      const overdueLoans = loans.filter((l) => l.status === "overdue");

      // 7. Net Sales Profit
      let totalSalesProfit = 0;
      sales.forEach((sale) => {
        (sale.sale_items || []).forEach((item: any) => {
          const cost = Number(item.products?.cost_price || 0);
          const selling = Number(item.unit_price);
          const qty = Number(item.quantity);
          totalSalesProfit += (selling - cost) * qty;
        });
      });

      const cards: MetricCard[] = [
        {
          id: "net_profit",
          title: "Net Sales Profit",
          value: formatCurrency(totalSalesProfit),
          subtitle: `From ${sales.length} total sales`,
          icon: TrendingUp,
          color: "text-success",
          borderColor: "border-success/20",
          details: [
            { label: "Total Sales Count", value: String(sales.length) },
            { label: "Total Revenue", value: formatCurrency(sales.reduce((s, sl) => s + Number(sl.total_amount), 0)) },
            { label: "Total Cost of Goods", value: formatCurrency(sales.reduce((s, sl) => s + Number(sl.total_amount), 0) - totalSalesProfit) },
            { label: "Net Profit", value: formatCurrency(totalSalesProfit) },
            { label: "Avg Profit/Sale", value: sales.length ? formatCurrency(totalSalesProfit / sales.length) : formatCurrency(0) },
          ],
        },
        {
          id: "stock_value",
          title: "Stock Value",
          value: formatCurrency(totalStockValue),
          subtitle: `Retail: ${formatCurrency(totalRetailValue)}`,
          icon: BarChart3,
          color: "text-primary",
          borderColor: "border-primary/20",
          details: [
            { label: "Total Products", value: String(activeProducts.length) },
            { label: "Cost Value", value: formatCurrency(totalStockValue) },
            { label: "Retail Value", value: formatCurrency(totalRetailValue) },
            { label: "Potential Profit", value: formatCurrency(potentialProfit) },
            { label: "Profit Margin", value: totalRetailValue > 0 ? `${((potentialProfit / totalRetailValue) * 100).toFixed(1)}%` : "0%" },
          ],
        },
        {
          id: "total_products",
          title: "Total Products",
          value: activeProducts.length,
          subtitle: `${products.length - activeProducts.length} inactive`,
          icon: Package,
          color: "text-accent",
          borderColor: "border-accent/20",
          details: [
            { label: "Active Products", value: String(activeProducts.length) },
            { label: "Inactive Products", value: String(products.length - activeProducts.length) },
            { label: "Total Items in Stock", value: String(activeProducts.reduce((s, p) => s + (p.current_stock || 0), 0)) },
            { label: "Avg Stock/Product", value: activeProducts.length ? String(Math.round(activeProducts.reduce((s, p) => s + (p.current_stock || 0), 0) / activeProducts.length)) : "0" },
          ],
        },
        {
          id: "low_stock",
          title: "Low Stock Alerts",
          value: lowStockItems.length,
          subtitle: lowStockItems.length > 0 ? "Need restocking" : "All stocked",
          icon: AlertTriangle,
          color: lowStockItems.length > 0 ? "text-destructive" : "text-success",
          borderColor: lowStockItems.length > 0 ? "border-destructive/20" : "border-success/20",
          details: lowStockItems.length > 0
            ? lowStockItems.slice(0, 10).map((p) => ({
                label: p.name,
                value: `${p.current_stock || 0} / ${p.min_stock_level || 10} min`,
              }))
            : [{ label: "Status", value: "All products are well stocked ✓" }],
        },
        {
          id: "expenses",
          title: "Total Expenses",
          value: formatCurrency(totalExpenses),
          subtitle: `${expenses.length} expense records`,
          icon: Wallet,
          color: "text-warning",
          borderColor: "border-warning/20",
          details: Object.entries(expensesByCategory).map(([cat, amt]) => ({
            label: cat.charAt(0).toUpperCase() + cat.slice(1),
            value: formatCurrency(amt),
          })),
        },
        {
          id: "customers",
          title: "Total Customers",
          value: activeCustomers.length,
          subtitle: `${customers.length - activeCustomers.length} inactive`,
          icon: Users,
          color: "text-primary",
          borderColor: "border-primary/20",
          details: [
            { label: "Active Customers", value: String(activeCustomers.length) },
            { label: "Inactive Customers", value: String(customers.length - activeCustomers.length) },
            { label: "Total Registered", value: String(customers.length) },
          ],
        },
        {
          id: "loans_outstanding",
          title: "Outstanding Loans",
          value: formatCurrency(totalLoanAmount),
          subtitle: `${activeLoans.length} active, ${overdueLoans.length} overdue`,
          icon: CreditCard,
          color: overdueLoans.length > 0 ? "text-destructive" : "text-accent",
          borderColor: overdueLoans.length > 0 ? "border-destructive/20" : "border-accent/20",
          details: [
            { label: "Active Loans", value: String(activeLoans.length) },
            { label: "Overdue Loans", value: String(overdueLoans.length) },
            { label: "Total Outstanding", value: formatCurrency(totalLoanAmount) },
            { label: "Total Paid", value: formatCurrency(loans.reduce((s, l) => s + Number(l.paid_amount || 0), 0)) },
            ...activeLoans.slice(0, 5).map((l: any) => ({
              label: l.customers?.name || "Unknown",
              value: formatCurrency(Number(l.remaining_balance)),
            })),
          ],
        },
      ];

      setMetrics(cards);
    } catch (error) {
      console.error("Error loading dashboard metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2"><div className="h-4 bg-muted rounded w-24" /></CardHeader>
            <CardContent><div className="h-8 bg-muted rounded w-32" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card
              key={metric.id}
              onClick={() => setSelectedCard(metric)}
              className={`cursor-pointer bg-gradient-card ${metric.borderColor} hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">{metric.subtitle}</p>
                  <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCard && <selectedCard.icon className={`w-5 h-5 ${selectedCard.color}`} />}
              {selectedCard?.title}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3 pr-4">
              {selectedCard?.details.map((detail, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <span className="text-sm text-muted-foreground">{detail.label}</span>
                  <Badge variant="secondary" className="font-mono text-sm">
                    {detail.value}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DashboardMetricCards;
