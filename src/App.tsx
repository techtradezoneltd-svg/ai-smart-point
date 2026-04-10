import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import POS from "./pages/POS";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import LoginForm from "@/components/LoginForm";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PermissionsProvider } from "@/contexts/PermissionsContext";

const queryClient = new QueryClient();

const AuthenticatedApp = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/pos" element={<POS />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <PermissionsProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthenticatedApp />
            </BrowserRouter>
          </PermissionsProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;