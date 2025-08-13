import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  Package,
  DollarSign,
  Target,
  Clock,
  Zap
} from "lucide-react";

interface Metric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: "up" | "down" | "stable";
  changePercent: number;
  icon: any;
  color: string;
}

const PerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<Metric[]>([
    {
      id: "sales_target",
      name: "Daily Sales Target",
      value: 8750,
      target: 10000,
      unit: "$",
      trend: "up",
      changePercent: 12.5,
      icon: Target,
      color: "primary"
    },
    {
      id: "transaction_rate",
      name: "Transaction Rate",
      value: 145,
      target: 200,
      unit: "/hour",
      trend: "up",
      changePercent: 8.3,
      icon: ShoppingCart,
      color: "success"
    },
    {
      id: "customer_satisfaction",
      name: "Customer Satisfaction",
      value: 92,
      target: 95,
      unit: "%",
      trend: "stable",
      changePercent: 1.2,
      icon: Users,
      color: "accent"
    },
    {
      id: "inventory_turnover",
      name: "Inventory Turnover",
      value: 68,
      target: 80,
      unit: "%",
      trend: "down",
      changePercent: -3.1,
      icon: Package,
      color: "warning"
    },
    {
      id: "average_sale",
      name: "Average Sale Value",
      value: 67.50,
      target: 75.00,
      unit: "$",
      trend: "up",
      changePercent: 4.2,
      icon: DollarSign,
      color: "success"
    },
    {
      id: "processing_time",
      name: "Avg. Processing Time",
      value: 2.3,
      target: 2.0,
      unit: "min",
      trend: "down",
      changePercent: -8.1,
      icon: Clock,
      color: "destructive"
    }
  ]);

  const [systemPerformance, setSystemPerformance] = useState({
    cpu: 45,
    memory: 62,
    storage: 38,
    network: 78
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.value + (Math.random() - 0.5) * (metric.value * 0.02),
        changePercent: metric.changePercent + (Math.random() - 0.5) * 2
      })));

      setSystemPerformance(prev => ({
        cpu: Math.max(20, Math.min(90, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(30, Math.min(95, prev.memory + (Math.random() - 0.5) * 5)),
        storage: Math.max(20, Math.min(80, prev.storage + (Math.random() - 0.5) * 3)),
        network: Math.max(50, Math.min(100, prev.network + (Math.random() - 0.5) * 8))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "text-success";
    if (percentage >= 70) return "text-warning";
    return "text-destructive";
  };

  const getTrendIcon = (trend: string, changePercent: number) => {
    if (trend === "up" && changePercent > 0) {
      return <TrendingUp className="w-4 h-4 text-success" />;
    }
    if (trend === "down" || changePercent < 0) {
      return <TrendingDown className="w-4 h-4 text-destructive" />;
    }
    return <div className="w-4 h-4 rounded-full bg-muted"></div>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Performance Metrics
          </h2>
          <p className="text-muted-foreground">Real-time business performance indicators</p>
        </div>
        <Badge variant="outline" className="border-success text-success">
          <Zap className="w-3 h-3 mr-1" />
          Live Updates
        </Badge>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => {
          const percentage = (metric.value / metric.target) * 100;
          const Icon = metric.icon;
          
          return (
            <Card key={metric.id} className="bg-gradient-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                <div className={`p-2 rounded-lg bg-${metric.color}/10`}>
                  <Icon className={`w-4 h-4 text-${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {metric.unit === "$" ? "$" : ""}{metric.value.toFixed(metric.unit === "$" ? 2 : 0)}
                      {metric.unit !== "$" ? metric.unit : ""}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {metric.unit === "$" ? "$" : ""}{metric.target.toFixed(metric.unit === "$" ? 2 : 0)}
                      {metric.unit !== "$" ? metric.unit : ""}
                    </span>
                  </div>
                  
                  <Progress value={percentage} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${getProgressColor(percentage)}`}>
                      {percentage.toFixed(1)}% of target
                    </span>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(metric.trend, metric.changePercent)}
                      <span className={`text-xs ${
                        metric.changePercent > 0 ? "text-success" : 
                        metric.changePercent < 0 ? "text-destructive" : "text-muted-foreground"
                      }`}>
                        {metric.changePercent > 0 ? "+" : ""}{metric.changePercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Performance */}
      <Card className="bg-gradient-card border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            System Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">CPU Usage</span>
                <span className="text-sm text-muted-foreground">{systemPerformance.cpu.toFixed(0)}%</span>
              </div>
              <Progress value={systemPerformance.cpu} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Memory</span>
                <span className="text-sm text-muted-foreground">{systemPerformance.memory.toFixed(0)}%</span>
              </div>
              <Progress value={systemPerformance.memory} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Storage</span>
                <span className="text-sm text-muted-foreground">{systemPerformance.storage.toFixed(0)}%</span>
              </div>
              <Progress value={systemPerformance.storage} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Network</span>
                <span className="text-sm text-muted-foreground">{systemPerformance.network.toFixed(0)}%</span>
              </div>
              <Progress value={systemPerformance.network} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card className="bg-gradient-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            AI Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="font-medium text-success">Positive Trend</span>
              </div>
              <p className="text-sm">Daily sales are 12.5% above average. Customer transaction rate has improved significantly this week.</p>
            </div>
            
            <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-warning" />
                <span className="font-medium text-warning">Attention Needed</span>
              </div>
              <p className="text-sm">Processing time is slightly above target. Consider optimizing checkout flow during peak hours.</p>
            </div>
            
            <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="font-medium text-primary">Recommendation</span>
              </div>
              <p className="text-sm">Focus on inventory turnover improvement. Consider promotional strategies for slow-moving items.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMetrics;