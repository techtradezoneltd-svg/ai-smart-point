import { useEffect } from "react";
import { SettingsProvider } from "@/contexts/SettingsContext";
import EnhancedPOSInterface from "@/components/EnhancedPOSInterface";

const POS = () => {
  useEffect(() => {
    // Tag the document so Radix-portaled content (dialogs, popovers, selects,
    // tooltips, dropdowns, toasts) can inherit the POS Brutalist typography
    // even though it renders outside the .pos-brutalist wrapper.
    document.body.classList.add("pos-brutalist-active");
    return () => {
      document.body.classList.remove("pos-brutalist-active");
    };
  }, []);

  return (
    <SettingsProvider>
      <div className="pos-brutalist min-h-screen">
        <EnhancedPOSInterface />
      </div>
    </SettingsProvider>
  );
};

export default POS;
