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
  Home
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
    setShowReceiptPreview(true);
  };

  const completeSale = async () => {
    if (cart.length === 0) return;
    
    setProcessing(true);
    try {
      const saleNumber = `SALE-${Date.now()}`;
      const paidAmount = paymentType === 'full' ? total : 
                         paymentType === 'partial' ? parseFloat(partialAmount) : 0;
      
      // Create sale record
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

      // Create sale items
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

      // Create loan if partial or loan_only
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

        // If partial payment, record the payment
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

        // Send WhatsApp loan agreement
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

      // Clear everything
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur border-b border-border p-4 mb-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {onNavigate && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2 hover:bg-primary hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Enhanced POS</h1>
              <p className="text-sm text-muted-foreground">Professional Sales Terminal with Loan Management</p>
            </div>
          </div>
          {onNavigate && (
            <Button 
              variant="secondary"
              size="sm"
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Button>
          )}
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Products */}
            <Card className="bg-gradient-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  Product Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Search products by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </CardContent>
            </Card>

            {/* Products Grid */}
            <Card>
              <CardHeader>
                <CardTitle>Products ({filteredProducts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-32"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="border rounded-lg p-3 hover:shadow-md transition-all cursor-pointer bg-card hover:bg-accent group"
                      >
                        {product.image_url && (
                          <div className="w-full h-24 mb-2 rounded overflow-hidden bg-muted">
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                        )}
                        <h3 className="font-medium text-sm mb-1 truncate">{product.name}</h3>
                        <p className="text-xs text-muted-foreground mb-2">{product.categories?.name || 'Uncategorized'}</p>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-primary">{formatCurrency(product.selling_price)}</span>
                          <Badge variant={product.current_stock > 10 ? "secondary" : "destructive"}>
                            {product.current_stock} left
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Shopping Cart */}
          <div className="space-y-6">
            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Shopping Cart ({cart.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.id} className="border rounded-lg p-3 bg-background">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="font-medium">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">{formatCurrency(item.price)} each</p>
                              <p className="font-bold">{formatCurrency(item.price * item.quantity)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Payment Type Selection */}
                    <div className="space-y-3">
                      <Label>Payment Type</Label>
                      <Select value={paymentType} onValueChange={(value: any) => setPaymentType(value)}>
                        <SelectTrigger>
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
                      <div className="space-y-3">
                        <Label>Customer</Label>
                        <div className="flex gap-2">
                          <Select value={selectedCustomer?.id || ''} onValueChange={(value) => {
                            const customer = customers.find(c => c.id === value);
                            setSelectedCustomer(customer || null);
                          }}>
                            <SelectTrigger className="flex-1">
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
                          <Button
                            variant="outline"
                            onClick={() => setShowCustomerDialog(true)}
                            className="px-3"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Partial Payment Amount */}
                    {paymentType === 'partial' && (
                      <div>
                        <Label>Partial Payment Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={partialAmount}
                          onChange={(e) => setPartialAmount(e.target.value)}
                          placeholder="0.00"
                          max={total}
                        />
                      </div>
                    )}

                    {/* Due Date for loans */}
                    {paymentType !== 'full' && (
                      <div>
                        <Label>Due Date</Label>
                        <Input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    )}

                    {/* Totals */}
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
                        <span>{formatCurrency(total)}</span>
                      </div>
                      
                      {paymentType === 'partial' && partialAmount && (
                        <>
                          <div className="flex justify-between text-green-600">
                            <span>Paying Now:</span>
                            <span>{formatCurrency(parseFloat(partialAmount))}</span>
                          </div>
                          <div className="flex justify-between text-red-600">
                            <span>Loan Amount:</span>
                            <span>{formatCurrency(total - parseFloat(partialAmount))}</span>
                          </div>
                        </>
                      )}
                      
                      {paymentType === 'loan_only' && (
                        <div className="flex justify-between text-red-600">
                          <span>Loan Amount:</span>
                          <span>{formatCurrency(total)}</span>
                        </div>
                      )}
                    </div>

                    {/* Payment Buttons */}
                    <div className="space-y-2">
                      <Button
                        onClick={() => showReceiptAndCompleteSale("cash")}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700"
                        disabled={cart.length === 0}
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        {paymentType === 'full' ? 'Cash Payment' : 
                         paymentType === 'partial' ? 'Partial Cash' : 'Create Loan'}
                      </Button>
                      
                      {paymentType === 'full' && (
                        <>
                          <Button
                            onClick={() => showReceiptAndCompleteSale("card")}
                            variant="outline"
                            className="w-full"
                            disabled={cart.length === 0}
                          >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Card Payment
                          </Button>
                          
                          <Button
                            onClick={() => showReceiptAndCompleteSale("mobile")}
                            variant="outline"
                            className="w-full"
                            disabled={cart.length === 0}
                          >
                            <Smartphone className="w-4 h-4 mr-2" />
                            Mobile Payment
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

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