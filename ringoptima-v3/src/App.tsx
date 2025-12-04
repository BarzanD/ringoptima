import { useEffect, useState, useRef, useMemo, lazy, Suspense } from 'react';
import { Phone, Upload, Download, Search, Menu, X, Star, LayoutDashboard, LayoutGrid, LayoutList, FolderOpen, ChevronRight } from 'lucide-react';
import { db } from './lib/db';
import { useStore } from './lib/store';
import { parseCSV, transformCSV, exportToCSV } from './lib/csv';
import { cn, getStatusColor, downloadFile } from './lib/utils';
import { ToastContainer } from './components/Toast';
import { SavedFiltersPanel } from './components/SavedFiltersPanel';
import { InitialLoadingScreen, ImportProgress } from './components/LoadingStates';
import { MultiValueCell } from './components/MultiValueCell';
import { StatCard } from './components/StatCard';
import { useVirtualScroll, useDebounce } from './hooks/usePerformance';
import { MobileNav, MobileHeader, MobileContactCard } from './components/MobileNav';

// CODE SPLITTING: Lazy load komponenter som inte behövs vid första render
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const CommandPalette = lazy(() => import('./components/CommandPalette').then(m => ({ default: m.CommandPalette })));
const ContactDetailModal = lazy(() => import('./components/ContactDetailModal').then(m => ({ default: m.ContactDetailModal })));
const ContactCard = lazy(() => import('./components/ContactCard').then(m => ({ default: m.ContactCard })));
import { toast } from './lib/toast';
import type { Contact, SavedFilter } from './types';

// Virtual scrolling constants
const ROW_HEIGHT = 72; // Approximate row height in pixels
const TABLE_HEIGHT = 600; // Visible table height

