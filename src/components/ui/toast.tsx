'use client';

import * as React from 'react';

type ToastType = 'default' | 'destructive';

interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  title,
  description,
  type = 'default',
  onDismiss,
}) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const baseStyles = 'flex items-center gap-2 rounded-lg border bg-white p-4 shadow-lg';
  const typeStyles = type === 'destructive' 
    ? 'bg-red-50 border-red-200 text-red-800' 
    : '';

  return (
    <div className={`${baseStyles} ${typeStyles}`}>
      <div className="flex-1">
        {title && <div className="font-medium">{title}</div>}
        {description && <div className="text-sm">{description}</div>}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="text-gray-500 hover:text-gray-700"
        aria-label="Dismiss toast"
      >
        ✕
      </button>
    </div>
  );
};

type ToastOptions = {
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number;
};

type ToastContextType = {
  showToast: (options: ToastOptions) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Array<ToastOptions & { id: string }>>([]);

  const showToast = React.useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((current) => [...current, { ...options, id }]);
  }, []);

  const dismissToast = React.useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const contextValue = React.useMemo(
    () => ({ showToast }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4 max-h-screen overflow-hidden">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            title={toast.title}
            description={toast.description}
            type={toast.type}
            onDismiss={dismissToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
