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
  admin: { label: 'Admin', icon: Shield, color: 'bg-destructive text-destructive-foreground' },
  manager: { label: 'Manager', icon: UserCheck, color: 'bg-primary text-primary-foreground' },
  supervisor: { label: 'Supervisor', icon: Users, color: 'bg-accent text-accent-foreground' },
  cashier: { label: 'Cashier', icon: ShoppingCart, color: 'bg-secondary text-secondary-foreground' },
};

const RoleSwitcher = () => {
  const { isActualAdmin, isPreviewMode, previewRole, role, setPreviewRole, clearPreviewRole } = usePermissions();

  // Only show for actual admins
  if (!isActualAdmin) return null;

  const roles: UserRole[] = ['admin', 'manager', 'supervisor', 'cashier'];
  const currentRoleConfig = role ? roleConfig[role] : null;
  const CurrentIcon = currentRoleConfig?.icon || Shield;

  return (
    <div className="flex items-center gap-2">
      {isPreviewMode && (
        <Badge variant="outline" className="border-warning text-warning bg-warning/10 animate-pulse">
          <Eye className="w-3 h-3 mr-1" />
          Preview Mode
        </Badge>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={isPreviewMode ? "outline" : "ghost"}
            size="sm"
            className={`h-8 gap-2 ${isPreviewMode ? 'border-warning text-warning hover:bg-warning/10' : ''}`}
          >
            <CurrentIcon className="w-4 h-4" />
            <span className="hidden sm:inline capitalize">{role}</span>
            {isPreviewMode && <Eye className="w-3 h-3" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview as Role
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {roles.map((r) => {
            const config = roleConfig[r];
            const Icon = config.icon;
            const isActive = previewRole === r || (!previewRole && role === r);
            
            return (
              <DropdownMenuItem
                key={r}
                onClick={() => r === 'admin' ? clearPreviewRole() : setPreviewRole(r)}
                className={`cursor-pointer ${isActive ? 'bg-secondary' : ''}`}
              >
                <Icon className="w-4 h-4 mr-2" />
                <span className="flex-1">{config.label}</span>
                {isActive && (
                  <Badge variant="secondary" className="text-xs">
                    {previewRole === r ? 'Previewing' : 'Current'}
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
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <EyeOff className="w-4 h-4 mr-2" />
                Exit Preview Mode
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default RoleSwitcher;
