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
  max_stock_level: number;
  cost_price: number;
  selling_price: number;
  category_id: string;
  unit_id: string;
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
  unit_cost?: number;
  products: { name: string; sku: string };
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchStockMovements()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, sku, current_stock, min_stock_level, max_stock_level, 
          cost_price, selling_price, category_id, unit_id,
          categories!inner(name),
          units!inner(name, symbol)
        `)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Products fetch error:', error);
        toast({ 
          title: "Error", 
          description: `Failed to fetch products: ${error.message}`, 
          variant: "destructive" 
        });
      } else {
        setProducts(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({ 
        title: "Error", 
        description: "An unexpected error occurred while fetching products", 
        variant: "destructive" 
      });
    }
  };

  const fetchStockMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          id, type, quantity, reference_number, notes, created_at, unit_cost,
          products!inner(name, sku)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Stock movements fetch error:', error);
        toast({ 
          title: "Error", 
          description: `Failed to fetch stock movements: ${error.message}`, 
          variant: "destructive" 
        });
      } else {
        setStockMovements(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({ 
        title: "Error", 
        description: "An unexpected error occurred while fetching stock movements", 
        variant: "destructive" 
      });
    }
  };

  const handleStockMovement = async () => {
    if (!selectedProduct || !quantity || quantity <= 0) {
      toast({ 
        title: "Validation Error", 
        description: "Please select a product and enter a valid quantity", 
        variant: "destructive" 
      });
      return;
    }

    setSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('stock_movements')
        .insert({
          product_id: selectedProduct,
          type: movementType,
          quantity: quantity,
          reference_number: `${movementType.toUpperCase()}-${Date.now()}`,
          notes: notes || null,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) {
        throw error;
      }

      toast({ 
        title: "Success", 
        description: "Stock movement recorded successfully",
        variant: "default"
      });
      
      setIsDialogOpen(false);
      setSelectedProduct("");
      setQuantity(0);
      setNotes("");
      
      // Refresh data
      await Promise.all([fetchProducts(), fetchStockMovements()]);
      
    } catch (error: any) {
      console.error('Stock movement error:', error);
      toast({ 
        title: "Error", 
        description: `Failed to record stock movement: ${error.message}`, 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
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
                
                <Button 
                  onClick={handleStockMovement} 
                  className="w-full"
                  disabled={submitting || !selectedProduct || !quantity}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Recording...
                    </>
                  ) : (
                    'Record Movement'
                  )}
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
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-muted-foreground">Loading products...</span>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No Products Found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm || filterType !== "all" 
                      ? "No products match your current filters" 
                      : "Start by adding products to your inventory"}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Product</TableHead>
                        <TableHead className="font-semibold">SKU</TableHead>
                        <TableHead className="font-semibold">Category</TableHead>
                        <TableHead className="font-semibold text-center">Current Stock</TableHead>
                        <TableHead className="font-semibold text-center">Min Level</TableHead>
                        <TableHead className="font-semibold text-center">Max Level</TableHead>
                        <TableHead className="font-semibold text-center">Status</TableHead>
                        <TableHead className="font-semibold text-right">Unit Price</TableHead>
                        <TableHead className="font-semibold text-right">Stock Value</TableHead>
                        <TableHead className="font-semibold text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map(product => {
                        const stockStatus = getStockStatus(product.current_stock, product.min_stock_level);
                        const stockValue = product.current_stock * product.cost_price;
                        return (
                          <TableRow key={product.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-xs text-muted-foreground">{product.units?.name}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">
                                {product.sku || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {product.categories?.name || 'Uncategorized'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="font-medium">
                                {product.current_stock} {product.units?.symbol}
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground">
                              {product.min_stock_level} {product.units?.symbol}
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground">
                              {product.max_stock_level} {product.units?.symbol}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge 
                                variant={stockStatus.color as any}
                                className="text-xs"
                              >
                                {stockStatus.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${product.cost_price.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              <div className="text-sm">${stockValue.toFixed(2)}</div>
                              <div className="text-xs text-muted-foreground">
                                {product.current_stock} × ${product.cost_price.toFixed(2)}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Package className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <TrendingUp className="mr-2 h-4 w-4" />
                                    Quick Stock In
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <TrendingDown className="mr-2 h-4 w-4" />
                                    Quick Stock Out
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
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
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-muted-foreground">Loading movements...</span>
                </div>
              ) : stockMovements.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No Stock Movements</h3>
                  <p className="text-sm text-muted-foreground">
                    Stock movements will appear here as you record them
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Product</TableHead>
                        <TableHead className="font-semibold">Type</TableHead>
                        <TableHead className="font-semibold text-center">Quantity</TableHead>
                        <TableHead className="font-semibold">Reference</TableHead>
                        <TableHead className="font-semibold">Date & Time</TableHead>
                        <TableHead className="font-semibold">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockMovements.map(movement => (
                        <TableRow key={movement.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="font-medium">{movement.products?.name}</div>
                            <div className="text-xs text-muted-foreground">
                              SKU: {movement.products?.sku || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getMovementIcon(movement.type)}
                              <Badge 
                                variant={movement.type === 'in' || movement.type === 'return' ? 'default' : 'secondary'}
                                className="capitalize text-xs"
                              >
                                {movement.type.replace('_', ' ')}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            <span className={movement.type === 'in' || movement.type === 'return' ? 'text-green-600' : 'text-red-600'}>
                              {movement.type === 'in' || movement.type === 'return' ? '+' : '-'}{movement.quantity}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {movement.reference_number}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(movement.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(movement.created_at).toLocaleTimeString()}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            {movement.notes ? (
                              <div className="text-sm truncate" title={movement.notes}>
                                {movement.notes}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">No notes</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockManagement;