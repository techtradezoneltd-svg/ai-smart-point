import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";
import { usePermissions, UserRole } from "@/hooks/usePermissions";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Settings,
  Brain,
  Zap,
  FileText,
  Truck,
  TrendingUp,
  DollarSign,
  UserCheck,
  Tags,
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
  category: string;
  allowedRoles?: UserRole[];
  requiredPermission?: keyof ReturnType<typeof usePermissions>;
}

const Navigation = ({ currentView, onNavigate }: NavigationProps) => {
  const permissions = usePermissions();

  const navigationItems: NavItem[] = [
    { 
      id: "dashboard", 
      label: "Dashboard", 
      icon: LayoutDashboard, 
      badge: null,
      category: "main"
    },
    { 
      id: "pos", 
      label: "Point of Sale", 
      icon: ShoppingCart, 
      badge: "AI",
      category: "sales",
      requiredPermission: "canProcessSales"
    },
    { 
      id: "inventory", 
      label: "Product Management", 
      icon: Package, 
      badge: null,
      category: "inventory",
      requiredPermission: "canManageProducts"
    },
    { 
      id: "stock", 
      label: "Stock Movements", 
      icon: TrendingUp, 
      badge: null,
      category: "inventory",
      requiredPermission: "canManageProducts"
    },
    { 
      id: "categories", 
      label: "Category & Units", 
      icon: Tags, 
      badge: null,
      category: "inventory",
      requiredPermission: "canManageProducts"
    },
    { 
      id: "saleshistory", 
      label: "Sales History", 
      icon: FileText, 
      badge: null,
      category: "sales",
      requiredPermission: "canProcessSales"
    },
    { 
      id: "customers", 
      label: "Customers", 
      icon: Users, 
      badge: null,
      category: "crm",
      requiredPermission: "canManageCustomers"
    },
    { 
      id: "suppliers", 
      label: "Suppliers", 
      icon: Truck, 
      badge: null,
      category: "crm",
      requiredPermission: "canManageSuppliers"
    },
    { 
      id: "expenses", 
      label: "Expense Management", 
      icon: DollarSign, 
      badge: null,
      category: "finance",
      requiredPermission: "canManageExpenses"
    },
    { 
      id: "reports", 
      label: "Reports", 
      icon: BarChart3, 
      badge: null,
      category: "reports",
      requiredPermission: "canViewReports"
    },
    { 
      id: "reports-export", 
      label: "Export Center", 
      icon: FileText, 
      badge: null,
      category: "reports",
      requiredPermission: "canViewReports"
    },
    { 
      id: "analytics", 
      label: "Analytics", 
      icon: TrendingUp, 
      badge: "AI",
      category: "reports",
      requiredPermission: "canViewReports"
    },
    { 
      id: "ai-voice", 
      label: "AI Assistant", 
      icon: Brain, 
      badge: "NEW",
      category: "ai"
    },
    { 
      id: "staff", 
      label: "Staff Management", 
      icon: UserCheck, 
      badge: null,
      category: "admin",
      requiredPermission: "canManageStaff"
    },
    { 
      id: "user-roles", 
      label: "User Roles", 
      icon: Users, 
      badge: null,
      category: "admin",
      allowedRoles: ["admin"]
    },
    { 
      id: "audit-logs", 
      label: "Audit Logs", 
      icon: FileText, 
      badge: null,
      category: "admin",
      allowedRoles: ["admin", "manager"]
    },
    { 
      id: "settings", 
      label: "Settings", 
      icon: Settings, 
      badge: null,
      category: "admin",
      requiredPermission: "canManageSettings"
    }
  ];

  // Filter navigation based on permissions
  const filteredItems = useMemo(() => {
    if (permissions.loading) return [];
    
    return navigationItems.filter(item => {
      // Check role-based access
      if (item.allowedRoles && permissions.role) {
        return item.allowedRoles.includes(permissions.role);
      }
      // Check permission-based access
      if (item.requiredPermission) {
        return permissions[item.requiredPermission] === true;
      }
      return true;
    });
  }, [permissions]);

  if (permissions.loading) {
    return (
      <div className="bg-gradient-card border-r border-border w-full sm:w-64 md:w-72 lg:w-80 min-h-screen p-3 sm:p-4 md:p-6 animate-fade-in flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-card border-r border-border w-full sm:w-64 md:w-72 lg:w-80 min-h-screen p-3 sm:p-4 md:p-6 animate-fade-in">
      {/* Logo/Brand */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
            <Brain className="w-4 h-4 sm:w-6 sm:h-6 text-white animate-pulse" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-lg sm:text-xl bg-gradient-primary bg-clip-text text-transparent">
              SmartPOS
            </h1>
            <p className="text-xs text-muted-foreground">AI-Powered</p>
          </div>
        </div>
      </div>

      {/* AI Status */}
      <div className="mb-4 sm:mb-6 p-2 sm:p-3 bg-accent/10 border border-accent/30 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
          <span className="text-xs sm:text-sm font-medium text-accent hidden sm:inline">AI Engine</span>
          <Badge variant="outline" className="border-accent text-accent text-xs">
            ACTIVE
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground hidden sm:block">
          Processing 47 data points for intelligent insights
        </p>
      </div>

      {/* Navigation Items */}
      <nav className="space-y-1 sm:space-y-2">
        {filteredItems.map((item, index) => (
          <Button
            key={item.id}
            variant={currentView === item.id ? "default" : "ghost"}
            className={`w-full justify-start h-10 sm:h-12 animate-fade-in ${
              currentView === item.id 
                ? "bg-gradient-primary text-white shadow-glow" 
                : "hover:bg-secondary/50"
            }`}
            style={{ animationDelay: `${index * 0.1}s` }}
            onClick={() => onNavigate(item.id)}
          >
            <item.icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
            <span className="flex-1 text-left text-xs sm:text-sm truncate hidden sm:block">{item.label}</span>
            <span className="flex-1 text-left text-xs truncate sm:hidden">{item.label.split(' ')[0]}</span>
            {item.badge && (
              <Badge 
                variant="secondary" 
                className="bg-destructive text-destructive-foreground text-xs hidden sm:inline-flex"
              >
                {item.badge}
              </Badge>
            )}
          </Button>
        ))}
      </nav>

      {/* AI Insights Summary */}
      <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-primary/10 border border-primary/30 rounded-lg hidden md:block">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm font-medium text-primary">Today's AI Insights</span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Revenue Prediction:</span>
            <span className="text-success font-medium">+12%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Stock Alerts:</span>
            <span className="text-warning font-medium">2 items</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customer Insights:</span>
            <span className="text-accent font-medium">3 new</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
