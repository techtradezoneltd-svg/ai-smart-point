import { SettingsProvider } from "@/contexts/SettingsContext";
import EnhancedPOSInterface from "@/components/EnhancedPOSInterface";

const POS = () => {
  return (
    <SettingsProvider>
      <EnhancedPOSInterface />
    </SettingsProvider>
  );
};

export default POS;
