import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Plus, 
  Shield, 
  ShieldCheck, 
  Crown, 
  User,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Staff {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'cashier' | 'supervisor' | 'manager';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const StaffManagement = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<'admin' | 'cashier' | 'supervisor' | 'manager' | ''>('');
  const [isActive, setIsActive] = useState(true);

  const { toast } = useToast();

  const roles = [
    { value: 'admin', label: 'Administrator', icon: Crown, color: 'destructive', description: 'Full system access' },
    { value: 'manager', label: 'Manager', icon: ShieldCheck, color: 'default', description: 'Management operations' },
    { value: 'supervisor', label: 'Supervisor', icon: Shield, color: 'secondary', description: 'Supervisory access' },
    { value: 'cashier', label: 'Cashier', icon: User, color: 'outline', description: 'Basic operations' }
  ];

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to fetch staff", variant: "destructive" });
    } else {
      setStaff(data || []);
    }
  };

  const handleCreateOrUpdateStaff = async () => {
    if (!fullName || !email || !role) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const staffData = {
      full_name: fullName,
      email: email,
      role: role as any,
      is_active: isActive
    };

    let error;
    if (editingStaff) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(staffData)
        .eq('id', editingStaff.id);
      error = updateError;
    } else {
      // Note: In a real app, you'd create the auth user first
      toast({ 
        title: "Info", 
        description: "In production, this would create a new auth user and profile", 
        variant: "default" 
      });
      return;
    }

    if (error) {
      toast({ title: "Error", description: "Failed to save staff member", variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Staff member ${editingStaff ? 'updated' : 'created'} successfully` });
      setIsDialogOpen(false);
      resetForm();
      fetchStaff();
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', staffId);

    if (error) {
      toast({ title: "Error", description: "Failed to delete staff member", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Staff member deleted successfully" });
      fetchStaff();
    }
  };

  const handleToggleStatus = async (staffMember: Staff) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !staffMember.is_active })
      .eq('id', staffMember.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update staff status", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Staff status updated successfully" });
      fetchStaff();
    }
  };

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setRole('');
    setIsActive(true);
    setEditingStaff(null);
  };

  const openEditDialog = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFullName(staffMember.full_name || "");
    setEmail(staffMember.email || "");
    setRole(staffMember.role);
    setIsActive(staffMember.is_active);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getRoleInfo = (roleValue: string) => {
    return roles.find(r => r.value === roleValue) || roles[3]; // default to cashier
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = (member.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && member.is_active) ||
                         (statusFilter === "inactive" && !member.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStaffStats = () => {
    const total = staff.length;
    const active = staff.filter(s => s.is_active).length;
    const byRole = roles.map(role => ({
      ...role,
      count: staff.filter(s => s.role === role.value).length
    }));
    
    return { total, active, inactive: total - active, byRole };
  };

  const stats = getStaffStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Staff Management
          </h1>
          <p className="text-muted-foreground">Manage team roles and permissions</p>
        </div>
        
        <Button onClick={openCreateDialog} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
          <Plus className="mr-2 h-4 w-4" />
          Add Staff
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add New Staff'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  disabled={!!editingStaff}
                />
              </div>
              
              <div>
                <Label>Role *</Label>
                <Select value={role} onValueChange={(value: any) => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(roleOption => (
                      <SelectItem key={roleOption.value} value={roleOption.value}>
                        <div className="flex items-center gap-2">
                          <roleOption.icon className="h-4 w-4" />
                          {roleOption.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Active Status</Label>
                  <p className="text-sm text-muted-foreground">Staff member can access the system</p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
              
              <Button onClick={handleCreateOrUpdateStaff} className="w-full">
                {editingStaff ? 'Update Staff' : 'Add Staff'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active, {stats.inactive} inactive
            </p>
          </CardContent>
        </Card>

        {stats.byRole.slice(0, 3).map(role => (
          <Card key={role.value}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{role.label}s</CardTitle>
              <role.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{role.count}</div>
              <p className="text-xs text-muted-foreground">{role.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map(role => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {filteredStaff.length} of {staff.length} staff members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredStaff.map(member => {
              const roleInfo = getRoleInfo(member.role);
              return (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold">
                      {(member.full_name || member.email || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-medium">{member.full_name || "No name set"}</h4>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={roleInfo.color as any} className="flex items-center gap-1">
                          <roleInfo.icon className="h-3 w-3" />
                          {roleInfo.label}
                        </Badge>
                        <Badge variant={member.is_active ? "default" : "secondary"}>
                          {member.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={member.is_active}
                      onCheckedChange={() => handleToggleStatus(member)}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(member)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteStaff(member.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
            
            {filteredStaff.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No staff members found matching your filters
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role Permissions Info */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>Understanding different access levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map(role => (
              <div key={role.value} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <role.icon className="h-5 w-5" />
                  <h4 className="font-medium">{role.label}</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{role.description}</p>
                <div className="text-xs text-muted-foreground">
                  {role.value === 'admin' && '• Full system access • Manage all users • System configuration'}
                  {role.value === 'manager' && '• Manage inventory • View reports • Manage expenses'}
                  {role.value === 'supervisor' && '• Stock management • Staff oversight • Customer service'}
                  {role.value === 'cashier' && '• Process sales • View products • Basic operations'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffManagement;