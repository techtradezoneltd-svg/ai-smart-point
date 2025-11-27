import { ReactNode } from 'react';
import { usePermissions, UserRole } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface RoleBasedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
}

/**
 * Component that restricts access based on user roles
 * Usage: <RoleBasedRoute allowedRoles={['admin', 'manager']}>...</RoleBasedRoute>
 */
export const RoleBasedRoute = ({ children, allowedRoles, fallback }: RoleBasedRouteProps) => {
  const permissions = usePermissions();

  if (permissions.loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!permissions.role || !allowedRoles.includes(permissions.role)) {
    return fallback || (
      <Card className="m-8 border-destructive">
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
          <p className="text-sm text-muted-foreground mt-2">
            Required roles: {allowedRoles.join(', ')}
          </p>
          <p className="text-sm text-muted-foreground">
            Your role: {permissions.role || 'None'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
