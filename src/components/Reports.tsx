import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/hooks/useCurrency";
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
  CreditCard
} from "lucide-react";

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const { formatCurrency } = useCurrency();

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
          <Button className="bg-gradient-primary">
            <Download className="w-4 h-4 mr-2" />
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
              {category.reports.map((report, reportIndex) => (
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
                    <Button size="sm" className="flex-1 bg-gradient-primary">
                      <BarChart3 className="w-3 h-3 mr-1" />
                      Generate
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                    <Button size="sm" variant="outline">
                      <PieChart className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
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
            <Button className="h-auto p-4 flex-col gap-2 bg-gradient-primary">
              <DollarSign className="w-6 h-6" />
              <span>Today's Sales</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <Package className="w-6 h-6" />
              <span>Stock Alert</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <Users className="w-6 h-6" />
              <span>Customer Export</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <TrendingUp className="w-6 h-6" />
              <span>P&L Summary</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;