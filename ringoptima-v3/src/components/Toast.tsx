import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToastStore, type Toast as ToastType } from '../lib/toast';
import { cn } from '../lib/utils';

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colors = {
  success: 'bg-emerald-500/90 border-emerald-400/50',
  error: 'bg-red-500/90 border-red-400/50',
  info: 'bg-blue-500/90 border-blue-400/50',
  warning: 'bg-yellow-500/90 border-yellow-400/50',
};

function Toast({ toast }: { toast: ToastType }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const [isExiting, setIsExiting] = useState(false);
  const Icon = icons[toast.type];

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => removeToast(toast.id), 300);
  };

  useEffect(() => {
    const duration = toast.duration ?? 4000;
    const timer = setTimeout(() => handleClose(), duration);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl backdrop-blur-md border shadow-lg min-w-[320px] max-w-md',
        'transition-all duration-300 ease-out',
        colors[toast.type],
        isExiting ? 'translate-x-[120%] opacity-0' : 'translate-x-0 opacity-100'
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5 text-white" />
      <p className="flex-1 text-sm text-white leading-relaxed">{toast.message}</p>
      <button
        onClick={handleClose}
        className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
        aria-label="Stäng"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} />
        </div>
      ))}
    </div>
  );
}
