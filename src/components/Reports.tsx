import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { exportToPDF, exportSummaryToPDF, formatForExport } from "@/lib/exportImport";
import {
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  AlertTriangle,
  Target,
  FileText,
  PieChart,
  Activity,
  CreditCard,
  Loader2
} from "lucide-react";

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate = new Date();
    let endDate = new Date();

    switch (selectedPeriod) {
      case "week":
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
        endDate = now;
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      case "quarter":
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        endDate = now;
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
        break;
    }
    return { startDate, endDate };
  };

  const generateReport = async (reportName: string, category: string) => {
    setGeneratingReport(reportName);
    const { startDate, endDate } = getDateRange();
    
    try {
      let data: any[] = [];
      let title = reportName;
      let filename = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;

      switch (category) {
        case "Sales Reports":
          if (reportName.includes("Daily")) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { data: salesData, error } = await supabase
              .from('sales')
              .select('sale_number, customer_name, total_amount, payment_method, status, created_at')
              .gte('created_at', today.toISOString())
              .order('created_at', { ascending: false });
            if (error) throw error;
            data = formatForExport(salesData || [], []);
          } else if (reportName.includes("Category")) {
            const { data: salesData, error } = await supabase
              .from('sale_items')
              .select('quantity, total_price, products (name, categories (name))')
              .gte('created_at', startDate.toISOString())
              .lte('created_at', endDate.toISOString());
            if (error) throw error;
            
            const categoryStats: Record<string, { count: number; revenue: number }> = {};
            (salesData || []).forEach((item: any) => {
              const catName = item.products?.categories?.name || 'Uncategorized';
              if (!categoryStats[catName]) categoryStats[catName] = { count: 0, revenue: 0 };
              categoryStats[catName].count += item.quantity;
              categoryStats[catName].revenue += Number(item.total_price);
            });
            data = Object.entries(categoryStats).map(([category, stats]) => ({
              Category: category,
              'Items Sold': stats.count,
              'Total Revenue': stats.revenue.toFixed(2)
            }));
          } else if (reportName.includes("Payment Method")) {
            const { data: salesData, error } = await supabase
              .from('sales')
              .select('payment_method, total_amount')
              .gte('created_at', startDate.toISOString())
              .lte('created_at', endDate.toISOString());
            if (error) throw error;
            
            const methodStats: Record<string, { count: number; total: number }> = {};
            (salesData || []).forEach((sale: any) => {
              const method = sale.payment_method || 'Unknown';
              if (!methodStats[method]) methodStats[method] = { count: 0, total: 0 };
              methodStats[method].count += 1;
              methodStats[method].total += Number(sale.total_amount);
            });
            data = Object.entries(methodStats).map(([method, stats]) => ({
              'Payment Method': method,
              'Transactions': stats.count,
              'Total Amount': stats.total.toFixed(2)
            }));
          } else {
            const { data: salesData, error } = await supabase
              .from('sales')
              .select('sale_number, customer_name, total_amount, payment_method, status, created_at')
              .gte('created_at', startDate.toISOString())
              .lte('created_at', endDate.toISOString())
              .order('created_at', { ascending: false });
            if (error) throw error;
            data = formatForExport(salesData || [], []);
          }
          break;

        case "Inventory Reports":
          if (reportName.includes("Low Stock")) {
            const { data: products, error } = await supabase
              .from('products')
              .select('name, current_stock, min_stock_level, selling_price, categories (name)')
              .eq('is_active', true);
            if (error) throw error;
            data = (products || [])
              .filter((p: any) => p.current_stock <= p.min_stock_level)
              .map((p: any) => ({
                'Product Name': p.name,
                'Current Stock': p.current_stock,
                'Min Level': p.min_stock_level,
                'Category': p.categories?.name || 'N/A',
                'Unit Price': Number(p.selling_price).toFixed(2)
              }));
          } else if (reportName.includes("Dead Stock")) {
            const { data: products, error } = await supabase
              .from('products')
              .select('name, current_stock, selling_price, updated_at, categories (name)')
              .eq('is_active', true)
              .gt('current_stock', 0)
              .order('updated_at', { ascending: true })
              .limit(50);
            if (error) throw error;
            data = formatForExport(products || [], ['categories']);
          } else {
            const { data: products, error } = await supabase
              .from('products')
              .select('name, current_stock, min_stock_level, max_stock_level, cost_price, selling_price, categories (name), units (symbol)')
              .eq('is_active', true)
              .order('name');
            if (error) throw error;
            data = (products || []).map((p: any) => ({
              'Product': p.name,
              'Stock': p.current_stock,
              'Min': p.min_stock_level,
              'Max': p.max_stock_level,
              'Cost': Number(p.cost_price).toFixed(2),
              'Price': Number(p.selling_price).toFixed(2),
              'Category': p.categories?.name || 'N/A',
              'Unit': p.units?.symbol || 'pcs'
            }));
          }
          break;

        case "Customer Reports":
          if (reportName.includes("Top Customers")) {
            const { data: loans, error } = await supabase
              .from('loans')
              .select('customer_id, total_amount, paid_amount, customers (name, phone)');
            if (error) throw error;
            
            const customerStats: Record<string, { name: string; phone: string; totalPurchases: number; totalPaid: number }> = {};
            (loans || []).forEach((loan: any) => {
              const id = loan.customer_id;
              if (!customerStats[id]) {
                customerStats[id] = {
                  name: loan.customers?.name || 'Unknown',
                  phone: loan.customers?.phone || 'N/A',
                  totalPurchases: 0,
                  totalPaid: 0
                };
              }
              customerStats[id].totalPurchases += Number(loan.total_amount);
              customerStats[id].totalPaid += Number(loan.paid_amount);
            });
            data = Object.values(customerStats)
              .sort((a, b) => b.totalPurchases - a.totalPurchases)
              .slice(0, 20)
              .map(c => ({
                'Customer Name': c.name,
                'Phone': c.phone,
                'Total Purchases': c.totalPurchases.toFixed(2),
                'Total Paid': c.totalPaid.toFixed(2)
              }));
          } else {
            const { data: customers, error } = await supabase
              .from('customers')
              .select('name, phone, email, address, is_active, created_at')
              .order('name');
            if (error) throw error;
            data = formatForExport(customers || [], []);
          }
          break;

        case "Profit & Loss Reports":
          const [salesRes, expensesRes, loansRes] = await Promise.all([
            supabase.from('sales').select('total_amount, subtotal, discount_amount, tax_amount').gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString()),
            supabase.from('expenses').select('amount, category, title').gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString()),
            supabase.from('loans').select('total_amount, paid_amount, status').gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString())
          ]);

          const totalSales = (salesRes.data || []).reduce((sum, s) => sum + Number(s.total_amount), 0);
          const totalExpenses = (expensesRes.data || []).reduce((sum, e) => sum + Number(e.amount), 0);
          const loansIssued = (loansRes.data || []).reduce((sum, l) => sum + Number(l.total_amount), 0);
          const loansCollected = (loansRes.data || []).reduce((sum, l) => sum + Number(l.paid_amount), 0);

          exportSummaryToPDF(
            `${reportName} - ${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}ly Report`,
            filename,
            [
              {
                sectionTitle: 'Revenue',
                data: [
                  { label: 'Total Sales', value: formatCurrency(totalSales) },
                  { label: 'Loans Issued', value: formatCurrency(loansIssued) },
                  { label: 'Loans Collected', value: formatCurrency(loansCollected) }
                ]
              },
              {
                sectionTitle: 'Expenses',
                data: [
                  { label: 'Total Expenses', value: formatCurrency(totalExpenses) }
                ]
              },
              {
                sectionTitle: 'Summary',
                data: [
                  { label: 'Gross Profit', value: formatCurrency(totalSales - totalExpenses) },
                  { label: 'Outstanding Loans', value: formatCurrency(loansIssued - loansCollected) }
                ]
              }
            ],
            { companyName: 'SmartPOS' }
          );
          
          toast({
            title: "Report Generated",
            description: `${reportName} PDF downloaded successfully!`,
          });
          setGeneratingReport(null);
          return;

        default:
          break;
      }

      if (data.length === 0) {
        toast({
          title: "No Data",
          description: "No data available for this report in the selected period.",
          variant: "destructive"
        });
        setGeneratingReport(null);
        return;
      }

      exportToPDF(data, filename, title, {
        orientation: Object.keys(data[0]).length > 5 ? 'landscape' : 'portrait',
        includeTimestamp: true,
        companyName: 'SmartPOS'
      });

      toast({
        title: "Report Generated",
        description: `${reportName} PDF downloaded successfully!`,
      });
    } catch (error) {
      console.error("Report generation error:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGeneratingReport(null);
    }
  };

  const handleExportAll = async () => {
    setGeneratingReport("all");
    const { startDate, endDate } = getDateRange();
    
    try {
      // Fetch all data
      const [salesRes, productsRes, customersRes, expensesRes, loansRes] = await Promise.all([
        supabase.from('sales').select('*').gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString()),
        supabase.from('products').select('*, categories (name)').eq('is_active', true),
        supabase.from('customers').select('*').eq('is_active', true),
        supabase.from('expenses').select('*').gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString()),
        supabase.from('loans').select('*, customers (name)').gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString())
      ]);

      const totalSales = (salesRes.data || []).reduce((sum, s) => sum + Number(s.total_amount), 0);
      const totalExpenses = (expensesRes.data || []).reduce((sum, e) => sum + Number(e.amount), 0);
      const activeLoans = (loansRes.data || []).filter((l: any) => l.status === 'active').length;
      const lowStockCount = (productsRes.data || []).filter((p: any) => p.current_stock <= p.min_stock_level).length;

      exportSummaryToPDF(
        `Complete Business Report - ${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}`,
        `Complete_Business_Report_${new Date().toISOString().split('T')[0]}`,
        [
          {
            sectionTitle: 'Sales Overview',
            data: [
              { label: 'Total Revenue', value: formatCurrency(totalSales) },
              { label: 'Number of Transactions', value: salesRes.data?.length || 0 },
              { label: 'Average Order Value', value: formatCurrency(salesRes.data?.length ? totalSales / salesRes.data.length : 0) }
            ]
          },
          {
            sectionTitle: 'Inventory Status',
            data: [
              { label: 'Total Products', value: productsRes.data?.length || 0 },
              { label: 'Low Stock Items', value: lowStockCount },
              { label: 'Inventory Value', value: formatCurrency((productsRes.data || []).reduce((sum, p) => sum + (p.current_stock * Number(p.cost_price)), 0)) }
            ]
          },
          {
            sectionTitle: 'Customer & Loans',
            data: [
              { label: 'Total Customers', value: customersRes.data?.length || 0 },
              { label: 'Active Loans', value: activeLoans },
              { label: 'Total Loan Value', value: formatCurrency((loansRes.data || []).reduce((sum, l) => sum + Number(l.remaining_balance), 0)) }
            ]
          },
          {
            sectionTitle: 'Expenses',
            data: [
              { label: 'Total Expenses', value: formatCurrency(totalExpenses) },
              { label: 'Net Profit', value: formatCurrency(totalSales - totalExpenses) }
            ]
          }
        ],
        { companyName: 'SmartPOS' }
      );

      toast({
        title: "Complete Report Generated",
        description: "Full business report PDF downloaded successfully!",
      });
    } catch (error) {
      console.error("Export all error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to generate complete report.",
        variant: "destructive"
      });
    } finally {
      setGeneratingReport(null);
    }
  };

  const reportCategories = [
    {
      title: "Sales Reports",
      icon: <DollarSign className="w-6 h-6 text-success" />,
      color: "success",
      reports: [
        { name: "Daily Sales Summary", description: "Revenue, transactions, and performance metrics", lastGenerated: "2 hours ago" },
        { name: "Weekly Sales Trends", description: "Sales patterns and growth analysis", lastGenerated: "1 day ago" },
        { name: "Monthly Performance", description: "Comprehensive monthly sales overview", lastGenerated: "3 days ago" },
        { name: "Sales by Category", description: "Product category performance breakdown", lastGenerated: "1 day ago" },
        { name: "Sales by Payment Method", description: "Payment method usage and trends", lastGenerated: "5 hours ago" }
      ]
    },
    {
      title: "Inventory Reports", 
      icon: <Package className="w-6 h-6 text-warning" />,
      color: "warning",
      reports: [
        { name: "Current Stock Levels", description: "Real-time inventory status across locations", lastGenerated: "30 min ago" },
        { name: "Low Stock Alert", description: "Items below minimum stock thresholds", lastGenerated: "1 hour ago" },
        { name: "Stock Movement Analysis", description: "Inventory flow and turnover rates", lastGenerated: "2 days ago" },
        { name: "Dead Stock Report", description: "Slow-moving and obsolete inventory", lastGenerated: "1 week ago" },
        { name: "Reorder Recommendations", description: "AI-powered restocking suggestions", lastGenerated: "4 hours ago" }
      ]
    },
    {
      title: "Customer Reports",
      icon: <Users className="w-6 h-6 text-primary" />,
      color: "primary", 
      reports: [
        { name: "Customer Analytics", description: "Purchase behavior and loyalty metrics", lastGenerated: "6 hours ago" },
        { name: "Top Customers", description: "Highest value customers by revenue", lastGenerated: "1 day ago" },
        { name: "Customer Retention", description: "Customer lifecycle and churn analysis", lastGenerated: "3 days ago" },
        { name: "Purchase Frequency", description: "Customer visit patterns and trends", lastGenerated: "2 days ago" },
        { name: "Customer Segmentation", description: "Customer groups by behavior and value", lastGenerated: "1 week ago" }
      ]
    },
    {
      title: "Profit & Loss Reports",
      icon: <TrendingUp className="w-6 h-6 text-accent" />,
      color: "accent",
      reports: [
        { name: "P&L Statement", description: "Comprehensive profit and loss overview", lastGenerated: "1 day ago" },
        { name: "Gross Margin Analysis", description: "Product and category margin breakdown", lastGenerated: "2 days ago" },
        { name: "Cost Analysis", description: "Operating costs and expense tracking", lastGenerated: "3 days ago" },
        { name: "Profitability by Product", description: "Individual product profit contributions", lastGenerated: "1 day ago" },
        { name: "Break-even Analysis", description: "Sales targets and break-even points", lastGenerated: "1 week ago" }
      ]
    }
  ];

  const keyMetrics = [
    {
      title: "Total Revenue",
      value: formatCurrency(47285),
      change: "+12.5%",
      trend: "up",
      icon: <DollarSign className="w-5 h-5" />,
      color: "success"
    },
    {
      title: "Total Orders",
      value: "1,247",
      change: "+8.3%", 
      trend: "up",
      icon: <ShoppingCart className="w-5 h-5" />,
      color: "primary"
    },
    {
      title: "Inventory Value",
      value: formatCurrency(23150),
      change: "-2.1%",
      trend: "down", 
      icon: <Package className="w-5 h-5" />,
      color: "warning"
    },
    {
      title: "Active Customers",
      value: "892",
      change: "+15.7%",
      trend: "up",
      icon: <Users className="w-5 h-5" />,
      color: "accent"
    },
    {
      title: "Avg Order Value",
      value: formatCurrency(37.92),
      change: "+4.2%",
      trend: "up", 
      icon: <Target className="w-5 h-5" />,
      color: "primary"
    },
    {
      title: "Low Stock Items",
      value: "15",
      change: "+3",
      trend: "up",
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "destructive"
    }
  ];

  const periods = [
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "This Quarter" },
    { value: "year", label: "This Year" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Business Reports
          </h1>
          <p className="text-muted-foreground">Comprehensive analytics and insights for your business</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Report
          </Button>
          <Button 
            className="bg-gradient-primary"
            onClick={handleExportAll}
            disabled={generatingReport === "all"}
          >
            {generatingReport === "all" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export All
          </Button>
        </div>
      </div>

      {/* Period Selection */}
      <Card className="bg-gradient-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Report Period:</span>
            <div className="flex gap-2">
              {periods.map((period) => (
                <Button
                  key={period.value}
                  variant={selectedPeriod === period.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period.value)}
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Overview */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Key Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {keyMetrics.map((metric, index) => (
              <div
                key={index}
                className="p-4 border border-border rounded-lg hover:border-primary/50 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 bg-${metric.color}/10 rounded-lg`}>
                    <div className={`text-${metric.color}`}>{metric.icon}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {metric.trend === "up" ? (
                      <TrendingUp className={`w-4 h-4 text-${metric.trend === "up" ? "success" : "destructive"}`} />
                    ) : (
                      <TrendingDown className={`w-4 h-4 text-${metric.trend === "up" ? "success" : "destructive"}`} />
                    )}
                    <span className={`text-sm font-medium text-${metric.trend === "up" ? "success" : "destructive"}`}>
                      {metric.change}
                    </span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-1">{metric.value}</h3>
                <p className="text-sm text-muted-foreground">{metric.title}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Categories */}
      {reportCategories.map((category, categoryIndex) => (
        <Card key={categoryIndex} className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={`p-2 bg-${category.color}/10 rounded-lg`}>
                {category.icon}
              </div>
              {category.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {category.reports.map((report, reportIndex) => {
                const isGenerating = generatingReport === report.name;
                return (
                  <div
                    key={reportIndex}
                    className="p-4 border border-border rounded-lg hover:border-primary/50 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{report.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{report.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Last: {report.lastGenerated}
                          </Badge>
                        </div>
                      </div>
                      <div className="ml-4">
                        <FileText className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-gradient-primary"
                        onClick={() => generateReport(report.name, category.title)}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <BarChart3 className="w-3 h-3 mr-1" />
                        )}
                        Generate
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => generateReport(report.name, category.title)}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Download className="w-3 h-3 mr-1" />
                        )}
                        PDF
                      </Button>
                      <Button size="sm" variant="outline">
                        <PieChart className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Quick Actions */}
      <Card className="bg-gradient-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Quick Report Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              className="h-auto p-4 flex-col gap-2 bg-gradient-primary"
              onClick={() => generateReport("Daily Sales Summary", "Sales Reports")}
              disabled={generatingReport === "Daily Sales Summary"}
            >
              {generatingReport === "Daily Sales Summary" ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <DollarSign className="w-6 h-6" />
              )}
              <span>Today's Sales</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col gap-2"
              onClick={() => generateReport("Low Stock Alert", "Inventory Reports")}
              disabled={generatingReport === "Low Stock Alert"}
            >
              {generatingReport === "Low Stock Alert" ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Package className="w-6 h-6" />
              )}
              <span>Stock Alert</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col gap-2"
              onClick={() => generateReport("Customer Analytics", "Customer Reports")}
              disabled={generatingReport === "Customer Analytics"}
            >
              {generatingReport === "Customer Analytics" ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Users className="w-6 h-6" />
              )}
              <span>Customer Export</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex-col gap-2"
              onClick={() => generateReport("P&L Statement", "Profit & Loss Reports")}
              disabled={generatingReport === "P&L Statement"}
            >
              {generatingReport === "P&L Statement" ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <TrendingUp className="w-6 h-6" />
              )}
              <span>P&L Summary</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;