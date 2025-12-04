/**
 * 🎯 OPTIMIZED MULTI-VALUE CELL
 * Memoized för att förhindra re-render vid parent updates
 */

import { useState, memo } from 'react';
import { cn } from '../lib/utils';

interface MultiValueCellProps {
  value: string;
  mono?: boolean;
  compact?: boolean;
  dedupe?: boolean;
}

function MultiValueCellComponent({ value, mono = false, compact = false, dedupe = false }: MultiValueCellProps) {
  const [expanded, setExpanded] = useState(false);
  let values = value.split('\n').filter(v => v.trim());

  // Format phone numbers - remove spaces and hyphens
  if (mono) {
    values = values.map(v => v.replace(/[\s-]/g, ''));
  }

  // Remove duplicates if dedupe is true (only when collapsed)
  const displayValues = dedupe && !expanded ? Array.from(new Set(values)) : values;

  // Show only first item when collapsed
  const itemsToShow = expanded ? displayValues : displayValues.slice(0, 1);
  const remaining = displayValues.length - 1;

  return (
    <div className={compact ? "space-y-0" : "space-y-0.5"}>
      {itemsToShow.map((val, idx) => (
        <div key={idx} className={cn("text-xs leading-tight", mono && "font-mono")}>
          {val}
        </div>
      ))}
      {!expanded && remaining > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              setExpanded(true);
            }
          }}
          className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:outline-offset-2"
          aria-label={`Visa ${remaining} fler objekt`}
          aria-expanded="false"
        >
          (+{remaining})
        </button>
      )}
      {expanded && displayValues.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              setExpanded(false);
            }
          }}
          className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:outline-offset-2"
          aria-label="Dölj extra objekt"
          aria-expanded="true"
        >
          Dölj
        </button>
      )}
      {displayValues.length === 0 && <span className="text-white/40 text-xs">-</span>}
    </div>
  );
}

// Memoize för att förhindra onödiga re-renders
export const MultiValueCell = memo(MultiValueCellComponent);
