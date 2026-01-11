import { useState, useEffect } from "react";
import NavigationEnhanced from "@/components/NavigationEnhanced";
import Dashboard from "@/components/Dashboard";
import RoleDashboard from "@/components/RoleDashboard";
import EnhancedPOSInterface from "@/components/EnhancedPOSInterface";
import StockManagement from "@/components/StockManagement";
import ProductManagement from "@/components/ProductManagement";
import Analytics from "@/components/Analytics";
import SalesHistory from "@/components/SalesHistory";
import Reports from "@/components/Reports";
import AIReportingSystem from "@/components/AIReportingSystem";
import Suppliers from "@/components/Suppliers";
import ExpenseManagement from "@/components/ExpenseManagement";
import CategoryUnitManagement from "@/components/CategoryUnitManagement";
import Customers from "@/components/Customers";
import LoanManagement from "@/components/LoanManagement";
import LoanReports from "@/components/LoanReports";
import LoanReminderTester from "@/components/LoanReminderTester";
import Settings from "@/components/Settings";
import AIVoiceAssistant from "@/components/AIVoiceAssistant";
import UserRoles from "@/components/UserRoles";
import AuditLogs from "@/components/AuditLogs";
import ReportsExport from "@/components/ReportsExport";
import NotificationCenter from "@/components/NotificationCenter";
import FloatingRoleSwitcher from "@/components/FloatingRoleSwitcher";
// AuthProvider is already in App.tsx - removed duplicate import
import { SettingsProvider } from "@/contexts/SettingsContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Loader2 } from "lucide-react";

// Permission mapping for each view
const viewPermissions: Record<string, { requiredPermission?: string; allowedRoles?: string[] }> = {
  dashboard: {},
  pos: { requiredPermission: "canProcessSales" },
  inventory: { requiredPermission: "canManageProducts" },
  stock: { requiredPermission: "canManageProducts" },
  categories: { requiredPermission: "canManageProducts" },
  customers: { requiredPermission: "canManageCustomers" },
  loans: { requiredPermission: "canManageLoans" },
  suppliers: { requiredPermission: "canManageSuppliers" },
  expenses: { requiredPermission: "canManageExpenses" },
  saleshistory: { requiredPermission: "canProcessSales" },
  reports: { requiredPermission: "canViewReports" },
  "reports-export": { requiredPermission: "canViewReports" },
  analytics: { requiredPermission: "canViewReports" },
  "ai-reporting": { requiredPermission: "canViewReports" },
  "loan-reports": { requiredPermission: "canViewReports" },
  "loan-tester": { allowedRoles: ["admin"] },
  "ai-voice": {},
  staff: { requiredPermission: "canManageStaff" },
  "user-roles": { allowedRoles: ["admin"] },
  "audit-logs": { allowedRoles: ["admin", "manager"] },
  settings: { requiredPermission: "canManageSettings" },
};

const AuthenticatedApp = () => {
  const [currentView, setCurrentView] = useState("dashboard");
  const permissions = usePermissions();

  // Check if user has access to the current view
  const hasAccessToView = (view: string): boolean => {
    if (permissions.loading) return true; // Don't redirect while loading
    
    const viewConfig = viewPermissions[view];
    if (!viewConfig) return true;

    // Check role-based access
    if (viewConfig.allowedRoles && permissions.role) {
      return viewConfig.allowedRoles.includes(permissions.role);
    }

    // Check permission-based access
    if (viewConfig.requiredPermission) {
      return (permissions as any)[viewConfig.requiredPermission] === true;
    }

    return true;
  };

  // Redirect to dashboard if user doesn't have access to current view
  useEffect(() => {
    if (!permissions.loading && !hasAccessToView(currentView)) {
      setCurrentView("dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, permissions.loading, permissions.role]);

  // Safe navigation that checks permissions
  const handleNavigate = (view: string) => {
    if (hasAccessToView(view)) {
      setCurrentView(view);
    } else {
      // Fallback to dashboard if no access
      setCurrentView("dashboard");
    }
  };

  const renderCurrentView = () => {
    // Double-check access before rendering
    if (!hasAccessToView(currentView)) {
      return <RoleDashboard onNavigate={handleNavigate} />;
    }

    switch (currentView) {
      case "pos":
        return <EnhancedPOSInterface onNavigate={handleNavigate} />;
      case "inventory":
        return <ProductManagement />;
      case "stock":
        return <StockManagement />;
      case "expenses":
        return <ExpenseManagement />;
      case "staff":
        return <UserRoles />;
      case "categories":
        return <CategoryUnitManagement />;
      case "customers":
        return <Customers />;
      case "loans":
        return <LoanManagement />;
      case "saleshistory":
        return <SalesHistory />;
      case "suppliers":
        return <Suppliers />;
      case "reports":
        return <Reports />;
      case "ai-reporting":
        return <AIReportingSystem />;
      case "loan-reports":
        return <LoanReports />;
      case "loan-tester":
        return <LoanReminderTester />;
      case "analytics":
        return <Analytics />;
      case "settings":
        return <Settings />;
      case "ai-voice":
        return <AIVoiceAssistant />;
      case "user-roles":
        return <UserRoles />;
      case "audit-logs":
        return <AuditLogs />;
      case "reports-export":
        return <ReportsExport />;
      default:
        return <RoleDashboard onNavigate={handleNavigate} />;
    }
  };

  if (permissions.loading) {
    return (
      <div className="flex min-h-screen bg-gradient-bg items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-bg">
      {currentView !== "pos" && (
        <NavigationEnhanced currentView={currentView} onNavigate={handleNavigate} />
      )}
      <div className={`flex-1 overflow-auto ${currentView === "pos" ? "p-4" : "p-2 sm:p-4 md:p-6"}`}>
        {renderCurrentView()}
      </div>
      <NotificationCenter />
      <FloatingRoleSwitcher />
    </div>
  );
};

const Index = () => {
  return (
    <SettingsProvider>
      <AuthenticatedApp />
    </SettingsProvider>
  );
};

export default Index;
