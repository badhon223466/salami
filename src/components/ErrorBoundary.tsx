import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorDetails = '';
      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          errorDetails = JSON.stringify(parsed, null, 2);
        }
      } catch (e) {
        errorDetails = this.state.error?.message || 'Unknown error';
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
          <div className="glass-card p-8 max-w-2xl w-full text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="text-red-500 w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">কিছু একটা ভুল হয়েছে!</h1>
            <p className="text-slate-400 mb-8">
              দুঃখিত, অ্যাপ্লিকেশনটি লোড করার সময় একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।
            </p>
            
            {errorDetails && (
              <pre className="bg-slate-900 p-4 rounded-xl text-left text-xs text-red-400 overflow-auto max-h-48 mb-8 border border-red-500/20">
                <code>{errorDetails}</code>
              </pre>
            )}

            <button
              onClick={() => window.location.reload()}
              className="btn-primary flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={20} />
              <span>আবার চেষ্টা করুন</span>
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default ErrorBoundary;
