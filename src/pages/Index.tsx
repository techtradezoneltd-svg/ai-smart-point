import { useState } from "react";
import Navigation from "@/components/Navigation";
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
        return (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Settings Coming Soon</h2>
            <p className="text-muted-foreground">Advanced AI configuration and system settings</p>
          </div>
        );
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-bg">
      <Navigation currentView={currentView} onNavigate={setCurrentView} />
      <div className="flex-1 p-6 overflow-auto">
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default Index;
