import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import {
  Upload,
  Download,
  LayoutDashboard,
  Search,
  Filter,
  BarChart3,
  Star,
  Phone,
  X,
  FileText,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: () => void;
  onExport: () => void;
  onToggleDashboard: () => void;
  onClearFilters: () => void;
  hasFilters: boolean;
  contactsCount: number;
}

interface CommandItem {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
  keywords?: string[];
  disabled?: boolean;
}

export function CommandPalette({
  open,
  onOpenChange,
  onImport,
  onExport,
  onToggleDashboard,
  onClearFilters,
  hasFilters,
  contactsCount,
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');

  // Reset search when opening
  useEffect(() => {
    if (open) {
      setSearch('');
    }
  }, [open]);

  const commands: CommandItem[] = [
    {
      id: 'import',
      label: 'Importera CSV-fil',
      icon: Upload,
      action: () => {
        onImport();
        onOpenChange(false);
      },
      keywords: ['import', 'csv', 'ladda', 'upload'],
    },
    {
      id: 'export',
      label: 'Exportera till CSV',
      icon: Download,
      action: () => {
        onExport();
        onOpenChange(false);
      },
      keywords: ['export', 'csv', 'ladda ner', 'download'],
      disabled: contactsCount === 0,
    },
    {
      id: 'dashboard',
      label: 'Växla Dashboard',
      icon: LayoutDashboard,
      action: () => {
        onToggleDashboard();
        onOpenChange(false);
      },
      keywords: ['dashboard', 'analytics', 'statistik', 'grafer'],
    },
    {
      id: 'clear-filters',
      label: 'Rensa filter',
      icon: Filter,
      action: () => {
        onClearFilters();
        onOpenChange(false);
      },
      keywords: ['rensa', 'clear', 'filter', 'reset'],
      disabled: !hasFilters,
    },
  ];

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-start justify-center pt-[20vh] p-4"
      onClick={() => onOpenChange(false)}
    >
      <Command
        className="glass rounded-3xl overflow-hidden w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        shouldFilter={false}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
          <Search className="w-5 h-5 text-white/60" />
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Sök kommando..."
            className="flex-1 bg-transparent border-0 outline-none text-white placeholder:text-white/50 text-lg"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex px-2 py-1 text-xs font-semibold text-white/60 bg-white/10 rounded border border-white/20">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <Command.List className="max-h-[400px] overflow-y-auto p-2">
          <Command.Empty className="py-12 text-center text-white/60">
            <div className="flex flex-col items-center gap-3">
              <FileText className="w-12 h-12 text-white/40" />
              <p className="text-sm">Inga kommandon hittades</p>
            </div>
          </Command.Empty>

          <Command.Group heading="Åtgärder" className="px-2 py-2">
            <div className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2 px-3">
              Åtgärder
            </div>
            {commands
              .filter((cmd) => {
                if (!search) return true;
                const searchLower = search.toLowerCase();
                return (
                  cmd.label.toLowerCase().includes(searchLower) ||
                  cmd.keywords?.some((kw) => kw.toLowerCase().includes(searchLower))
                );
              })
              .map((command) => (
                <Command.Item
                  key={command.id}
                  value={command.label}
                  onSelect={() => !command.disabled && command.action()}
                  disabled={command.disabled}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-150',
                    'data-[selected=true]:bg-white/15',
                    'hover:bg-white/10',
                    command.disabled && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <command.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{command.label}</div>
                  </div>
                  {command.id === 'import' && (
                    <kbd className="hidden sm:inline-flex px-2 py-1 text-xs font-semibold text-white/60 bg-white/10 rounded border border-white/20">
                      Enter
                    </kbd>
                  )}
                </Command.Item>
              ))}
          </Command.Group>
        </Command.List>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 text-xs text-white/50">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20">↓</kbd>
              Navigera
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20">Enter</kbd>
              Välj
            </span>
          </div>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20">ESC</kbd>
            Stäng
          </span>
        </div>
      </Command>
    </div>
  );
}
