import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { usePermissions, UserRole } from "@/hooks/usePermissions";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Settings,
  Brain,
  Bot,
  Zap,
  FileText,
  Truck,
  TrendingUp,
  DollarSign,
  CreditCard,
  MessageSquare,
  UserCheck,
  Tags,
  ChevronDown,
  ChevronRight,
  LogOut,
  User,
  LucideIcon
} from "lucide-react";

interface NavigationProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge: string | null;
  allowedRoles?: UserRole[];
  requiredPermission?: keyof ReturnType<typeof usePermissions>;
}

interface NavCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
  allowedRoles?: UserRole[];
}

const NavigationEnhanced = ({ currentView, onNavigate }: NavigationProps) => {
  const { signOut, user } = useAuth();
  const permissions = usePermissions();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    "main", "sales", "inventory"
  ]);

  const navigationCategories: NavCategory[] = [
    {
      id: "main",
      label: "Dashboard",
      icon: LayoutDashboard,
      items: [
        { 
          id: "dashboard", 
          label: "Overview", 
          icon: LayoutDashboard, 
          badge: null 
        }
      ]
    },
    {
      id: "sales",
      label: "Sales & POS",
      icon: ShoppingCart,
      items: [
        { 
          id: "pos", 
          label: "Enhanced POS", 
          icon: ShoppingCart, 
          badge: "AI",
          requiredPermission: "canProcessSales"
        },
        { 
          id: "saleshistory", 
          label: "Sales History", 
          icon: FileText, 
          badge: null,
          requiredPermission: "canProcessSales"
        }
      ]
    },
    {
      id: "inventory",
      label: "Inventory Management",
      icon: Package,
      items: [
        { 
          id: "inventory", 
          label: "Products", 
          icon: Package, 
          badge: null,
          requiredPermission: "canManageProducts"
        },
        { 
          id: "stock", 
          label: "Stock Movements", 
          icon: TrendingUp, 
          badge: null,
          requiredPermission: "canManageProducts"
        },
        { 
          id: "categories", 
          label: "Categories & Units", 
          icon: Tags, 
          badge: null,
          requiredPermission: "canManageProducts"
        }
      ]
    },
    {
      id: "crm",
      label: "Customer Relations",
      icon: Users,
      items: [
        { 
          id: "customers", 
          label: "Customers", 
          icon: Users, 
          badge: null,
          requiredPermission: "canManageCustomers"
        },
        { 
          id: "loans", 
          label: "Loan Management", 
          icon: Users, 
          badge: "NEW",
          requiredPermission: "canManageLoans"
        },
        { 
          id: "suppliers", 
          label: "Suppliers", 
          icon: Truck, 
          badge: null,
          requiredPermission: "canManageSuppliers"
        }
      ]
    },
    {
      id: "finance",
      label: "Financial Management",
      icon: DollarSign,
      items: [
        { 
          id: "expenses", 
          label: "Expenses", 
          icon: DollarSign, 
          badge: null,
          requiredPermission: "canManageExpenses"
        }
      ]
    },
    {
      id: "reports",
      label: "Reports & Analytics",
      icon: BarChart3,
      items: [
        { 
          id: "reports", 
          label: "Reports", 
          icon: BarChart3, 
          badge: null,
          requiredPermission: "canViewReports"
        },
        { 
          id: "reports-export", 
          label: "Export Center", 
          icon: FileText, 
          badge: null,
          requiredPermission: "canViewReports"
        },
        { 
          id: "analytics", 
          label: "Analytics", 
          icon: TrendingUp, 
          badge: "AI",
          requiredPermission: "canViewReports"
        },
        { 
          id: "ai-reporting", 
          label: "AI Reporting", 
          icon: Bot, 
          badge: "NEW",
          requiredPermission: "canViewReports"
        },
        { 
          id: "loan-reports", 
          label: "Loan Reports", 
          icon: CreditCard, 
          badge: "AI",
          requiredPermission: "canViewReports"
        },
        { 
          id: "loan-tester", 
          label: "Reminder Tester", 
          icon: MessageSquare, 
          badge: "TEST",
          allowedRoles: ["admin"]
        }
      ]
    },
    {
      id: "ai",
      label: "AI Features",
      icon: Brain,
      items: [
        { 
          id: "ai-voice", 
          label: "Voice Assistant", 
          icon: Brain, 
          badge: "NEW"
        }
      ]
    },
    {
      id: "admin",
      label: "Administration",
      icon: Settings,
      allowedRoles: ["admin"],
      items: [
        { 
          id: "staff", 
          label: "Staff Management", 
          icon: UserCheck, 
          badge: null,
          requiredPermission: "canManageStaff"
        },
        { 
          id: "user-roles", 
          label: "User Roles", 
          icon: Users, 
          badge: null,
          allowedRoles: ["admin"]
        },
        { 
          id: "audit-logs", 
          label: "Audit Logs", 
          icon: FileText, 
          badge: null,
          allowedRoles: ["admin", "manager"]
        },
        { 
          id: "settings", 
          label: "Settings", 
          icon: Settings, 
          badge: null,
          requiredPermission: "canManageSettings"
        }
      ]
    }
  ];

  // Filter navigation based on permissions
  const filteredCategories = useMemo(() => {
    if (permissions.loading) return [];
    
    return navigationCategories
      .filter(category => {
        // Check if category has role restrictions
        if (category.allowedRoles && permissions.role) {
          return category.allowedRoles.includes(permissions.role);
        }
        return true;
      })
      .map(category => ({
        ...category,
        items: category.items.filter(item => {
          // Check role-based access
          if (item.allowedRoles && permissions.role) {
            return item.allowedRoles.includes(permissions.role);
          }
          // Check permission-based access
          if (item.requiredPermission) {
            return permissions[item.requiredPermission] === true;
          }
          return true;
        })
      }))
      .filter(category => category.items.length > 0);
  }, [permissions]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (permissions.loading) {
    return (
      <div className="bg-gradient-card border-r border-border w-16 sm:w-52 md:w-56 lg:w-60 min-h-screen p-2 sm:p-3 md:p-4 animate-fade-in flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-card border-r border-border w-16 sm:w-52 md:w-56 lg:w-60 min-h-screen p-2 sm:p-3 md:p-4 animate-fade-in">
      {/* Logo/Brand */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-white animate-pulse" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-medium text-sm sm:text-base bg-gradient-primary bg-clip-text text-transparent">
              SmartPOS
            </h1>
            <p className="text-xs text-muted-foreground">AI System</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="mb-3 sm:mb-4 p-1.5 sm:p-2 bg-accent/10 border border-accent/30 rounded-md">
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-accent rounded-full flex items-center justify-center">
            <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-accent capitalize">{permissions.role || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate max-w-32">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* AI Status */}
      <div className="mb-3 sm:mb-4 p-1.5 sm:p-2 bg-success/10 border border-success/30 rounded-md">
        <div className="flex items-center gap-1 sm:gap-2 justify-center sm:justify-start">
          <Zap className="w-3 h-3 text-success animate-pulse" />
          <span className="text-xs font-medium text-success hidden sm:inline">AI Engine</span>
          <Badge variant="outline" className="border-success text-success text-xs px-1 py-0 h-4 hidden sm:inline-flex">
            ON
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground hidden md:block mt-1">
          Processing insights
        </p>
      </div>

      {/* Navigation Categories */}
      <nav className="space-y-0.5 sm:space-y-1 mb-4 sm:mb-6">
        {filteredCategories.map((category) => (
          <Collapsible
            key={category.id}
            open={expandedCategories.includes(category.id)}
            onOpenChange={() => toggleCategory(category.id)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-center sm:justify-between h-8 sm:h-9 px-1 sm:px-2 hover:bg-secondary/50 text-xs"
              >
                <div className="flex items-center gap-1 sm:gap-2">
                  <category.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-xs font-medium truncate hidden sm:block">
                    {category.label}
                  </span>
                </div>
                {expandedCategories.includes(category.id) ? 
                  <ChevronDown className="w-3 h-3 hidden sm:block" /> : 
                  <ChevronRight className="w-3 h-3 hidden sm:block" />
                }
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-0.5 ml-1 sm:ml-2">
              {category.items.map((item) => (
                <Button
                  key={item.id}
                  variant={currentView === item.id ? "default" : "ghost"}
                  className={`w-full justify-center sm:justify-start h-7 sm:h-8 animate-fade-in text-xs ${
                    currentView === item.id 
                      ? "bg-gradient-primary text-white shadow-glow" 
                      : "hover:bg-secondary/50"
                  }`}
                  onClick={() => onNavigate(item.id)}
                >
                  <item.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-0 sm:mr-2 flex-shrink-0" />
                  <span className="flex-1 text-left text-xs font-medium truncate hidden sm:block">
                    {item.label}
                  </span>
                  {item.badge && (
                    <Badge 
                      variant="secondary" 
                      className="bg-destructive text-destructive-foreground text-xs hidden md:inline-flex ml-1 px-1 py-0 h-3.5"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </nav>

      <Separator className="my-3" />

      {/* Logout Button */}
      <Button
        variant="outline"
        className="w-full justify-center sm:justify-start h-8 sm:h-9 border-destructive/30 hover:bg-destructive/10 hover:border-destructive text-xs"
        onClick={handleLogout}
      >
        <LogOut className="w-3.5 h-3.5 mr-0 sm:mr-2 flex-shrink-0 text-destructive" />
        <span className="text-destructive text-xs font-medium hidden sm:block">Sign Out</span>
      </Button>

      {/* AI Insights Summary */}
      <div className="mt-4 sm:mt-6 p-2 sm:p-3 bg-primary/10 border border-primary/30 rounded-md hidden lg:block">
        <div className="flex items-center gap-1 mb-2">
          <Brain className="w-3 h-3 text-primary animate-pulse" />
          <span className="text-xs font-medium text-primary">AI Insights</span>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground text-xs">Revenue:</span>
            <span className="text-success font-medium text-xs">+12%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground text-xs">Alerts:</span>
            <span className="text-warning font-medium text-xs">2</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground text-xs">Insights:</span>
            <span className="text-accent font-medium text-xs">3</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationEnhanced;
