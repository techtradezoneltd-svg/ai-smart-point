import { useState } from "react";
import Navigation from "@/components/Navigation";
import Dashboard from "@/components/Dashboard";
import POSInterface from "@/components/POSInterface";
import Inventory from "@/components/Inventory";
import Customers from "@/components/Customers";
import Analytics from "@/components/Analytics";
import SalesHistory from "@/components/SalesHistory";
import ProductCRM from "@/components/ProductCRM";
import Reports from "@/components/Reports";
import Suppliers from "@/components/Suppliers";

const Index = () => {
  const [currentView, setCurrentView] = useState("dashboard");

  const renderCurrentView = () => {
    switch (currentView) {
      case "pos":
        return <POSInterface />;
      case "inventory":
        return <Inventory />;
      case "customers":
        return <Customers />;
      case "saleshistory":
        return <SalesHistory />;
      case "productcrm":
        return <ProductCRM />;
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
