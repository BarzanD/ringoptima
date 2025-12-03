import { useEffect, useState, useRef } from 'react';
import { Phone, Upload, Download, Search, Filter, BarChart3, Menu, X, Star, ArrowUpDown, LayoutDashboard, LayoutGrid, LayoutList } from 'lucide-react';
import { db } from './lib/supabase';
import { useStore } from './lib/store';
import { parseCSV, transformCSV, exportToCSV } from './lib/csv';
import { cn, formatDate, getStatusColor, getPriorityColor, downloadFile } from './lib/utils';
import { ToastContainer } from './components/Toast';
import { Dashboard } from './components/Dashboard';
import { CommandPalette } from './components/CommandPalette';
import { ContactDetailModal } from './components/ContactDetailModal';
import { ContactCard } from './components/ContactCard';
import { SavedFiltersPanel } from './components/SavedFiltersPanel';
import { InitialLoadingScreen, TableSkeleton, StatsSkeleton, ImportProgress } from './components/LoadingStates';
import { toast } from './lib/toast';
import type { Contact, SavedFilter } from './types';

function App() {
  const { contacts, batches, filter, setContacts, setBatches, setFilter, resetFilter } = useStore();
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importFileName, setImportFileName] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showDashboard, setShowDashboard] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<number>>(new Set());
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [activeFilterId, setActiveFilterId] = useState<number | null>(null);
  const [loggingContactId, setLoggingContactId] = useState<number | null>(null);
  const [logNote, setLogNote] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [authenticated, setAuthenticated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize auth and load data on mount
  useEffect(() => {
    initAuth();
  }, []);

  // Command palette keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function initAuth() {
    setLoading(true);
    try {
      // Check if user is already authenticated
      const user = await db.getCurrentUser();

      if (!user) {
        // Sign in anonymously if not authenticated
        await db.signInAnonymously();
        toast.success('Ansluten! Din data synkas nu mellan enheter.');
      }

      setAuthenticated(true);
      await loadData();
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Kunde inte ansluta. Kontrollera din Supabase-konfiguration.');
      setLoading(false);
    }
  }

  async function loadData() {
    try {
      const [contactsData, batchesData, savedFiltersData] = await Promise.all([
        db.getAllContacts(),
        db.getAllBatches(),
        db.getAllSavedFilters(),
      ]);
      setContacts(contactsData);
      setBatches(batchesData);
      setSavedFilters(savedFiltersData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Kunde inte ladda data från servern.');
    } finally {
      setLoading(false);
    }
  }

  // Import CSV
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportFileName(file.name);
    setImportProgress(0);

    try {
      // Simulate progress for reading file
      setImportProgress(10);
      const text = await file.text();

      setImportProgress(30);
      const rows = parseCSV(text);

      setImportProgress(50);
      const batchId = await db.addBatch({
        name: file.name,
        fileName: file.name,
        count: rows.length - 1,
        createdAt: new Date().toISOString(),
      });

      setImportProgress(70);
      const newContacts = transformCSV(rows, batchId);

      setImportProgress(85);
      await db.addContacts(newContacts);

      setImportProgress(95);
      await loadData();

      setImportProgress(100);

      // Brief delay to show 100% before closing
      setTimeout(() => {
        setImporting(false);
        toast.success(`${newContacts.length} kontakter importerade från ${file.name}`);
      }, 500);
    } catch (error) {
      console.error('Import error:', error);
      setImporting(false);
      toast.error('CSV-import misslyckades. Kontrollera filformatet.');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // Export CSV
  function handleExport() {
    const csvContent = exportToCSV(filteredContacts);
    downloadFile(csvContent, `ringoptima-export-${Date.now()}.csv`, 'text/csv;charset=utf-8');
    toast.success(`${filteredContacts.length} kontakter exporterade till CSV`);
  }

  // Delete contact
  async function handleDelete(id: number) {
    if (!confirm('Radera denna kontakt?')) return;
    await db.deleteContact(id);
    await loadData();
    toast.info('Kontakt raderad');
  }

  // Update contact status
  async function updateStatus(id: number, status: Contact['status']) {
    if (status === 'contacted') {
      // Open log dialog
      setLoggingContactId(id);
      setLogNote('');
    } else {
      await db.updateContact(id, { status });
      await loadData();
      toast.info('Status uppdaterad');
    }
  }

  // Save log note
  async function saveLogNote() {
    if (loggingContactId && logNote.trim()) {
      const contact = await db.getContact(loggingContactId);
      const existingNotes = contact?.notes || '';
      const timestamp = new Date().toLocaleString('sv-SE');
      const newNotes = existingNotes
        ? `${existingNotes}\n\n[${timestamp}]\n${logNote}`
        : `[${timestamp}]\n${logNote}`;

      await db.updateContact(loggingContactId, {
        status: 'contacted',
        notes: newNotes
      });
      setLoggingContactId(null);
      setLogNote('');
      await loadData();
      toast.success('Samtalsanteckning sparad');
    }
  }

  // Toggle priority
  async function togglePriority(id: number, currentPriority: Contact['priority']) {
    const newPriority = currentPriority === 'high' ? 'medium' : 'high';
    await db.updateContact(id, { priority: newPriority });
    await loadData();
    toast.info(`Prioritet ändrad till ${newPriority === 'high' ? 'hög' : 'medium'}`);
  }

  // Save contact from detail modal
  async function handleSaveContact(contact: Contact) {
    if (!contact.id) return;
    await db.updateContact(contact.id, contact);
    await loadData();
    setSelectedContact(null);
    toast.success('Kontakt uppdaterad');
  }

  // Saved filter handlers
  async function handleSaveFilter(name: string) {
    const savedFilter = {
      name,
      filter: { ...filter },
      createdAt: new Date().toISOString(),
    };
    const id = await db.addSavedFilter(savedFilter);
    const updatedFilters = await db.getAllSavedFilters();
    setSavedFilters(updatedFilters);
    setActiveFilterId(id);
    toast.success(`Filter "${name}" sparad`);
  }

  async function handleLoadFilter(savedFilter: SavedFilter) {
    setFilter(savedFilter.filter);
    setActiveFilterId(savedFilter.id || null);
    toast.info(`Filter "${savedFilter.name}" laddad`);
  }

  async function handleDeleteFilter(id: number) {
    await db.deleteSavedFilter(id);
    const updatedFilters = await db.getAllSavedFilters();
    setSavedFilters(updatedFilters);
    if (activeFilterId === id) setActiveFilterId(null);
    toast.info('Filter raderat');
  }

  // Check if current filter is active (has any filter values set)
  const currentFilterActive = !!(
    filter.search ||
    filter.operator ||
    filter.status ||
    filter.priority ||
    filter.sort
  );

  // Filter and sort contacts
  let filteredContacts = contacts.filter((c) => {
    // Search filter
    if (filter.search && !c.name.toLowerCase().includes(filter.search.toLowerCase()) &&
        !c.org.toLowerCase().includes(filter.search.toLowerCase()) &&
        !c.phones.includes(filter.search)) {
      return false;
    }

    // Operator filter
    if (filter.operator) {
      const ops = c.operators.toLowerCase();
      if (filter.operator === 'telia' && !ops.includes('telia sverige ab') && !ops.includes('telia sonera ab')) return false;
      if (filter.operator === 'tele2' && !ops.includes('tele2 sverige ab')) return false;
      if (filter.operator === 'tre' && !ops.includes('hi3g access ab')) return false;
      if (filter.operator === 'telenor' && !ops.includes('telenor sverige ab') && !ops.includes('telenor')) return false;
      if (filter.operator === 'other') {
        const hasKnown = ops.includes('telia') || ops.includes('tele2') || ops.includes('hi3g') || ops.includes('telenor');
        if (hasKnown) return false;
      }
    }

    // Status filter
    if (filter.status && c.status !== filter.status) return false;

    // Priority filter
    if (filter.priority && c.priority !== filter.priority) return false;

    return true;
  });

  // Sorting
  if (filter.sort === 'phones-desc') {
    filteredContacts = [...filteredContacts].sort((a, b) => {
      const aCount = a.phones.split('\n').filter(p => p.trim()).length;
      const bCount = b.phones.split('\n').filter(p => p.trim()).length;
      return bCount - aCount;
    });
  } else if (filter.sort === 'phones-asc') {
    filteredContacts = [...filteredContacts].sort((a, b) => {
      const aCount = a.phones.split('\n').filter(p => p.trim()).length;
      const bCount = b.phones.split('\n').filter(p => p.trim()).length;
      return aCount - bCount;
    });
  }

  // Statistik
  const stats = {
    total: contacts.length,
    nya: contacts.filter(c => c.status === 'new').length,
    intresserade: contacts.filter(c => c.status === 'interested').length,
    konverterade: contacts.filter(c => c.status === 'converted').length,
    logg: contacts.filter(c => c.notes && c.notes.trim()).length,
  };

  if (loading) {
    return <InitialLoadingScreen />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-80 glass border-r border-white/20 transform transition-transform duration-300",
        !sidebarOpen && "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="mb-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center backdrop-blur-xl border border-white/30 shadow-xl">
                <Phone className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Ringoptima</h1>
                <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">V3 Enterprise</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-3 mb-8">
            <StatCard
              label="Totalt"
              value={stats.total}
              color="bg-blue-500/20"
              onClick={() => setFilter({ status: '' })}
              active={filter.status === ''}
            />
            <StatCard
              label="Nya"
              value={stats.nya}
              color="bg-green-500/20"
              onClick={() => setFilter({ status: 'new' })}
              active={filter.status === 'new'}
            />
            <StatCard
              label="Intresserade"
              value={stats.intresserade}
              color="bg-yellow-500/20"
              onClick={() => setFilter({ status: 'interested' })}
              active={filter.status === 'interested'}
            />
            <StatCard
              label="Konverterade"
              value={stats.konverterade}
              color="bg-emerald-500/20"
              onClick={() => setFilter({ status: 'converted' })}
              active={filter.status === 'converted'}
            />
            <StatCard
              label="Logg"
              value={stats.logg}
              color="bg-purple-500/20"
              onClick={() => setFilter({ status: 'contacted' })}
              active={filter.status === 'contacted'}
            />
          </div>

          {/* Saved Filters */}
          <div className="mb-6">
            <SavedFiltersPanel
              savedFilters={savedFilters}
              currentFilterActive={currentFilterActive}
              activeFilterId={activeFilterId}
              onSave={handleSaveFilter}
              onLoad={handleLoadFilter}
              onDelete={handleDeleteFilter}
            />
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => setShowDashboard(!showDashboard)}
              className={cn(
                "w-full btn-premium p-3.5 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all",
                showDashboard && "bg-white/25 ring-2 ring-white/40"
              )}
            >
              <LayoutDashboard className="w-5 h-5" />
              {showDashboard ? 'Dölj Dashboard' : 'Visa Dashboard'}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full btn-premium p-3.5 rounded-xl flex items-center gap-3 font-semibold text-sm"
            >
              <Upload className="w-5 h-5" />
              Importera CSV
            </button>
            <button
              onClick={handleExport}
              disabled={contacts.length === 0}
              className="w-full btn-premium p-3.5 rounded-xl flex items-center gap-3 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              Exportera CSV
            </button>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-6 border-t border-white/10 text-xs text-white/60">
            <p>Byggd med React + TypeScript</p>
            <p>Drivs av IndexedDB</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        sidebarOpen ? "ml-80" : "ml-0"
      )}>
        {/* Header */}
        <header className="glass border-b border-white/20 p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg glass-hover"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Search */}
            <div className="flex-1 max-w-2xl relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                type="search"
                placeholder="Sök kontakter..."
                value={filter.search}
                onChange={(e) => setFilter({ search: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-11 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>

            {/* Filters */}
            <select
              value={filter.operator}
              onChange={(e) => setFilter({ operator: e.target.value })}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <option value="">Alla operatörer</option>
              <option value="telia">Telia</option>
              <option value="tele2">Tele2</option>
              <option value="tre">Tre</option>
              <option value="telenor">Telenor</option>
              <option value="other">Annan</option>
            </select>

            <select
              value={filter.status}
              onChange={(e) => setFilter({ status: e.target.value })}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <option value="">Alla statusar</option>
              <option value="new">Ny</option>
              <option value="contacted">Kontaktad</option>
              <option value="interested">Intresserad</option>
              <option value="not_interested">Ej intresserad</option>
              <option value="converted">Konverterad</option>
            </select>

            <select
              value={filter.sort}
              onChange={(e) => setFilter({ sort: e.target.value as any })}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <option value="">Sortera...</option>
              <option value="phones-desc">Flest nummer</option>
              <option value="phones-asc">Minst nummer</option>
            </select>

            {(filter.search || filter.status || filter.priority || filter.operator || filter.sort) && (
              <button
                onClick={resetFilter}
                className="p-2.5 rounded-lg glass-hover"
                title="Rensa filter"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-white/10 border border-white/20 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  "p-2 rounded transition-colors",
                  viewMode === 'table' ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
                )}
                title="Tabellvy"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={cn(
                  "p-2 rounded transition-colors",
                  viewMode === 'cards' ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
                )}
                title="Kortvy"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {showDashboard ? (
            <Dashboard contacts={contacts} />
          ) : filteredContacts.length === 0 ? (
            <div className="glass rounded-3xl p-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center">
                <Upload className="w-12 h-12" />
              </div>
              <h3 className="text-3xl font-bold mb-3">Inga kontakter än</h3>
              <p className="text-white/80 text-lg mb-8">Importera en CSV-fil för att komma igång</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-premium px-8 py-4 rounded-2xl font-bold text-base"
              >
                Importera CSV-fil
              </button>
            </div>
          ) : viewMode === 'cards' ? (
            /* Cards View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredContacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onStatusChange={(status) => updateStatus(contact.id!, status)}
                  onPriorityToggle={() => togglePriority(contact.id!, contact.priority)}
                  onCall={() => window.open(`tel:${contact.phones.split('\n')[0].replace(/[\s-]/g, '')}`)}
                  onDelete={() => handleDelete(contact.id!)}
                  onClick={() => setSelectedContact(contact)}
                />
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="glass rounded-3xl overflow-hidden">
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
                    {filteredContacts.map((contact) => (
                      <tr
                        key={contact.id}
                        className="hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => setSelectedContact(contact)}
                      >
                        <td className="p-3">
                          <div className="font-medium text-sm">{contact.name}</div>
                          <div className="text-xs text-white/60">{contact.city}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{contact.contact || '-'}</div>
                          <div className="text-xs text-white/60">{contact.role || '-'}</div>
                        </td>
                        <td className="p-3">
                          <MultiValueCell value={contact.phones} mono compact />
                        </td>
                        <td className="p-3">
                          <MultiValueCell value={contact.users} compact />
                        </td>
                        <td className="p-3">
                          <MultiValueCell value={contact.operators} compact />
                        </td>
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={contact.status}
                            onChange={(e) => updateStatus(contact.id!, e.target.value as Contact['status'])}
                            className={cn("px-2 py-1 rounded-full text-xs font-medium border-0", getStatusColor(contact.status))}
                          >
                            <option value="new">Ny</option>
                            <option value="contacted">Logga</option>
                            <option value="interested">Intresserad</option>
                            <option value="not_interested">Ej intresserad</option>
                            <option value="converted">Konverterad</option>
                          </select>
                        </td>
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => togglePriority(contact.id!, contact.priority)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title="Växla prioritet"
                          >
                            <Star
                              className={cn(
                                "w-4 h-4 transition-all",
                                contact.priority === 'high' ? "fill-yellow-400 text-yellow-400" : "text-white/40"
                              )}
                            />
                          </button>
                        </td>
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => window.open(`tel:${contact.phones.split('\n')[0].replace(/[\s-]/g, '')}`)}
                              className="p-1.5 rounded glass-hover text-green-400"
                              title="Ring"
                            >
                              <Phone className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(contact.id!)}
                              className="p-1.5 rounded glass-hover text-red-400"
                              title="Radera"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table footer */}
              <div className="border-t border-white/10 p-3 flex items-center justify-between text-xs text-white/70">
                <div>Visar {filteredContacts.length} av {contacts.length} kontakter</div>
                <div>{batches.length} importerade listor</div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Log Modal */}
      {loggingContactId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-3xl p-8 max-w-lg w-full shadow-xl">
            <h3 className="text-2xl font-bold mb-6">Logga samtalsanteckning</h3>
            <textarea
              value={logNote}
              onChange={(e) => setLogNote(e.target.value)}
              placeholder="Skriv din anteckning här..."
              className="w-full bg-white/10 border border-white/25 rounded-2xl p-4 text-white font-medium placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/15 min-h-[180px] resize-none"
              autoFocus
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={saveLogNote}
                className="flex-1 bg-green-500/30 hover:bg-green-500/40 text-white px-6 py-3.5 rounded-2xl font-bold transition-colors border border-white/20"
              >
                Spara
              </button>
              <button
                onClick={() => setLoggingContactId(null)}
                className="flex-1 btn-premium px-6 py-3.5 rounded-2xl font-bold"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onImport={() => fileInputRef.current?.click()}
        onExport={handleExport}
        onToggleDashboard={() => setShowDashboard(!showDashboard)}
        onClearFilters={resetFilter}
        hasFilters={!!(filter.search || filter.status || filter.priority || filter.operator || filter.sort)}
        contactsCount={contacts.length}
      />

      {/* Contact Detail Modal */}
      <ContactDetailModal
        contact={selectedContact}
        onClose={() => setSelectedContact(null)}
        onSave={handleSaveContact}
      />

      {/* Import Progress */}
      {importing && <ImportProgress progress={importProgress} fileName={importFileName} />}
    </div>
  );
}

// Multi-value Cell Component
function MultiValueCell({ value, mono = false, compact = false }: { value: string; mono?: boolean; compact?: boolean }) {
  let values = value.split('\n').filter(v => v.trim());

  // Format phone numbers - remove spaces and hyphens
  if (mono) {
    values = values.map(v => v.replace(/[\s-]/g, ''));
  }

  return (
    <div className={compact ? "space-y-0" : "space-y-0.5"}>
      {values.map((val, idx) => (
        <div key={idx} className={cn("text-xs leading-tight", mono && "font-mono")}>
          {val}
        </div>
      ))}
      {values.length === 0 && <span className="text-white/40 text-xs">-</span>}
    </div>
  );
}

// Stats Card Component - Optimized
function StatCard({
  label,
  value,
  color,
  onClick,
  active = false
}: {
  label: string;
  value: number;
  color: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-full p-5 rounded-2xl transition-all duration-200 text-left",
        color,
        "backdrop-blur-sm border border-white/25",
        onClick && "cursor-pointer hover:bg-white/20",
        active && "ring-2 ring-white/70 shadow-lg"
      )}
    >
      {/* Content */}
      <div className="relative">
        <div className="text-3xl font-bold mb-1">{value}</div>
        <div className="text-xs font-semibold text-white/80 uppercase tracking-wide">{label}</div>
      </div>

      {/* Active indicator */}
      {active && (
        <div className="absolute top-4 right-4">
          <div className="w-2.5 h-2.5 rounded-full bg-white shadow-md" />
        </div>
      )}
    </button>
  );
}

export default App;
