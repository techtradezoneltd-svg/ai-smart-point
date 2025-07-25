import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: "cash" | "card" | "mobile" | "split";
  cashierName: string;
  timestamp: string;
  status: "completed" | "refunded" | "cancelled";
}

const SalesHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("today");
  const [selectedPayment, setSelectedPayment] = useState("all");

  const salesRecords: SaleRecord[] = [
    {
      id: "1",
      invoiceNumber: "INV-2024-001",
      customerName: "John Doe",
      customerPhone: "+1234567890",
      items: [
        { name: "Wireless Headphones", quantity: 1, price: 99.99, total: 99.99 },
        { name: "Phone Case", quantity: 2, price: 15.99, total: 31.98 }
      ],
      subtotal: 131.97,
      tax: 13.20,
      discount: 5.00,
      total: 140.17,
      paymentMethod: "card",
      cashierName: "Sarah Johnson",
      timestamp: "2024-01-25 14:30:22",
      status: "completed"
    },
    {
      id: "2",
      invoiceNumber: "INV-2024-002",
      customerName: "Alice Smith",
      customerPhone: "+1234567891",
      items: [
        { name: "Laptop Stand", quantity: 1, price: 45.00, total: 45.00 }
      ],
      subtotal: 45.00,
      tax: 4.50,
      discount: 0,
      total: 49.50,
      paymentMethod: "cash",
      cashierName: "Mike Wilson",
      timestamp: "2024-01-25 15:45:10",
      status: "completed"
    },
    {
      id: "3",
      invoiceNumber: "INV-2024-003",
      customerName: "Bob Johnson",
      customerPhone: "+1234567892",
      items: [
        { name: "Gaming Mouse", quantity: 1, price: 79.99, total: 79.99 },
        { name: "Mouse Pad", quantity: 1, price: 12.99, total: 12.99 }
      ],
      subtotal: 92.98,
      tax: 9.30,
      discount: 10.00,
      total: 92.28,
      paymentMethod: "mobile",
      cashierName: "Sarah Johnson",
      timestamp: "2024-01-25 16:20:15",
      status: "completed"
    }
  ];

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

  const totalSales = salesRecords.reduce((sum, record) => sum + record.total, 0);
  const todaysSales = salesRecords.length;

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
                <p className="text-2xl font-bold text-primary">${totalSales.toFixed(2)}</p>
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
                <p className="text-2xl font-bold text-accent">${(totalSales / todaysSales).toFixed(2)}</p>
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
                <p className="text-2xl font-bold text-warning">0</p>
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
              <Button variant={selectedDate === "today" ? "default" : "outline"} size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Today
              </Button>
              <Button variant={selectedDate === "week" ? "default" : "outline"} size="sm">
                This Week
              </Button>
              <Button variant={selectedDate === "month" ? "default" : "outline"} size="sm">
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
          <div className="space-y-4">
            {salesRecords.map((record) => (
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
                        <h3 className="font-semibold">{record.invoiceNumber}</h3>
                        <Badge variant="outline" className={`border-${getStatusColor(record.status)} text-${getStatusColor(record.status)}`}>
                          {record.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{record.timestamp}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold">${record.total.toFixed(2)}</p>
                    <div className="flex items-center gap-1 justify-end mt-1">
                      {getPaymentIcon(record.paymentMethod)}
                      <span className="text-sm text-muted-foreground capitalize">{record.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Customer</p>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{record.customerName}</p>
                        <p className="text-xs text-muted-foreground">{record.customerPhone}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Cashier</p>
                    <p className="font-medium">{record.cashierName}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Items</p>
                    <p className="font-medium">{record.items.length} item(s)</p>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {record.items.map((item, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {item.quantity}x {item.name} - ${item.total.toFixed(2)}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Subtotal: ${record.subtotal.toFixed(2)}</span>
                      {record.discount > 0 && <span>Discount: -${record.discount.toFixed(2)}</span>}
                      <span>Tax: ${record.tax.toFixed(2)}</span>
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
                      {record.status === "completed" && (
                        <Button size="sm" variant="outline" className="text-warning border-warning">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesHistory;