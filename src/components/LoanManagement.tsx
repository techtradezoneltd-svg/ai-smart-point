import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  Plus,
  Eye,
  Edit,
  MessageSquare
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  repayment_behavior: any;
  is_active: boolean;
}

interface Loan {
  id: string;
  customer_id: string;
  total_amount: number;
  paid_amount: number;
  remaining_balance: number;
  due_date: string;
  status: 'active' | 'paid' | 'overdue' | 'defaulted';
  ai_risk_assessment: any;
  customers: Customer;
}

const LoanManagement: React.FC = () => {
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [loansResult, customersResult] = await Promise.all([
        supabase
          .from('loans')
          .select(`
            *,
            customers (*)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('customers')
          .select('*')
          .eq('is_active', true)
          .order('name')
      ]);

      if (loansResult.error) throw loansResult.error;
      if (customersResult.error) throw customersResult.error;

      setLoans(loansResult.data || []);
      setCustomers(customersResult.data || []);
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
      const { error } = await supabase
        .from('customers')
        .insert([newCustomer]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Customer added successfully"
      });

      setNewCustomer({ name: '', phone: '', email: '', address: '' });
      setShowAddCustomer(false);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const recordPayment = async () => {
    if (!selectedLoan || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast({
        title: "Error",
        description: "Valid payment amount is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const amount = parseFloat(paymentAmount);
      
      // Record payment
      const { error: paymentError } = await supabase
        .from('loan_payments')
        .insert([{
          loan_id: selectedLoan.id,
          amount: amount,
          notes: paymentNotes,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }]);

      if (paymentError) throw paymentError;

      // Send WhatsApp thank you message
      try {
        await supabase.functions.invoke('whatsapp-notification', {
          body: {
            phone: selectedLoan.customers.phone,
            title: 'Payment Received',
            message: `Thank you ${selectedLoan.customers.name}! We received your payment of ${formatCurrency(amount)}. Your new balance is ${formatCurrency(selectedLoan.remaining_balance - amount)}.`,
            type: 'query_response'
          }
        });
      } catch (whatsappError) {
        console.log('WhatsApp notification failed:', whatsappError);
      }

      toast({
        title: "Success",
        description: "Payment recorded successfully"
      });

      setPaymentAmount('');
      setPaymentNotes('');
      setShowPaymentDialog(false);
      setSelectedLoan(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-700 border-green-200';
      case 'active': return 'bg-blue-500/20 text-blue-700 border-blue-200';
      case 'overdue': return 'bg-red-500/20 text-red-700 border-red-200';
      case 'defaulted': return 'bg-gray-500/20 text-gray-700 border-gray-200';
      default: return 'bg-gray-500/20 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'active': return <Clock className="w-4 h-4" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4" />;
      case 'defaulted': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getRiskLevel = (customer: Customer) => {
    const behavior = customer.repayment_behavior || {};
    return behavior.risk_level || 'low';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500/20 text-green-700';
      case 'medium': return 'bg-yellow-500/20 text-yellow-700';
      case 'high': return 'bg-red-500/20 text-red-700';
      default: return 'bg-gray-500/20 text-gray-700';
    }
  };

  const activeLoans = loans.filter(loan => loan.status === 'active');
  const overdueLoans = loans.filter(loan => loan.status === 'overdue');
  const totalLoanAmount = loans.reduce((sum, loan) => sum + loan.remaining_balance, 0);
  const totalPaidAmount = loans.reduce((sum, loan) => sum + loan.paid_amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Loan Management</h1>
          <p className="text-muted-foreground">Manage customer loans with AI-powered insights</p>
        </div>
        <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="Email address"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  placeholder="Address"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAddCustomer(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={addCustomer} className="flex-1">
                  Add Customer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Loans</p>
                <p className="text-2xl font-bold">{activeLoans.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueLoans.length}</p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold">{formatCurrency(totalLoanAmount)}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Collected</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaidAmount)}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loans List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Active Loans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No loans found</p>
              </div>
            ) : (
              loans.map((loan) => (
                <div key={loan.id} className="border rounded-lg p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{loan.customers.name}</h3>
                        <Badge className={getStatusColor(loan.status)}>
                          {getStatusIcon(loan.status)}
                          <span className="ml-1 capitalize">{loan.status}</span>
                        </Badge>
                        <Badge className={getRiskColor(getRiskLevel(loan.customers))}>
                          {getRiskLevel(loan.customers)} risk
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Amount</p>
                          <p className="font-medium">{formatCurrency(loan.total_amount)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Paid</p>
                          <p className="font-medium text-green-600">{formatCurrency(loan.paid_amount)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Balance</p>
                          <p className="font-medium text-red-600">{formatCurrency(loan.remaining_balance)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Due Date</p>
                          <p className="font-medium">{new Date(loan.due_date).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{loan.customers.phone}</span>
                        {loan.customers.email && (
                          <>
                            <Mail className="w-4 h-4 ml-4" />
                            <span>{loan.customers.email}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {loan.status !== 'paid' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedLoan(loan);
                            setShowPaymentDialog(true);
                          }}
                        >
                          <DollarSign className="w-4 h-4 mr-1" />
                          Payment
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {selectedLoan && (
            <div className="space-y-4">
              <div className="bg-gray-50/50 p-4 rounded-lg">
                <h3 className="font-semibold">{selectedLoan.customers.name}</h3>
                <p className="text-sm text-muted-foreground">Outstanding: {formatCurrency(selectedLoan.remaining_balance)}</p>
              </div>
              
              <div>
                <Label htmlFor="payment-amount">Payment Amount *</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  max={selectedLoan.remaining_balance}
                />
              </div>
              
              <div>
                <Label htmlFor="payment-notes">Notes</Label>
                <Textarea
                  id="payment-notes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Payment notes..."
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={recordPayment} className="flex-1">
                  Record Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoanManagement;