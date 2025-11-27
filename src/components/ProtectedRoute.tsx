import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: 'canManageProducts' | 'canManageStaff' | 'canManageSettings' | 
                        'canManageExpenses' | 'canViewReports' | 'canManageLoans' | 
                        'canProcessSales' | 'canManageCustomers' | 'canManageSuppliers';
  requiredRole?: 'admin' | 'manager' | 'supervisor' | 'cashier';
  fallback?: ReactNode;
}

export const ProtectedRoute = ({ 
  children, 
  requiredPermission, 
  requiredRole,
  fallback 
}: ProtectedRouteProps) => {
  const permissions = usePermissions();

  if (permissions.loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Check role-based access
  if (requiredRole && permissions.role !== requiredRole && !permissions.isAdmin) {
    return fallback || (
      <Card className="m-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You don't have permission to access this feature. Required role: <strong>{requiredRole}</strong>
          </p>
        </CardContent>
      </Card>
    );
  }

  // Check permission-based access
  if (requiredPermission && !permissions[requiredPermission]) {
    return fallback || (
      <Card className="m-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You don't have permission to access this feature.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
