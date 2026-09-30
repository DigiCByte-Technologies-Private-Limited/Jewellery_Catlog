import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from './Button';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toast: (options: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: (options: Omit<ToastItem, 'id'>) => {
        console.warn('Toast outside ToastContainer:', options);
      },
    };
  }
  return ctx;
}

export function ToastContainer({ children }: { children?: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((options: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, ...options }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
          {toasts.map((t) => (
            <ToastMessage key={t.id} toast={t} onClose={() => removeToast(t.id)} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

function ToastMessage({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="text-green-500" />,
    error: <AlertCircle className="text-red-500" />,
    warning: <AlertTriangle className="text-amber-500" />,
    info: <Info className="text-blue-500" />
  };

  const bgs = {
    success: 'bg-white border-green-200',
    error: 'bg-white border-red-200',
    warning: 'bg-white border-amber-200',
    info: 'bg-white border-blue-200'
  };

  return (
    <div className={cn("pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-lg transition-all", bgs[toast.type])}>
      <div className="shrink-0">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-slate-900">{toast.title}</h4>
        {toast.message && <p className="text-sm text-slate-600 mt-1">{toast.message}</p>}
      </div>
      <button onClick={onClose} className="shrink-0 text-slate-400 hover:text-slate-600">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
