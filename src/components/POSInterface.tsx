import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/use-toast";
import ReceiptPreview from "./ReceiptPreview";
import { 
  Scan, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Smartphone,
  Brain,
  Sparkles,
  Percent,
  Package,
  Receipt
} from "lucide-react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  stock: number;
  sku: string;
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
  selling_price: number;
  current_stock: number;
  categories?: { name: string };
  units?: { name: string; symbol: string };
  barcode: string | null;
  is_active: boolean;
}

const POSInterface = () => {
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcode, setBarcode] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, sku, selling_price, current_stock, barcode, is_active,
          categories(name),
          units(name, symbol)
        `)
        .eq('is_active', true)
        .gt('current_stock', 0)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on search
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // AI Recommendations based on cart
  const getAIRecommendations = () => {
    if (cart.length === 0) return [];
    
    // Simple recommendation logic - suggest products from same categories
    const cartCategories = cart.map(item => item.category);
    return products
      .filter(p => cartCategories.includes(p.categories?.name || '') && !cart.find(c => c.id === p.id))
      .slice(0, 3)
      .map(p => ({
        id: p.id,
        name: p.name,
        price: p.selling_price,
        reason: "Often bought together"
      }));
  };

  const addToCart = (product: Product | any) => {
    // Check stock availability
    const currentCartItem = cart.find(item => item.id === product.id);
    const currentCartQuantity = currentCartItem ? currentCartItem.quantity : 0;
    
    if (currentCartQuantity >= (product.current_stock || product.stock)) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.current_stock || product.stock} units available`,
        variant: "destructive"
      });
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { 
        id: product.id,
        name: product.name,
        price: product.selling_price || product.price,
        quantity: 1,
        category: product.categories?.name || product.category || 'General',
        stock: product.current_stock || product.stock || 0,
        sku: product.sku || ''
      }];
    });
  };

  const updateQuantity = (id: string, change: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + change;
        if (newQuantity > item.stock) {
          toast({
            title: "Insufficient Stock",
            description: `Only ${item.stock} units available`,
            variant: "destructive"
          });
          return item;
        }
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  const handleBarcodeSearch = () => {
    if (!barcode.trim()) return;
    
    const product = products.find(p => 
      p.barcode === barcode.trim() || 
      p.sku === barcode.trim() ||
      p.id === barcode.trim()
    );
    
    if (product) {
      addToCart(product);
      setBarcode("");
      toast({
        title: "Product Added",
        description: `${product.name} added to cart`
      });
    } else {
      toast({
        title: "Product Not Found",
        description: "No product found with this barcode/SKU",
        variant: "destructive"
      });
    }
  };

  const showReceiptAndCompleteSale = (paymentMethod: string) => {
    setSelectedPaymentMethod(paymentMethod);
    setShowReceiptPreview(true);
  };

  const completeSale = async () => {
    if (cart.length === 0) return;
    
    setProcessing(true);
    try {
      // Generate sale number
      const saleNumber = `SALE-${Date.now()}`;
      
      // Create sale record
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          sale_number: saleNumber,
          customer_name: null,
          customer_phone: null,
          subtotal: subtotal,
          tax_amount: tax,
          discount_amount: 0,
          total_amount: total,
          payment_method: selectedPaymentMethod,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items and stock movements
      for (const item of cart) {
        // Insert sale item
        const { error: itemError } = await supabase
          .from('sale_items')
          .insert({
            sale_id: saleData.id,
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity
          });

        if (itemError) throw itemError;

        // Stock movement will be created automatically by trigger
      }

      toast({
        title: "Sale Completed",
        description: `Sale ${saleNumber} completed successfully`
      });

      // Clear cart and refresh products
      setCart([]);
      setShowReceiptPreview(false);
      setSelectedPaymentMethod("");
      fetchProducts();
      
    } catch (error: any) {
      toast({
        title: "Sale Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Professional POS Header */}
      <div className="bg-card/95 backdrop-blur border-b border-border p-4 mb-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Point of Sale</h1>
              <p className="text-sm text-muted-foreground">Professional Sales Terminal</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Exit POS
          </Button>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Barcode Scanner */}
            <Card className="bg-gradient-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scan className="w-5 h-5 text-primary" />
                  Smart Scanner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Scan barcode, SKU, or search product..."
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleBarcodeSearch} className="bg-gradient-primary">
                    <Scan className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
                <div className="mt-2">
                  <Input
                    placeholder="Search products by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Product Grid */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle>Products ({filteredProducts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading products...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No products found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="p-4 border border-border rounded-lg hover:border-primary/50 transition-all cursor-pointer group"
                        onClick={() => addToCart(product)}
                      >
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gradient-primary rounded-lg mx-auto mb-2 flex items-center justify-center">
                            <Package className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
                          <p className="text-xs text-muted-foreground mb-1">SKU: {product.sku || 'N/A'}</p>
                          <p className="text-lg font-bold text-primary">{formatCurrency(product.selling_price)}</p>
                          <div className="flex items-center justify-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {product.categories?.name || 'General'}
                            </Badge>
                            <Badge variant={product.current_stock > 10 ? "secondary" : "destructive"} className="text-xs">
                              {product.current_stock} in stock
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            {getAIRecommendations().length > 0 && (
              <Card className="bg-gradient-card border-accent/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-accent animate-pulse" />
                    AI Smart Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getAIRecommendations().map((rec) => (
                      <div
                        key={rec.id}
                        className="flex items-center justify-between p-3 border border-accent/30 rounded-lg hover:bg-accent/10 transition-all group cursor-pointer"
                        onClick={() => addToCart(rec)}
                      >
                        <div>
                          <p className="font-medium">{rec.name}</p>
                          <p className="text-sm text-accent">{rec.reason}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-accent">{formatCurrency(rec.price)}</span>
                          <Plus className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Cart & Checkout */}
          <div className="space-y-6">
            {/* Professional Cart */}
            <Card className="bg-card/95 backdrop-blur border-border shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-primary" />
                    </div>
                    Shopping Cart
                  </div>
                  <Badge variant="secondary" className="text-sm font-semibold">
                    {cart.length} {cart.length === 1 ? 'item' : 'items'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground font-medium">Your cart is empty</p>
                    <p className="text-sm text-muted-foreground">Add products to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {cart.map((item, index) => (
                      <div key={item.id} className="group">
                        <div className="bg-muted/30 rounded-lg p-4 border border-border/50 hover:border-primary/30 transition-all">
                          {/* Item Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm truncate mb-1">{item.name}</h4>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs font-medium">
                                  SKU: {item.sku || 'N/A'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatCurrency(item.price)} per unit
                                </span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => updateQuantity(item.id, -1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <div className="bg-background border border-border rounded px-3 py-1 min-w-[3rem] text-center">
                                <span className="font-semibold text-sm">{item.quantity}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => updateQuantity(item.id, 1)}
                                disabled={item.quantity >= item.stock}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                              <div className="ml-2">
                                <Badge variant={item.stock - item.quantity <= 5 ? "destructive" : "secondary"} className="text-xs">
                                  {item.stock - item.quantity} left
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Item Total */}
                            <div className="text-right">
                              <div className="font-bold text-lg text-primary">
                                {formatCurrency(item.price * item.quantity)}
                              </div>
                            </div>
                          </div>
                        </div>
                        {index < cart.length - 1 && <Separator className="my-2" />}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Professional Checkout */}
            {cart.length > 0 && (
              <Card className="bg-card/95 backdrop-blur border-success/30 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-success" />
                    </div>
                    Payment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Detailed Pricing Breakdown */}
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items):</span>
                      <span className="font-semibold">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Tax (8%):</span>
                      <span className="font-semibold">{formatCurrency(tax)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Total Amount:</span>
                      <span className="text-2xl font-bold text-success">{formatCurrency(total)}</span>
                    </div>
                  </div>

                  {/* AI Discount Suggestion */}
                  <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Percent className="w-4 h-4 text-accent" />
                      <span className="text-sm font-medium text-accent">AI Pricing Optimization</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Apply 5% loyalty discount? Customer has 89% positive purchase history.
                    </p>
                    <Button size="sm" variant="outline" className="mt-2 w-full">
                      Apply AI Discount
                    </Button>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold">Select Payment Method:</p>
                    <div className="grid grid-cols-1 gap-3">
                      <Button 
                        variant="outline" 
                        size="lg"
                        className="flex items-center justify-center gap-3 p-4 h-auto hover:border-primary/50 transition-all"
                        onClick={() => showReceiptAndCompleteSale("card")}
                      >
                        <CreditCard className="w-6 h-6 text-primary" />
                        <div className="text-left">
                          <div className="font-semibold">Card Payment</div>
                          <div className="text-xs text-muted-foreground">Credit/Debit Card</div>
                        </div>
                      </Button>
                      
                      <Button 
                        variant="outline"
                        size="lg" 
                        className="flex items-center justify-center gap-3 p-4 h-auto hover:border-primary/50 transition-all"
                        onClick={() => showReceiptAndCompleteSale("cash")}
                      >
                        <Banknote className="w-6 h-6 text-success" />
                        <div className="text-left">
                          <div className="font-semibold">Cash Payment</div>
                          <div className="text-xs text-muted-foreground">Physical Currency</div>
                        </div>
                      </Button>
                      
                      <Button 
                        variant="outline"
                        size="lg"
                        className="flex items-center justify-center gap-3 p-4 h-auto hover:border-primary/50 transition-all"
                        onClick={() => showReceiptAndCompleteSale("mobile_payment")}
                      >
                        <Smartphone className="w-6 h-6 text-accent" />
                        <div className="text-left">
                          <div className="font-semibold">Mobile Payment</div>
                          <div className="text-xs text-muted-foreground">Digital Wallet</div>
                        </div>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Preview Dialog */}
      <ReceiptPreview
        isOpen={showReceiptPreview}
        onClose={() => setShowReceiptPreview(false)}
        cart={cart}
        subtotal={subtotal}
        tax={tax}
        total={total}
        paymentMethod={selectedPaymentMethod}
        onConfirmSale={completeSale}
        processing={processing}
      />
    </div>
  );
};

export default POSInterface;