// Hook för att detektera mobil
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

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
  const [_selectedContactIds, _setSelectedContactIds] = useState<Set<number>>(new Set());
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [activeFilterId, setActiveFilterId] = useState<number | null>(null);
  const [loggingContactId, setLoggingContactId] = useState<number | null>(null);
  const [logNote, setLogNote] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [_authenticated, setAuthenticated] = useState(false);
  const [showListorPanel, setShowListorPanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mobile state
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<'contacts' | 'dashboard' | 'lists' | 'search'>('contacts');

  // PERFORMANCE: Debounce search input för att undvika omfiltrering vid varje tangenttryckning
  const debouncedSearch = useDebounce(filter.search, 300);

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
      // IndexedDB kräver ingen autentisering
      setAuthenticated(true);
      await loadData();
      toast.success('Ringoptima V3 laddad! Data lagras lokalt i webbläsaren.');
    } catch (error) {
      console.error('Init error:', error);
      toast.error('Kunde inte ladda applikationen.');
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
      const totalRows = rows.length - 1; // Exkludera header
      const batchId = await db.addBatch({
        name: file.name,
        fileName: file.name,
        count: totalRows,
        createdAt: new Date().toISOString(),
      });

      setImportProgress(70);
      const newContacts = transformCSV(rows, batchId);
      const importedCount = newContacts.length;
      const skippedCount = totalRows - importedCount;

      setImportProgress(85);
      await db.addContacts(newContacts);

      setImportProgress(95);
      await loadData();

      setImportProgress(100);

      // Brief delay to show 100% before closing
      setTimeout(() => {
        setImporting(false);
        if (skippedCount > 0) {
          toast.success(`${importedCount} kontakter importerade från ${file.name}. ${skippedCount} rader hoppades över (saknar telefonnummer eller firmatecknare).`);
        } else {
          toast.success(`${importedCount} kontakter importerade från ${file.name}`);
        }
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

  // MEMOIZED: Filter and sort contacts - förhindrar O(n) beräkningar på varje render
  const filteredContacts = useMemo(() => {
    let result = contacts.filter((c) => {
      // Search filter - använder debounced värde för bättre prestanda
      if (debouncedSearch && !c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) &&
          !c.org.toLowerCase().includes(debouncedSearch.toLowerCase()) &&
          !c.phones.includes(debouncedSearch)) {
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
      result = [...result].sort((a, b) => {
        const aCount = a.phones.split('\n').filter(p => p.trim()).length;
        const bCount = b.phones.split('\n').filter(p => p.trim()).length;
        return bCount - aCount;
      });
    } else if (filter.sort === 'phones-asc') {
      result = [...result].sort((a, b) => {
        const aCount = a.phones.split('\n').filter(p => p.trim()).length;
        const bCount = b.phones.split('\n').filter(p => p.trim()).length;
        return aCount - bCount;
      });
    }

    return result;
  }, [contacts, debouncedSearch, filter.operator, filter.status, filter.priority, filter.sort]);

  // MEMOIZED: Statistik - förhindrar omräkning vid varje render
  const stats = useMemo(() => ({
    total: contacts.length,
    nya: contacts.filter(c => c.status === 'new').length,
    intresserade: contacts.filter(c => c.status === 'interested').length,
    konverterade: contacts.filter(c => c.status === 'converted').length,
    logg: contacts.filter(c => c.notes && c.notes.trim()).length,
  }), [contacts]);

  // VIRTUAL SCROLLING: Renderar endast synliga rader för 60fps scroll
  const {
    visibleItems: visibleContacts,
    totalHeight,
    offsetY,
    onScroll: handleTableScroll,
  } = useVirtualScroll(filteredContacts, TABLE_HEIGHT, ROW_HEIGHT);

  if (loading) {
    return <InitialLoadingScreen />;
  }

  // MOBILE VIEW
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Mobile Header */}
        <MobileHeader
          title={
            mobileTab === 'contacts' ? 'Kontakter' :
            mobileTab === 'dashboard' ? 'Dashboard' :
            mobileTab === 'lists' ? 'Listor' : 'Sök'
          }
          subtitle={mobileTab === 'contacts' ? `${filteredContacts.length} av ${contacts.length}` : undefined}
        />

        {/* Mobile Search (shown when search tab is active) */}
        {mobileTab === 'search' && (
          <div className="mobile-search">
            <Search className="mobile-search-icon" />
            <input
              type="search"
              placeholder="Sök kontakter..."
              value={filter.search}
              onChange={(e) => setFilter({ search: e.target.value })}
              className="mobile-search-input"
              autoFocus
            />
          </div>
        )}

        {/* Mobile Filters (shown on contacts and search tabs) */}
        {(mobileTab === 'contacts' || mobileTab === 'search') && (
          <div className="mobile-filters">
            <button
              onClick={() => setFilter({ status: '' })}
              className={cn("mobile-filter-chip", !filter.status && "active")}
            >
              Alla
            </button>
            <button
              onClick={() => setFilter({ status: 'new' })}
              className={cn("mobile-filter-chip", filter.status === 'new' && "active")}
            >
              Nya ({stats.nya})
            </button>
            <button
              onClick={() => setFilter({ status: 'interested' })}
              className={cn("mobile-filter-chip", filter.status === 'interested' && "active")}
            >
              Intresserade ({stats.intresserade})
            </button>
            <button
              onClick={() => setFilter({ status: 'contacted' })}
              className={cn("mobile-filter-chip", filter.status === 'contacted' && "active")}
            >
              Kontaktade
            </button>
            <button
              onClick={() => setFilter({ status: 'converted' })}
              className={cn("mobile-filter-chip", filter.status === 'converted' && "active")}
            >
              Konverterade ({stats.konverterade})
            </button>
          </div>
        )}

        {/* Mobile Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-24">
          {/* Contacts Tab */}
          {(mobileTab === 'contacts' || mobileTab === 'search') && (
            <>
              {filteredContacts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                    <Upload className="w-10 h-10 text-white/40" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Inga kontakter</h3>
                  <p className="text-white/60 mb-6">Ladda upp en CSV-fil för att börja</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-premium px-6 py-3 rounded-xl font-semibold"
                  >
                    Importera CSV
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredContacts.map((contact) => (
                    <MobileContactCard
                      key={contact.id}
                      contact={contact}
                      onClick={() => setSelectedContact(contact)}
                      onCall={() => window.open(`tel:${contact.phones.split('\n')[0].replace(/[\s-]/g, '')}`)}
                      onStatusChange={(status) => updateStatus(contact.id!, status as Contact['status'])}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Dashboard Tab */}
          {mobileTab === 'dashboard' && (
            <Suspense fallback={<div className="text-center py-12 animate-pulse">Laddar Dashboard...</div>}>
              <div className="mobile-stats-grid mb-6">
                <div className="mobile-stat-card">
                  <div className="mobile-stat-value">{stats.total}</div>
                  <div className="mobile-stat-label">Totalt</div>
                </div>
                <div className="mobile-stat-card">
                  <div className="mobile-stat-value">{stats.nya}</div>
                  <div className="mobile-stat-label">Nya</div>
                </div>
                <div className="mobile-stat-card">
                  <div className="mobile-stat-value">{stats.intresserade}</div>
                  <div className="mobile-stat-label">Intresserade</div>
                </div>
                <div className="mobile-stat-card">
                  <div className="mobile-stat-value">{stats.konverterade}</div>
                  <div className="mobile-stat-label">Konverterade</div>
                </div>
              </div>
              <Dashboard contacts={contacts} />
            </Suspense>
          )}

          {/* Lists Tab */}
          {mobileTab === 'lists' && (
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full mobile-list-item mb-4"
              >
                <div className="mobile-list-item-icon bg-green-500/20 text-green-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="mobile-list-item-content">
                  <p className="mobile-list-item-title">Ladda upp ny lista</p>
                  <p className="mobile-list-item-subtitle">Importera CSV-fil</p>
                </div>
                <ChevronRight className="w-5 h-5 mobile-list-item-action" />
              </button>

              {batches.length > 0 ? (
                <div className="rounded-2xl overflow-hidden">
                  {batches.map((batch) => (
                    <div
                      key={batch.id}
                      className="mobile-list-item"
                      onClick={() => {
                        if (confirm(`Radera "${batch.name}"?`)) {
                          db.deleteBatch(batch.id!).then(() => loadData());
                        }
                      }}
                    >
                      <div className="mobile-list-item-icon">
                        <FolderOpen className="w-5 h-5" />
                      </div>
                      <div className="mobile-list-item-content">
                        <p className="mobile-list-item-title">{batch.name}</p>
                        <p className="mobile-list-item-subtitle">{batch.count} kontakter</p>
                      </div>
                      <X className="w-5 h-5 text-red-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-white/50">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Inga listor uppladdade</p>
                </div>
              )}

              {/* Export Button */}
              {contacts.length > 0 && (
                <button
                  onClick={handleExport}
                  className="w-full mobile-list-item mt-4"
                >
                  <div className="mobile-list-item-icon bg-purple-500/20 text-purple-400">
                    <Download className="w-5 h-5" />
                  </div>
                  <div className="mobile-list-item-content">
                    <p className="mobile-list-item-title">Exportera kontakter</p>
                    <p className="mobile-list-item-subtitle">{filteredContacts.length} kontakter till CSV</p>
                  </div>
                  <ChevronRight className="w-5 h-5 mobile-list-item-action" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileNav
          activeTab={mobileTab}
          onTabChange={setMobileTab}
          onUpload={() => fileInputRef.current?.click()}
          contactsCount={contacts.length}
        />

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Mobile Contact Detail Modal */}
        {selectedContact && (
          <Suspense fallback={null}>
            <ContactDetailModal
              contact={selectedContact}
              onClose={() => setSelectedContact(null)}
              onSave={handleSaveContact}
            />
          </Suspense>
        )}

        {/* Log Modal */}
        {loggingContactId && (
          <div className="mobile-modal" onClick={() => setLoggingContactId(null)}>
            <div className="mobile-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-modal-header">
                <h3 className="mobile-modal-title">Logga samtalsanteckning</h3>
                <button onClick={() => setLoggingContactId(null)} className="mobile-modal-close">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mobile-modal-body">
                <textarea
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  placeholder="Skriv din anteckning här..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white min-h-[150px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  autoFocus
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={saveLogNote}
                    className="flex-1 bg-green-500/30 hover:bg-green-500/40 text-white px-6 py-3 rounded-xl font-semibold"
                  >
                    Spara
                  </button>
                  <button
                    onClick={() => setLoggingContactId(null)}
                    className="flex-1 btn-premium px-6 py-3 rounded-xl font-semibold"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Import Progress */}
        {importing && <ImportProgress progress={importProgress} fileName={importFileName} />}

        {/* Toast */}
        <ToastContainer />
      </div>
    );
  }

  // DESKTOP VIEW
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        id="sidebar"
        role="navigation"
        aria-label="Huvudnavigering"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-52 glass border-r border-white/20 transform transition-transform duration-300",
          !sidebarOpen && "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full p-3">
          {/* Logo */}
          <div className="mb-4">
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center backdrop-blur-xl border border-white/30 shadow-xl">
                <Phone className="w-4 h-4" />
              </div>
              <div className="text-center">
                <h1 className="text-sm font-bold tracking-tight">Ringoptima</h1>
                <span className="text-[8px] font-semibold text-white/50 uppercase tracking-widest">V3</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-1.5 mb-4">
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
            <StatCard
              label="Listor"
              value={batches.length}
              color="bg-orange-500/20"
              onClick={() => setShowListorPanel(!showListorPanel)}
              active={showListorPanel}
            />
          </div>

          {/* Saved Filters */}
          <div className="mb-3">
            <SavedFiltersPanel
              savedFilters={savedFilters}
              currentFilterActive={currentFilterActive}
              activeFilterId={activeFilterId}
              onSave={handleSaveFilter}
              onLoad={handleLoadFilter}
              onDelete={handleDeleteFilter}
            />
          </div>

          {/* Listor Panel */}
          {showListorPanel && (
            <div className="mb-6">
              <h3 className="text-[10px] font-bold text-white/80 uppercase tracking-wide mb-2 px-1">
                Hantera Listor
              </h3>

              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full mb-2 glass rounded-lg p-2 flex items-center gap-2 hover:bg-white/10 transition-colors text-xs font-semibold"
              >
                <Upload className="w-3.5 h-3.5" />
                Ladda upp CSV
              </button>

              {/* List of imported batches */}
              {batches.length > 0 && (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {batches.map((batch) => (
                    <div
                      key={batch.id}
                      className="glass rounded-lg p-2 flex items-center justify-between gap-2 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold truncate">{batch.name}</p>
                        <p className="text-[9px] text-white/60">
                          {batch.count} kontakter
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          if (!batch.id) return;
                          if (confirm(`Radera "${batch.name}"?`)) {
                            try {
                              await db.deleteBatch(batch.id);
                              await loadData();
                              toast.success(`Lista raderad`);
                            } catch (error) {
                              console.error('Error deleting batch:', error);
                              toast.error('Kunde inte radera');
                            }
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors flex-shrink-0"
                        title="Radera"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {batches.length === 0 && (
                <p className="text-[9px] text-white/50 text-center py-3">Inga listor uppladdade</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={() => setShowDashboard(!showDashboard)}
              className={cn(
                "w-full btn-premium p-2 rounded-lg flex items-center gap-2 font-semibold text-[10px] transition-all",
                showDashboard && "bg-white/25 ring-2 ring-white/40"
              )}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </button>
            <button
              onClick={handleExport}
              disabled={contacts.length === 0}
              className="w-full btn-premium p-2 rounded-lg flex items-center gap-2 font-semibold text-[10px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              Exportera
            </button>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-3 border-t border-white/10 text-[8px] text-white/60 text-center">
            <p>React + TS</p>
            <p>IndexedDB</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        sidebarOpen ? "ml-52" : "ml-0"
      )}>
        {/* Header */}
        <header className="glass border-b border-white/20 p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg glass-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/50 focus-visible:outline-offset-2"
              aria-label={sidebarOpen ? "Stäng sidomenyn" : "Öppna sidomenyn"}
              aria-expanded={sidebarOpen}
              aria-controls="sidebar"
            >
              {sidebarOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
            </button>

            {/* Search */}
            <div className="flex-1 max-w-2xl relative" role="search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" aria-hidden="true" />
              <input
                type="search"
                placeholder="Sök kontakter..."
                value={filter.search}
                onChange={(e) => setFilter({ search: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-11 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-white/30"
                aria-label="Sök kontakter efter namn, organisation eller telefonnummer"
              />
            </div>

            {/* Filters */}
            <select
              value={filter.operator}
              onChange={(e) => setFilter({ operator: e.target.value })}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label="Filtrera efter operatör"
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
              aria-label="Filtrera efter status"
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
              aria-label="Sortera kontakter"
            >
              <option value="">Sortera...</option>
              <option value="phones-desc">Flest nummer</option>
              <option value="phones-asc">Minst nummer</option>
            </select>

            {(filter.search || filter.status || filter.priority || filter.operator || filter.sort) && (
              <button
                onClick={resetFilter}
                className="p-2.5 rounded-lg glass-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/50"
                aria-label="Rensa alla filter"
              >
                <X className="w-5 h-5" aria-hidden="true" />
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
            <Suspense fallback={<div className="glass rounded-3xl p-16 text-center animate-pulse"><div className="text-xl">Laddar Dashboard...</div></div>}>
              <Dashboard contacts={contacts} />
            </Suspense>
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
            /* Cards View - Lazy loaded */
            <Suspense fallback={<div className="glass rounded-3xl p-16 text-center animate-pulse"><div className="text-xl">Laddar kort...</div></div>}>
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
            </Suspense>
          ) : (
            /* Table View with Virtual Scrolling */
            <div className="glass rounded-3xl overflow-hidden">
              {/* Fixed header */}
              <div className="bg-white/5 border-b border-white/10">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col style={{ width: '18%' }} /> {/* Företag */}
                    <col style={{ width: '11%' }} /> {/* Kontakt */}
                    <col style={{ width: '13%' }} /> {/* Nummer */}
                    <col style={{ width: '15%' }} /> {/* Användare */}
                    <col style={{ width: '13%' }} /> {/* Operatör */}
                    <col style={{ width: '12%' }} /> {/* Status */}
                    <col style={{ width: '8%' }} />  {/* Prioritet */}
                    <col style={{ width: '10%' }} /> {/* Åtgärder */}
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-white/70">Företag</th>
                      <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-white/70">Kontakt</th>
                      <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-white/70">Nummer</th>
                      <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-white/70">Användare</th>
                      <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-white/70">Operatör</th>
                      <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide text-white/70">Status</th>
                      <th className="text-center p-3 font-semibold text-xs uppercase tracking-wide text-white/70">Prio</th>
                      <th className="text-right p-3 font-semibold text-xs uppercase tracking-wide text-white/70">Åtgärder</th>
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Virtual scrolling container */}
              <div
                className="overflow-y-auto overflow-x-hidden"
                style={{ height: TABLE_HEIGHT }}
                onScroll={handleTableScroll}
              >
                {/* Total height spacer for scrollbar */}
                <div style={{ height: totalHeight, position: 'relative' }}>
                  {/* Visible rows positioned with offset */}
                  <table
                    className="w-full table-fixed"
                    style={{
                      position: 'absolute',
                      top: offsetY,
                      left: 0,
                      right: 0,
                    }}
                  >
                    <colgroup>
                      <col style={{ width: '18%' }} /> {/* Företag */}
                      <col style={{ width: '11%' }} /> {/* Kontakt */}
                      <col style={{ width: '13%' }} /> {/* Nummer */}
                      <col style={{ width: '15%' }} /> {/* Användare */}
                      <col style={{ width: '13%' }} /> {/* Operatör */}
                      <col style={{ width: '12%' }} /> {/* Status */}
                      <col style={{ width: '8%' }} />  {/* Prioritet */}
                      <col style={{ width: '10%' }} /> {/* Åtgärder */}
                    </colgroup>
                    <tbody className="divide-y divide-white/5">
                      {visibleContacts.map((contact) => (
                      <tr
                        key={contact.id}
                        className="hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => setSelectedContact(contact)}
                      >
                        <td className="p-3 align-top">
                          <div className="font-medium text-sm truncate" title={contact.name}>{contact.name}</div>
                          <div className="text-xs text-white/60 truncate">{contact.city}</div>
                        </td>
                        <td className="p-3 align-top">
                          <div className="text-sm truncate" title={contact.contact}>{contact.contact || '-'}</div>
                          <div className="text-xs text-white/60 truncate">{contact.role || '-'}</div>
                        </td>
                        <td className="p-3 align-top">
                          <MultiValueCell value={contact.phones} mono compact />
                        </td>
                        <td className="p-3 align-top">
                          <MultiValueCell value={contact.users} compact />
                        </td>
                        <td className="p-3 align-top">
                          <MultiValueCell value={contact.operators} compact dedupe />
                        </td>
                        <td className="p-3 align-top" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={contact.status}
                            onChange={(e) => updateStatus(contact.id!, e.target.value as Contact['status'])}
                            className={cn("w-full px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer", getStatusColor(contact.status))}
                          >
                            <option value="new">Ny</option>
                            <option value="contacted">Logga</option>
                            <option value="interested">Intresserad</option>
                            <option value="not_interested">Ej intresserad</option>
                            <option value="converted">Konverterad</option>
                          </select>
                        </td>
                        <td className="p-3 align-top text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => togglePriority(contact.id!, contact.priority)}
                            className="p-1.5 hover:bg-white/10 rounded transition-colors mx-auto"
                            title="Växla prioritet"
                          >
                            <Star
                              className={cn(
                                "w-5 h-5 transition-all",
                                contact.priority === 'high' ? "fill-yellow-400 text-yellow-400" : "text-white/40"
                              )}
                            />
                          </button>
                        </td>
                        <td className="p-3 align-top" onClick={(e) => e.stopPropagation()}>
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
              </div>

              {/* Table footer with virtual scroll info */}
              <div className="border-t border-white/10 p-3 flex items-center justify-between text-xs text-white/70">
                <div>Visar {filteredContacts.length} av {contacts.length} kontakter</div>
                <div className="flex items-center gap-4">
                  <span className="text-green-400/80">⚡ Virtual scroll aktiv ({visibleContacts.length} renderade)</span>
                  <span>{batches.length} listor</span>
                </div>
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

      {/* Command Palette - Lazy loaded */}
      {commandPaletteOpen && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      {/* Contact Detail Modal - Lazy loaded */}
      {selectedContact && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"><div className="glass rounded-3xl p-8 animate-pulse">Laddar...</div></div>}>
          <ContactDetailModal
            contact={selectedContact}
            onClose={() => setSelectedContact(null)}
            onSave={handleSaveContact}
          />
        </Suspense>
      )}

      {/* Import Progress */}
      {importing && <ImportProgress progress={importProgress} fileName={importFileName} />}
    </div>
  );
}

export default App;
