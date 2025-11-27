import { supabase } from '@/integrations/supabase/client';

interface AuditLogParams {
  action: string;
  category: 'security' | 'financial' | 'inventory' | 'user_management' | 'settings' | 'sales' | 'system';
  details?: Record<string, any>;
  status?: 'success' | 'error' | 'warning';
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
}

export const useAuditLog = () => {
  const logAction = async ({
    action,
    category,
    details = {},
    status = 'success',
    risk_level = 'low'
  }: AuditLogParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No user found for audit logging');
        return;
      }

      // Get user profile to get role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', user.id)
        .single();

      await supabase.from('audit_logs').insert({
        user_id: user.id,
        user_email: profile?.email || user.email,
        user_role: profile?.role || 'unknown',
        action,
        category,
        details,
        status,
        risk_level,
        ip_address: null, // Could be enhanced with IP tracking
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  };

  return { logAction };
};
