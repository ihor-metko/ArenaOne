'use client';

/**
 * Notification Store Initializer
 * 
 * Loads initial notifications from the API once on app startup.
 * After initial load, all notification updates come via WebSocket events
 * handled by GlobalSocketListener.
 * 
 * This component:
 * - Performs a single HTTP fetch on mount (for authenticated admin users)
 * - Populates the notification store with initial data
 * - Does NOT poll or listen to events (that's GlobalSocketListener's job)
 * - Does NOT trigger any side effects after initial load
 */

import { useEffect, useRef } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import type { AdminNotification } from '@/stores/useNotificationStore';

interface NotificationsResponse {
  notifications: AdminNotification[];
  totalCount: number;
  unreadCount: number;
  hasMore: boolean;
}

export function NotificationStoreInitializer() {
  const user = useUserStore(state => state.user);
  const isHydrated = useUserStore(state => state.isHydrated);
  const setNotifications = useNotificationStore(state => state.setNotifications);
  const setUnreadCount = useNotificationStore(state => state.setUnreadCount);
  const setLoading = useNotificationStore(state => state.setLoading);
  const setError = useNotificationStore(state => state.setError);
  
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only initialize once per session
    if (hasInitialized.current) return;
    
    // Wait for user store to hydrate
    if (!isHydrated) return;
    
    // Only load notifications for admin users
    if (!user || !user.isRoot) return;

    const loadInitialNotifications = async () => {
      hasInitialized.current = true;
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/admin/notifications');

        if (response.status === 401 || response.status === 403) {
          setError('Access denied. Admin privileges required.');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }

        const data: NotificationsResponse = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        setError(null);
        
        console.log('[NotificationStoreInitializer] Loaded initial notifications:', data.notifications.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notifications');
        console.error('[NotificationStoreInitializer] Failed to load notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialNotifications();
  }, [user, isHydrated, setNotifications, setUnreadCount, setLoading, setError]);

  // This component doesn't render anything
  return null;
}
