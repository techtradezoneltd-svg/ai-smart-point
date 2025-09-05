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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
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
        {/* Cart */}
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Cart ({cart.length})
              <Sparkles className="w-5 h-5 text-accent" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Cart is empty
              </p>
            ) : (
              <>
                {cart.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} each</p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                    <Separator />
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        {/* Checkout */}
        {cart.length > 0 && (
          <Card className="bg-gradient-card border-success/20">
            <CardHeader>
              <CardTitle className="text-success">Checkout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pricing Breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (8%):</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-success">{formatCurrency(total)}</span>
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
              <div className="space-y-2">
                <p className="text-sm font-medium">Payment Method:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="flex flex-col items-center p-3 h-auto">
                    <CreditCard className="w-5 h-5 mb-1" />
                    <span className="text-xs">Card</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center p-3 h-auto">
                    <Banknote className="w-5 h-5 mb-1" />
                    <span className="text-xs">Cash</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center p-3 h-auto">
                    <Smartphone className="w-5 h-5 mb-1" />
                    <span className="text-xs">Mobile Pay</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center p-3 h-auto">
                    <CreditCard className="w-5 h-5 mb-1" />
                    <span className="text-xs">Split</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 text-sm font-semibold"
                  onClick={() => showReceiptAndCompleteSale('cash')}
                  disabled={processing}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Preview & Pay Cash
                </Button>
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 text-sm font-semibold"
                  onClick={() => showReceiptAndCompleteSale('card')}
                  disabled={processing}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Preview & Pay Card
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
    </div>
  );
};

export default POSInterface;