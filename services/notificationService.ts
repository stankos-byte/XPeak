/**
 * Notification Service
 * 
 * Handles all notification-related operations including:
 * - Subscribing to real-time notification updates
 * - Marking notifications as read
 * - Getting unread notification count
 */

import { query, orderBy, limit, onSnapshot, updateDoc, Unsubscribe } from 'firebase/firestore';
import { fbPaths } from './firebasePaths';
import { NotificationDocument } from '../types';

/**
 * Subscribe to real-time notification updates for a user
 * @param uid User ID
 * @param callback Function to call when notifications change
 * @returns Unsubscribe function to stop listening
 */
export const subscribeToNotifications = (
  uid: string,
  callback: (notifications: NotificationDocument[]) => void
): Unsubscribe => {
  const notificationsRef = fbPaths.notificationsCollection(uid);
  const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(50));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const notifications: NotificationDocument[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as NotificationDocument[];
      
      callback(notifications);
    },
    (error) => {
      console.error('Error listening to notifications:', error);
      callback([]);
    }
  );
};

/**
 * Mark a notification as read
 * @param uid User ID
 * @param notificationId Notification ID
 */
export const markNotificationAsRead = async (uid: string, notificationId: string): Promise<void> => {
  try {
    const notificationRef = fbPaths.notificationDoc(uid, notificationId);
    await updateDoc(notificationRef, { read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Get the count of unread notifications
 * @param notifications Array of notifications
 * @returns Number of unread notifications
 */
export const getUnreadCount = (notifications: NotificationDocument[]): number => {
  return notifications.filter(n => !n.read).length;
};

/**
 * Mark all notifications as read
 * @param uid User ID
 * @param notifications Array of current notifications
 */
export const markAllAsRead = async (uid: string, notifications: NotificationDocument[]): Promise<void> => {
  try {
    const unreadNotifications = notifications.filter(n => !n.read);
    const promises = unreadNotifications.map(n => markNotificationAsRead(uid, n.id));
    await Promise.all(promises);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};
