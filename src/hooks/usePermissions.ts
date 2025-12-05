import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'manager' | 'supervisor' | 'cashier';

interface PermissionsState {
  role: UserRole | null;
  actualRole: UserRole | null; // The real role from database
  previewRole: UserRole | null; // The role being previewed (admin only)
  isAdmin: boolean;
  isActualAdmin: boolean; // Whether user is actually an admin
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
  isPreviewMode: boolean;
  setPreviewRole: (role: UserRole | null) => void;
  clearPreviewRole: () => void;
}

const calculatePermissions = (role: UserRole | null) => {
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isSupervisor = role === 'supervisor';
  const isCashier = role === 'cashier';

  return {
    isAdmin,
    isManager,
    isSupervisor,
    isCashier,
    canManageProducts: isAdmin || isManager || isSupervisor,
    canManageStaff: isAdmin,
    canManageSettings: isAdmin,
    canManageExpenses: isAdmin || isManager || isSupervisor,
    canViewReports: isAdmin || isManager || isSupervisor,
    canManageLoans: isAdmin || isManager || isSupervisor || isCashier,
    canProcessSales: isAdmin || isManager || isSupervisor || isCashier,
    canManageCustomers: isAdmin || isManager || isSupervisor || isCashier,
    canManageSuppliers: isAdmin || isManager || isSupervisor,
  };
};

export const usePermissions = () => {
  const [state, setState] = useState<Omit<PermissionsState, 'setPreviewRole' | 'clearPreviewRole'>>({
    role: null,
    actualRole: null,
    previewRole: null,
    isAdmin: false,
    isActualAdmin: false,
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
    isPreviewMode: false,
  });

  useEffect(() => {
    loadPermissions();

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
        setState(prev => ({
          ...prev,
          role: null,
          actualRole: null,
          previewRole: null,
          loading: false,
          isActualAdmin: false,
          isPreviewMode: false,
          ...calculatePermissions(null),
        }));
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        console.error('Error loading user profile:', error);
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      const actualRole = profile.role as UserRole;
      const isActualAdmin = actualRole === 'admin';

      setState(prev => {
        // If in preview mode, use the preview role; otherwise use actual role
        const effectiveRole = prev.previewRole && isActualAdmin ? prev.previewRole : actualRole;
        const isPreviewMode = prev.previewRole !== null && isActualAdmin;

        return {
          ...prev,
          role: effectiveRole,
          actualRole,
          isActualAdmin,
          loading: false,
          isPreviewMode,
          ...calculatePermissions(effectiveRole),
        };
      });
    } catch (error) {
      console.error('Error loading permissions:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const setPreviewRole = useCallback((role: UserRole | null) => {
    setState(prev => {
      if (!prev.isActualAdmin) return prev; // Only admins can preview

      const effectiveRole = role || prev.actualRole;
      const isPreviewMode = role !== null;

      return {
        ...prev,
        role: effectiveRole,
        previewRole: role,
        isPreviewMode,
        ...calculatePermissions(effectiveRole),
      };
    });
  }, []);

  const clearPreviewRole = useCallback(() => {
    setState(prev => {
      if (!prev.isActualAdmin) return prev;

      return {
        ...prev,
        role: prev.actualRole,
        previewRole: null,
        isPreviewMode: false,
        ...calculatePermissions(prev.actualRole),
      };
    });
  }, []);

  return {
    ...state,
    setPreviewRole,
    clearPreviewRole,
  };
};
