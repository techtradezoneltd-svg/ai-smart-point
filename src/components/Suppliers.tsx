import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  Search, 
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Package,
  DollarSign,
  Calendar,
  CheckCircle,
  Truck,
  Star,
  FileText,
  Eye,
  Loader2
} from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  category: string | null;
  status: string;
  rating: number | null;
  total_orders: number | null;
  total_value: number | null;
  last_order_date: string | null;
  payment_terms: string | null;
  lead_time: number | null;
  products: string[] | null;
  reliability: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

const Suppliers = () => {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Supplier>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const categories = ["All", "Electronics", "Accessories", "Gaming", "Components", "Food", "Beverages", "Other"];

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: any) {
      console.error('Error fetching suppliers:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = async () => {
    if (!editForm.name) {
      toast({ title: "Error", description: "Supplier name is required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('suppliers')
        .insert({
          name: editForm.name,
          contact_person: editForm.contact_person || null,
          email: editForm.email || null,
          phone: editForm.phone || null,
          address: editForm.address || null,
          city: editForm.city || null,
          country: editForm.country || null,
          category: editForm.category || null,
          status: editForm.status || 'active',
          payment_terms: editForm.payment_terms || null,
          lead_time: editForm.lead_time || 7,
          notes: editForm.notes || null,
          created_by: user?.id
        });

      if (error) throw error;

      toast({ title: "Success", description: "Supplier added successfully" });
      setIsAddMode(false);
      setEditForm({});
      fetchSuppliers();
    } catch (error: any) {
      console.error('Error adding supplier:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSupplier = async () => {
    if (!selectedSupplier || !editForm.name) {
      toast({ title: "Error", description: "Supplier name is required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({
          name: editForm.name,
          contact_person: editForm.contact_person,
          email: editForm.email,
          phone: editForm.phone,
          address: editForm.address,
          city: editForm.city,
          country: editForm.country,
          category: editForm.category,
          status: editForm.status,
          payment_terms: editForm.payment_terms,
          lead_time: editForm.lead_time,
          notes: editForm.notes,
          rating: editForm.rating,
          reliability: editForm.reliability
        })
        .eq('id', selectedSupplier.id);

      if (error) throw error;

      toast({ title: "Success", description: "Supplier updated successfully" });
      setIsEditMode(false);
      setSelectedSupplier(null);
      setEditForm({});
      fetchSuppliers();
    } catch (error: any) {
      console.error('Error updating supplier:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ is_active: false })
        .eq('id', selectedSupplier.id);

      if (error) throw error;

      toast({ title: "Success", description: "Supplier deactivated successfully" });
      setShowDeleteDialog(false);
      setSelectedSupplier(null);
      fetchSuppliers();
    } catch (error: any) {
      console.error('Error deleting supplier:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "success";
      case "pending": return "warning";
      case "inactive": return "destructive";
      default: return "secondary";
    }
  };

  const getReliabilityColor = (reliability: number) => {
    if (reliability >= 95) return "text-green-500";
    if (reliability >= 85) return "text-yellow-500";
    return "text-red-500";
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} 
      />
    ));
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || 
      supplier.category?.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.status === "active").length;
  const totalOrderValue = suppliers.reduce((sum, s) => sum + (s.total_value || 0), 0);
  const avgRating = suppliers.length > 0 
    ? suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / suppliers.filter(s => s.rating).length || 0
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Supplier Management
          </h1>
          <p className="text-muted-foreground">Manage vendor relationships and procurement</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            className="bg-gradient-to-r from-primary to-secondary"
            onClick={() => {
              setIsAddMode(true);
              setEditForm({ status: 'active' });
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Suppliers</p>
                <p className="text-2xl font-bold text-primary">{totalSuppliers}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Package className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Suppliers</p>
                <p className="text-2xl font-bold text-green-500">{activeSuppliers}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Order Value</p>
                <p className="text-2xl font-bold text-blue-500">${totalOrderValue.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold text-yellow-500">{avgRating.toFixed(1)}</p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Search & Filter Suppliers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name, contact person, or email..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Button 
                  key={category}
                  variant={selectedCategory === category.toLowerCase() ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setSelectedCategory(category.toLowerCase())}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers List */}
      {filteredSuppliers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No suppliers found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedCategory !== 'all' 
                ? "Try adjusting your search or filters" 
                : "Get started by adding your first supplier"}
            </p>
            <Button onClick={() => { setIsAddMode(true); setEditForm({ status: 'active' }); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Supplier
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSuppliers.map((supplier) => (
            <Card key={supplier.id} className="hover:border-primary/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{supplier.name}</h3>
                        <Badge 
                          variant={getStatusColor(supplier.status) as any}
                          className="capitalize"
                        >
                          {supplier.status}
                        </Badge>
                        {supplier.category && (
                          <Badge variant="outline" className="capitalize">
                            {supplier.category}
                          </Badge>
                        )}
                      </div>
                      {supplier.contact_person && (
                        <p className="text-sm text-muted-foreground mb-2">Contact: {supplier.contact_person}</p>
                      )}
                      {supplier.rating && (
                        <div className="flex items-center gap-1 mb-2">
                          {getRatingStars(supplier.rating)}
                          <span className="text-sm text-muted-foreground ml-2">({supplier.rating}/5)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold">${(supplier.total_value || 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{supplier.total_orders || 0} orders</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Contact Info</p>
                    <div className="space-y-1">
                      {supplier.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span>{supplier.email}</span>
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span>{supplier.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Location</p>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span>{[supplier.city, supplier.country].filter(Boolean).join(', ') || 'Not specified'}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Terms</p>
                    <div className="space-y-1">
                      {supplier.payment_terms && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span>{supplier.payment_terms}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Truck className="w-3 h-3 text-muted-foreground" />
                        <span>{supplier.lead_time || 7} days</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Performance</p>
                    {supplier.reliability && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Reliability:</span>
                        <span className={`text-sm font-medium ${getReliabilityColor(supplier.reliability)}`}>
                          {supplier.reliability}%
                        </span>
                      </div>
                    )}
                    {supplier.last_order_date && (
                      <p className="text-xs text-muted-foreground">
                        Last order: {new Date(supplier.last_order_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Added: {new Date(supplier.created_at).toLocaleDateString()}</span>
                    {supplier.notes && (
                      <span className="max-w-xs truncate">Notes: {supplier.notes}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setSelectedSupplier(supplier)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedSupplier(supplier);
                        setEditForm(supplier);
                        setIsEditMode(true);
                      }}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Supplier Dialog */}
      <Dialog open={isAddMode} onOpenChange={(open) => { setIsAddMode(open); if (!open) setEditForm({}); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Name *</Label>
              <Input
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Supplier name"
              />
            </div>
            <div>
              <Label>Contact Person</Label>
              <Input
                value={editForm.contact_person || ''}
                onChange={(e) => setEditForm({ ...editForm, contact_person: e.target.value })}
                placeholder="Contact name"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={editForm.phone || ''}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={editForm.category || ''}
                onValueChange={(value) => setEditForm({ ...editForm, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.slice(1).map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={editForm.status || 'active'}
                onValueChange={(value) => setEditForm({ ...editForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Terms</Label>
              <Input
                value={editForm.payment_terms || ''}
                onChange={(e) => setEditForm({ ...editForm, payment_terms: e.target.value })}
                placeholder="e.g., Net 30"
              />
            </div>
            <div>
              <Label>Lead Time (days)</Label>
              <Input
                type="number"
                value={editForm.lead_time || 7}
                onChange={(e) => setEditForm({ ...editForm, lead_time: parseInt(e.target.value) || 7 })}
              />
            </div>
            <div className="col-span-2">
              <Label>Address</Label>
              <Input
                value={editForm.address || ''}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                placeholder="Street address"
              />
            </div>
            <div>
              <Label>City</Label>
              <Input
                value={editForm.city || ''}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                placeholder="City"
              />
            </div>
            <div>
              <Label>Country</Label>
              <Input
                value={editForm.country || ''}
                onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                placeholder="Country"
              />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={editForm.notes || ''}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddMode(false); setEditForm({}); }}>
              Cancel
            </Button>
            <Button onClick={handleAddSupplier} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Add Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Edit Supplier Dialog */}
      <Dialog open={!!selectedSupplier && !showDeleteDialog} onOpenChange={(open) => {
        if (!open) {
          setSelectedSupplier(null);
          setIsEditMode(false);
          setEditForm({});
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{isEditMode ? 'Edit Supplier' : 'Supplier Details'}</span>
              {!isEditMode && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                  <Button size="sm" onClick={() => {
                    setIsEditMode(true);
                    setEditForm(selectedSupplier || {});
                  }}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          {isEditMode ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Name *</Label>
                <Input
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Contact Person</Label>
                <Input
                  value={editForm.contact_person || ''}
                  onChange={(e) => setEditForm({ ...editForm, contact_person: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={editForm.category || ''}
                  onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.slice(1).map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={editForm.status || 'active'}
                  onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Payment Terms</Label>
                <Input
                  value={editForm.payment_terms || ''}
                  onChange={(e) => setEditForm({ ...editForm, payment_terms: e.target.value })}
                />
              </div>
              <div>
                <Label>Lead Time (days)</Label>
                <Input
                  type="number"
                  value={editForm.lead_time || 7}
                  onChange={(e) => setEditForm({ ...editForm, lead_time: parseInt(e.target.value) || 7 })}
                />
              </div>
              <div>
                <Label>Rating (0-5)</Label>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={editForm.rating || 0}
                  onChange={(e) => setEditForm({ ...editForm, rating: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Reliability (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={editForm.reliability || 100}
                  onChange={(e) => setEditForm({ ...editForm, reliability: parseInt(e.target.value) || 100 })}
                />
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
                <Input
                  value={editForm.address || ''}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={editForm.city || ''}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                />
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  value={editForm.country || ''}
                  onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Textarea
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                />
              </div>
            </div>
          ) : selectedSupplier && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedSupplier.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusColor(selectedSupplier.status) as any} className="capitalize">
                    {selectedSupplier.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact Person</p>
                  <p className="font-medium">{selectedSupplier.contact_person || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedSupplier.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedSupplier.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{selectedSupplier.category || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">
                    {[selectedSupplier.address, selectedSupplier.city, selectedSupplier.country]
                      .filter(Boolean).join(', ') || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Terms</p>
                  <p className="font-medium">{selectedSupplier.payment_terms || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lead Time</p>
                  <p className="font-medium">{selectedSupplier.lead_time || 7} days</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <div className="flex items-center gap-1">
                    {getRatingStars(selectedSupplier.rating || 0)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reliability</p>
                  <p className={`font-medium ${getReliabilityColor(selectedSupplier.reliability || 0)}`}>
                    {selectedSupplier.reliability || 0}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="font-medium">{selectedSupplier.total_orders || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="font-medium">${(selectedSupplier.total_value || 0).toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium">{selectedSupplier.notes || '-'}</p>
                </div>
              </div>
            </div>
          )}

          {isEditMode && (
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsEditMode(false); setEditForm({}); }}>
                Cancel
              </Button>
              <Button onClick={handleUpdateSupplier} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the supplier "{selectedSupplier?.name}". 
              They will no longer appear in the active suppliers list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSupplier} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Suppliers;