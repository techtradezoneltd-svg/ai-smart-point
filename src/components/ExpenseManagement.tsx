import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import BulkDeleteBar from "@/components/BulkDeleteBar";
import { format } from "date-fns";
import { 
  Receipt, 
  Plus, 
  CalendarIcon,
  DollarSign,
  TrendingUp,
  FileText,
  Filter,
  Download,
  Edit,
  Trash2,
  Loader2
} from "lucide-react";

interface Expense {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  category: string;
  receipt_number: string | null;
  expense_date: string;
  created_at: string;
  created_by: string | null;
}

const ExpenseManagement = () => {
  const { formatCurrency } = useCurrency();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth().toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterCategory, setFilterCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<'utilities' | 'rent' | 'supplies' | 'maintenance' | 'marketing' | 'salaries' | 'other' | "">("");
  const [receiptNumber, setReceiptNumber] = useState("");

  const { toast } = useToast();
  const expenseBulk = useBulkSelection(expenses);

  const categories = [
    { value: 'utilities', label: 'Utilities', color: 'bg-blue-500' },
    { value: 'rent', label: 'Rent', color: 'bg-purple-500' },
    { value: 'supplies', label: 'Supplies', color: 'bg-green-500' },
    { value: 'maintenance', label: 'Maintenance', color: 'bg-orange-500' },
    { value: 'marketing', label: 'Marketing', color: 'bg-pink-500' },
    { value: 'salaries', label: 'Salaries', color: 'bg-indigo-500' },
    { value: 'other', label: 'Other', color: 'bg-gray-500' }
  ];

  useEffect(() => {
    fetchExpenses();
  }, [filterMonth, filterYear, filterCategory]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });

      if (filterCategory !== "all") {
        query = query.eq('category', filterCategory as any);
      }

      const { data, error } = await query;

      if (error) throw error;

      const filtered = data?.filter(expense => {
        const expenseDate = new Date(expense.expense_date);
        return expenseDate.getMonth() === parseInt(filterMonth) && 
               expenseDate.getFullYear() === parseInt(filterYear);
      }) || [];
      
      setExpenses(filtered);
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to fetch expenses", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExpense = async () => {
    if (!title || !amount || !category || !selectedDate) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const expenseData = {
        title,
        description: description || null,
        amount,
        category: category as any,
        receipt_number: receiptNumber || null,
        expense_date: format(selectedDate, 'yyyy-MM-dd')
      };

      if (editingExpense) {
        const { error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', editingExpense.id);

        if (error) throw error;
        toast({ title: "Success", description: "Expense updated successfully" });
      } else {
        const { error } = await supabase
          .from('expenses')
          .insert(expenseData);

        if (error) throw error;
        toast({ title: "Success", description: "Expense recorded successfully" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchExpenses();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', selectedExpense.id);

      if (error) throw error;
      
      toast({ title: "Success", description: "Expense deleted successfully" });
      setShowDeleteDialog(false);
      setSelectedExpense(null);
      fetchExpenses();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense);
    setTitle(expense.title);
    setDescription(expense.description || "");
    setAmount(expense.amount);
    setCategory(expense.category as any);
    setReceiptNumber(expense.receipt_number || "");
    setSelectedDate(new Date(expense.expense_date));
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setAmount(0);
    setCategory("");
    setReceiptNumber("");
    setSelectedDate(undefined);
    setEditingExpense(null);
  };

  const handleBulkDeleteExpenses = async () => {
    const ids = Array.from(expenseBulk.selectedIds);
    const { error } = await supabase.from('expenses').delete().in('id', ids);
    if (error) {
      toast({ title: "Error", description: "Failed to delete selected expenses", variant: "destructive" });
    } else {
      toast({ title: "Success", description: `${ids.length} expenses deleted successfully` });
      expenseBulk.clearSelection();
      fetchExpenses();
    }
  };

  const getTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + Number(expense.amount), 0);
  };

  const getCategoryTotals = () => {
    const totals: { [key: string]: number } = {};
    expenses.forEach(expense => {
      totals[expense.category] = (totals[expense.category] || 0) + Number(expense.amount);
    });
    return totals;
  };

  const categoryTotals = getCategoryTotals();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Expense Management
          </h1>
          <p className="text-muted-foreground">Track and manage business expenses</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={openAddDialog} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Expense' : 'Record New Expense'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter expense title"
              />
            </div>
            
            <div>
              <Label>Category *</Label>
              <Select value={category} onValueChange={(value: any) => setCategory(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Amount *</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label>Receipt Number</Label>
              <Input
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="Receipt/Reference number"
              />
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional details"
              />
            </div>
            
            <Button onClick={handleSaveExpense} className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                editingExpense ? 'Update Expense' : 'Record Expense'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalExpenses())}</div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(parseInt(filterYear), parseInt(filterMonth)), 'MMMM yyyy')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenses.length}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. per Day</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(getTotalExpenses() / new Date(parseInt(filterYear), parseInt(filterMonth) + 1, 0).getDate())}
            </div>
            <p className="text-xs text-muted-foreground">Daily average</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => (
              <SelectItem key={i} value={i.toString()}>
                {format(new Date(2024, i), 'MMMM')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - 2 + i;
              return (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[160px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map(cat => {
              const total = categoryTotals[cat.value] || 0;
              const percentage = getTotalExpenses() > 0 ? (total / getTotalExpenses() * 100) : 0;
              return (
                <div key={cat.value} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${cat.color}`}></div>
                    <span className="text-sm font-medium">{cat.label}</span>
                  </div>
                  <div className="text-lg font-bold">{formatCurrency(total)}</div>
                  <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <BulkDeleteBar
        selectedCount={expenseBulk.selectedCount}
        onDelete={handleBulkDeleteExpenses}
        onClear={expenseBulk.clearSelection}
        itemLabel="expenses"
      />

      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>
            {expenses.length} expenses for {format(new Date(parseInt(filterYear), parseInt(filterMonth)), 'MMMM yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.map(expense => {
                const categoryInfo = categories.find(c => c.value === expense.category);
                return (
                  <div key={expense.id} className={`flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow ${expenseBulk.isSelected(expense.id) ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}>
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={expenseBulk.isSelected(expense.id)}
                        onCheckedChange={() => expenseBulk.toggleOne(expense.id)}
                        aria-label={`Select ${expense.title}`}
                      />
                      <div className={`w-10 h-10 rounded-full ${categoryInfo?.color} flex items-center justify-center`}>
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium">{expense.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="secondary">{categoryInfo?.label}</Badge>
                          <span>{format(new Date(expense.expense_date), 'MMM dd, yyyy')}</span>
                          {expense.receipt_number && (
                            <span>• {expense.receipt_number}</span>
                          )}
                        </div>
                        {expense.description && (
                          <p className="text-sm text-muted-foreground mt-1">{expense.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-bold">{formatCurrency(expense.amount)}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(expense)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-destructive"
                          onClick={() => {
                            setSelectedExpense(expense);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {expenses.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  No expenses found for the selected period
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedExpense?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteExpense}
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

export default ExpenseManagement;
