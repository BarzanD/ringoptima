import { Phone, LayoutDashboard, Upload, Search, FolderOpen } from 'lucide-react';
import { cn } from '../lib/utils';

interface MobileNavProps {
  activeTab: 'contacts' | 'dashboard' | 'lists' | 'search';
  onTabChange: (tab: 'contacts' | 'dashboard' | 'lists' | 'search') => void;
  onUpload: () => void;
  contactsCount: number;
}

export function MobileNav({ activeTab, onTabChange, onUpload, contactsCount }: MobileNavProps) {
  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-inner">
        {/* Contacts */}
        <button
          onClick={() => onTabChange('contacts')}
          className={cn(
            "mobile-nav-item",
            activeTab === 'contacts' && "active"
          )}
        >
          <Phone className="mobile-nav-icon" />
          <span className="mobile-nav-label">Kontakter</span>
          {contactsCount > 0 && (
            <span className="mobile-nav-badge">{contactsCount > 999 ? '999+' : contactsCount}</span>
          )}
        </button>

        {/* Search */}
        <button
          onClick={() => onTabChange('search')}
          className={cn(
            "mobile-nav-item",
            activeTab === 'search' && "active"
          )}
        >
          <Search className="mobile-nav-icon" />
          <span className="mobile-nav-label">Sök</span>
        </button>

        {/* Upload Button (Center, Elevated) */}
        <button
          onClick={onUpload}
          className="mobile-nav-fab"
          aria-label="Ladda upp CSV"
        >
          <Upload className="w-6 h-6" />
        </button>

        {/* Lists */}
        <button
          onClick={() => onTabChange('lists')}
          className={cn(
            "mobile-nav-item",
            activeTab === 'lists' && "active"
          )}
        >
          <FolderOpen className="mobile-nav-icon" />
          <span className="mobile-nav-label">Listor</span>
        </button>

        {/* Dashboard */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={cn(
            "mobile-nav-item",
            activeTab === 'dashboard' && "active"
          )}
        >
          <LayoutDashboard className="mobile-nav-icon" />
          <span className="mobile-nav-label">Dashboard</span>
        </button>
      </div>
    </nav>
  );
}

// Mobile Header Component
interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function MobileHeader({ title, subtitle, showBack, onBack, rightAction }: MobileHeaderProps) {
  return (
    <header className="mobile-header">
      <div className="mobile-header-inner">
        {showBack && onBack && (
          <button onClick={onBack} className="mobile-header-back">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="mobile-header-title">
          <h1>{title}</h1>
          {subtitle && <span>{subtitle}</span>}
        </div>
        {rightAction && (
          <div className="mobile-header-action">
            {rightAction}
          </div>
        )}
      </div>
    </header>
  );
}

// Mobile Contact Card Component
interface MobileContactCardProps {
  contact: {
    id?: number;
    name: string;
    org: string;
    phones: string;
    contact: string;
    status: string;
    priority: string;
    operators: string;
  };
  onClick: () => void;
  onCall: () => void;
  onStatusChange: (status: string) => void;
}

export function MobileContactCard({ contact, onClick, onCall }: MobileContactCardProps) {
  const firstPhone = contact.phones.split('\n')[0]?.trim() || '';
  const phoneCount = contact.phones.split('\n').filter(p => p.trim()).length;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      new: 'bg-blue-500/20 text-blue-300',
      contacted: 'bg-purple-500/20 text-purple-300',
      interested: 'bg-yellow-500/20 text-yellow-300',
      not_interested: 'bg-red-500/20 text-red-300',
      converted: 'bg-green-500/20 text-green-300',
    };
    const labels: Record<string, string> = {
      new: 'Ny',
      contacted: 'Kontaktad',
      interested: 'Intresserad',
      not_interested: 'Ej intresserad',
      converted: 'Konverterad',
    };
    return (
      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", styles[status] || styles.new)}>
        {labels[status] || 'Ny'}
      </span>
    );
  };

  return (
    <div className="mobile-contact-card" onClick={onClick}>
      <div className="mobile-contact-card-main">
        <div className="mobile-contact-card-info">
          <h3 className="mobile-contact-card-name">{contact.name}</h3>
          <p className="mobile-contact-card-org">{contact.org || contact.contact || '-'}</p>
          <div className="mobile-contact-card-meta">
            {getStatusBadge(contact.status)}
            {phoneCount > 1 && (
              <span className="text-xs text-white/50">{phoneCount} nummer</span>
            )}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onCall(); }}
          className="mobile-contact-card-call"
          aria-label="Ring"
        >
          <Phone className="w-5 h-5" />
        </button>
      </div>
      {firstPhone && (
        <div className="mobile-contact-card-phone">
          <span className="font-mono text-sm text-white/70">{firstPhone}</span>
        </div>
      )}
    </div>
  );
}
