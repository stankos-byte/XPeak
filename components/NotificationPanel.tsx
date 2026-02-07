import React from 'react';
import { Bell, AlertCircle, AlertTriangle, Info, CheckCircle, Trash2 } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationDocument } from '../types';
import { useNavigate } from 'react-router-dom';

const NotificationPanel: React.FC = () => {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = async (notification: NotificationDocument) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate to action URL if provided
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle size={20} className="text-red-400" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-yellow-400" />;
      case 'success':
        return <CheckCircle size={20} className="text-green-400" />;
      default:
        return <Info size={20} className="text-blue-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-500/10 border-red-500/30';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'success':
        return 'bg-green-500/10 border-green-500/30';
      default:
        return 'bg-blue-500/10 border-blue-500/30';
    }
  };

  const formatDateTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let relative = '';
    if (diffMins < 1) relative = 'Just now';
    else if (diffMins < 60) relative = `${diffMins}m ago`;
    else if (diffHours < 24) relative = `${diffHours}h ago`;
    else if (diffDays < 7) relative = `${diffDays}d ago`;
    else relative = date.toLocaleDateString();

    const time = date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    return { relative, full: time };
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
          Notifications
        </h1>
        <p className="text-secondary">
          {unreadCount > 0 ? (
            <>
              You have <span className="text-primary font-bold">{unreadCount}</span> unread{' '}
              {unreadCount === 1 ? 'notification' : 'notifications'}
            </>
          ) : (
            'All caught up!'
          )}
        </p>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="bg-surface border border-secondary/20 rounded-2xl p-16 text-center">
          <Bell size={64} className="mx-auto text-secondary/30 mb-4" />
          <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">
            No Notifications
          </h3>
          <p className="text-secondary text-sm">
            You're all set! New notifications will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const time = formatDateTime(notification.createdAt);
            return (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-surface border rounded-2xl p-5 transition-all cursor-pointer hover:border-primary/40 ${
                  !notification.read
                    ? 'border-primary/20 shadow-lg shadow-primary/5'
                    : 'border-secondary/20'
                }`}
              >
                <div className="flex gap-4">
                  {/* Severity Icon */}
                  <div className="flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-xl border flex items-center justify-center ${getSeverityColor(
                        notification.severity
                      )}`}
                    >
                      {getSeverityIcon(notification.severity)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3 className="text-base font-black text-white uppercase tracking-tight mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-secondary leading-relaxed">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <span className="flex-shrink-0 w-3 h-3 bg-primary rounded-full mt-1"></span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs text-secondary/70" title={time.full}>
                        {time.relative}
                      </span>
                      {notification.actionLabel && notification.actionUrl && (
                        <span className="text-xs text-primary font-medium hover:text-cyan-300 transition-colors">
                          {notification.actionLabel} →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
