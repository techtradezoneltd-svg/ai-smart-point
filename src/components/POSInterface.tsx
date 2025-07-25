import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Percent
} from "lucide-react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

const POSInterface = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcode, setBarcode] = useState("");

  // Sample products with enhanced data for AI features
  const sampleProducts = [
    { id: "1", name: "iPhone 15 Pro", price: 999.99, category: "Electronics", barcode: "123456789012", stock: 23, margin: 0.35 },
    { id: "2", name: "Samsung Galaxy S24", price: 799.99, category: "Electronics", barcode: "123456789013", stock: 8, margin: 0.28 },
    { id: "3", name: "Apple AirPods Pro", price: 249.99, category: "Electronics", barcode: "123456789014", stock: 45, margin: 0.42 },
    { id: "4", name: "Wireless Charger", price: 39.99, category: "Accessories", barcode: "123456789015", stock: 67, margin: 0.55 },
    { id: "5", name: "Phone Case Premium", price: 29.99, category: "Accessories", barcode: "123456789016", stock: 120, margin: 0.65 },
    { id: "6", name: "Screen Protector", price: 19.99, category: "Accessories", barcode: "123456789017", stock: 200, margin: 0.70 }
  ];

  // AI Recommendations based on cart
  const aiRecommendations = [
    { id: "5", name: "Phone Case", price: 29.99, reason: "Often bought with phones" },
    { id: "6", name: "Screen Protector", price: 19.99, reason: "95% compatibility with your selection" },
  ];

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, change: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + change;
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

  const simulateBarcodeScan = () => {
    if (sampleProducts.length > 0) {
      const randomProduct = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];
      addToCart(randomProduct);
      setBarcode(randomProduct.id);
      setTimeout(() => setBarcode(""), 2000);
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
                placeholder="Scan barcode or search product..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="flex-1"
              />
              <Button onClick={simulateBarcodeScan} className="bg-gradient-primary">
                <Scan className="w-4 h-4 mr-2" />
                Scan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Product Grid */}
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle>Quick Select Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {sampleProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-4 border border-border rounded-lg hover:border-primary/50 transition-all cursor-pointer group"
                  onClick={() => addToCart(product)}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-primary rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <Smartphone className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-medium text-sm mb-1">{product.name}</h3>
                    <p className="text-lg font-bold text-primary">${product.price}</p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {product.category}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card className="bg-gradient-card border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-accent animate-pulse" />
              AI Smart Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiRecommendations.map((rec) => (
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
                    <span className="font-bold text-accent">${rec.price}</span>
                    <Plus className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
                        <p className="text-xs text-muted-foreground">${item.price} each</p>
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
                      <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
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
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (8%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-success">${total.toFixed(2)}</span>
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

              <Button className="w-full bg-gradient-primary text-lg font-semibold py-6">
                Complete Sale - ${total.toFixed(2)}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default POSInterface;