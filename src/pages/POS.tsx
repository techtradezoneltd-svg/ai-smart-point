import { SettingsProvider } from "@/contexts/SettingsContext";
import EnhancedPOSInterface from "@/components/EnhancedPOSInterface";

const POS = () => {
  return (
    <SettingsProvider>
      <div className="pos-brutalist min-h-screen">
        <EnhancedPOSInterface />
      </div>
    </SettingsProvider>
  );
};

export default POS;
