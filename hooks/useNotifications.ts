/**
 * useNotifications Hook
 * 
 * React hook for managing notification state and providing real-time updates.
 * Handles notification subscriptions, marking as read, and unread counts.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToNotifications, markNotificationAsRead, getUnreadCount } from '../services/notificationService';
import { NotificationDocument } from '../types';

interface UseNotificationsReturn {
  /** Array of notifications sorted by creation date (newest first) */
  notifications: NotificationDocument[];
  /** Number of unread notifications */
  unreadCount: number;
  /** Whether notifications are loading */
  isLoading: boolean;
  /** Mark a notification as read */
  markAsRead: (notificationId: string) => Promise<void>;
}

/**
 * Hook to manage notification state with real-time updates
 * 
 * @example
 * ```tsx
 * const { notifications, unreadCount, markAsRead } = useNotifications();
 * 
 * return (
 *   <div>
 *     <p>You have {unreadCount} unread notifications</p>
 *     {notifications.map(notif => (
 *       <div key={notif.id} onClick={() => markAsRead(notif.id)}>
 *         {notif.title}
 *       </div>
 *     ))}
 *   </div>
 * );
 * ```
 */
export const useNotifications = (): UseNotificationsReturn => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDocument[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Subscribe to real-time notification updates
    const unsubscribe = subscribeToNotifications(user.uid, (newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(getUnreadCount(newNotifications));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  /**
   * Mark a specific notification as read
   * @param notificationId The ID of the notification to mark as read
   */
  const markAsRead = async (notificationId: string): Promise<void> => {
    if (!user) return;
    
    try {
      await markNotificationAsRead(user.uid, notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
  };
};
