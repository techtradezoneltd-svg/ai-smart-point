import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  const [selectedDateRange, setSelectedDateRange] = useState("last_7_days");
  const [selectedFormat, setSelectedFormat] = useState("PDF");

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

  const handleGenerateReport = (reportId: string) => {
    console.log(`Generating report ${reportId} for ${selectedDateRange} in ${selectedFormat} format`);
    // In a real app, this would trigger the report generation API
  };

  const handleQuickReport = (action: string) => {
    console.log(`Generating quick report: ${action}`);
    // In a real app, this would trigger the quick report generation
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
                    onClick={() => setSelectedFormat(format)}
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
                  <Input type="date" placeholder="Start date" />
                  <Input type="date" placeholder="End date" />
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
                onClick={() => handleQuickReport(report.action)}
              >
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-lg bg-gradient-primary/10 group-hover:bg-gradient-primary/20 transition-all">
                    {report.icon}
                  </div>
                  <h3 className="font-medium text-sm mb-1">{report.name}</h3>
                  <p className="text-xs text-muted-foreground">{report.description}</p>
                  <Button size="sm" className="mt-3 w-full bg-gradient-primary">
                    <FileDown className="w-3 h-3 mr-1" />
                    Export
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
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Generate
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