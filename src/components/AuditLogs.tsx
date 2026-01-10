import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { 
  Activity, 
  Search, 
  Download,
  Calendar,
  User,
  ShoppingCart,
  Package,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  timestamp: string;
  user_email: string | null;
  user_role: string | null;
  action: string;
  category: string;
  details: Record<string, any> | null;
  ip_address: string | null;
  status: string | null;
  risk_level: string | null;
}

const AuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching audit logs:', error);
      } else {
        // Map the data to our interface
        const mappedLogs: AuditLog[] = (data || []).map(log => ({
          id: log.id,
          timestamp: log.timestamp,
          user_email: log.user_email,
          user_role: log.user_role,
          action: log.action,
          category: log.category,
          details: typeof log.details === 'object' ? log.details as Record<string, any> : null,
          ip_address: log.ip_address,
          status: log.status,
          risk_level: log.risk_level
        }));
        setAuditLogs(mappedLogs);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const mapCategoryToDisplay = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'sales': 'sale',
      'financial': 'sale',
      'inventory': 'inventory',
      'user_management': 'user',
      'settings': 'system',
      'system': 'system',
      'security': 'security'
    };
    return categoryMap[category] || category;
  };

  const filteredLogs = auditLogs.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    const userMatch = (log.user_email || '').toLowerCase().includes(searchLower);
    const actionMatch = log.action.toLowerCase().includes(searchLower);
    const detailsMatch = log.details ? JSON.stringify(log.details).toLowerCase().includes(searchLower) : false;
    const matchesSearch = userMatch || actionMatch || detailsMatch;
    
    const displayCategory = mapCategoryToDisplay(log.category);
    const matchesCategory = selectedCategory === "all" || displayCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    const displayCategory = mapCategoryToDisplay(category);
    switch (displayCategory) {
      case "sale": return <ShoppingCart className="w-4 h-4" />;
      case "inventory": return <Package className="w-4 h-4" />;
      case "user": return <User className="w-4 h-4" />;
      case "system": return <Settings className="w-4 h-4" />;
      case "security": return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const displayCategory = mapCategoryToDisplay(category);
    switch (displayCategory) {
      case "sale": return "success";
      case "inventory": return "primary";
      case "user": return "accent";
      case "system": return "warning";
      case "security": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "success": return <CheckCircle className="w-4 h-4 text-success" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "error": return <AlertTriangle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRiskColor = (risk: string | null) => {
    switch (risk) {
      case "high": 
      case "critical": return "destructive";
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

  const today = new Date().toISOString().split('T')[0];
  const stats = {
    total: auditLogs.length,
    today: auditLogs.filter(log => log.timestamp.startsWith(today)).length,
    highRisk: auditLogs.filter(log => log.risk_level === "high" || log.risk_level === "critical").length,
    failed: auditLogs.filter(log => log.status === "error").length
  };

  const formatDetails = (details: Record<string, any> | null): string => {
    if (!details) return 'No details available';
    try {
      return JSON.stringify(details, null, 2);
    } catch {
      return 'Unable to display details';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    try {
      return format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss');
    } catch {
      return timestamp;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
          <Button variant="outline" onClick={fetchAuditLogs}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
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
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search logs by user, action, or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
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
            <Badge variant="secondary" className="ml-2">{filteredLogs.length} entries</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No audit logs found</p>
              <p className="text-sm">Activity will appear here as actions are performed in the system</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 border border-border rounded-lg hover:border-primary/50 transition-all"
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(log.status)}
                    <div className="p-2 rounded-lg bg-muted border">
                      {getCategoryIcon(log.category)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold">{log.action}</h3>
                      <Badge variant="outline" className="capitalize">
                        {mapCategoryToDisplay(log.category)}
                      </Badge>
                      <Badge 
                        variant={log.risk_level === 'high' || log.risk_level === 'critical' ? 'destructive' : log.risk_level === 'medium' ? 'default' : 'secondary'}
                      >
                        {log.risk_level || 'low'} risk
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2 truncate">
                      {log.details ? JSON.stringify(log.details).substring(0, 100) + '...' : 'No details'}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{log.user_email || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimestamp(log.timestamp)}</span>
                      </div>
                      {log.ip_address && <span>IP: {log.ip_address}</span>}
                    </div>
                  </div>

                  <div className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setSelectedLog(log)}>
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(selectedLog.status)}
                <div className="p-2 rounded-lg bg-muted border">
                  {getCategoryIcon(selectedLog.category)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedLog.action}</h3>
                  <p className="text-sm text-muted-foreground">Log ID: {selectedLog.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Category</p>
                    <Badge variant="outline" className="capitalize">
                      {mapCategoryToDisplay(selectedLog.category)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Risk Level</p>
                    <Badge 
                      variant={selectedLog.risk_level === 'high' || selectedLog.risk_level === 'critical' ? 'destructive' : 'secondary'}
                    >
                      {selectedLog.risk_level || 'low'} risk
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge 
                      variant={selectedLog.status === 'success' ? 'default' : selectedLog.status === 'error' ? 'destructive' : 'secondary'}
                      className="capitalize"
                    >
                      {selectedLog.status || 'unknown'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">User</p>
                    <p className="text-sm font-semibold">{selectedLog.user_email || 'Unknown'}</p>
                    {selectedLog.user_role && (
                      <p className="text-xs text-muted-foreground capitalize">Role: {selectedLog.user_role}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
                    <p className="text-sm">{formatTimestamp(selectedLog.timestamp)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">IP Address</p>
                    <p className="text-sm font-mono">{selectedLog.ip_address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Details</p>
                <div className="p-4 bg-muted/50 rounded-lg border overflow-auto max-h-48">
                  <pre className="text-sm whitespace-pre-wrap">{formatDetails(selectedLog.details)}</pre>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedLog(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLogs;