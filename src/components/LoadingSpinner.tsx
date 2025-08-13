import { Brain } from 'lucide-react';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Brain className="w-10 h-10 text-white animate-bounce" />
        </div>
        <h2 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          SmartPOS
        </h2>
        <p className="text-muted-foreground">Loading your intelligent POS system...</p>
        <div className="flex items-center justify-center gap-1 mt-4">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;