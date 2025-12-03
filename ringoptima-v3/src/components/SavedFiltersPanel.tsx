import { useState } from 'react';
import { Save, Bookmark, Trash2, Check, X } from 'lucide-react';
import { cn } from '../lib/utils';
import type { SavedFilter } from '../types';

interface SavedFiltersPanelProps {
  savedFilters: SavedFilter[];
  currentFilterActive: boolean;
  activeFilterId: number | null;
  onSave: (name: string) => void;
  onLoad: (filter: SavedFilter) => void;
  onDelete: (id: number) => void;
}

export function SavedFiltersPanel({
  savedFilters,
  currentFilterActive,
  activeFilterId,
  onSave,
  onLoad,
  onDelete,
}: SavedFiltersPanelProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [filterName, setFilterName] = useState('');

  const handleSave = () => {
    if (filterName.trim()) {
      onSave(filterName.trim());
      setFilterName('');
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Save Current Filter */}
      {currentFilterActive && (
        <div className="space-y-2">
          {!isSaving ? (
            <button
              onClick={() => setIsSaving(true)}
              className="w-full btn-premium p-3 rounded-xl flex items-center gap-3 font-semibold text-sm"
            >
              <Save className="w-4 h-4" />
              Spara aktuellt filter
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Namnge filter..."
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') {
                    setIsSaving(false);
                    setFilterName('');
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Spara
                </button>
                <button
                  onClick={() => {
                    setIsSaving(false);
                    setFilterName('');
                  }}
                  className="flex-1 btn-premium px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Avbryt
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saved Filters List */}
      {savedFilters.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-white/50 uppercase tracking-wide px-2">
            Sparade Filter
          </div>
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {savedFilters.map((filter) => (
              <div
                key={filter.id}
                className={cn(
                  'group flex items-center gap-2 p-3 rounded-xl transition-all duration-200',
                  'bg-white/5 hover:bg-white/10 border border-white/10',
                  activeFilterId === filter.id && 'bg-white/15 border-white/30'
                )}
              >
                <button
                  onClick={() => onLoad(filter)}
                  className="flex-1 flex items-center gap-3 text-left"
                >
                  <Bookmark className={cn(
                    'w-4 h-4 flex-shrink-0',
                    activeFilterId === filter.id ? 'fill-white text-white' : 'text-white/60'
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{filter.name}</div>
                    <div className="text-xs text-white/50">
                      {new Date(filter.createdAt).toLocaleDateString('sv-SE')}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => filter.id && onDelete(filter.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"
                  title="Radera filter"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {savedFilters.length === 0 && !isSaving && (
        <div className="text-center py-6 text-white/40 text-sm">
          <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-40" />
          Inga sparade filter ännu
        </div>
      )}
    </div>
  );
}
