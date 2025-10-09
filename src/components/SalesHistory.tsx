import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  Filter,
  Calendar,
  Download,
  Eye,
  DollarSign,
  Clock,
  User,
  Package,
  CreditCard,
  Trash2,
  RefreshCw
} from "lucide-react";

interface SaleRecord {
  id: string;
  sale_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: string;
  created_at: string;
  created_by: string | null;
  status?: "completed" | "refunded" | "cancelled";
  sale_items?: Array<{
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    products?: {
      name: string;
    };
  }>;
  profiles?: {
    full_name: string | null;
  };
}

const SalesHistory = () => {
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("today");
  const [selectedPayment, setSelectedPayment] = useState("all");
  const [salesRecords, setSalesRecords] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = async () => {
    try {
      setLoading(true);
      
      // Calculate date filter
      let dateFilter = '';
      const today = new Date();
      
      switch (selectedDate) {
        case 'today':
          dateFilter = today.toISOString().split('T')[0];
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter = weekAgo.toISOString().split('T')[0];
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateFilter = monthAgo.toISOString().split('T')[0];
          break;
      }

      let query = supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            id,
            product_id,
            quantity,
            unit_price,
            total_price,
            products (
              name
            )
          ),
          profiles (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (selectedDate === 'today') {
        query = query.gte('created_at', `${dateFilter}T00:00:00.000Z`);
      } else if (selectedDate === 'week' || selectedDate === 'month') {
        query = query.gte('created_at', `${dateFilter}T00:00:00.000Z`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setSalesRecords(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching sales",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (saleId: string) => {
    try {
      // In a real implementation, you'd create a refund record and reverse stock movements
      toast({
        title: "Refund initiated",
        description: "Refund process has been started. Stock will be updated.",
      });
      
      // Refresh sales data
      fetchSales();
    } catch (error: any) {
      toast({
        title: "Refund failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchSales();
  }, [selectedDate]);

  // Filter sales based on search term
  const filteredSales = salesRecords.filter(record => 
    record.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.sale_items?.some(item => 
      item.products?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "cash": return <DollarSign className="w-4 h-4 text-success" />;
      case "card": return <CreditCard className="w-4 h-4 text-primary" />;
      case "mobile": return <Package className="w-4 h-4 text-accent" />;
      case "split": return <RefreshCw className="w-4 h-4 text-warning" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "success";
      case "refunded": return "warning";
      case "cancelled": return "destructive";
      default: return "secondary";
    }
  };

  const totalSales = filteredSales.reduce((sum, record) => sum + record.total_amount, 0);
  const todaysSales = filteredSales.length;
  const refundCount = filteredSales.filter(record => record.status === 'refunded').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Sales History
          </h1>
          <p className="text-muted-foreground">Complete transaction records and sales analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button className="bg-gradient-primary">
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filter
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Sales</p>
                <p className="text-2xl font-bold text-success">{todaysSales}</p>
              </div>
              <div className="p-3 bg-success/10 rounded-lg">
                <Package className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalSales)}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-accent/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Transaction</p>
                <p className="text-2xl font-bold text-accent">{formatCurrency(totalSales / todaysSales)}</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-lg">
                <CreditCard className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-warning/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Refunds</p>
                <p className="text-2xl font-bold text-warning">{refundCount}</p>
              </div>
              <div className="p-3 bg-warning/10 rounded-lg">
                <RefreshCw className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by invoice, customer, or product..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={selectedDate === "today" ? "default" : "outline"} 
                size="sm"
                onClick={() => setSelectedDate("today")}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Today
              </Button>
              <Button 
                variant={selectedDate === "week" ? "default" : "outline"} 
                size="sm"
                onClick={() => setSelectedDate("week")}
              >
                This Week
              </Button>
              <Button 
                variant={selectedDate === "month" ? "default" : "outline"} 
                size="sm"
                onClick={() => setSelectedDate("month")}
              >
                This Month
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Records */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading sales history...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No sales records found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSales.map((record) => (
                <div
                  key={record.id}
                  className="border border-border rounded-lg p-6 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold">{record.sale_number}</h3>
                          <Badge variant="outline" className={`border-${getStatusColor(record.status || 'completed')} text-${getStatusColor(record.status || 'completed')}`}>
                            {record.status || 'completed'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{new Date(record.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold">{formatCurrency(record.total_amount)}</p>
                      <div className="flex items-center gap-1 justify-end mt-1">
                        {getPaymentIcon(record.payment_method)}
                        <span className="text-sm text-muted-foreground capitalize">{record.payment_method}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Customer</p>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{record.customer_name || 'Walk-in Customer'}</p>
                          <p className="text-xs text-muted-foreground">{record.customer_phone || 'No phone'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Cashier</p>
                      <p className="font-medium">{record.profiles?.full_name || 'System User'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Items</p>
                      <p className="font-medium">{record.sale_items?.length || 0} item(s)</p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {record.sale_items?.map((item, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {item.quantity}x {item.products?.name || 'Unknown Item'} - {formatCurrency(item.total_price)}
                        </Badge>
                      )) || (
                        <Badge variant="secondary" className="text-xs">No items found</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Subtotal: {formatCurrency(record.subtotal)}</span>
                        {record.discount_amount > 0 && <span>Discount: -{formatCurrency(record.discount_amount)}</span>}
                        <span>Tax: {formatCurrency(record.tax_amount)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-1" />
                          Receipt
                        </Button>
                        {(record.status === "completed" || !record.status) && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-warning border-warning hover:bg-warning/10"
                            onClick={() => handleRefund(record.id)}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Refund
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesHistory;