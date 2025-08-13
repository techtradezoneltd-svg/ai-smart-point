import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
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
  ChevronDown,
  ChevronRight,
  LogOut,
  User
} from "lucide-react";

interface NavigationProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

const NavigationEnhanced = ({ currentView, onNavigate }: NavigationProps) => {
  const { signOut, user } = useAuth();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    "main", "sales", "inventory"
  ]);

  const navigationCategories = [
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
          label: "Point of Sale", 
          icon: ShoppingCart, 
          badge: "AI" 
        },
        { 
          id: "saleshistory", 
          label: "Sales History", 
          icon: FileText, 
          badge: null 
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
          badge: null 
        },
        { 
          id: "stock", 
          label: "Stock Movements", 
          icon: TrendingUp, 
          badge: null 
        },
        { 
          id: "categories", 
          label: "Categories & Units", 
          icon: Tags, 
          badge: null 
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
          badge: null 
        },
        { 
          id: "suppliers", 
          label: "Suppliers", 
          icon: Truck, 
          badge: null 
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
          badge: null 
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
          badge: null 
        },
        { 
          id: "reports-export", 
          label: "Export Center", 
          icon: FileText, 
          badge: null 
        },
        { 
          id: "analytics", 
          label: "Analytics", 
          icon: TrendingUp, 
          badge: "AI" 
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
      items: [
        { 
          id: "staff", 
          label: "Staff Management", 
          icon: UserCheck, 
          badge: null 
        },
        { 
          id: "user-roles", 
          label: "User Roles", 
          icon: Users, 
          badge: null 
        },
        { 
          id: "audit-logs", 
          label: "Audit Logs", 
          icon: FileText, 
          badge: null 
        },
        { 
          id: "settings", 
          label: "Settings", 
          icon: Settings, 
          badge: null 
        }
      ]
    }
  ];

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
            <p className="text-xs text-muted-foreground">AI-Powered System</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="mb-4 sm:mb-6 p-2 sm:p-3 bg-accent/10 border border-accent/30 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-gradient-accent rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-accent">Welcome back!</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* AI Status */}
      <div className="mb-4 sm:mb-6 p-2 sm:p-3 bg-success/10 border border-success/30 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-success animate-pulse" />
          <span className="text-xs sm:text-sm font-medium text-success hidden sm:inline">AI Engine</span>
          <Badge variant="outline" className="border-success text-success text-xs">
            ACTIVE
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground hidden sm:block">
          Processing 47 data points for intelligent insights
        </p>
      </div>

      {/* Navigation Categories */}
      <nav className="space-y-1 sm:space-y-2 mb-6">
        {navigationCategories.map((category) => (
          <Collapsible
            key={category.id}
            open={expandedCategories.includes(category.id)}
            onOpenChange={() => toggleCategory(category.id)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between h-10 sm:h-12 px-2 sm:px-3 hover:bg-secondary/50"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <category.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm truncate hidden sm:block">
                    {category.label}
                  </span>
                </div>
                {expandedCategories.includes(category.id) ? 
                  <ChevronDown className="w-4 h-4 hidden sm:block" /> : 
                  <ChevronRight className="w-4 h-4 hidden sm:block" />
                }
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-1 ml-2 sm:ml-4">
              {category.items.map((item) => (
                <Button
                  key={item.id}
                  variant={currentView === item.id ? "default" : "ghost"}
                  className={`w-full justify-start h-8 sm:h-10 animate-fade-in ${
                    currentView === item.id 
                      ? "bg-gradient-primary text-white shadow-glow" 
                      : "hover:bg-secondary/50"
                  }`}
                  onClick={() => onNavigate(item.id)}
                >
                  <item.icon className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="flex-1 text-left text-xs sm:text-sm truncate hidden sm:block">
                    {item.label}
                  </span>
                  {item.badge && (
                    <Badge 
                      variant="secondary" 
                      className="bg-destructive text-destructive-foreground text-xs hidden sm:inline-flex ml-2"
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

      <Separator className="my-4" />

      {/* Logout Button */}
      <Button
        variant="outline"
        className="w-full justify-start h-10 sm:h-12 border-destructive/30 hover:bg-destructive/10 hover:border-destructive"
        onClick={handleLogout}
      >
        <LogOut className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0 text-destructive" />
        <span className="text-destructive text-xs sm:text-sm hidden sm:block">Sign Out</span>
      </Button>

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

export default NavigationEnhanced;