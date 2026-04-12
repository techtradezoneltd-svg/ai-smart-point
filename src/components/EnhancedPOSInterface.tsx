import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import ReceiptPreview from "./ReceiptPreview";
import { 
  Receipt, 
  Scan, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Search,
  CreditCard,
  DollarSign,
  Smartphone,
  User,
  Calendar,
  AlertCircle,
  ArrowLeft,
  Home,
  Wallet,
  XCircle,
  Pause,
  Play,
  RotateCcw,
  ChevronUp
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
  sku: string;
  selling_price: number;
  current_stock: number;
  categories: { name: string };
  units: { name: string };
  barcode?: string;
  is_active: boolean;
  image_url?: string | null;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface HeldOrder {
  id: string;
  name: string;
  cart: CartItem[];
  customer: Customer | null;
  timestamp: number;
}

interface EnhancedPOSInterfaceProps {
  onNavigate?: (view: string) => void;
}

const EnhancedPOSInterface: React.FC<EnhancedPOSInterfaceProps> = ({ onNavigate }) => {
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const barcodeBufferRef = useRef("");
  const barcodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // State management
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [paymentType, setPaymentType] = useState<'full' | 'partial' | 'loan_only'>('full');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
  // Hold/Recall
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('pos_held_orders') || '[]');
    } catch { return []; }
  });
  const [showHeldOrdersDialog, setShowHeldOrdersDialog] = useState(false);

  // Loan-specific states
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
  const [partialAmount, setPartialAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [agreementTerms, setAgreementTerms] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  // Persist held orders
  useEffect(() => {
    localStorage.setItem('pos_held_orders', JSON.stringify(heldOrders));
  }, [heldOrders]);

  // Barcode scanner listener - listens for rapid keystrokes globally
  const handleBarcodeInput = useCallback((e: KeyboardEvent) => {
    // Keyboard shortcuts (work even in input fields)
    if (e.key === 'F2') { e.preventDefault(); holdOrder(); return; }
    if (e.key === 'F3') { e.preventDefault(); setShowHeldOrdersDialog(true); return; }
    if (e.key === 'F9') { e.preventDefault(); if (cart.length > 0) setShowPaymentDialog(true); return; }
    if (e.key === 'Escape') { e.preventDefault(); clearCart(); return; }
    if (e.key === 'F4') { e.preventDefault(); searchInputRef.current?.focus(); return; }

    // Ignore barcode input if user is typing in an input field
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

    if (e.key === 'Enter' && barcodeBufferRef.current.length >= 3) {
      const barcode = barcodeBufferRef.current;
      barcodeBufferRef.current = "";
      
      // Find product by barcode or SKU
      const product = products.find(
        p => p.barcode === barcode || p.sku === barcode
      );
      if (product) {
        addToCart(product);
        toast({ title: "Scanned", description: `${product.name} added to cart` });
      } else {
        toast({ title: "Not Found", description: `No product with barcode "${barcode}"`, variant: "destructive" });
      }
      return;
    }

    // Only accept printable characters
    if (e.key.length === 1) {
      barcodeBufferRef.current += e.key;
      
      if (barcodeTimeoutRef.current) clearTimeout(barcodeTimeoutRef.current);
      barcodeTimeoutRef.current = setTimeout(() => {
        barcodeBufferRef.current = "";
      }, 100);
    }
  }, [products, cart.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleBarcodeInput);
    return () => window.removeEventListener('keydown', handleBarcodeInput);
  }, [handleBarcodeInput]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`*, categories (name), units (name)`)
        .eq('is_active', true)
        .gt('current_stock', 0)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase.from('customers').select('*').eq('is_active', true).order('name');
      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      console.error('Error fetching customers:', error);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.current_stock) {
          toast({ title: "Stock Limit", description: "Cannot add more than available stock", variant: "destructive" });
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        id: product.id, name: product.name, price: product.selling_price,
        quantity: 1, category: product.categories?.name || "Unknown",
        stock: product.current_stock, sku: product.sku
      }];
    });
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity === 0) { removeFromCart(id); return; }
    const item = cart.find(item => item.id === id);
    if (item && newQuantity > item.stock) {
      toast({ title: "Stock Limit", description: "Cannot exceed available stock", variant: "destructive" });
      return;
    }
    setCart(cart.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
  };

  const removeFromCart = (id: string) => setCart(cart.filter(item => item.id !== id));

  const clearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
    setSelectedCustomer(null);
    toast({ title: "Cart Cleared", description: "All items removed from cart" });
  };

  // Hold current order
  const holdOrder = () => {
    if (cart.length === 0) return;
    const order: HeldOrder = {
      id: `HOLD-${Date.now()}`,
      name: `Order #${heldOrders.length + 1}`,
      cart: [...cart],
      customer: selectedCustomer,
      timestamp: Date.now()
    };
    setHeldOrders(prev => [...prev, order]);
    setCart([]);
    setSelectedCustomer(null);
    toast({ title: "Order Held", description: `${order.name} saved for later` });
  };

  // Recall a held order
  const recallOrder = (order: HeldOrder) => {
    // If current cart has items, hold them first
    if (cart.length > 0) {
      const currentOrder: HeldOrder = {
        id: `HOLD-${Date.now()}`,
        name: `Order #${heldOrders.length + 1}`,
        cart: [...cart],
        customer: selectedCustomer,
        timestamp: Date.now()
      };
      setHeldOrders(prev => [...prev.filter(o => o.id !== order.id), currentOrder]);
    } else {
      setHeldOrders(prev => prev.filter(o => o.id !== order.id));
    }
    setCart(order.cart);
    setSelectedCustomer(order.customer);
    setShowHeldOrdersDialog(false);
    toast({ title: "Order Recalled", description: `${order.name} restored to cart` });
  };

  const deleteHeldOrder = (orderId: string) => {
    setHeldOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const addCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast({ title: "Error", description: "Name and phone are required", variant: "destructive" });
      return;
    }
    try {
      const { data, error } = await supabase.from('customers').insert([newCustomer]).select().single();
      if (error) throw error;
      setSelectedCustomer(data);
      setCustomers([...customers, data]);
      setNewCustomer({ name: '', phone: '', email: '' });
      setShowCustomerDialog(false);
      toast({ title: "Success", description: "Customer added successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const showReceiptAndCompleteSale = (paymentMethod: string) => {
    if (paymentType !== 'full' && !selectedCustomer) {
      toast({ title: "Customer Required", description: "Please select a customer for partial payments or loans", variant: "destructive" });
      return;
    }
    if (paymentType === 'partial' && (!partialAmount || parseFloat(partialAmount) >= total)) {
      toast({ title: "Invalid Partial Amount", description: "Partial amount must be less than total amount", variant: "destructive" });
      return;
    }
    if ((paymentType === 'partial' || paymentType === 'loan_only') && !dueDate) {
      toast({ title: "Due Date Required", description: "Please set a due date for the loan", variant: "destructive" });
      return;
    }
    setSelectedPaymentMethod(paymentMethod);
    setShowPaymentDialog(false);
    setShowReceiptPreview(true);
  };

  const completeSale = async () => {
    if (cart.length === 0) return;
    setProcessing(true);
    try {
      const saleNumber = `SALE-${Date.now()}`;
      const paidAmount = paymentType === 'full' ? total : paymentType === 'partial' ? parseFloat(partialAmount) : 0;
      
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          sale_number: saleNumber,
          customer_name: selectedCustomer?.name || null,
          customer_phone: selectedCustomer?.phone || null,
          customer_id: selectedCustomer?.id || null,
          subtotal, tax_amount: tax, discount_amount: 0, total_amount: total,
          payment_method: selectedPaymentMethod, payment_type: paymentType,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select().single();

      if (saleError) throw saleError;

      for (const item of cart) {
        const { error: itemError } = await supabase.from('sale_items').insert({
          sale_id: saleData.id, product_id: item.id, quantity: item.quantity,
          unit_price: item.price, total_price: item.price * item.quantity
        });
        if (itemError) throw itemError;
      }

      if (paymentType !== 'full' && selectedCustomer) {
        const loanAmount = total - paidAmount;
        const { data: loanData, error: loanError } = await supabase
          .from('loans')
          .insert({
            customer_id: selectedCustomer.id, sale_id: saleData.id,
            total_amount: loanAmount, paid_amount: 0, remaining_balance: loanAmount,
            due_date: dueDate,
            agreement_terms: agreementTerms || `Loan agreement for sale ${saleNumber}. Amount: ${formatCurrency(loanAmount)}. Due: ${dueDate}`,
            created_by: (await supabase.auth.getUser()).data.user?.id
          }).select().single();

        if (loanError) throw loanError;

        if (paymentType === 'partial' && paidAmount > 0) {
          const { error: paymentError } = await supabase.from('loan_payments').insert({
            loan_id: loanData.id, amount: paidAmount,
            notes: `Initial payment for sale ${saleNumber}`,
            created_by: (await supabase.auth.getUser()).data.user?.id
          });
          if (paymentError) throw paymentError;
        }

        try {
          await supabase.functions.invoke('whatsapp-notification', {
            body: {
              phone: selectedCustomer.phone, title: 'Loan Agreement',
              message: `Dear ${selectedCustomer.name}, your loan agreement for ${formatCurrency(loanAmount)} has been created. Due date: ${dueDate}. ${paymentType === 'partial' ? `Initial payment of ${formatCurrency(paidAmount)} received.` : ''}`,
              type: 'alert'
            }
          });
        } catch (whatsappError) {
          console.log('WhatsApp notification failed:', whatsappError);
        }
      }

      toast({ title: "Sale Completed", description: `Sale ${saleNumber} completed successfully${paymentType !== 'full' ? ' with loan created' : ''}` });

      setCart([]); setShowReceiptPreview(false); setSelectedPaymentMethod("");
      setPaymentType('full'); setSelectedCustomer(null); setPartialAmount('');
      setDueDate(''); setAgreementTerms('');
      fetchProducts();
    } catch (error: any) {
      toast({ title: "Sale Failed", description: error.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleBack = () => {
    if (onNavigate) { onNavigate('dashboard'); } else { navigate('/'); }
  };

  // Barcode search in search input
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      const product = products.find(
        p => p.barcode === searchTerm.trim() || p.sku === searchTerm.trim()
      );
      if (product) {
        addToCart(product);
        setSearchTerm("");
        toast({ title: "Added", description: `${product.name} added to cart` });
      }
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchTerm))
  );

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  // Cart content shared between desktop sidebar and mobile sheet
  const cartContent = (
    <>
      <div className="px-3 py-2 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          <span className="font-semibold text-sm">Cart ({cart.length})</span>
        </div>
        {cart.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearCart} className="h-6 px-2 text-destructive hover:text-destructive text-xs">
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground py-12">
          <div className="text-center">
            <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Cart is empty</p>
            <p className="text-xs mt-1 opacity-60">Scan barcode or tap products</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto">
            {/* Mobile: card-style items / Desktop: table */}
            <div className="md:hidden divide-y divide-border/50">
              {cart.map((item) => (
                <div key={item.id} className="px-3 py-2.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} each</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-7 w-7 p-0 rounded-full">
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="font-semibold text-sm w-6 text-center">{item.quantity}</span>
                    <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-7 w-7 p-0 rounded-full">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <span className="font-bold text-sm w-16 text-right shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)} className="h-7 w-7 p-0 text-destructive hover:text-destructive shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <table className="w-full text-xs hidden md:table">
              <thead className="border-b sticky top-0 bg-card">
                <tr className="text-muted-foreground">
                  <th className="text-left py-2 px-3 font-medium">Product</th>
                  <th className="text-center py-2 font-medium w-24">Qty</th>
                  <th className="text-right py-2 font-medium">Price</th>
                  <th className="text-right py-2 px-3 font-medium">Total</th>
                  <th className="w-8 px-1"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-accent/50">
                    <td className="py-2 px-3 font-medium truncate max-w-[120px]">{item.name}</td>
                    <td className="py-2">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-5 w-5 p-0">
                          <Minus className="w-2.5 h-2.5" />
                        </Button>
                        <span className="font-medium w-5 text-center">{item.quantity}</span>
                        <Button variant="ghost" size="sm" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-5 w-5 p-0">
                          <Plus className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    </td>
                    <td className="py-2 text-right text-muted-foreground">{formatCurrency(item.price)}</td>
                    <td className="py-2 px-3 text-right font-semibold">{formatCurrency(item.price * item.quantity)}</td>
                    <td className="py-2 px-1">
                      <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)} className="h-5 w-5 p-0 text-destructive hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cart footer with total + pay (mobile only) */}
          <div className="md:hidden border-t border-border p-3 space-y-2 shrink-0 bg-card">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
            </div>
            <Button
              onClick={() => { setMobileCartOpen(false); setShowPaymentDialog(true); }}
              disabled={cart.length === 0}
              className="w-full h-12 text-base bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Pay {formatCurrency(total)}
            </Button>
          </div>
        </>
      )}
    </>
  );

  return (
    <div className="h-screen flex flex-col bg-muted/60">
      {/* Header - responsive */}
      <div className="bg-card border-b border-border px-2 sm:px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="outline" size="sm" onClick={handleBack} className="h-8 w-8 p-0 sm:w-auto sm:px-3">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <Receipt className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="text-sm sm:text-base font-bold">POS</h1>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Hold */}
          <Button variant="outline" size="sm" onClick={holdOrder} disabled={cart.length === 0} className="h-8 text-xs px-2 sm:px-3">
            <Pause className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Hold</span>
          </Button>

          {/* Recall */}
          <Button variant="outline" size="sm" onClick={() => setShowHeldOrdersDialog(true)} className="h-8 text-xs relative px-2 sm:px-3">
            <Play className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Recall</span>
            {heldOrders.length > 0 && (
              <Badge className="absolute -top-1.5 -right-1.5 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                {heldOrders.length}
              </Badge>
            )}
          </Button>

          {/* Total - hidden on mobile (shown in cart sheet instead) */}
          <div className="hidden md:flex items-center gap-2 bg-primary/10 rounded-lg px-4 py-1.5">
            <span className="text-xs text-muted-foreground">Total:</span>
            <span className="font-bold text-primary text-lg">{formatCurrency(total)}</span>
          </div>

          {/* Pay Button - desktop only (mobile has it in cart sheet) */}
          <Button
            onClick={() => setShowPaymentDialog(true)}
            disabled={cart.length === 0}
            className="hidden md:flex h-9 px-6 bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Pay
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Product Selection - takes full width on mobile */}
        <div className="flex-1 flex flex-col p-2 sm:p-3 overflow-hidden">
          {/* Search */}
          <div className="relative mb-2 sm:mb-3 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search or scan barcode... (F4)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-9 pr-10 h-9 sm:h-10 bg-card"
            />
            <Scan className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
          </div>

          {/* Products Grid - responsive columns */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-card animate-pulse rounded-lg h-24 sm:h-20"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5 sm:gap-2">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="border rounded-lg p-2 hover:shadow-md transition-all cursor-pointer bg-card hover:bg-accent group active:scale-95"
                  >
                    {product.image_url && (
                      <div className="w-full h-14 sm:h-12 mb-1 rounded overflow-hidden bg-muted">
                        <img src={product.image_url} alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    )}
                    <h3 className="font-medium text-xs truncate">{product.name}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-bold text-xs text-primary">{formatCurrency(product.selling_price)}</span>
                      <span className={`text-[10px] ${product.current_stock > 10 ? 'text-muted-foreground' : 'text-destructive font-medium'}`}>
                        {product.current_stock}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Cart Sidebar - hidden on mobile */}
        <div className="hidden md:flex w-80 lg:w-96 border-l border-border bg-card flex-col overflow-hidden">
          {cartContent}
        </div>
      </div>

      {/* Mobile floating cart bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
          <SheetTrigger asChild>
            <button className="w-full bg-card border-t border-border px-4 py-3 flex items-center justify-between shadow-lg active:bg-accent transition-colors">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {cart.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                      {cart.length}
                    </Badge>
                  )}
                </div>
                <span className="font-medium text-sm">
                  {cart.length === 0 ? 'Cart is empty' : `${cart.length} item${cart.length > 1 ? 's' : ''}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary text-lg">{formatCurrency(total)}</span>
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col rounded-t-2xl">
            <SheetHeader className="sr-only">
              <SheetTitle>Shopping Cart</SheetTitle>
            </SheetHeader>
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-2 mb-1 shrink-0" />
            <div className="flex-1 flex flex-col overflow-hidden">
              {cartContent}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Add bottom padding on mobile so products aren't hidden behind cart bar */}
      <div className="md:hidden h-16 shrink-0" />
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" /> Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center bg-primary/10 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(total)}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Payment Type</Label>
              <Select value={paymentType} onValueChange={(value: any) => setPaymentType(value)}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Payment</SelectItem>
                  <SelectItem value="partial">Partial Payment</SelectItem>
                  <SelectItem value="loan_only">Loan Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentType !== 'full' && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm">Customer</Label>
                  <div className="flex gap-2">
                    <Select value={selectedCustomer?.id || ''} onValueChange={(value) => {
                      setSelectedCustomer(customers.find(c => c.id === value) || null);
                    }}>
                      <SelectTrigger className="flex-1 h-10"><SelectValue placeholder="Select customer" /></SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>{customer.name} - {customer.phone}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => setShowCustomerDialog(true)} className="h-10 px-3">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {paymentType === 'partial' && (
                  <div className="space-y-2">
                    <Label className="text-sm">Partial Amount</Label>
                    <Input type="number" step="0.01" value={partialAmount} onChange={(e) => setPartialAmount(e.target.value)} placeholder="0.00" max={total} className="h-10" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm">Due Date</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="h-10" />
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm">Choose Payment Method</Label>
              <div className="grid grid-cols-1 gap-2">
                <Button onClick={() => showReceiptAndCompleteSale("cash")} className="h-12 text-base bg-green-600 hover:bg-green-700">
                  <DollarSign className="w-5 h-5 mr-2" />
                  {paymentType === 'full' ? 'Pay with Cash' : paymentType === 'partial' ? 'Partial Cash' : 'Create Loan'}
                </Button>
                {paymentType === 'full' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => showReceiptAndCompleteSale("card")} variant="outline" className="h-11">
                      <CreditCard className="w-4 h-4 mr-2" /> Card
                    </Button>
                    <Button onClick={() => showReceiptAndCompleteSale("mobile")} variant="outline" className="h-11">
                      <Smartphone className="w-4 h-4 mr-2" /> Mobile
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Held Orders Dialog */}
      <Dialog open={showHeldOrdersDialog} onOpenChange={setShowHeldOrdersDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" /> Held Orders
            </DialogTitle>
          </DialogHeader>
          {heldOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Pause className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No held orders</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {heldOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-3 flex items-center justify-between hover:bg-accent/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{order.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.cart.length} items · {formatCurrency(order.cart.reduce((s, i) => s + i.price * i.quantity, 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.timestamp).toLocaleTimeString()}
                      {order.customer && ` · ${order.customer.name}`}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button size="sm" onClick={() => recallOrder(order)} className="h-7 text-xs px-3">
                      Recall
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteHeldOrder(order.id)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Customer</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customer-name">Name *</Label>
              <Input id="customer-name" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} placeholder="Customer name" />
            </div>
            <div>
              <Label htmlFor="customer-phone">Phone *</Label>
              <Input id="customer-phone" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} placeholder="Phone number" />
            </div>
            <div>
              <Label htmlFor="customer-email">Email</Label>
              <Input id="customer-email" type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} placeholder="Email address" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCustomerDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={addCustomer} className="flex-1">Add Customer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Preview */}
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

export default EnhancedPOSInterface;
