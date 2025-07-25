import { useState } from "react";
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
  name: string;
  email: string;
  role: "admin" | "supervisor" | "cashier" | "inventory_manager";
  permissions: string[];
  lastLogin: string;
  status: "active" | "inactive";
  actionsToday: number;
}

const UserRoles = () => {
  const [users] = useState<UserRole[]>([
    {
      id: "1",
      name: "John Admin",
      email: "john@store.com",
      role: "admin",
      permissions: ["all_access", "user_management", "reports", "system_config"],
      lastLogin: "2024-01-25 09:15",
      status: "active",
      actionsToday: 45
    },
    {
      id: "2",
      name: "Sarah Manager",
      email: "sarah@store.com",
      role: "supervisor",
      permissions: ["sales_management", "inventory_view", "reports", "staff_oversight"],
      lastLogin: "2024-01-25 08:30",
      status: "active",
      actionsToday: 32
    },
    {
      id: "3",
      name: "Mike Cashier",
      email: "mike@store.com",
      role: "cashier",
      permissions: ["pos_access", "basic_sales", "customer_lookup"],
      lastLogin: "2024-01-25 10:00",
      status: "active",
      actionsToday: 89
    },
    {
      id: "4",
      name: "Lisa Stock",
      email: "lisa@store.com",
      role: "inventory_manager",
      permissions: ["inventory_full", "supplier_management", "stock_reports", "reorder_access"],
      lastLogin: "2024-01-24 16:45",
      status: "inactive",
      actionsToday: 0
    }
  ]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Crown className="w-4 h-4 text-primary" />;
      case "supervisor": return <Shield className="w-4 h-4 text-accent" />;
      case "cashier": return <User className="w-4 h-4 text-success" />;
      case "inventory_manager": return <UserCheck className="w-4 h-4 text-warning" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "primary";
      case "supervisor": return "accent";
      case "cashier": return "success";
      case "inventory_manager": return "warning";
      default: return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "active" ? "success" : "muted";
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
              {users.filter(u => u.status === "active").length}
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
              {users.reduce((sum, u) => sum + u.actionsToday, 0)}
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
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{user.name}</h3>
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
                        className={`border-${getStatusColor(user.status)} text-${getStatusColor(user.status)}`}
                      >
                        {user.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Last login: {user.lastLogin}</span>
                      <span>Actions today: {user.actionsToday}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium mb-2">Permissions</p>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {user.permissions.slice(0, 3).map((perm) => (
                        <Badge key={perm} variant="secondary" className="text-xs">
                          {permissionDescriptions[perm] || perm}
                        </Badge>
                      ))}
                      {user.permissions.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{user.permissions.length - 3} more
                        </Badge>
                      )}
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

      {/* Permission Matrix */}
      <Card className="bg-gradient-card border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent" />
            Permission Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Permission</th>
                  <th className="text-center p-2">Admin</th>
                  <th className="text-center p-2">Supervisor</th>
                  <th className="text-center p-2">Cashier</th>
                  <th className="text-center p-2">Inventory Manager</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(permissionDescriptions).map(([perm, desc]) => (
                  <tr key={perm} className="border-b hover:bg-muted/20">
                    <td className="p-2 font-medium">{desc}</td>
                    <td className="text-center p-2">
                      {users.find(u => u.role === "admin")?.permissions.includes(perm) ? 
                        <div className="w-4 h-4 bg-success rounded-full mx-auto"></div> : 
                        <div className="w-4 h-4 bg-muted rounded-full mx-auto"></div>
                      }
                    </td>
                    <td className="text-center p-2">
                      {users.find(u => u.role === "supervisor")?.permissions.includes(perm) ? 
                        <div className="w-4 h-4 bg-success rounded-full mx-auto"></div> : 
                        <div className="w-4 h-4 bg-muted rounded-full mx-auto"></div>
                      }
                    </td>
                    <td className="text-center p-2">
                      {users.find(u => u.role === "cashier")?.permissions.includes(perm) ? 
                        <div className="w-4 h-4 bg-success rounded-full mx-auto"></div> : 
                        <div className="w-4 h-4 bg-muted rounded-full mx-auto"></div>
                      }
                    </td>
                    <td className="text-center p-2">
                      {users.find(u => u.role === "inventory_manager")?.permissions.includes(perm) ? 
                        <div className="w-4 h-4 bg-success rounded-full mx-auto"></div> : 
                        <div className="w-4 h-4 bg-muted rounded-full mx-auto"></div>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserRoles;