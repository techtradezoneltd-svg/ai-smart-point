import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  Search, 
  Brain, 
  Star, 
  TrendingUp,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  Gift,
  Target,
  Edit,
  Trash2,
  Plus,
  MapPin,
  Loader2
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  repayment_behavior: any;
  // Computed fields
  totalSpent?: number;
  loanCount?: number;
}

const Customers = () => {
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      // Fetch customers with their loan data for computing stats
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;

      // Fetch loan totals per customer
      const { data: loansData } = await supabase
        .from('loans')
        .select('customer_id, total_amount, paid_amount');

      // Compute customer stats
      const customersWithStats = (customersData || []).map(customer => {
        const customerLoans = (loansData || []).filter(l => l.customer_id === customer.id);
        const totalSpent = customerLoans.reduce((sum, l) => sum + Number(l.paid_amount || 0), 0);
        return {
          ...customer,
          totalSpent,
          loanCount: customerLoans.length
        };
      });

      setCustomers(customersWithStats);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomer = async () => {
    if (!formData.name || !formData.phone) {
      toast({ title: "Error", description: "Name and phone are required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      if (selectedCustomer && isEditMode) {
        // Update existing customer
        const { error } = await supabase
          .from('customers')
          .update({
            name: formData.name,
            email: formData.email || null,
            phone: formData.phone,
            address: formData.address || null
          })
          .eq('id', selectedCustomer.id);

        if (error) throw error;
        toast({ title: "Success", description: "Customer updated successfully" });
      } else {
        // Create new customer
        const { error } = await supabase
          .from('customers')
          .insert({
            name: formData.name,
            email: formData.email || null,
            phone: formData.phone,
            address: formData.address || null,
            is_active: true
          });

        if (error) throw error;
        toast({ title: "Success", description: "Customer created successfully" });
      }

      setShowAddDialog(false);
      setSelectedCustomer(null);
      setIsEditMode(false);
      resetForm();
      fetchCustomers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    setSubmitting(true);
    try {
      // Deactivate instead of delete to preserve data integrity
      const { error } = await supabase
        .from('customers')
        .update({ is_active: false })
        .eq('id', selectedCustomer.id);

      if (error) throw error;
      
      toast({ title: "Success", description: "Customer deactivated successfully" });
      setShowDeleteDialog(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", address: "" });
  };

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone,
      address: customer.address || ""
    });
    setIsEditMode(true);
    setShowAddDialog(true);
  };

  const openAddDialog = () => {
    resetForm();
    setSelectedCustomer(null);
    setIsEditMode(false);
    setShowAddDialog(true);
  };

  const getRiskLevel = (behavior: any) => {
    const riskLevel = behavior?.risk_level || 'low';
    return riskLevel;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high": return "destructive";
      case "medium": return "warning";
      default: return "success";
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const activeCustomers = customers.filter(c => c.is_active);
  const totalRevenue = customers.reduce((sum, customer) => sum + (customer.totalSpent || 0), 0);
  const avgSpendPerCustomer = activeCustomers.length > 0 ? totalRevenue / activeCustomers.length : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Customer Management
          </h1>
          <p className="text-muted-foreground">Manage customers and view insights</p>
        </div>
        <Button className="bg-gradient-primary" onClick={openAddDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{customers.length}</div>
            <p className="text-xs text-muted-foreground">{activeCustomers.length} active</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-success/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From all customers</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Spend</CardTitle>
            <ShoppingBag className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{formatCurrency(avgSpendPerCustomer)}</div>
            <p className="text-xs text-muted-foreground">Per customer</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-warning/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Loans</CardTitle>
            <Gift className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {customers.filter(c => (c.loanCount || 0) > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">Active loan customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-gradient-card border-border">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search customers by name, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Customer Database ({filteredCustomers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No customers found</p>
              <Button className="mt-4" onClick={openAddDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Customer
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-6 border border-border rounded-lg hover:border-primary/50 transition-all bg-gradient-card"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarFallback className="bg-gradient-primary text-white font-bold">
                          {customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{customer.name}</h3>
                          <Badge variant={customer.is_active ? "default" : "secondary"}>
                            {customer.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`border-${getRiskColor(getRiskLevel(customer.repayment_behavior))} text-${getRiskColor(getRiskLevel(customer.repayment_behavior))}`}
                          >
                            {getRiskLevel(customer.repayment_behavior)} risk
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {customer.email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              {customer.email}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            {customer.phone}
                          </div>
                          {customer.address && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              {customer.address}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            Joined: {new Date(customer.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-4">
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Spent</p>
                          <p className="text-xl font-bold text-success">{formatCurrency(customer.totalSpent || 0)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Loans</p>
                          <p className="text-lg font-semibold">{customer.loanCount || 0}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(customer)}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-destructive"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Customer Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Customer name"
              />
            </div>
            <div>
              <Label>Phone *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email address (optional)"
              />
            </div>
            <div>
              <Label>Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Address (optional)"
              />
            </div>
            <Button onClick={handleSaveCustomer} className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                isEditMode ? 'Update Customer' : 'Add Customer'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate "{selectedCustomer?.name}". They will no longer appear in active customer lists but their data will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCustomer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={submitting}
            >
              {submitting ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Customers;
