import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { useNavigate } from "react-router-dom";
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
  Wallet
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

interface EnhancedPOSInterfaceProps {
  onNavigate?: (view: string) => void;
}

const EnhancedPOSInterface: React.FC<EnhancedPOSInterfaceProps> = ({ onNavigate }) => {
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();

  // State management
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [paymentType, setPaymentType] = useState<'full' | 'partial' | 'loan_only'>('full');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
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

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name),
          units (name)
        `)
        .eq('is_active', true)
        .gt('current_stock', 0)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      console.error('Error fetching customers:', error);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.current_stock) {
        toast({
          title: "Stock Limit",
          description: "Cannot add more items than available in stock",
          variant: "destructive"
        });
        return;
      }
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.selling_price,
        quantity: 1,
        category: product.categories?.name || "Unknown",
        stock: product.current_stock,
        sku: product.sku
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(id);
      return;
    }

    const item = cart.find(item => item.id === id);
    if (item && newQuantity > item.stock) {
      toast({
        title: "Stock Limit",
        description: "Cannot exceed available stock",
        variant: "destructive"
      });
      return;
    }

    setCart(cart.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const addCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast({
        title: "Error",
        description: "Name and phone are required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([newCustomer])
        .select()
        .single();

      if (error) throw error;

      setSelectedCustomer(data);
      setCustomers([...customers, data]);
      setNewCustomer({ name: '', phone: '', email: '' });
      setShowCustomerDialog(false);
      
      toast({
        title: "Success",
        description: "Customer added successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const showReceiptAndCompleteSale = (paymentMethod: string) => {
    if (paymentType !== 'full' && !selectedCustomer) {
      toast({
        title: "Customer Required",
        description: "Please select a customer for partial payments or loans",
        variant: "destructive"
      });
      return;
    }

    if (paymentType === 'partial' && (!partialAmount || parseFloat(partialAmount) >= total)) {
      toast({
        title: "Invalid Partial Amount",
        description: "Partial amount must be less than total amount",
        variant: "destructive"
      });
      return;
    }

    if ((paymentType === 'partial' || paymentType === 'loan_only') && !dueDate) {
      toast({
        title: "Due Date Required",
        description: "Please set a due date for the loan",
        variant: "destructive"
      });
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
      const paidAmount = paymentType === 'full' ? total : 
                         paymentType === 'partial' ? parseFloat(partialAmount) : 0;
      
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          sale_number: saleNumber,
          customer_name: selectedCustomer?.name || null,
          customer_phone: selectedCustomer?.phone || null,
          customer_id: selectedCustomer?.id || null,
          subtotal: subtotal,
          tax_amount: tax,
          discount_amount: 0,
          total_amount: total,
          payment_method: selectedPaymentMethod,
          payment_type: paymentType,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (saleError) throw saleError;

      for (const item of cart) {
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
      }

      if (paymentType !== 'full' && selectedCustomer) {
        const loanAmount = total - paidAmount;
        
        const { data: loanData, error: loanError } = await supabase
          .from('loans')
          .insert({
            customer_id: selectedCustomer.id,
            sale_id: saleData.id,
            total_amount: loanAmount,
            paid_amount: 0,
            remaining_balance: loanAmount,
            due_date: dueDate,
            agreement_terms: agreementTerms || `Loan agreement for sale ${saleNumber}. Amount: ${formatCurrency(loanAmount)}. Due: ${dueDate}`,
            created_by: (await supabase.auth.getUser()).data.user?.id
          })
          .select()
          .single();

        if (loanError) throw loanError;

        if (paymentType === 'partial' && paidAmount > 0) {
          const { error: paymentError } = await supabase
            .from('loan_payments')
            .insert({
              loan_id: loanData.id,
              amount: paidAmount,
              notes: `Initial payment for sale ${saleNumber}`,
              created_by: (await supabase.auth.getUser()).data.user?.id
            });

          if (paymentError) throw paymentError;
        }

        try {
          await supabase.functions.invoke('whatsapp-notification', {
            body: {
              phone: selectedCustomer.phone,
              title: 'Loan Agreement',
              message: `Dear ${selectedCustomer.name}, your loan agreement for ${formatCurrency(loanAmount)} has been created. Due date: ${dueDate}. ${paymentType === 'partial' ? `Initial payment of ${formatCurrency(paidAmount)} received.` : ''}`,
              type: 'alert'
            }
          });
        } catch (whatsappError) {
          console.log('WhatsApp notification failed:', whatsappError);
        }
      }

      toast({
        title: "Sale Completed",
        description: `Sale ${saleNumber} completed successfully${paymentType !== 'full' ? ' with loan created' : ''}`
      });

      setCart([]);
      setShowReceiptPreview(false);
      setSelectedPaymentMethod("");
      setPaymentType('full');
      setSelectedCustomer(null);
      setPartialAmount('');
      setDueDate('');
      setAgreementTerms('');
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

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    } else {
      navigate('/');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <div className="h-screen flex flex-col" style={{ background: '#e8e8e8' }}>
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleBack}
            className="h-8"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <Receipt className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="text-base font-bold">POS</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Total */}
          <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-4 py-1.5">
            <span className="text-xs text-muted-foreground">Total:</span>
            <span className="font-bold text-primary text-lg">{formatCurrency(total)}</span>
          </div>

          {/* Pay Button */}
          <Button
            onClick={() => setShowPaymentDialog(true)}
            disabled={cart.length === 0}
            className="h-9 px-6 bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Pay
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Product Selection */}
        <div className="flex-1 flex flex-col p-3 overflow-hidden">
          {/* Search */}
          <div className="relative mb-3 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 bg-card"
            />
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-card animate-pulse rounded-lg h-20"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="border rounded-lg p-2 hover:shadow-md transition-all cursor-pointer bg-card hover:bg-accent group"
                  >
                    {product.image_url && (
                      <div className="w-full h-12 mb-1 rounded overflow-hidden bg-muted">
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
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

        {/* Shopping Cart - full height */}
        <div className="w-80 lg:w-96 border-l border-border bg-card flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-border flex items-center gap-2 shrink-0">
            <ShoppingCart className="w-4 h-4" />
            <span className="font-semibold text-sm">Cart ({cart.length})</span>
          </div>

          {cart.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Cart is empty</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-xs">
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-5 w-5 p-0"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </Button>
                          <span className="font-medium w-5 text-center">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-5 w-5 p-0"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </Button>
                        </div>
                      </td>
                      <td className="py-2 text-right text-muted-foreground">{formatCurrency(item.price)}</td>
                      <td className="py-2 px-3 text-right font-semibold">{formatCurrency(item.price * item.quantity)}</td>
                      <td className="py-2 px-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Payment
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Total display */}
            <div className="text-center bg-primary/10 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(total)}</p>
            </div>

            {/* Payment Type */}
            <div className="space-y-2">
              <Label className="text-sm">Payment Type</Label>
              <Select value={paymentType} onValueChange={(value: any) => setPaymentType(value)}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Payment</SelectItem>
                  <SelectItem value="partial">Partial Payment</SelectItem>
                  <SelectItem value="loan_only">Loan Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Customer Selection for loans */}
            {paymentType !== 'full' && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm">Customer</Label>
                  <div className="flex gap-2">
                    <Select value={selectedCustomer?.id || ''} onValueChange={(value) => {
                      const customer = customers.find(c => c.id === value);
                      setSelectedCustomer(customer || null);
                    }}>
                      <SelectTrigger className="flex-1 h-10">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name} - {customer.phone}
                          </SelectItem>
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

            {/* Payment Method Buttons */}
            <div className="space-y-2">
              <Label className="text-sm">Choose Payment Method</Label>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  onClick={() => showReceiptAndCompleteSale("cash")}
                  className="h-12 text-base bg-green-600 hover:bg-green-700"
                >
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

      {/* Add Customer Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customer-name">Name *</Label>
              <Input
                id="customer-name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                placeholder="Customer name"
              />
            </div>
            <div>
              <Label htmlFor="customer-phone">Phone *</Label>
              <Input
                id="customer-phone"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div>
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                placeholder="Email address"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCustomerDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={addCustomer} className="flex-1">
                Add Customer
              </Button>
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
