import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  TrendingUp
} from "lucide-react";

interface NavigationProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

const Navigation = ({ currentView, onNavigate }: NavigationProps) => {
  const navigationItems = [
    { 
      id: "dashboard", 
      label: "Dashboard", 
      icon: LayoutDashboard, 
      badge: null 
    },
    { 
      id: "pos", 
      label: "Point of Sale", 
      icon: ShoppingCart, 
      badge: "AI" 
    },
    { 
      id: "inventory", 
      label: "Inventory", 
      icon: Package, 
      badge: "2" 
    },
    { 
      id: "customers", 
      label: "Customers", 
      icon: Users, 
      badge: null 
    },
    { 
      id: "saleshistory", 
      label: "Sales History", 
      icon: FileText, 
      badge: "NEW" 
    },
    { 
      id: "productcrm", 
      label: "Product CRM", 
      icon: Package, 
      badge: null 
    },
    { 
      id: "suppliers", 
      label: "Suppliers", 
      icon: Truck, 
      badge: null 
    },
    { 
      id: "reports", 
      label: "Reports", 
      icon: BarChart3, 
      badge: null 
    },
    { 
      id: "analytics", 
      label: "Analytics", 
      icon: TrendingUp, 
      badge: "AI" 
    },
    { 
      id: "settings", 
      label: "Settings", 
      icon: Settings, 
      badge: null 
    }
  ];

  return (
    <div className="bg-gradient-card border-r border-border w-64 min-h-screen p-6">
      {/* Logo/Brand */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-xl bg-gradient-primary bg-clip-text text-transparent">
              SmartPOS
            </h1>
            <p className="text-xs text-muted-foreground">AI-Powered</p>
          </div>
        </div>
      </div>

      {/* AI Status */}
      <div className="mb-6 p-3 bg-accent/10 border border-accent/30 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-accent">AI Engine</span>
          <Badge variant="outline" className="border-accent text-accent text-xs">
            ACTIVE
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Processing 47 data points for intelligent insights
        </p>
      </div>

      {/* Navigation Items */}
      <nav className="space-y-2">
        {navigationItems.map((item) => (
          <Button
            key={item.id}
            variant={currentView === item.id ? "default" : "ghost"}
            className={`w-full justify-start h-12 ${
              currentView === item.id 
                ? "bg-gradient-primary text-white shadow-glow" 
                : "hover:bg-secondary/50"
            }`}
            onClick={() => onNavigate(item.id)}
          >
            <item.icon className="w-5 h-5 mr-3" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <Badge 
                variant="secondary" 
                className="bg-destructive text-destructive-foreground text-xs"
              >
                {item.badge}
              </Badge>
            )}
          </Button>
        ))}
      </nav>

      {/* AI Insights Summary */}
      <div className="mt-8 p-4 bg-primary/10 border border-primary/30 rounded-lg">
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