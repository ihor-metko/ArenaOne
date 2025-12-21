"use client";

import { useEffect, useCallback, useRef } from "react";
import { useNotificationStore, type AdminNotification } from "@/stores/useNotificationStore";

interface UseNotificationsOptions {
  enabled?: boolean;
  onNewNotification?: (notification: AdminNotification) => void;
}

interface UseNotificationsReturn {
  notifications: AdminNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

/**
 * Hook for accessing and managing notifications from the centralized store.
 * 
 * This hook is fully passive and:
 * - Reads notifications from the Zustand store (single source of truth)
 * - Does NOT fetch notifications (handled by NotificationStoreInitializer)
 * - Does NOT poll (relies on Socket.IO for real-time updates via GlobalSocketListener)
 * - Only provides methods to mark notifications as read (with API calls)
 * 
 * Notification flow:
 * 1. Initial load: NotificationStoreInitializer fetches on app startup
 * 2. Real-time updates: GlobalSocketListener handles WebSocket events
 * 3. UI updates: Components read from store and re-render automatically
 * 
 * @example
 * ```tsx
 * const { notifications, unreadCount, markAsRead } = useNotifications({
 *   onNewNotification: (notification) => {
 *     showToast(notification.summary);
 *   }
 * });
 * ```
 */
export function useNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const {
    enabled = true,
    onNewNotification,
  } = options;

  // Get state and actions from the notification store
  const notifications = useNotificationStore(state => state.notifications);
  const unreadCount = useNotificationStore(state => state.unreadCount);
  const loading = useNotificationStore(state => state.loading);
  const error = useNotificationStore(state => state.error);
  const markAsReadInStore = useNotificationStore(state => state.markAsRead);
  const markAllAsReadInStore = useNotificationStore(state => state.markAllAsRead);

  const onNewNotificationRef = useRef(onNewNotification);
  const previousNotificationIdsRef = useRef<Set<string>>(new Set());

  // Update the ref when callback changes
  useEffect(() => {
    onNewNotificationRef.current = onNewNotification;
  }, [onNewNotification]);

  // Detect new notifications and trigger callback
  useEffect(() => {
    if (!enabled) return;

    const currentIds = new Set(notifications.map(n => n.id));
    const previousIds = previousNotificationIdsRef.current;
    
    // Find notifications that are in current but not in previous
    const newNotificationIds = notifications
      .filter(n => !previousIds.has(n.id))
      .map(n => n.id);
    
    // Trigger callback for each new unread notification
    if (newNotificationIds.length > 0) {
      notifications.forEach(notification => {
        if (newNotificationIds.includes(notification.id) && !notification.read) {
          onNewNotificationRef.current?.(notification);
        }
      });
    }
    
    // Update the ref for next comparison
    previousNotificationIdsRef.current = currentIds;
  }, [notifications, enabled]);

  // Mark notification as read (API call + store update)
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      // Update store
      markAsReadInStore(notificationId);
    } catch (err) {
      throw err;
    }
  }, [markAsReadInStore]);

  // Mark all notifications as read (API call + store update)
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/notifications/mark-all-read", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to mark all as read");
      }

      // Update store
      markAllAsReadInStore();
    } catch (err) {
      throw err;
    }
  }, [markAllAsReadInStore]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
  };
}
