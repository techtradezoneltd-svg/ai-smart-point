import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { exportToExcel, exportToCSV, formatForExport } from "@/lib/exportImport";
import { 
  FileDown, 
  Calendar, 
  Filter,
  FileText,
  FileSpreadsheet,
  Database,
  Mail,
  Clock,
  BarChart3,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Settings
} from "lucide-react";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: "sales" | "inventory" | "customer" | "financial" | "analytics";
  frequency: "daily" | "weekly" | "monthly" | "custom";
  format: "PDF" | "Excel" | "CSV" | "JSON";
  lastGenerated: string;
  size: string;
  automated: boolean;
}

const ReportsExport = () => {
  const { toast } = useToast();
  const [selectedDateRange, setSelectedDateRange] = useState("last_7_days");
  const [selectedFormat, setSelectedFormat] = useState<"Excel" | "CSV" | "PDF" | "JSON">("Excel");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const reportTemplates: ReportTemplate[] = [
    {
      id: "1",
      name: "Daily Sales Summary",
      description: "Complete sales overview with transactions, revenue, and performance metrics",
      category: "sales",
      frequency: "daily",
      format: "PDF",
      lastGenerated: "2024-01-25 09:00",
      size: "2.4 MB",
      automated: true
    },
    {
      id: "2",
      name: "Inventory Status Report",
      description: "Current stock levels, low stock alerts, and reorder recommendations",
      category: "inventory",
      frequency: "weekly",
      format: "Excel",
      lastGenerated: "2024-01-22 18:00",
      size: "1.8 MB",
      automated: true
    },
    {
      id: "3",
      name: "Customer Analytics",
      description: "Customer behavior analysis, loyalty metrics, and segmentation data",
      category: "customer",
      frequency: "monthly",
      format: "Excel",
      lastGenerated: "2024-01-01 10:00",
      size: "3.2 MB",
      automated: false
    },
    {
      id: "4",
      name: "Financial Performance",
      description: "Revenue analysis, profit margins, tax summaries, and financial trends",
      category: "financial",
      frequency: "monthly",
      format: "PDF",
      lastGenerated: "2024-01-01 12:00",
      size: "1.5 MB",
      automated: true
    },
    {
      id: "5",
      name: "Product Performance Analysis",
      description: "Top selling products, category analysis, and profit contribution",
      category: "analytics",
      frequency: "weekly",
      format: "Excel",
      lastGenerated: "2024-01-22 16:30",
      size: "2.1 MB",
      automated: false
    },
    {
      id: "6",
      name: "Staff Performance Report",
      description: "Employee sales metrics, productivity analysis, and commission calculations",
      category: "analytics",
      frequency: "monthly",
      format: "PDF",
      lastGenerated: "2024-01-01 14:00",
      size: "1.9 MB",
      automated: true
    }
  ];

  const quickReports = [
    {
      name: "Today's Sales",
      description: "Quick sales summary for today",
      icon: <DollarSign className="w-5 h-5 text-success" />,
      action: "generate_today_sales"
    },
    {
      name: "Low Stock Alert",
      description: "Items below minimum stock level",
      icon: <Package className="w-5 h-5 text-warning" />,
      action: "generate_low_stock"
    },
    {
      name: "Customer List",
      description: "Export all customer data",
      icon: <Users className="w-5 h-5 text-primary" />,
      action: "export_customers"
    },
    {
      name: "Transaction Log",
      description: "All transactions for selected period",
      icon: <BarChart3 className="w-5 h-5 text-accent" />,
      action: "export_transactions"
    }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "sales": return <DollarSign className="w-4 h-4" />;
      case "inventory": return <Package className="w-4 h-4" />;
      case "customer": return <Users className="w-4 h-4" />;
      case "financial": return <TrendingUp className="w-4 h-4" />;
      case "analytics": return <BarChart3 className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "sales": return "success";
      case "inventory": return "warning";
      case "customer": return "primary";
      case "financial": return "accent";
      case "analytics": return "secondary";
      default: return "muted";
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "PDF": return <FileText className="w-4 h-4 text-destructive" />;
      case "Excel": return <FileSpreadsheet className="w-4 h-4 text-success" />;
      case "CSV": return <Database className="w-4 h-4 text-accent" />;
      case "JSON": return <Database className="w-4 h-4 text-warning" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const dateRanges = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "last_7_days", label: "Last 7 days" },
    { value: "last_30_days", label: "Last 30 days" },
    { value: "this_month", label: "This month" },
    { value: "last_month", label: "Last month" },
    { value: "custom", label: "Custom range" }
  ];

  const formats = ["PDF", "Excel", "CSV", "JSON"];

  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate = new Date();
    let endDate = new Date();

    switch (selectedDateRange) {
      case "today":
        startDate = today;
        endDate = now;
        break;
      case "yesterday":
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 1);
        endDate = new Date(today);
        endDate.setSeconds(endDate.getSeconds() - 1);
        break;
      case "last_7_days":
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
        endDate = now;
        break;
      case "last_30_days":
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 30);
        endDate = now;
        break;
      case "this_month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      case "last_month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "custom":
        startDate = customStartDate ? new Date(customStartDate) : today;
        endDate = customEndDate ? new Date(customEndDate) : now;
        break;
    }

    return { startDate, endDate };
  };

  const exportData = async (data: any[], filename: string) => {
    try {
      if (!data || data.length === 0) {
        toast({
          title: "No Data",
          description: "No data available to export for the selected date range.",
          variant: "destructive"
        });
        return;
      }

      if (selectedFormat === "Excel") {
        exportToExcel(data, filename);
        toast({
          title: "Success",
          description: `Excel file "${filename}.xlsx" downloaded successfully!`,
        });
      } else if (selectedFormat === "CSV") {
        exportToCSV(data, filename);
        toast({
          title: "Success",
          description: `CSV file "${filename}.csv" downloaded successfully!`,
        });
      } else if (selectedFormat === "JSON") {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        toast({
          title: "Success",
          description: `JSON file "${filename}.json" downloaded successfully!`,
        });
      } else {
        toast({
          title: "PDF Export",
          description: "PDF export will be available soon. Please use Excel or CSV format.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to download file. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleGenerateReport = async (reportId: string) => {
    setIsExporting(true);
    const { startDate, endDate } = getDateRange();

    try {
      const template = reportTemplates.find(t => t.id === reportId);
      
      switch (template?.category) {
        case "sales":
          await exportSalesReport(startDate, endDate);
          break;
        case "inventory":
          await exportInventoryReport();
          break;
        case "customer":
          await exportCustomerReport();
          break;
        case "financial":
          await exportFinancialReport(startDate, endDate);
          break;
        case "analytics":
          if (template.name.includes("Product")) {
            await exportProductAnalytics(startDate, endDate);
          } else {
            await exportStaffPerformance(startDate, endDate);
          }
          break;
      }
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleQuickReport = async (action: string) => {
    setIsExporting(true);
    try {
      switch (action) {
        case "generate_today_sales":
          await exportTodaySales();
          break;
        case "generate_low_stock":
          await exportLowStock();
          break;
        case "export_customers":
          await exportCustomerReport();
          break;
        case "export_transactions":
          const { startDate, endDate } = getDateRange();
          await exportSalesReport(startDate, endDate);
          break;
      }
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to generate quick report.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportTodaySales = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          quantity,
          unit_price,
          total_price,
          products (name)
        )
      `)
      .gte('created_at', today.toISOString());

    if (error) throw error;

    const formattedData = formatForExport(data || [], ['id', 'created_by', 'loan_id']);
    await exportData(formattedData, `Today_Sales_${new Date().toISOString().split('T')[0]}`);
  };

  const exportSalesReport = async (startDate: Date, endDate: Date) => {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          quantity,
          unit_price,
          total_price,
          products (name, category_id, categories (name))
        ),
        profiles (full_name)
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    const formattedData = formatForExport(data || [], ['id', 'created_by', 'loan_id']);
    await exportData(formattedData, `Sales_Report_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}`);
  };

  const exportLowStock = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories (name), units (name)')
      .order('current_stock', { ascending: true });

    if (error) throw error;

    const lowStockProducts = (data || []).filter(p => p.current_stock <= p.min_stock_level);
    const formattedData = formatForExport(lowStockProducts, ['id', 'created_by', 'category_id', 'unit_id']);
    await exportData(formattedData, `Low_Stock_Alert_${new Date().toISOString().split('T')[0]}`);
  };

  const exportInventoryReport = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories (name), units (name, symbol)')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    const formattedData = formatForExport(data || [], ['id', 'created_by', 'category_id', 'unit_id']);
    await exportData(formattedData, `Inventory_Report_${new Date().toISOString().split('T')[0]}`);
  };

  const exportCustomerReport = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    const formattedData = formatForExport(data || [], ['id', 'repayment_behavior']);
    await exportData(formattedData, `Customer_List_${new Date().toISOString().split('T')[0]}`);
  };

  const exportFinancialReport = async (startDate: Date, endDate: Date) => {
    const [salesData, expensesData, loansData] = await Promise.all([
      supabase.from('sales').select('*').gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString()),
      supabase.from('expenses').select('*').gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString()),
      supabase.from('loans').select('*, loan_payments (*)').gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString())
    ]);

    const financialSummary = [
      {
        metric: 'Total Sales',
        value: salesData.data?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0
      },
      {
        metric: 'Total Expenses',
        value: expensesData.data?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0
      },
      {
        metric: 'Loans Issued',
        value: loansData.data?.reduce((sum, loan) => sum + Number(loan.total_amount), 0) || 0
      },
      {
        metric: 'Loan Repayments',
        value: loansData.data?.reduce((sum, loan) => sum + Number(loan.paid_amount), 0) || 0
      }
    ];

    await exportData(financialSummary, `Financial_Report_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}`);
  };

  const exportProductAnalytics = async (startDate: Date, endDate: Date) => {
    const { data, error } = await supabase
      .from('products_daily_stats')
      .select('*, products (name, categories (name))')
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('revenue', { ascending: false });

    if (error) throw error;

    const formattedData = formatForExport(data || [], ['id', 'product_id']);
    await exportData(formattedData, `Product_Analytics_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}`);
  };

  const exportStaffPerformance = async (startDate: Date, endDate: Date) => {
    const { data, error } = await supabase
      .from('sales')
      .select('created_by, total_amount, profiles (full_name, role)')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    const staffStats = (data || []).reduce((acc: any[], sale) => {
      const existing = acc.find(s => s.staff_id === sale.created_by);
      if (existing) {
        existing.total_sales += Number(sale.total_amount);
        existing.transaction_count += 1;
      } else {
        acc.push({
          staff_id: sale.created_by,
          staff_name: sale.profiles?.full_name || 'Unknown',
          role: sale.profiles?.role || 'Unknown',
          total_sales: Number(sale.total_amount),
          transaction_count: 1
        });
      }
      return acc;
    }, []);

    await exportData(staffStats, `Staff_Performance_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Reports & Export Center
          </h1>
          <p className="text-muted-foreground">Generate comprehensive business reports and export data</p>
        </div>
        <Button className="bg-gradient-primary">
          <Settings className="w-4 h-4 mr-2" />
          Report Settings
        </Button>
      </div>

      {/* Export Configuration */}
      <Card className="bg-gradient-card border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-accent" />
            Export Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Date Range Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <div className="space-y-2">
                {dateRanges.map((range) => (
                  <Button
                    key={range.value}
                    variant={selectedDateRange === range.value ? "default" : "outline"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setSelectedDateRange(range.value)}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Format Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Export Format</label>
              <div className="space-y-2">
                {formats.map((format) => (
                  <Button
                    key={format}
                    variant={selectedFormat === format ? "default" : "outline"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setSelectedFormat(format as "Excel" | "CSV" | "PDF" | "JSON")}
                  >
                    {getFormatIcon(format)}
                    <span className="ml-2">{format}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Date Range */}
            {selectedDateRange === "custom" && (
              <div>
                <label className="text-sm font-medium mb-2 block">Custom Range</label>
                <div className="space-y-2">
                  <Input 
                    type="date" 
                    placeholder="Start date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                  <Input 
                    type="date" 
                    placeholder="End date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Reports */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-primary" />
            Quick Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickReports.map((report, index) => (
              <div
                key={index}
                className="p-4 border border-border rounded-lg hover:border-primary/50 transition-all cursor-pointer group"
              >
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-lg bg-gradient-primary/10 group-hover:bg-gradient-primary/20 transition-all">
                    {report.icon}
                  </div>
                  <h3 className="font-medium text-sm mb-1">{report.name}</h3>
                  <p className="text-xs text-muted-foreground">{report.description}</p>
                  <Button 
                    size="sm" 
                    className="mt-3 w-full bg-gradient-primary"
                    disabled={isExporting}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickReport(report.action);
                    }}
                  >
                    <FileDown className="w-3 h-3 mr-1" />
                    {isExporting ? "Exporting..." : "Export"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Templates */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Report Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportTemplates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-6 border border-border rounded-lg hover:border-primary/50 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg bg-${getCategoryColor(template.category)}/10 border border-${getCategoryColor(template.category)}/20`}>
                    {getCategoryIcon(template.category)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{template.name}</h3>
                      <Badge 
                        variant="outline" 
                        className={`border-${getCategoryColor(template.category)} text-${getCategoryColor(template.category)} capitalize`}
                      >
                        {template.category}
                      </Badge>
                      <Badge variant={template.automated ? "default" : "secondary"}>
                        {template.automated ? "Automated" : "Manual"}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Frequency: {template.frequency}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getFormatIcon(template.format)}
                        <span>{template.format}</span>
                      </div>
                      <span>Last: {template.lastGenerated}</span>
                      <span>Size: {template.size}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleGenerateReport(template.id)}
                    className="bg-gradient-primary"
                    disabled={isExporting}
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    {isExporting ? "Exporting..." : "Generate"}
                  </Button>
                  
                  <Button size="sm" variant="outline">
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                  
                  <Button size="sm" variant="outline">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Reports */}
      <Card className="bg-gradient-card border-success/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-success" />
            Scheduled Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportTemplates.filter(r => r.automated).map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-4 border border-success/30 rounded-lg bg-success/5"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/20 rounded-lg">
                    <Clock className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Next generation: {template.frequency === "daily" ? "Tomorrow 09:00" : 
                                      template.frequency === "weekly" ? "Next Monday 09:00" : 
                                      "Next month 1st"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-success text-success">
                    Active
                  </Badge>
                  <Button size="sm" variant="outline">
                    Configure
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsExport;