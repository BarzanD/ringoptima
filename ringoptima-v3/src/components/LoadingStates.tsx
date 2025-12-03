import { cn } from '../lib/utils';

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass rounded-3xl overflow-hidden animate-in fade-in duration-300">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="text-left p-3 font-semibold text-xs">Företag</th>
              <th className="text-left p-3 font-semibold text-xs">Kontakt</th>
              <th className="text-left p-3 font-semibold text-xs">Nummer</th>
              <th className="text-left p-3 font-semibold text-xs">Användare</th>
              <th className="text-left p-3 font-semibold text-xs">Operatör</th>
              <th className="text-left p-3 font-semibold text-xs">Status</th>
              <th className="text-left p-3 font-semibold text-xs">Prioritet</th>
              <th className="text-right p-3 font-semibold text-xs">Åtgärder</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {Array.from({ length: rows }).map((_, idx) => (
              <tr key={idx} className="animate-pulse">
                <td className="p-3">
                  <div className="h-4 bg-white/10 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-white/5 rounded w-20"></div>
                </td>
                <td className="p-3">
                  <div className="h-4 bg-white/10 rounded w-28 mb-2"></div>
                  <div className="h-3 bg-white/5 rounded w-24"></div>
                </td>
                <td className="p-3">
                  <div className="h-3 bg-white/10 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-white/5 rounded w-24"></div>
                </td>
                <td className="p-3">
                  <div className="h-3 bg-white/10 rounded w-20"></div>
                </td>
                <td className="p-3">
                  <div className="h-3 bg-white/10 rounded w-16"></div>
                </td>
                <td className="p-3">
                  <div className="h-6 bg-white/10 rounded-full w-20"></div>
                </td>
                <td className="p-3">
                  <div className="h-5 w-5 bg-white/10 rounded"></div>
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1">
                    <div className="h-7 w-7 bg-white/10 rounded"></div>
                    <div className="h-7 w-7 bg-white/10 rounded"></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div
          key={idx}
          className="relative w-full p-5 rounded-2xl backdrop-blur-sm border border-white/25 bg-white/10"
        >
          <div className="h-8 bg-white/20 rounded w-16 mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-24"></div>
        </div>
      ))}
    </div>
  );
}

export function ImportProgress({ progress, fileName }: { progress: number; fileName: string }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="glass rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          </div>
          <h3 className="text-xl font-bold mb-2">Importerar kontakter</h3>
          <p className="text-white/70 text-sm mb-6">{fileName}</p>

          {/* Progress Bar */}
          <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>

          <p className="text-xs text-white/60">{Math.round(progress)}% slutfört</p>
        </div>
      </div>
    </div>
  );
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={cn(
      'border-white/20 border-t-white rounded-full animate-spin',
      sizeClasses[size]
    )}></div>
  );
}

export function InitialLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-xl border border-white/30 shadow-xl">
          <LoadingSpinner size="lg" />
        </div>
        <h2 className="text-3xl font-bold mb-2 animate-pulse">Ringoptima V3</h2>
        <p className="text-white/70">Laddar dina kontakter...</p>
      </div>
    </div>
  );
}
