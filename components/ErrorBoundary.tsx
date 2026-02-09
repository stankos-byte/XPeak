import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { DEBUG_FLAGS } from '../config/debugFlags';
import { captureException } from '../config/sentry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (DEBUG_FLAGS.errors) console.error('Uncaught error:', error, errorInfo);
    
    // Store error info for display
    this.setState({ errorInfo });
    
    // Report to Sentry (automatically handles prod check)
    captureException(error, {
      errorInfo,
      componentStack: errorInfo.componentStack,
      tags: { 
        component: 'ErrorBoundary',
        errorBoundary: true,
      },
    });
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center max-w-md px-6">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <AlertTriangle size={40} className="text-red-500" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-4 uppercase tracking-tighter italic">
              System Error Detected
            </h1>
            <p className="text-secondary mb-6 font-medium">
              An unexpected error occurred. Your data is safe. Please reload the application.
            </p>
            {this.state.error && (
              <details className="mb-6 text-left bg-surface border border-secondary/20 rounded-xl p-4">
                <summary className="text-xs font-black uppercase tracking-widest text-secondary cursor-pointer hover:text-primary transition-colors">
                  Technical Details
                </summary>
                <pre className="mt-3 text-xs text-red-400 overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button 
              onClick={() => window.location.reload()} 
              className="bg-primary hover:bg-cyan-400 text-background px-8 py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
