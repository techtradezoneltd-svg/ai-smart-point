import { useState } from "react";
import NavigationEnhanced from "@/components/NavigationEnhanced";
import Dashboard from "@/components/Dashboard";
import POSInterface from "@/components/POSInterface";
import StockManagement from "@/components/StockManagement";
import ProductManagement from "@/components/ProductManagement";
import Analytics from "@/components/Analytics";
import SalesHistory from "@/components/SalesHistory";
import Reports from "@/components/Reports";
import Suppliers from "@/components/Suppliers";
import ExpenseManagement from "@/components/ExpenseManagement";
import StaffManagement from "@/components/StaffManagement";
import CategoryUnitManagement from "@/components/CategoryUnitManagement";
import Customers from "@/components/Customers";
import Settings from "@/components/Settings";
import AIVoiceAssistant from "@/components/AIVoiceAssistant";
import UserRoles from "@/components/UserRoles";
import AuditLogs from "@/components/AuditLogs";
import ReportsExport from "@/components/ReportsExport";
import NotificationCenter from "@/components/NotificationCenter";

const Index = () => {
  const [currentView, setCurrentView] = useState("dashboard");

  const renderCurrentView = () => {
    switch (currentView) {
      case "pos":
        return <POSInterface />;
      case "inventory":
        return <ProductManagement />;
      case "stock":
        return <StockManagement />;
      case "expenses":
        return <ExpenseManagement />;
      case "staff":
        return <StaffManagement />;
      case "categories":
        return <CategoryUnitManagement />;
      case "customers":
        return <Customers />;
      case "saleshistory":
        return <SalesHistory />;
      case "suppliers":
        return <Suppliers />;
      case "reports":
        return <Reports />;
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
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-bg">
      {currentView !== "pos" && (
        <NavigationEnhanced currentView={currentView} onNavigate={setCurrentView} />
      )}
      <div className={`flex-1 overflow-auto ${currentView === "pos" ? "p-4" : "p-2 sm:p-4 md:p-6"}`}>
        {renderCurrentView()}
      </div>
      <NotificationCenter />
    </div>
  );
};

export default Index;
