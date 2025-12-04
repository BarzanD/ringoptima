/**
 * 🎯 OPTIMIZED STAT CARD
 * Memoized för att förhindra re-render vid parent updates
 */

import { memo } from 'react';
import { cn } from '../lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  onClick?: () => void;
  active?: boolean;
}

function StatCardComponent({ label, value, color, onClick, active = false }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-full p-2.5 rounded-xl transition-all duration-200 text-left",
        color,
        "backdrop-blur-sm border border-white/25",
        onClick && "cursor-pointer hover:bg-white/20",
        active && "ring-2 ring-white/70 shadow-lg"
      )}
      aria-label={`${label}: ${value}`}
      aria-pressed={active}
      disabled={!onClick}
    >
      {/* Content */}
      <div className="relative">
        <div className="text-xl font-bold mb-0.5">{value}</div>
        <div className="text-[10px] font-semibold text-white/80 uppercase tracking-wide">{label}</div>
      </div>

      {/* Active indicator */}
      {active && (
        <div className="absolute top-2 right-2" aria-hidden="true">
          <div className="w-2 h-2 rounded-full bg-white shadow-md" />
        </div>
      )}
    </button>
  );
}

// Memoize för att förhindra onödiga re-renders
export const StatCard = memo(StatCardComponent);
