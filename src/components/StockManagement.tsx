import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel, exportToCSV, importFromCSV, importFromExcel, formatForExport } from "@/lib/exportImport";
import { 
  Package, 
  Plus, 
  Minus, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  RotateCcw,
  Search,
  Filter,
  Download,
  Upload,
  FileText,
  File,
  MoreHorizontal
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
  const [filterType, setFilterType] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [movementType, setMovementType] = useState<'in' | 'out' | 'damage' | 'return' | 'adjustment'>('in');
  const [quantity, setQuantity] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Export functions
  const exportProducts = (format: 'excel' | 'csv') => {
    const exportData = formatForExport(
      filteredProducts.map(p => ({
        Name: p.name,
        SKU: p.sku,
        'Current Stock': p.current_stock,
        'Min Level': p.min_stock_level,
        'Cost Price': p.cost_price,
        'Selling Price': p.selling_price,
        Category: p.categories?.name,
        Unit: p.units?.symbol,
        'Stock Value': (p.current_stock * p.cost_price).toFixed(2),
        Status: getStockStatus(p.current_stock, p.min_stock_level).status
      }))
    );

    if (format === 'excel') {
      exportToExcel(exportData, 'inventory-products', 'Products');
    } else {
      exportToCSV(exportData, 'inventory-products');
    }
    
    toast({ title: "Success", description: `Products exported to ${format.toUpperCase()}` });
  };

  const exportMovements = (format: 'excel' | 'csv') => {
    const exportData = formatForExport(
      stockMovements.map(m => ({
        'Product Name': m.products?.name,
        Type: m.type,
        Quantity: m.quantity,
        'Reference Number': m.reference_number,
        Notes: m.notes,
        Date: new Date(m.created_at).toLocaleDateString()
      }))
    );

    if (format === 'excel') {
      exportToExcel(exportData, 'stock-movements', 'Movements');
    } else {
      exportToCSV(exportData, 'stock-movements');
    }
    
    toast({ title: "Success", description: `Stock movements exported to ${format.toUpperCase()}` });
  };

  // Import function
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      let importedData;
      if (file.name.endsWith('.csv')) {
        importedData = await importFromCSV(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        importedData = await importFromExcel(file);
      } else {
        toast({ title: "Error", description: "Please select a CSV or Excel file", variant: "destructive" });
        return;
      }

      console.log('Imported data:', importedData);
      toast({ title: "Success", description: `Imported ${importedData.length} records` });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to import file", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Stock & Inventory Management
          </h1>
          <p className="text-muted-foreground">Track stock movements, manage inventory levels</p>
        </div>
        
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileImport}
            className="hidden"
          />
          
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>

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
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle>Product Inventory</CardTitle>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => exportProducts('excel')}>
                        <FileText className="mr-2 h-4 w-4" />
                        Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportProducts('csv')}>
                        <File className="mr-2 h-4 w-4" />
                        CSV
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
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
            </CardHeader>
            
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Min Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Stock Value</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map(product => {
                    const stockStatus = getStockStatus(product.current_stock, product.min_stock_level);
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.sku}</Badge>
                        </TableCell>
                        <TableCell>{product.categories?.name}</TableCell>
                        <TableCell>
                          {product.current_stock} {product.units?.symbol}
                        </TableCell>
                        <TableCell>
                          {product.min_stock_level} {product.units?.symbol}
                        </TableCell>
                        <TableCell>
                          <Badge variant={stockStatus.color as any}>{stockStatus.status}</Badge>
                        </TableCell>
                        <TableCell>${product.cost_price.toFixed(2)}</TableCell>
                        <TableCell>${(product.current_stock * product.cost_price).toFixed(2)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>Edit Product</DropdownMenuItem>
                              <DropdownMenuItem>Stock Movement</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Stock Movements</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => exportMovements('excel')}>
                      <FileText className="mr-2 h-4 w-4" />
                      Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportMovements('csv')}>
                      <File className="mr-2 h-4 w-4" />
                      CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockMovements.map(movement => (
                    <TableRow key={movement.id}>
                      <TableCell className="font-medium">{movement.products?.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getMovementIcon(movement.type)}
                          <span className="capitalize">{movement.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>{movement.quantity}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{movement.reference_number}</Badge>
                      </TableCell>
                      <TableCell>{new Date(movement.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {movement.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockManagement;