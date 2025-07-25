import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Activity, 
  Search, 
  Filter, 
  Download,
  Calendar,
  User,
  ShoppingCart,
  Package,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  category: "sale" | "inventory" | "user" | "system" | "security";
  details: string;
  ip: string;
  status: "success" | "warning" | "error";
  risk: "low" | "medium" | "high";
}

const AuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const auditLogs: AuditLog[] = [
    {
      id: "1",
      timestamp: "2024-01-25 14:32:15",
      user: "Mike Cashier",
      action: "Sale Completed",
      category: "sale",
      details: "iPhone 15 Pro - $999.99 - Customer: Sarah Johnson",
      ip: "192.168.1.45",
      status: "success",
      risk: "low"
    },
    {
      id: "2",
      timestamp: "2024-01-25 14:28:43",
      user: "Lisa Stock",
      action: "Inventory Updated",
      category: "inventory",
      details: "Samsung Galaxy S24 - Stock adjusted from 15 to 8 units",
      ip: "192.168.1.67",
      status: "success",
      risk: "low"
    },
    {
      id: "3",
      timestamp: "2024-01-25 14:15:22",
      user: "Sarah Manager",
      action: "User Role Modified",
      category: "user",
      details: "Changed Mike Cashier permissions - Added customer_lookup",
      ip: "192.168.1.23",
      status: "warning",
      risk: "medium"
    },
    {
      id: "4",
      timestamp: "2024-01-25 13:45:11",
      user: "John Admin",
      action: "System Configuration",
      category: "system",
      details: "Updated tax rate from 7% to 8% for all products",
      ip: "192.168.1.10",
      status: "success",
      risk: "high"
    },
    {
      id: "5",
      timestamp: "2024-01-25 13:30:55",
      user: "Unknown User",
      action: "Failed Login Attempt",
      category: "security",
      details: "Multiple failed login attempts from IP 203.45.67.89",
      ip: "203.45.67.89",
      status: "error",
      risk: "high"
    },
    {
      id: "6",
      timestamp: "2024-01-25 12:15:33",
      user: "Mike Cashier",
      action: "Transaction Voided",
      category: "sale",
      details: "Voided transaction #TX-2024-001234 - Amount: $249.99",
      ip: "192.168.1.45",
      status: "warning",
      risk: "medium"
    },
    {
      id: "7",
      timestamp: "2024-01-25 11:45:17",
      user: "Lisa Stock",
      action: "Bulk Inventory Import",
      category: "inventory",
      details: "Imported 150 products from supplier data feed",
      ip: "192.168.1.67",
      status: "success",
      risk: "low"
    },
    {
      id: "8",
      timestamp: "2024-01-25 10:22:08",
      user: "Sarah Manager",
      action: "Report Generated",
      category: "system",
      details: "Generated weekly sales report for period 2024-01-18 to 2024-01-24",
      ip: "192.168.1.23",
      status: "success",
      risk: "low"
    }
  ];

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || log.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "sale": return <ShoppingCart className="w-4 h-4" />;
      case "inventory": return <Package className="w-4 h-4" />;
      case "user": return <User className="w-4 h-4" />;
      case "system": return <Settings className="w-4 h-4" />;
      case "security": return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "sale": return "success";
      case "inventory": return "primary";
      case "user": return "accent";
      case "system": return "warning";
      case "security": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="w-4 h-4 text-success" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "error": return <AlertTriangle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high": return "destructive";
      case "medium": return "warning";
      default: return "success";
    }
  };

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "sale", label: "Sales" },
    { value: "inventory", label: "Inventory" },
    { value: "user", label: "User Management" },
    { value: "system", label: "System" },
    { value: "security", label: "Security" }
  ];

  const stats = {
    total: auditLogs.length,
    today: auditLogs.filter(log => log.timestamp.includes("2024-01-25")).length,
    highRisk: auditLogs.filter(log => log.risk === "high").length,
    failed: auditLogs.filter(log => log.status === "error").length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Audit Logs & Activity
          </h1>
          <p className="text-muted-foreground">Track all system activities and security events</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Date Range
          </Button>
          <Button className="bg-gradient-primary">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-success/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
            <Clock className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.today}</div>
            <p className="text-xs text-muted-foreground">Events today</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.highRisk}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-warning/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Actions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">Error events</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-card border-border">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search logs by user, action, or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {categories.map((category) => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            System Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 border border-border rounded-lg hover:border-primary/50 transition-all"
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(log.status)}
                  <div className={`p-2 rounded-lg bg-${getCategoryColor(log.category)}/10 border border-${getCategoryColor(log.category)}/20`}>
                    {getCategoryIcon(log.category)}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{log.action}</h3>
                    <Badge 
                      variant="outline" 
                      className={`border-${getCategoryColor(log.category)} text-${getCategoryColor(log.category)} capitalize`}
                    >
                      {log.category}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`border-${getRiskColor(log.risk)} text-${getRiskColor(log.risk)}`}
                    >
                      {log.risk} risk
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">{log.details}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{log.user}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{log.timestamp}</span>
                    </div>
                    <span>IP: {log.ip}</span>
                  </div>
                </div>

                <div className="text-right">
                  <Button size="sm" variant="outline">
                    View Details
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

export default AuditLogs;