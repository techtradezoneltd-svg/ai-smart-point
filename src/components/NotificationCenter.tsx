import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, X, AlertTriangle, Info, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  urgent: boolean;
}

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load notifications from AI recommendations and low stock products
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const notificationsList: Notification[] = [];

      // Load AI recommendations as notifications
      const { data: recommendations } = await supabase
        .from('ai_recommendations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recommendations) {
        recommendations.forEach(rec => {
          notificationsList.push({
            id: rec.id,
            type: rec.priority === 'high' ? 'warning' : 'info',
            title: rec.title,
            message: rec.message,
            timestamp: new Date(rec.created_at || Date.now()),
            read: rec.is_read || false,
            urgent: rec.priority === 'high'
          });
        });
      }

      // Load low stock alerts
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('id, name, current_stock, min_stock_level')
        .eq('is_active', true)
        .not('min_stock_level', 'is', null)
        .limit(5);

      if (lowStockProducts) {
        lowStockProducts.forEach(product => {
          if (product.current_stock !== null && 
              product.min_stock_level !== null && 
              product.current_stock <= product.min_stock_level) {
            notificationsList.push({
              id: `stock-${product.id}`,
              type: product.current_stock === 0 ? 'error' : 'warning',
              title: 'Low Stock Alert',
              message: `${product.name} has only ${product.current_stock} units remaining`,
              timestamp: new Date(),
              read: false,
              urgent: product.current_stock === 0
            });
          }
        });
      }

      // Sort by timestamp (newest first)
      notificationsList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setNotifications(notificationsList.slice(0, 10));
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    // Set up real-time subscription for AI recommendations
    const channel = supabase
      .channel('notification-center')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ai_recommendations'
      }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const urgentCount = notifications.filter(n => !n.read && n.urgent).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-success" />;
      default:
        return <Info className="w-4 h-4 text-primary" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "error":
        return "border-destructive/30 bg-destructive/5";
      case "warning":
        return "border-warning/30 bg-warning/5";
      case "success":
        return "border-success/30 bg-success/5";
      default:
        return "border-primary/30 bg-primary/5";
    }
  };

  const markAsRead = async (id: string) => {
    // If it's an AI recommendation, update in database
    if (!id.startsWith('stock-')) {
      await supabase
        .from('ai_recommendations')
        .update({ is_read: true })
        .eq('id', id);
    }
    
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = async () => {
    // Update AI recommendations in database
    const aiRecIds = notifications
      .filter(n => !n.id.startsWith('stock-') && !n.read)
      .map(n => n.id);
    
    if (aiRecIds.length > 0) {
      await supabase
        .from('ai_recommendations')
        .update({ is_read: true })
        .in('id', aiRecIds);
    }
    
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!isOpen) {
    return (
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="relative"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 w-5 h-5 text-xs p-0 flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed top-4 right-4 w-96 max-h-[80vh] bg-gradient-card border-border shadow-elegant z-50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Notifications
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {unreadCount} new
            </Badge>
          )}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
        >
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {unreadCount > 0 && (
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {urgentCount > 0 && (
                <span className="text-destructive font-medium">
                  {urgentCount} urgent, 
                </span>
              )} {unreadCount} unread
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
            >
              Mark all read
            </Button>
          </div>
        )}

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border transition-all ${getNotificationColor(notification.type)} ${
                !notification.read ? "border-l-4" : ""
              } ${notification.urgent && !notification.read ? "ring-2 ring-destructive/20" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium truncate">
                      {notification.title}
                    </h4>
                    {notification.urgent && !notification.read && (
                      <Badge variant="destructive" className="text-xs">
                        URGENT
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(notification.timestamp)}
                    </span>
                    
                    <div className="flex gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="h-6 px-2 text-xs"
                        >
                          Mark read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissNotification(notification.id)}
                        className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {notifications.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No notifications</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;