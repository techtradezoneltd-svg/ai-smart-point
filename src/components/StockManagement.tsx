import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  Plus, 
  Minus, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  RotateCcw,
  Search,
  Filter
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  current_stock: number;
  min_stock_level: number;
  cost_price: number;
  selling_price: number;
  categories: { name: string };
  units: { name: string; symbol: string };
}

interface StockMovement {
  id: string;
  type: 'in' | 'out' | 'damage' | 'return' | 'adjustment';
  quantity: number;
  reference_number: string;
  notes: string;
  created_at: string;
  products: { name: string };
}

const StockManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [movementType, setMovementType] = useState<'in' | 'out' | 'damage' | 'return' | 'adjustment'>('in');
  const [quantity, setQuantity] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
    fetchStockMovements();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, name, sku, current_stock, min_stock_level, cost_price, selling_price,
        categories(name),
        units(name, symbol)
      `)
      .eq('is_active', true);

    if (error) {
      toast({ title: "Error", description: "Failed to fetch products", variant: "destructive" });
    } else {
      setProducts(data || []);
    }
  };

  const fetchStockMovements = async () => {
    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        id, type, quantity, reference_number, notes, created_at,
        products(name)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      toast({ title: "Error", description: "Failed to fetch stock movements", variant: "destructive" });
    } else {
      setStockMovements(data || []);
    }
  };

  const handleStockMovement = async () => {
    if (!selectedProduct || !quantity) {
      toast({ title: "Error", description: "Please select product and enter quantity", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from('stock_movements')
      .insert({
        product_id: selectedProduct,
        type: movementType,
        quantity: quantity,
        reference_number: `${movementType.toUpperCase()}-${Date.now()}`,
        notes: notes
      });

    if (error) {
      toast({ title: "Error", description: "Failed to record stock movement", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Stock movement recorded successfully" });
      setIsDialogOpen(false);
      setQuantity(0);
      setNotes("");
      fetchProducts();
      fetchStockMovements();
    }
  };

  const getStockStatus = (current: number, min: number) => {
    if (current <= min * 0.5) return { status: "Critical", color: "destructive" };
    if (current <= min) return { status: "Low", color: "warning" };
    return { status: "Good", color: "success" };
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'out': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'damage': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'return': return <RotateCcw className="h-4 w-4 text-blue-500" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === "low") return matchesSearch && product.current_stock <= product.min_stock_level;
    if (filterType === "critical") return matchesSearch && product.current_stock <= product.min_stock_level * 0.5;
    return matchesSearch;
  });

  const lowStockItems = products.filter(p => p.current_stock <= p.min_stock_level);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Stock & Inventory Management
          </h1>
          <p className="text-muted-foreground">Track stock movements, manage inventory levels</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
              <Package className="mr-2 h-4 w-4" />
              Record Movement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Stock Movement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Movement Type</Label>
                <Select value={movementType} onValueChange={(value: any) => setMovementType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Stock In</SelectItem>
                    <SelectItem value="out">Stock Out</SelectItem>
                    <SelectItem value="damage">Damage</SelectItem>
                    <SelectItem value="return">Return</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  placeholder="Enter quantity"
                />
              </div>
              
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes (optional)"
                />
              </div>
              
              <Button onClick={handleStockMovement} className="w-full">
                Record Movement
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alert for low stock */}
      {lowStockItems.length > 0 && (
        <Card className="border-l-4 border-l-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2">{lowStockItems.length} items are running low on stock:</p>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.slice(0, 5).map(item => (
                <Badge key={item.id} variant="outline" className="text-warning border-warning">
                  {item.name} ({item.current_stock} left)
                </Badge>
              ))}
              {lowStockItems.length > 5 && (
                <Badge variant="outline">+{lowStockItems.length - 5} more</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Current Stock</TabsTrigger>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="critical">Critical Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filteredProducts.map(product => {
              const stockStatus = getStockStatus(product.current_stock, product.min_stock_level);
              return (
                <Card key={product.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{product.name}</h3>
                          <Badge variant="outline">{product.sku}</Badge>
                          <Badge variant={stockStatus.color as any}>{stockStatus.status}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Current Stock:</span>
                            <p className="font-medium">{product.current_stock} {product.units?.symbol}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Min Level:</span>
                            <p className="font-medium">{product.min_stock_level} {product.units?.symbol}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Category:</span>
                            <p className="font-medium">{product.categories?.name}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Value:</span>
                            <p className="font-medium">${(product.current_stock * product.cost_price).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <div className="grid gap-4">
            {stockMovements.map(movement => (
              <Card key={movement.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getMovementIcon(movement.type)}
                      <div>
                        <h4 className="font-medium">{movement.products?.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {movement.type.charAt(0).toUpperCase() + movement.type.slice(1)} - {movement.quantity} units
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{movement.reference_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(movement.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {movement.notes && (
                    <p className="text-sm text-muted-foreground mt-2 border-t pt-2">
                      {movement.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockManagement;