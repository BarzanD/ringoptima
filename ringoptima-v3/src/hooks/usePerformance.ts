/**
 * 🚀 PERFORMANCE HOOKS
 * Memoization och optimering för att undvika onödiga re-renders
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { Contact } from '../types';

/**
 * useDebounce - Förhindrar för många uppdateringar vid snabb input
 * @param value - Värdet som ska debouncas
 * @param delay - Fördröjning i ms (default: 300ms)
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useMemoizedFilter - Memoized kontaktfiltrering
 * Förhindrar O(n) beräkningar på varje render
 */
export function useMemoizedFilter(
  contacts: Contact[],
  searchTerm: string,
  operator: string,
  status: string,
  priority: string,
  sortBy: string
) {
  const debouncedSearch = useDebounce(searchTerm, 300);

  return useMemo(() => {
    let filtered = contacts.filter((contact) => {
      // Search filter - använd debounced värde
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const matchesName = contact.name.toLowerCase().includes(searchLower);
        const matchesOrg = contact.org.toLowerCase().includes(searchLower);
        const matchesPhone = contact.phones.includes(debouncedSearch);

        if (!matchesName && !matchesOrg && !matchesPhone) {
          return false;
        }
      }

      // Operator filter
      if (operator) {
        const ops = contact.operators.toLowerCase();
        if (operator === 'telia' && !ops.includes('telia')) return false;
        if (operator === 'tele2' && !ops.includes('tele2')) return false;
        if (operator === 'tre' && !ops.includes('hi3g')) return false;
        if (operator === 'telenor' && !ops.includes('telenor')) return false;
        if (operator === 'other') {
          const hasKnown =
            ops.includes('telia') ||
            ops.includes('tele2') ||
            ops.includes('hi3g') ||
            ops.includes('telenor');
          if (hasKnown) return false;
        }
      }

      // Status filter
      if (status && contact.status !== status) return false;

      // Priority filter
      if (priority && contact.priority !== priority) return false;

      return true;
    });

    // Sorting
    if (sortBy === 'phones-desc') {
      filtered = [...filtered].sort((a, b) => {
        const aCount = a.phones.split('\n').filter(p => p.trim()).length;
        const bCount = b.phones.split('\n').filter(p => p.trim()).length;
        return bCount - aCount;
      });
    } else if (sortBy === 'phones-asc') {
      filtered = [...filtered].sort((a, b) => {
        const aCount = a.phones.split('\n').filter(p => p.trim()).length;
        const bCount = b.phones.split('\n').filter(p => p.trim()).length;
        return aCount - bCount;
      });
    }

    return filtered;
  }, [contacts, debouncedSearch, operator, status, priority, sortBy]);
}

/**
 * useStableCallback - Förhindrar att callbacks skapar nya referenser
 * Användbart för att undvika onödiga re-renders av barn-komponenter
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback((...args: any[]) => {
    return callbackRef.current(...args);
  }, []) as T;
}

/**
 * useVirtualScroll - Virtual scrolling för stora listor
 * Renderar endast synliga rader för bättre prestanda
 */
export function useVirtualScroll<T>(
  items: T[],
  containerHeight: number,
  itemHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight);

    // Lägg till buffer för smoother scroll
    const buffer = 5;
    return {
      start: Math.max(0, startIndex - buffer),
      end: Math.min(items.length, endIndex + buffer),
    };
  }, [scrollTop, containerHeight, itemHeight, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
  };
}

