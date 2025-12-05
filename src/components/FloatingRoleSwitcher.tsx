import { usePermissions, UserRole } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, EyeOff, Shield, UserCheck, Users, ShoppingCart } from 'lucide-react';

const roleConfig: Record<UserRole, { label: string; icon: typeof Shield; color: string }> = {
  admin: { label: 'Admin', icon: Shield, color: 'bg-destructive' },
  manager: { label: 'Manager', icon: UserCheck, color: 'bg-primary' },
  supervisor: { label: 'Supervisor', icon: Users, color: 'bg-accent' },
  cashier: { label: 'Cashier', icon: ShoppingCart, color: 'bg-secondary' },
};

const FloatingRoleSwitcher = () => {
  const { isActualAdmin, isPreviewMode, previewRole, role, setPreviewRole, clearPreviewRole, loading } = usePermissions();

  // Only show for actual admins and after loading
  if (loading || !isActualAdmin) return null;

  const roles: UserRole[] = ['admin', 'manager', 'supervisor', 'cashier'];
  const currentRoleConfig = role ? roleConfig[role] : null;
  const CurrentIcon = currentRoleConfig?.icon || Shield;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className={`
              h-14 w-14 rounded-full shadow-lg transition-all duration-300
              ${isPreviewMode 
                ? 'bg-warning hover:bg-warning/90 text-warning-foreground animate-pulse' 
                : 'bg-gradient-primary hover:opacity-90 text-white'
              }
            `}
          >
            <div className="flex flex-col items-center">
              {isPreviewMode ? (
                <Eye className="w-6 h-6" />
              ) : (
                <CurrentIcon className="w-6 h-6" />
              )}
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" side="top" className="w-64 mb-2">
          <DropdownMenuLabel className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Role Preview Mode
            </div>
            {isPreviewMode && (
              <Badge variant="outline" className="border-warning text-warning text-xs">
                Active
              </Badge>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            Preview app as different roles
          </div>
          
          {roles.map((r) => {
            const config = roleConfig[r];
            const Icon = config.icon;
            const isActive = previewRole === r || (!previewRole && role === r);
            const isPreviewing = previewRole === r;
            
            return (
              <DropdownMenuItem
                key={r}
                onClick={() => r === 'admin' ? clearPreviewRole() : setPreviewRole(r)}
                className={`cursor-pointer gap-3 py-3 ${isActive ? 'bg-secondary' : ''}`}
              >
                <div className={`p-2 rounded-full ${config.color}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{config.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {r === 'admin' && 'Full system access'}
                    {r === 'manager' && 'Reports, products, expenses'}
                    {r === 'supervisor' && 'Products, sales, customers'}
                    {r === 'cashier' && 'POS and sales only'}
                  </div>
                </div>
                {isActive && (
                  <Badge variant="secondary" className="text-xs">
                    {isPreviewing ? 'Previewing' : 'You'}
                  </Badge>
                )}
              </DropdownMenuItem>
            );
          })}
          
          {isPreviewMode && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={clearPreviewRole}
                className="cursor-pointer text-destructive focus:text-destructive py-3"
              >
                <div className="p-2 rounded-full bg-destructive/10">
                  <EyeOff className="w-4 h-4 text-destructive" />
                </div>
                <div className="flex-1 ml-3">
                  <div className="font-medium">Exit Preview Mode</div>
                  <div className="text-xs text-muted-foreground">Return to admin view</div>
                </div>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Preview Mode Label */}
      {isPreviewMode && (
        <div className="absolute -top-8 right-0 whitespace-nowrap">
          <Badge className="bg-warning text-warning-foreground shadow-md">
            Viewing as {role}
          </Badge>
        </div>
      )}
    </div>
  );
};

export default FloatingRoleSwitcher;
