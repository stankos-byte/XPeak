/**
 * Maintenance Page Component
 * 
 * Displays when the app is in maintenance mode.
 * Shows maintenance message from Firestore config.
 */

import React from 'react';
import { MaintenanceConfig } from '../types';

interface MaintenancePageProps {
  config?: MaintenanceConfig;
}

const MaintenancePage: React.FC<MaintenancePageProps> = ({ config }) => {
  const title = config?.title || 'Down for Maintenance';
  const subtitle = config?.subtitle || "We're making some improvements. Check back soon!";
  const scheduledDate = config?.date;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Icon */}
        <div style={styles.iconContainer}>
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={styles.icon}
          >
            {/* Wrench icon */}
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>

        {/* Title */}
        <h1 style={styles.title}>{title}</h1>

        {/* Subtitle */}
        <p style={styles.subtitle}>{subtitle}</p>

        {/* Scheduled completion date */}
        {scheduledDate && (
          <div style={styles.dateContainer}>
            <p style={styles.dateLabel}>Expected completion:</p>
            <p style={styles.dateValue}>
              {new Date(scheduledDate).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        )}

        {/* Refresh button */}
        <button
          onClick={() => window.location.reload()}
          style={styles.refreshButton}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={styles.refreshIcon}
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          Check Again
        </button>

        {/* Last updated */}
        {config?.lastUpdatedAt && (
          <p style={styles.lastUpdated}>
            Last updated:{' '}
            {new Date(config.lastUpdatedAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
};

// Inline styles for simplicity
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  content: {
    background: 'white',
    borderRadius: '20px',
    padding: '60px 40px',
    maxWidth: '600px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  iconContainer: {
    marginBottom: '30px',
    display: 'inline-block',
  },
  icon: {
    color: '#667eea',
    animation: 'rotate 3s linear infinite',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: '16px',
    marginTop: '0',
  },
  subtitle: {
    fontSize: '18px',
    color: '#4a5568',
    lineHeight: '1.6',
    marginBottom: '32px',
  },
  dateContainer: {
    background: '#f7fafc',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '32px',
    border: '1px solid #e2e8f0',
  },
  dateLabel: {
    fontSize: '14px',
    color: '#718096',
    marginBottom: '8px',
    marginTop: '0',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  dateValue: {
    fontSize: '16px',
    color: '#2d3748',
    margin: '0',
    fontWeight: '500',
  },
  refreshButton: {
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '14px 28px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
  },
  refreshIcon: {
    marginRight: '4px',
  },
  lastUpdated: {
    fontSize: '13px',
    color: '#a0aec0',
    marginTop: '32px',
    marginBottom: '0',
  },
};

// Add keyframe animation for the wrench icon
const styleSheet = document.styleSheets[0];
if (styleSheet) {
  try {
    styleSheet.insertRule(
      `@keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }`,
      styleSheet.cssRules.length
    );
  } catch (e) {
    // Ignore if animation already exists
  }
}

export default MaintenancePage;
