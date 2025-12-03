import { useState, useEffect } from 'react';
import { X, Phone, User, Building2, MapPin, Calendar, Tag, FileText, Edit2, Save } from 'lucide-react';
import { cn, getStatusColor, getPriorityColor, getOperatorColor } from '../lib/utils';
import type { Contact } from '../types';

interface ContactDetailModalProps {
  contact: Contact | null;
  onClose: () => void;
  onSave: (contact: Contact) => void;
}

export function ContactDetailModal({ contact, onClose, onSave }: ContactDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState<Contact | null>(null);

  useEffect(() => {
    if (contact) {
      setEditedContact({ ...contact });
      setIsEditing(false);
    }
  }, [contact]);

  if (!contact || !editedContact) return null;

  const handleSave = () => {
    onSave(editedContact);
    setIsEditing(false);
  };

  const phoneNumbers = contact.phones.split('\n').filter(p => p.trim());
  const users = contact.users.split('\n').filter(u => u.trim());
  const operators = contact.operators.split('\n').filter(o => o.trim());

  // Parse notes into individual entries
  const noteEntries = contact.notes
    ? contact.notes.split('\n\n').filter(n => n.trim())
    : [];

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="glass rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/10">
          <div className="flex-1">
            {isEditing ? (
              <input
                value={editedContact.name}
                onChange={(e) => setEditedContact({ ...editedContact, name: e.target.value })}
                className="text-3xl font-bold bg-white/10 border border-white/20 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            ) : (
              <h2 className="text-3xl font-bold">{contact.name}</h2>
            )}
            {isEditing ? (
              <input
                value={editedContact.org}
                onChange={(e) => setEditedContact({ ...editedContact, org: e.target.value })}
                className="text-lg text-white/70 bg-white/10 border border-white/20 rounded-lg px-4 py-2 w-full mt-2 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            ) : (
              <p className="text-lg text-white/70 mt-1">{contact.org}</p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 transition-colors"
                  title="Spara"
                >
                  <Save className="w-5 h-5 text-green-400" />
                </button>
                <button
                  onClick={() => {
                    setEditedContact({ ...contact });
                    setIsEditing(false);
                  }}
                  className="p-2 rounded-lg glass-hover transition-colors"
                  title="Avbryt"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 rounded-lg glass-hover transition-colors"
                  title="Redigera"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg glass-hover transition-colors"
                  title="Stäng"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Contact Info */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="glass rounded-2xl p-5">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Kontaktinformation
                </h3>
                <div className="space-y-3">
                  <InfoField
                    icon={User}
                    label="Kontaktperson"
                    value={contact.contact || '-'}
                    editValue={editedContact.contact}
                    isEditing={isEditing}
                    onChange={(value) => setEditedContact({ ...editedContact, contact: value })}
                  />
                  <InfoField
                    icon={Tag}
                    label="Roll"
                    value={contact.role || '-'}
                    editValue={editedContact.role}
                    isEditing={isEditing}
                    onChange={(value) => setEditedContact({ ...editedContact, role: value })}
                  />
                  <InfoField
                    icon={MapPin}
                    label="Adress"
                    value={contact.address || '-'}
                    editValue={editedContact.address}
                    isEditing={isEditing}
                    onChange={(value) => setEditedContact({ ...editedContact, address: value })}
                  />
                  <InfoField
                    icon={MapPin}
                    label="Ort"
                    value={contact.city || '-'}
                    editValue={editedContact.city}
                    isEditing={isEditing}
                    onChange={(value) => setEditedContact({ ...editedContact, city: value })}
                  />
                  <InfoField
                    icon={Calendar}
                    label="Skapad"
                    value={new Date(contact.createdAt).toLocaleString('sv-SE')}
                    isEditing={false}
                  />
                </div>
              </div>

              {/* Status & Priority */}
              <div className="glass rounded-2xl p-5">
                <h3 className="text-lg font-bold mb-4">Status & Prioritet</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-white/60 uppercase tracking-wide mb-2 block">
                      Status
                    </label>
                    {isEditing ? (
                      <select
                        value={editedContact.status}
                        onChange={(e) => setEditedContact({ ...editedContact, status: e.target.value as Contact['status'] })}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
                      >
                        <option value="new">Ny</option>
                        <option value="contacted">Kontaktad</option>
                        <option value="interested">Intresserad</option>
                        <option value="not_interested">Ej intresserad</option>
                        <option value="converted">Konverterad</option>
                      </select>
                    ) : (
                      <span className={cn('inline-block px-3 py-1.5 rounded-full text-sm font-semibold', getStatusColor(contact.status))}>
                        {contact.status === 'new' && 'Ny'}
                        {contact.status === 'contacted' && 'Kontaktad'}
                        {contact.status === 'interested' && 'Intresserad'}
                        {contact.status === 'not_interested' && 'Ej intresserad'}
                        {contact.status === 'converted' && 'Konverterad'}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-white/60 uppercase tracking-wide mb-2 block">
                      Prioritet
                    </label>
                    {isEditing ? (
                      <select
                        value={editedContact.priority}
                        onChange={(e) => setEditedContact({ ...editedContact, priority: e.target.value as Contact['priority'] })}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
                      >
                        <option value="low">Låg</option>
                        <option value="medium">Medium</option>
                        <option value="high">Hög</option>
                      </select>
                    ) : (
                      <span className={cn('inline-block text-sm font-semibold', getPriorityColor(contact.priority))}>
                        {contact.priority === 'low' && 'Låg'}
                        {contact.priority === 'medium' && 'Medium'}
                        {contact.priority === 'high' && 'Hög'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Phone Numbers & Operators */}
              <div className="glass rounded-2xl p-5">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Telefonnummer ({phoneNumbers.length})
                </h3>
                <div className="space-y-2">
                  {phoneNumbers.map((phone, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex-1">
                        <div className="font-mono text-sm">{phone.replace(/[\s-]/g, '')}</div>
                        {users[idx] && (
                          <div className="text-xs text-white/60 mt-1">{users[idx]}</div>
                        )}
                      </div>
                      {operators[idx] && (
                        <div className={cn('text-xs font-semibold', getOperatorColor(operators[idx]))}>
                          {operators[idx]}
                        </div>
                      )}
                    </div>
                  ))}
                  {phoneNumbers.length === 0 && (
                    <p className="text-white/40 text-sm text-center py-4">Inga telefonnummer</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Notes & History */}
            <div className="space-y-6">
              <div className="glass rounded-2xl p-5">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Samtalshistorik ({noteEntries.length})
                </h3>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {noteEntries.map((entry, idx) => {
                    const lines = entry.split('\n');
                    const timestamp = lines[0].match(/\[(.*?)\]/)?.[1] || '';
                    const note = lines.slice(1).join('\n');

                    return (
                      <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/10">
                        {timestamp && (
                          <div className="text-xs text-white/50 mb-2 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {timestamp}
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{note}</p>
                      </div>
                    );
                  })}
                  {noteEntries.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-white/20 mx-auto mb-3" />
                      <p className="text-white/40 text-sm">Ingen samtalshistorik ännu</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-4 flex items-center justify-between text-xs text-white/60">
          <div>
            Senast uppdaterad: {new Date(contact.updatedAt).toLocaleString('sv-SE')}
          </div>
          {isEditing && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditedContact({ ...contact });
                  setIsEditing(false);
                }}
                className="px-4 py-2 rounded-lg glass-hover"
              >
                Avbryt
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 font-semibold"
              >
                Spara ändringar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoField({
  icon: Icon,
  label,
  value,
  editValue,
  isEditing,
  onChange,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  editValue?: string;
  isEditing: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-white/60 uppercase tracking-wide mb-1 flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {label}
      </label>
      {isEditing && onChange ? (
        <input
          value={editValue || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
        />
      ) : (
        <p className="text-sm">{value}</p>
      )}
    </div>
  );
}
