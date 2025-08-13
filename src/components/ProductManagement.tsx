import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  FileText,
  FileSpreadsheet,
  MoreHorizontal,
  Eye
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  min_stock_level: number;
  max_stock_level: number;
  category_id: string | null;
  unit_id: string | null;
  barcode: string | null;
  is_active: boolean;
  created_at: string;
  categories?: { name: string };
  units?: { name: string; symbol: string };
}

interface Category {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  name: string;
  symbol: string;
}

const ProductManagement = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    cost_price: "",
    selling_price: "",
    current_stock: "",
    min_stock_level: "",
    max_stock_level: "",
    category_id: "",
    unit_id: "",
    barcode: "",
    is_active: true
  });

  // Fetch data
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          units(name, symbol)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive"
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('name');

      if (error) throw error;
      setUnits(data || []);
    } catch (error: any) {
      console.error('Error fetching units:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchCategories(), fetchUnits()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.name || !formData.cost_price || !formData.selling_price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create products",
          variant: "destructive"
        });
        setSubmitting(false);
        return;
      }

      const productData = {
        name: formData.name,
        sku: formData.sku || null,
        description: formData.description || null,
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        current_stock: parseInt(formData.current_stock) || 0,
        min_stock_level: parseInt(formData.min_stock_level) || 10,
        max_stock_level: parseInt(formData.max_stock_level) || 1000,
        category_id: formData.category_id || null,
        unit_id: formData.unit_id || null,
        barcode: formData.barcode || null,
        is_active: formData.is_active,
        created_by: user.id
      };

      let error;
      if (selectedProduct) {
        // Update existing product
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', selectedProduct.id);
        error = updateError;
      } else {
        // Create new product
        const { error: insertError } = await supabase
          .from('products')
          .insert([productData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Product ${selectedProduct ? 'updated' : 'created'} successfully`
      });

      setIsDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: `Failed to ${selectedProduct ? 'update' : 'create'} product: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedProduct) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', selectedProduct.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully"
      });

      setDeleteDialogOpen(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: `Failed to delete product: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      description: "",
      cost_price: "",
      selling_price: "",
      current_stock: "",
      min_stock_level: "",
      max_stock_level: "",
      category_id: "",
      unit_id: "",
      barcode: "",
      is_active: true
    });
    setSelectedProduct(null);
  };

  // Open edit dialog
  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || "",
      description: product.description || "",
      cost_price: product.cost_price.toString(),
      selling_price: product.selling_price.toString(),
      current_stock: product.current_stock.toString(),
      min_stock_level: product.min_stock_level.toString(),
      max_stock_level: product.max_stock_level.toString(),
      category_id: product.category_id || "",
      unit_id: product.unit_id || "",
      barcode: product.barcode || "",
      is_active: product.is_active
    });
    setIsDialogOpen(true);
  };

  // Export functions
  const exportData = (format: 'excel' | 'csv') => {
    const exportData = formatForExport(
      filteredProducts.map(p => ({
        Name: p.name,
        SKU: p.sku || '',
        Description: p.description || '',
        'Cost Price': p.cost_price,
        'Selling Price': p.selling_price,
        'Current Stock': p.current_stock,
        'Min Stock Level': p.min_stock_level,
        'Max Stock Level': p.max_stock_level,
        Category: p.categories?.name || '',
        Unit: p.units?.name || '',
        'Unit Symbol': p.units?.symbol || '',
        Barcode: p.barcode || '',
        Active: p.is_active ? 'Yes' : 'No',
        'Stock Value': (p.current_stock * p.cost_price).toFixed(2),
        'Profit Margin': ((p.selling_price - p.cost_price) / p.cost_price * 100).toFixed(2) + '%'
      }))
    );

    if (format === 'excel') {
      exportToExcel(exportData, 'products-inventory', 'Products');
    } else {
      exportToCSV(exportData, 'products-inventory');
    }
    
    toast({ title: "Success", description: `Products exported to ${format.toUpperCase()}` });
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

      // Process imported data (you can enhance this based on your needs)
      console.log('Imported data:', importedData);
      toast({ title: "Success", description: `Imported ${importedData.length} records` });
      
      // Clear file input
      if (event.target) {
        event.target.value = '';
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to import file", variant: "destructive" });
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === "all" || product.category_id === filterCategory;
    
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && product.is_active) ||
                         (filterStatus === "inactive" && !product.is_active) ||
                         (filterStatus === "low_stock" && product.current_stock <= product.min_stock_level);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStockStatus = (current: number, min: number) => {
    if (current <= min * 0.5) return { status: "Critical", variant: "destructive" as const };
    if (current <= min) return { status: "Low", variant: "warning" as const };
    return { status: "Good", variant: "success" as const };
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6 min-h-screen overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Product Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Manage your product inventory with full CRUD operations
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Button
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
            className="bg-gradient-primary text-white shadow-glow hover:shadow-accent-glow text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-accent text-accent hover:bg-accent/10 text-sm sm:text-base">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportData('excel')}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportData('csv')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-success text-success hover:bg-success/10 text-sm sm:text-base">
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Import Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => csvInputRef.current?.click()}>
                  <FileText className="w-4 h-4 mr-2" />
                  Import CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileImport}
        className="hidden"
      />
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileImport}
        className="hidden"
      />

      {/* Filters */}
      <Card className="bg-gradient-card border-accent/30">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products by name, SKU, or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="bg-gradient-card border-accent/30 shadow-elegant">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground flex items-center gap-2 text-lg sm:text-xl">
            <Package className="w-5 h-5 text-primary" />
            Products ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap">Product</TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap hidden sm:table-cell">SKU</TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">Category</TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap text-right">Prices</TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap text-center">Stock</TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap text-center">Status</TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium mb-2">No products found</p>
                          <p className="text-sm">Add your first product to get started</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => {
                        const stockStatus = getStockStatus(product.current_stock, product.min_stock_level);
                        return (
                          <TableRow key={product.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="min-w-0">
                              <div className="font-medium text-xs sm:text-sm max-w-[120px] sm:max-w-[200px] truncate">
                                {product.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {product.units?.name || 'No unit'}
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
                            <TableCell className="text-right">
                              <div className="text-xs sm:text-sm">
                                <div className="font-medium">${product.selling_price}</div>
                                <div className="text-muted-foreground">${product.cost_price}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="text-xs sm:text-sm">
                                <div className="font-medium">{product.current_stock}</div>
                                <div className="text-muted-foreground">Min: {product.min_stock_level}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="space-y-1">
                                <Badge variant={stockStatus.variant === "warning" ? "outline" : stockStatus.variant === "success" ? "secondary" : "destructive"} className="text-xs">
                                  {stockStatus.status}
                                </Badge>
                                <Badge variant={product.is_active ? "secondary" : "outline"} className="text-xs block">
                                  {product.is_active ? "Active" : "Inactive"}
                                </Badge>
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
                                  <DropdownMenuItem onClick={() => openEditDialog(product)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedProduct(product);
                                      setDeleteDialogOpen(true);
                                    }}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter product name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Enter SKU"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost_price">Cost Price *</Label>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="selling_price">Selling Price *</Label>
              <Input
                id="selling_price"
                type="number"
                step="0.01"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_stock">Current Stock</Label>
              <Input
                id="current_stock"
                type="number"
                value={formData.current_stock}
                onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_stock_level">Min Stock Level</Label>
              <Input
                id="min_stock_level"
                type="number"
                value={formData.min_stock_level}
                onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                placeholder="10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_stock_level">Max Stock Level</Label>
              <Input
                id="max_stock_level"
                type="number"
                value={formData.max_stock_level}
                onChange={(e) => setFormData({ ...formData, max_stock_level: e.target.value })}
                placeholder="1000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="Enter barcode"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_id">Category</Label>
              <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_id">Unit</Label>
              <Select value={formData.unit_id} onValueChange={(value) => setFormData({ ...formData, unit_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name} ({unit.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter product description"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {selectedProduct ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                selectedProduct ? 'Update Product' : 'Create Product'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              "{selectedProduct?.name}" from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={submitting}
            >
              {submitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductManagement;