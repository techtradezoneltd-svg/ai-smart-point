import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Search, 
  AlertTriangle, 
  TrendingUp, 
  Brain,
  RefreshCw,
  Plus,
  Eye,
  Edit,
  BarChart3
} from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  supplier: string;
  lastRestocked: string;
  aiInsight: string;
  trend: "up" | "down" | "stable";
}

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const inventoryData: InventoryItem[] = [
    {
      id: "1",
      name: "iPhone 15 Pro",
      category: "Electronics",
      stock: 23,
      minStock: 10,
      price: 999.99,
      supplier: "Apple Inc.",
      lastRestocked: "2024-01-20",
      aiInsight: "High demand predicted - reorder in 2 days",
      trend: "down"
    },
    {
      id: "2",
      name: "Samsung Galaxy S24",
      category: "Electronics",
      stock: 8,
      minStock: 15,
      price: 799.99,
      supplier: "Samsung",
      lastRestocked: "2024-01-18",
      aiInsight: "Below minimum stock - urgent reorder needed",
      trend: "down"
    },
    {
      id: "3",
      name: "Apple AirPods Pro",
      category: "Electronics",
      stock: 45,
      minStock: 20,
      price: 249.99,
      supplier: "Apple Inc.",
      lastRestocked: "2024-01-22",
      aiInsight: "Optimal stock level - no action needed",
      trend: "stable"
    },
    {
      id: "4",
      name: "Wireless Charger",
      category: "Accessories",
      stock: 67,
      minStock: 25,
      price: 39.99,
      supplier: "TechCorp",
      lastRestocked: "2024-01-15",
      aiInsight: "Seasonal increase predicted next month",
      trend: "up"
    }
  ];

  const filteredInventory = inventoryData.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = inventoryData.filter(item => item.stock <= item.minStock);
  const totalValue = inventoryData.reduce((sum, item) => sum + (item.stock * item.price), 0);

  const getStockStatus = (item: InventoryItem) => {
    if (item.stock <= item.minStock / 2) return { status: "critical", color: "destructive" };
    if (item.stock <= item.minStock) return { status: "low", color: "warning" };
    return { status: "good", color: "success" };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="w-4 h-4 text-success" />;
      case "down": return <TrendingUp className="w-4 h-4 text-destructive rotate-180" />;
      default: return <div className="w-4 h-4 bg-muted rounded-full" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            AI Inventory Management
          </h1>
          <p className="text-muted-foreground">Smart stock control with predictive analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{inventoryData.length}</div>
            <p className="text-xs text-muted-foreground">Active products</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-warning/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-success/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Inventory worth</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
            <Brain className="h-4 w-4 text-accent animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">12</div>
            <p className="text-xs text-muted-foreground">Active recommendations</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-gradient-card border-border">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search products by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Product Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredInventory.map((item) => {
              const stockStatus = getStockStatus(item);
              
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{item.name}</h3>
                        <Badge variant="outline">{item.category}</Badge>
                        {getTrendIcon(item.trend)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Supplier: {item.supplier} • Last restocked: {item.lastRestocked}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Brain className="w-3 h-3 text-accent" />
                        <p className="text-xs text-accent">{item.aiInsight}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Stock</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold text-${stockStatus.color}`}>
                          {item.stock}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`border-${stockStatus.color} text-${stockStatus.color}`}
                        >
                          {stockStatus.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="text-lg font-bold">${item.price}</p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Value</p>
                      <p className="text-lg font-bold text-success">
                        ${(item.stock * item.price).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card className="bg-gradient-card border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-accent animate-pulse" />
            AI Inventory Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border border-accent/30 rounded-lg bg-accent/5">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-accent">Urgent Restock Alert</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Samsung Galaxy S24 is below minimum stock (8/15 units). AI predicts stockout in 3 days based on current sales velocity.
                </p>
                <p className="text-xs text-accent mt-2">Recommended order: 50 units from Samsung</p>
              </div>
              <Button size="sm" className="bg-gradient-accent">
                Auto-Order
              </Button>
            </div>
          </div>

          <div className="p-4 border border-warning/30 rounded-lg bg-warning/5">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-warning">Seasonal Demand Prediction</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Wireless Charger sales expected to increase 40% next month due to back-to-school season.
                </p>
                <p className="text-xs text-warning mt-2">Recommended action: Increase stock to 100 units</p>
              </div>
              <Button size="sm" variant="outline">
                Schedule Order
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;