import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'manager' | 'supervisor' | 'cashier';

interface PermissionsState {
  role: UserRole | null;
  isAdmin: boolean;
  isManager: boolean;
  isSupervisor: boolean;
  isCashier: boolean;
  loading: boolean;
  canManageProducts: boolean;
  canManageStaff: boolean;
  canManageSettings: boolean;
  canManageExpenses: boolean;
  canViewReports: boolean;
  canManageLoans: boolean;
  canProcessSales: boolean;
  canManageCustomers: boolean;
  canManageSuppliers: boolean;
}

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<PermissionsState>({
    role: null,
    isAdmin: false,
    isManager: false,
    isSupervisor: false,
    isCashier: false,
    loading: true,
    canManageProducts: false,
    canManageStaff: false,
    canManageSettings: false,
    canManageExpenses: false,
    canViewReports: false,
    canManageLoans: false,
    canProcessSales: false,
    canManageCustomers: false,
    canManageSuppliers: false,
  });

  useEffect(() => {
    loadPermissions();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadPermissions();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setPermissions({
          role: null,
          isAdmin: false,
          isManager: false,
          isSupervisor: false,
          isCashier: false,
          loading: false,
          canManageProducts: false,
          canManageStaff: false,
          canManageSettings: false,
          canManageExpenses: false,
          canViewReports: false,
          canManageLoans: false,
          canProcessSales: false,
          canManageCustomers: false,
          canManageSuppliers: false,
        });
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        console.error('Error loading user profile:', error);
        setPermissions(prev => ({ ...prev, loading: false }));
        return;
      }

      const role = profile.role as UserRole;
      const isAdmin = role === 'admin';
      const isManager = role === 'manager';
      const isSupervisor = role === 'supervisor';
      const isCashier = role === 'cashier';

      setPermissions({
        role,
        isAdmin,
        isManager,
        isSupervisor,
        isCashier,
        loading: false,
        // Admin can do everything
        canManageProducts: isAdmin || isManager || isSupervisor,
        canManageStaff: isAdmin,
        canManageSettings: isAdmin,
        canManageExpenses: isAdmin || isManager || isSupervisor,
        canViewReports: isAdmin || isManager || isSupervisor,
        canManageLoans: isAdmin || isManager || isSupervisor || isCashier,
        canProcessSales: isAdmin || isManager || isSupervisor || isCashier,
        canManageCustomers: isAdmin || isManager || isSupervisor || isCashier,
        canManageSuppliers: isAdmin || isManager || isSupervisor,
      });
    } catch (error) {
      console.error('Error loading permissions:', error);
      setPermissions(prev => ({ ...prev, loading: false }));
    }
  };

  return permissions;
};
