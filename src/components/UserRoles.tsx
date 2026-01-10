import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  Users, 
  Settings, 
  Eye, 
  Edit, 
  Trash2,
  Plus,
  Crown,
  User,
  UserCheck,
  Activity
} from "lucide-react";

interface UserRole {
  id: string;
  full_name: string | null;
  email: string | null;
  role: "admin" | "supervisor" | "cashier" | "manager";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const UserRoles = () => {
  const [users, setUsers] = useState<UserRole[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserRole | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserRole>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    full_name: '',
    email: '',
    role: '' as 'admin' | 'cashier' | 'supervisor' | 'manager' | '',
    password: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { logAction } = useAuditLog();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to fetch users", variant: "destructive" });
    } else {
      setUsers(data || []);
    }
  };

  const handleSaveUserChanges = async () => {
    if (!selectedUser) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editForm.full_name,
        role: editForm.role,
        is_active: editForm.is_active
      })
      .eq('id', selectedUser.id);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      // Log the action
      await logAction({
        action: `Updated user: ${editForm.full_name}`,
        category: 'user_management',
        details: {
          user_id: selectedUser.id,
          changes: {
            role: editForm.role !== selectedUser.role ? { from: selectedUser.role, to: editForm.role } : undefined,
            is_active: editForm.is_active !== selectedUser.is_active ? { from: selectedUser.is_active, to: editForm.is_active } : undefined
          }
        },
        risk_level: editForm.role !== selectedUser.role ? 'high' : 'medium'
      });

      toast({ title: "Success", description: "User updated successfully" });
      setIsEditMode(false);
      setSelectedUser(null);
      fetchUsers();
    }
  };

  const handleAddUser = async () => {
    if (!newUserForm.full_name || !newUserForm.email || !newUserForm.role || !newUserForm.password) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    if (newUserForm.password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      // Sign up the new user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: newUserForm.email,
        password: newUserForm.password,
        options: {
          data: {
            full_name: newUserForm.full_name
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (signUpError) {
        toast({ title: "Error", description: signUpError.message, variant: "destructive" });
        return;
      }

      if (authData.user) {
        // Update the profile with the correct role
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            full_name: newUserForm.full_name,
            email: newUserForm.email,
            role: newUserForm.role,
            is_active: true
          });
        
        if (profileError) {
          toast({ title: "Error", description: "Failed to create user profile", variant: "destructive" });
          return;
        }

        // Log the action
        await logAction({
          action: `Created new user: ${newUserForm.full_name}`,
          category: 'user_management',
          details: {
            user_email: newUserForm.email,
            role: newUserForm.role
          },
          risk_level: 'high'
        });

        toast({ 
          title: "Success", 
          description: 'User created successfully. They will receive an email to confirm their account.'
        });
        setShowAddUserDialog(false);
        setNewUserForm({ full_name: '', email: '', role: '', password: '' });
        fetchUsers();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast({ title: "Error", description: "Failed to create user", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('id', selectedUser.id);

    if (error) {
      toast({ title: "Error", description: "Failed to deactivate user", variant: "destructive" });
    } else {
      await logAction({
        action: `Deactivated user: ${selectedUser.full_name || selectedUser.email}`,
        category: 'user_management',
        details: { user_id: selectedUser.id },
        risk_level: 'high'
      });
      toast({ title: "Success", description: "User deactivated successfully" });
      setShowDeleteDialog(false);
      setSelectedUser(null);
      fetchUsers();
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Crown className="w-4 h-4 text-primary" />;
      case "supervisor": return <Shield className="w-4 h-4 text-accent" />;
      case "cashier": return <User className="w-4 h-4 text-success" />;
      case "manager": return <UserCheck className="w-4 h-4 text-warning" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "primary";
      case "supervisor": return "accent";
      case "cashier": return "success";
      case "manager": return "warning";
      default: return "secondary";
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "success" : "muted";
  };

  const permissionDescriptions: Record<string, string> = {
    all_access: "Full system access",
    user_management: "Manage user accounts",
    reports: "View and generate reports",
    system_config: "System configuration",
    sales_management: "Manage sales operations",
    inventory_view: "View inventory data",
    staff_oversight: "Supervise staff activities",
    pos_access: "Access POS system",
    basic_sales: "Process basic sales",
    customer_lookup: "Search customer data",
    inventory_full: "Full inventory management",
    supplier_management: "Manage suppliers",
    stock_reports: "Generate stock reports",
    reorder_access: "Place reorder requests"
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            User Roles & Access Control
          </h1>
          <p className="text-muted-foreground">Manage user permissions and system access</p>
        </div>
        <Button className="bg-gradient-primary" onClick={() => setShowAddUserDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{users.length}</div>
            <p className="text-xs text-muted-foreground">System users</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-success/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {users.filter(u => u.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Actions</CardTitle>
            <Activity className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {users.length * 15} {/* Mock data for demo */}
            </div>
            <p className="text-xs text-muted-foreground">Total actions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-warning/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles Defined</CardTitle>
            <Shield className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">4</div>
            <p className="text-xs text-muted-foreground">Different roles</p>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            System Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-6 border border-border rounded-lg hover:border-primary/50 transition-all"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className={`bg-gradient-${getRoleColor(user.role)} text-white font-bold`}>
                      {(user.full_name || user.email || "U").split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{user.full_name || "No name set"}</h3>
                      <div className="flex items-center gap-1">
                        {getRoleIcon(user.role)}
                        <Badge 
                          variant="outline" 
                          className={`border-${getRoleColor(user.role)} text-${getRoleColor(user.role)} capitalize`}
                        >
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`border-${getStatusColor(user.is_active)} text-${getStatusColor(user.is_active)}`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Created: {new Date(user.created_at).toLocaleDateString()}</span>
                      <span>Role: {user.role}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium mb-2">Role Access</p>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      <Badge variant="secondary" className="text-xs">
                        {user.role === 'admin' ? 'Full Access' : 
                         user.role === 'manager' ? 'Management Access' :
                         user.role === 'supervisor' ? 'Supervisory Access' : 'Basic Access'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSelectedUser(user)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Settings className="w-4 h-4" />
                    </Button>
                    {user.role !== "admin" && (
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Overview */}
      <Card className="bg-gradient-card border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent" />
            Role Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Administrator</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">Complete system control</p>
              <div className="text-xs text-muted-foreground">
                • Full system access • Manage all users • System configuration • All reports
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="h-5 w-5 text-warning" />
                <h4 className="font-medium">Manager</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">Management operations</p>
              <div className="text-xs text-muted-foreground">
                • Manage inventory • View reports • Manage expenses • Staff oversight
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-accent" />
                <h4 className="font-medium">Supervisor</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">Supervisory access</p>
              <div className="text-xs text-muted-foreground">
                • Stock management • Staff oversight • Customer service • Basic reports
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5 text-success" />
                <h4 className="font-medium">Cashier</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">Basic operations</p>
              <div className="text-xs text-muted-foreground">
                • Process sales • View products • Customer lookup • Basic operations
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => {
        setSelectedUser(null);
        setIsEditMode(false);
        setEditForm({});
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>User Profile Details</span>
              {!isEditMode ? (
                <div className="flex gap-2">
                  {selectedUser?.role !== 'admin' && (
                    <Button size="sm" variant="outline" onClick={() => setShowDeleteDialog(true)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  )}
                  <Button size="sm" onClick={() => {
                    setIsEditMode(true);
                    setEditForm(selectedUser || {});
                  }}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    setIsEditMode(false);
                    setEditForm({});
                  }}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => handleSaveUserChanges()}>
                    Save Changes
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className={`bg-gradient-${getRoleColor(selectedUser.role)} text-white font-bold text-xl`}>
                    {(selectedUser.full_name || selectedUser.email || "U").split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  {isEditMode ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Full Name</label>
                        <Input 
                          value={editForm.full_name || ''} 
                          onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Role</label>
                        <Select value={editForm.role} onValueChange={(value: any) => setEditForm({...editForm, role: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrator</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="supervisor">Supervisor</SelectItem>
                            <SelectItem value="cashier">Cashier</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="is_active"
                          checked={editForm.is_active}
                          onChange={(e) => setEditForm({...editForm, is_active: e.target.checked})}
                          className="w-4 h-4"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium">Active User</label>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-2xl font-bold mb-2">{selectedUser.full_name || "No name set"}</h3>
                      <div className="flex gap-2 mb-2">
                        <div className="flex items-center gap-1">
                          {getRoleIcon(selectedUser.role)}
                          <Badge 
                            variant="outline" 
                            className={`border-${getRoleColor(selectedUser.role)} text-${getRoleColor(selectedUser.role)} capitalize`}
                          >
                            {selectedUser.role.replace('_', ' ')}
                          </Badge>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`border-${getStatusColor(selectedUser.is_active)} text-${getStatusColor(selectedUser.is_active)}`}
                        >
                          {selectedUser.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Account Information</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">User ID</p>
                        <p className="font-mono text-xs">{selectedUser.id}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Created</p>
                        <p>{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Updated</p>
                        <p>{new Date(selectedUser.updated_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Role & Permissions</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Role</p>
                        <p className="font-semibold capitalize">{selectedUser.role}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Access Level</p>
                        <p>
                          {selectedUser.role === 'admin' ? 'Full System Access' : 
                           selectedUser.role === 'manager' ? 'Management Access' :
                           selectedUser.role === 'supervisor' ? 'Supervisory Access' : 'Basic Access'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className={selectedUser.is_active ? "text-success font-semibold" : "text-muted-foreground"}>
                          {selectedUser.is_active ? "Active" : "Inactive"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Role Capabilities</h4>
                  <div className="space-y-2 text-sm">
                    {selectedUser.role === 'admin' && (
                      <>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                          <p>Full system access and control</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                          <p>Manage all users and roles</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                          <p>System configuration and settings</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                          <p>View all reports and analytics</p>
                        </div>
                      </>
                    )}
                    {selectedUser.role === 'manager' && (
                      <>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-warning mt-2" />
                          <p>Manage inventory and products</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-warning mt-2" />
                          <p>View and generate reports</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-warning mt-2" />
                          <p>Manage expenses and suppliers</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-warning mt-2" />
                          <p>Staff oversight capabilities</p>
                        </div>
                      </>
                    )}
                    {selectedUser.role === 'supervisor' && (
                      <>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                          <p>Stock management and adjustments</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                          <p>Supervise staff activities</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                          <p>Customer service operations</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                          <p>Basic reports access</p>
                        </div>
                      </>
                    )}
                    {selectedUser.role === 'cashier' && (
                      <>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-success mt-2" />
                          <p>Process sales transactions</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-success mt-2" />
                          <p>View product catalog</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-success mt-2" />
                          <p>Customer lookup and basic info</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-success mt-2" />
                          <p>Basic POS operations</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                  Close
                </Button>
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit User
                </Button>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Permissions
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the user "{selectedUser?.full_name || selectedUser?.email}". 
              They will no longer be able to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Full Name *</label>
              <Input
                value={newUserForm.full_name}
                onChange={(e) => setNewUserForm({...newUserForm, full_name: e.target.value})}
                placeholder="Enter full name"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Email *</label>
              <Input
                type="email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Password *</label>
              <Input
                type="password"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                placeholder="Enter password (min 6 characters)"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Role *</label>
              <Select 
                value={newUserForm.role} 
                onValueChange={(value: any) => setNewUserForm({...newUserForm, role: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      Administrator
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Manager
                    </div>
                  </SelectItem>
                  <SelectItem value="supervisor">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Supervisor
                    </div>
                  </SelectItem>
                  <SelectItem value="cashier">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Cashier
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setShowAddUserDialog(false);
                setNewUserForm({ full_name: '', email: '', role: '', password: '' });
              }}>
                Cancel
              </Button>
              <Button onClick={handleAddUser} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Add User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserRoles;