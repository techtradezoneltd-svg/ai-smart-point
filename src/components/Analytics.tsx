import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  Brain, 
  Calendar,
  Download,
  Filter,
  Target,
  Zap,
  DollarSign,
  Users,
  ShoppingCart,
  Package
} from "lucide-react";

const Analytics = () => {
  // Sample data for charts (in a real app, this would come from your analytics service)
  const salesData = [
    { day: "Mon", sales: 12500, transactions: 45 },
    { day: "Tue", sales: 15200, transactions: 52 },
    { day: "Wed", sales: 18900, transactions: 68 },
    { day: "Thu", sales: 14600, transactions: 48 },
    { day: "Fri", sales: 22100, transactions: 72 },
    { day: "Sat", sales: 28500, transactions: 89 },
    { day: "Sun", sales: 16800, transactions: 58 }
  ];

  const topProducts = [
    { name: "iPhone 15 Pro", sales: 89, revenue: 88911, trend: "+15%" },
    { name: "Samsung Galaxy S24", sales: 67, revenue: 53593, trend: "+8%" },
    { name: "Apple AirPods Pro", sales: 156, revenue: 38984, trend: "+23%" },
    { name: "Wireless Charger", sales: 203, revenue: 8120, trend: "+5%" }
  ];

  const customerSegments = [
    { segment: "High Value", count: 23, revenue: 45600, percentage: 38 },
    { segment: "Regular", count: 89, revenue: 67800, percentage: 57 },
    { segment: "New", count: 34, revenue: 5200, percentage: 5 }
  ];

  const aiPredictions = [
    {
      title: "Revenue Forecast",
      prediction: "$156,780",
      confidence: "94%",
      period: "Next 30 days",
      trend: "+18%",
      color: "success"
    },
    {
      title: "Inventory Turnover",
      prediction: "12.5 days",
      confidence: "89%",
      period: "Average cycle",
      trend: "-2 days",
      color: "accent"
    },
    {
      title: "Customer Acquisition",
      prediction: "47 new customers",
      confidence: "91%",
      period: "This month",
      trend: "+23%",
      color: "primary"
    }
  ];

  const maxSales = Math.max(...salesData.map(d => d.sales));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            AI Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">Intelligent business insights and predictions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Date Range
          </Button>
          <Button className="bg-gradient-primary">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* AI Predictions */}
      <Card className="bg-gradient-card border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-accent animate-pulse" />
            AI Predictive Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aiPredictions.map((prediction, index) => (
              <div
                key={index}
                className={`p-6 border border-${prediction.color}/30 rounded-lg bg-${prediction.color}/5 hover:bg-${prediction.color}/10 transition-all`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-semibold text-${prediction.color}`}>{prediction.title}</h3>
                  <Badge variant="outline" className={`border-${prediction.color} text-${prediction.color}`}>
                    {prediction.confidence} confidence
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className={`text-2xl font-bold text-${prediction.color}`}>{prediction.prediction}</p>
                  <p className="text-sm text-muted-foreground">{prediction.period}</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className={`w-4 h-4 text-${prediction.color}`} />
                    <span className={`text-sm font-medium text-${prediction.color}`}>{prediction.trend}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sales Chart */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Weekly Sales Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Simple chart representation */}
            <div className="grid grid-cols-7 gap-2 h-64">
              {salesData.map((data, index) => (
                <div key={index} className="flex flex-col items-center justify-end space-y-2">
                  <div className="text-xs text-muted-foreground">${(data.sales / 1000).toFixed(0)}k</div>
                  <div
                    className="w-full bg-gradient-primary rounded-t-lg transition-all hover:bg-gradient-accent"
                    style={{ height: `${(data.sales / maxSales) * 200}px` }}
                  ></div>
                  <div className="text-sm font-medium">{data.day}</div>
                  <div className="text-xs text-muted-foreground">{data.transactions} txn</div>
                </div>
              ))}
            </div>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-success">
                  ${salesData.reduce((sum, d) => sum + d.sales, 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Sales</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {salesData.reduce((sum, d) => sum + d.transactions, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Transactions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent">
                  ${(salesData.reduce((sum, d) => sum + d.sales, 0) / salesData.reduce((sum, d) => sum + d.transactions, 0)).toFixed(0)}
                </p>
                <p className="text-sm text-muted-foreground">Avg Order</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-warning">
                  +12%
                </p>
                <p className="text-sm text-muted-foreground">vs Last Week</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Top Performing Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.sales} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-success">${product.revenue.toLocaleString()}</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-success" />
                      <span className="text-sm text-success">{product.trend}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Segments */}
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Customer Segmentation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customerSegments.map((segment, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{segment.segment} Customers</span>
                    <span className="text-sm text-muted-foreground">{segment.count} customers</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 bg-muted rounded-full h-2 mr-4">
                      <div
                        className="bg-gradient-primary h-2 rounded-full transition-all"
                        style={{ width: `${segment.percentage}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-success">${segment.revenue.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{segment.percentage}% of total revenue</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights and Recommendations */}
      <Card className="bg-gradient-card border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            AI-Powered Business Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border border-success/30 rounded-lg bg-success/5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-success" />
                <h4 className="font-semibold text-success">Revenue Optimization</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                AI detected that Friday-Sunday generates 45% of weekly revenue. Consider staffing optimization and targeted weekend promotions.
              </p>
              <Button size="sm" className="bg-success text-success-foreground">
                View Recommendations
              </Button>
            </div>

            <div className="p-4 border border-warning/30 rounded-lg bg-warning/5">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-5 h-5 text-warning animate-pulse" />
                <h4 className="font-semibold text-warning">Inventory Insights</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                AirPods Pro showing 23% growth trend. AI recommends increasing inventory by 40% before holiday season.
              </p>
              <Button size="sm" className="bg-warning text-warning-foreground">
                Auto-Adjust Inventory
              </Button>
            </div>

            <div className="p-4 border border-accent/30 rounded-lg bg-accent/5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-accent" />
                <h4 className="font-semibold text-accent">Customer Behavior</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                High-value customers prefer bundled purchases. Create smart bundles to increase average order value by 18%.
              </p>
              <Button size="sm" className="bg-accent text-accent-foreground">
                Create Bundles
              </Button>
            </div>

            <div className="p-4 border border-primary/30 rounded-lg bg-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-primary">Pricing Strategy</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Dynamic pricing model suggests 8% price increase on Samsung Galaxy S24 based on demand trends and competitor analysis.
              </p>
              <Button size="sm" className="bg-gradient-primary">
                Apply Dynamic Pricing
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;