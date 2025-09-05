import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  const { toast } = useToast();

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
        <Button className="bg-gradient-primary">
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
                    <Button size="sm" variant="outline">
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
    </div>
  );
};

export default UserRoles;