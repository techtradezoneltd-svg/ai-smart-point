import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
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
  MoreHorizontal,
  Edit,
  Trash2
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
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [movementType, setMovementType] = useState<'in' | 'out' | 'damage' | 'return' | 'adjustment'>('in');
  const [quantity, setQuantity] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { currencySymbol, formatCurrency } = useCurrency();
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

  // Download import template
  const downloadImportTemplate = (format: 'excel' | 'csv') => {
    const templateData = [
      {
        'SKU': 'PROD-001',
        'Product Name': 'Example Product',
        'Type': 'in',
        'Quantity': 100,
        'Notes': 'Initial stock',
        'Reference Number': 'REF-001',
        'Unit Cost': 25.00
      },
      {
        'SKU': 'PROD-002',
        'Product Name': 'Another Product',
        'Type': 'out',
        'Quantity': 10,
        'Notes': 'Sold to customer',
        'Reference Number': 'REF-002',
        'Unit Cost': 30.00
      },
      {
        'SKU': 'PROD-003',
        'Product Name': 'Sample Item',
        'Type': 'damage',
        'Quantity': 2,
        'Notes': 'Damaged during handling',
        'Reference Number': 'REF-003',
        'Unit Cost': 15.00
      }
    ];

    if (format === 'excel') {
      exportToExcel(templateData, 'stock-movement-template', 'Template');
    } else {
      exportToCSV(templateData, 'stock-movement-template');
    }
    
    toast({ 
      title: "Template Downloaded", 
      description: `Stock movement import template downloaded. Valid types: in, out, damage, return, adjustment` 
    });
  };

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

  // Import function - saves stock movements to database
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      let importedData: any[];
      if (file.name.endsWith('.csv')) {
        importedData = await importFromCSV(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        importedData = await importFromExcel(file);
      } else {
        toast({ title: "Error", description: "Please select a CSV or Excel file", variant: "destructive" });
        return;
      }

      if (!importedData || importedData.length === 0) {
        toast({ title: "Error", description: "No data found in the file", variant: "destructive" });
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Error", description: "You must be logged in to import stock movements", variant: "destructive" });
        return;
      }

      // Build a product lookup map (by SKU or name)
      const productMap = new Map<string, string>();
      products.forEach(p => {
        productMap.set(p.sku?.toLowerCase(), p.id);
        productMap.set(p.name?.toLowerCase(), p.id);
      });

      let successCount = 0;
      let skipCount = 0;
      const errors: string[] = [];

      for (const row of importedData) {
        // Try to find product by SKU or Name (flexible column naming)
        const productIdentifier = (
          row['SKU'] || row['sku'] || row['Sku'] ||
          row['Product SKU'] || row['product_sku'] ||
          row['Product Name'] || row['product_name'] ||
          row['Product'] || row['product'] ||
          row['Name'] || row['name']
        )?.toString().toLowerCase();

        const productId = productIdentifier ? productMap.get(productIdentifier) : null;

        if (!productId) {
          skipCount++;
          errors.push(`Product not found: ${productIdentifier || 'Unknown'}`);
          continue;
        }

        // Parse movement type (flexible column naming)
        const typeRaw = (
          row['Type'] || row['type'] || row['Movement Type'] || 
          row['movement_type'] || row['MovementType']
        )?.toString().toLowerCase();

        // Map common type names to valid values
        let type: 'in' | 'out' | 'damage' | 'return' | 'adjustment' = 'in';
        if (typeRaw) {
          if (['in', 'stock in', 'stock_in', 'stockin', 'receive', 'received'].includes(typeRaw)) {
            type = 'in';
          } else if (['out', 'stock out', 'stock_out', 'stockout', 'sold', 'issue'].includes(typeRaw)) {
            type = 'out';
          } else if (['damage', 'damaged', 'broken', 'spoiled'].includes(typeRaw)) {
            type = 'damage';
          } else if (['return', 'returned', 'refund'].includes(typeRaw)) {
            type = 'return';
          } else if (['adjustment', 'adjust', 'correction'].includes(typeRaw)) {
            type = 'adjustment';
          }
        }

        // Parse quantity (flexible column naming)
        const quantityRaw = row['Quantity'] || row['quantity'] || row['Qty'] || row['qty'] || row['Amount'] || row['amount'];
        const quantity = parseInt(quantityRaw?.toString() || '0', 10);

        if (!quantity || quantity <= 0) {
          skipCount++;
          errors.push(`Invalid quantity for ${productIdentifier}: ${quantityRaw}`);
          continue;
        }

        // Parse optional fields
        const notes = row['Notes'] || row['notes'] || row['Note'] || row['note'] || row['Remarks'] || row['remarks'] || null;
        const referenceNumber = row['Reference Number'] || row['reference_number'] || row['Reference'] || row['reference'] || 
                                row['Ref'] || row['ref'] || `IMP-${Date.now()}-${successCount}`;
        const unitCost = parseFloat(row['Unit Cost'] || row['unit_cost'] || row['Cost'] || row['cost'] || '0') || null;

        // Insert stock movement
        const { error } = await supabase
          .from('stock_movements')
          .insert({
            product_id: productId,
            type,
            quantity,
            reference_number: referenceNumber,
            notes,
            unit_cost: unitCost,
            created_by: user.id
          });

        if (error) {
          skipCount++;
          errors.push(`Failed to insert movement for ${productIdentifier}: ${error.message}`);
        } else {
          successCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        toast({ 
          title: "Import Complete", 
          description: `Successfully imported ${successCount} stock movements${skipCount > 0 ? `, ${skipCount} skipped` : ''}` 
        });
        // Refresh data
        await Promise.all([fetchProducts(), fetchStockMovements()]);
      } else {
        toast({ 
          title: "Import Failed", 
          description: `No records imported. ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}`, 
          variant: "destructive" 
        });
      }

      if (errors.length > 0) {
        console.warn('Import errors:', errors);
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast({ title: "Error", description: `Failed to import file: ${error.message}`, variant: "destructive" });
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6 min-h-screen overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Stock & Inventory
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">Track stock movements, manage inventory levels</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileImport}
            className="hidden"
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="text-sm sm:text-base">
                <Download className="mr-2 h-4 w-4" />
                Template
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => downloadImportTemplate('excel')}>
                <FileText className="mr-2 h-4 w-4" />
                Excel Template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadImportTemplate('csv')}>
                <File className="mr-2 h-4 w-4" />
                CSV Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            className="text-sm sm:text-base"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-sm sm:text-base">
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
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap">Product</TableHead>
                          <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap hidden sm:table-cell">SKU</TableHead>
                          <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">Category</TableHead>
                          <TableHead className="font-semibold text-center text-xs sm:text-sm whitespace-nowrap">Stock</TableHead>
                          <TableHead className="font-semibold text-center text-xs sm:text-sm whitespace-nowrap hidden lg:table-cell">Min</TableHead>
                          <TableHead className="font-semibold text-center text-xs sm:text-sm whitespace-nowrap hidden lg:table-cell">Max</TableHead>
                          <TableHead className="font-semibold text-center text-xs sm:text-sm whitespace-nowrap">Status</TableHead>
                          <TableHead className="font-semibold text-right text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">Price</TableHead>
                          <TableHead className="font-semibold text-right text-xs sm:text-sm whitespace-nowrap hidden lg:table-cell">Value</TableHead>
                          <TableHead className="font-semibold text-center text-xs sm:text-sm whitespace-nowrap">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map(product => {
                          const stockStatus = getStockStatus(product.current_stock, product.min_stock_level);
                          const stockValue = product.current_stock * product.cost_price;
                          return (
                            <TableRow key={product.id} className="hover:bg-muted/50 transition-colors">
                              <TableCell className="min-w-0">
                                <div className="font-medium text-xs sm:text-sm max-w-[120px] sm:max-w-[200px] truncate">
                                  {product.name}
                                </div>
                                <div className="text-xs text-muted-foreground sm:hidden">
                                  {product.categories?.name || 'N/A'}
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <Badge variant="outline" className="font-mono text-xs max-w-[80px] truncate">
                                  {product.sku || 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <Badge variant="secondary" className="text-xs max-w-[100px] truncate">
                                  {product.categories?.name || 'Uncategorized'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="font-medium text-xs sm:text-sm">
                                  {product.current_stock} {product.units?.symbol}
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-muted-foreground text-xs hidden lg:table-cell">
                                {product.min_stock_level} {product.units?.symbol}
                              </TableCell>
                              <TableCell className="text-center text-muted-foreground text-xs hidden lg:table-cell">
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
                              <TableCell className="text-right font-medium text-xs sm:text-sm hidden md:table-cell">
                                ${product.cost_price.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-medium text-xs hidden lg:table-cell">
                                <div className="text-xs sm:text-sm">${stockValue.toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground">
                                  {product.current_stock} × ${product.cost_price.toFixed(2)}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                                      <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setSelectedProductDetail(product)}>
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

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProductDetail} onOpenChange={() => {
        setSelectedProductDetail(null);
        setIsEditMode(false);
        setEditForm({});
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Product Stock Details</span>
              {!isEditMode ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                  <Button size="sm" onClick={() => {
                    setIsEditMode(true);
                    setEditForm(selectedProductDetail || {});
                  }}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    setIsEditMode(false);
                    setEditForm({});
                  }}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={async () => {
                    if (!selectedProductDetail) return;
                    const { error } = await supabase
                      .from('products')
                      .update({
                        name: editForm.name,
                        cost_price: editForm.cost_price,
                        selling_price: editForm.selling_price,
                        min_stock_level: editForm.min_stock_level,
                        max_stock_level: editForm.max_stock_level
                      })
                      .eq('id', selectedProductDetail.id);
                    
                    if (error) {
                      toast({ title: "Error", description: error.message, variant: "destructive" });
                    } else {
                      toast({ title: "Success", description: "Product updated successfully" });
                      setIsEditMode(false);
                      setSelectedProductDetail(null);
                      await fetchProducts();
                    }
                  }}>
                    Save Changes
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedProductDetail && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {isEditMode ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Product Name</label>
                        <Input 
                          value={editForm.name || ''} 
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Cost Price ({currencySymbol})</label>
                          <Input 
                            type="number"
                            step="0.01"
                            value={editForm.cost_price || ''} 
                            onChange={(e) => setEditForm({...editForm, cost_price: parseFloat(e.target.value)})}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Selling Price ({currencySymbol})</label>
                          <Input 
                            type="number"
                            step="0.01"
                            value={editForm.selling_price || ''} 
                            onChange={(e) => setEditForm({...editForm, selling_price: parseFloat(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Min Stock Level</label>
                          <Input 
                            type="number"
                            value={editForm.min_stock_level || ''} 
                            onChange={(e) => setEditForm({...editForm, min_stock_level: parseInt(e.target.value)})}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Max Stock Level</label>
                          <Input 
                            type="number"
                            value={editForm.max_stock_level || ''} 
                            onChange={(e) => setEditForm({...editForm, max_stock_level: parseInt(e.target.value)})}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-2xl font-bold mb-2">{selectedProductDetail.name}</h3>
                      <div className="flex gap-2">
                        <Badge variant="outline">SKU: {selectedProductDetail.sku}</Badge>
                        <Badge variant="outline">{selectedProductDetail.categories.name}</Badge>
                      </div>
                    </>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Current Stock</p>
                  <p className="text-3xl font-bold text-primary">{selectedProductDetail.current_stock}</p>
                  <p className="text-sm text-muted-foreground">{selectedProductDetail.units.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3">Stock Levels</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Stock:</span>
                        <span className="font-semibold">{selectedProductDetail.current_stock} {selectedProductDetail.units.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Minimum Level:</span>
                        <span>{selectedProductDetail.min_stock_level} {selectedProductDetail.units.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Maximum Level:</span>
                        <span>{selectedProductDetail.max_stock_level} {selectedProductDetail.units.symbol}</span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Stock Status:</span>
                          <Badge 
                            variant="outline" 
                            className={
                              selectedProductDetail.current_stock <= selectedProductDetail.min_stock_level 
                                ? "border-destructive text-destructive" 
                                : selectedProductDetail.current_stock >= selectedProductDetail.max_stock_level
                                ? "border-warning text-warning"
                                : "border-success text-success"
                            }
                          >
                            {selectedProductDetail.current_stock <= selectedProductDetail.min_stock_level 
                              ? "Low Stock" 
                              : selectedProductDetail.current_stock >= selectedProductDetail.max_stock_level
                              ? "Overstock"
                              : "Optimal"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3">Pricing</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cost Price:</span>
                        <span className="font-semibold">${selectedProductDetail.cost_price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Selling Price:</span>
                        <span className="font-semibold">${selectedProductDetail.selling_price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Profit Margin:</span>
                        <span className="font-semibold text-success">
                          ${(selectedProductDetail.selling_price - selectedProductDetail.cost_price).toFixed(2)}
                        </span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Stock Value:</span>
                          <span className="font-bold text-accent">
                            ${(selectedProductDetail.current_stock * selectedProductDetail.cost_price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Product Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Category</p>
                      <p className="font-semibold">{selectedProductDetail.categories.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Unit of Measurement</p>
                      <p className="font-semibold">{selectedProductDetail.units.name} ({selectedProductDetail.units.symbol})</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Product ID</p>
                      <p className="font-mono text-xs">{selectedProductDetail.id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">SKU</p>
                      <p className="font-mono">{selectedProductDetail.sku}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedProductDetail(null)}>
                  Close
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSelectedProduct(selectedProductDetail.id);
                    setMovementType('in');
                    setSelectedProductDetail(null);
                    setIsDialogOpen(true);
                  }}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Stock In
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSelectedProduct(selectedProductDetail.id);
                    setMovementType('out');
                    setSelectedProductDetail(null);
                    setIsDialogOpen(true);
                  }}
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Stock Out
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product "{selectedProductDetail?.name}". This action cannot be undone and will remove all associated stock movement history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!selectedProductDetail) return;
                const { error } = await supabase
                  .from('products')
                  .update({ is_active: false })
                  .eq('id', selectedProductDetail.id);
                
                if (error) {
                  toast({ title: "Error", description: error.message, variant: "destructive" });
                } else {
                  toast({ 
                    title: "Success", 
                    description: "Product deleted successfully",
                    variant: "default"
                  });
                  setShowDeleteDialog(false);
                  setSelectedProductDetail(null);
                  await fetchProducts();
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StockManagement;