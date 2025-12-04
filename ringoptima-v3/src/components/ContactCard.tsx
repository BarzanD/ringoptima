import { Phone, Star, MapPin, Users, Smartphone, User, Briefcase, X } from 'lucide-react';
import { cn, getStatusColor } from '../lib/utils';
import type { Contact } from '../types';

interface ContactCardProps {
  contact: Contact;
  onStatusChange: (status: Contact['status']) => void;
  onPriorityToggle: () => void;
  onCall: () => void;
  onDelete: () => void;
  onClick: () => void;
}

export function ContactCard({
  contact,
  onStatusChange,
  onPriorityToggle,
  onCall,
  onDelete,
  onClick,
}: ContactCardProps) {
  const phoneNumbers = contact.phones.split('\n').filter(p => p.trim());
  const users = contact.users.split('\n').filter(u => u.trim());
  const operators = contact.operators.split('\n').filter(o => o.trim());

  return (
    <div
      className="glass rounded-2xl p-4 hover:bg-white/10 transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      {/* Header: Company & Priority */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base truncate">{contact.name}</h3>
          <div className="flex items-center gap-1.5 text-xs text-white/60 mt-1">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{contact.city}</span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPriorityToggle();
          }}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors ml-2"
          title="Växla prioritet"
        >
          <Star
            className={cn(
              "w-5 h-5 transition-all",
              contact.priority === 'high' ? "fill-yellow-400 text-yellow-400" : "text-white/40"
            )}
          />
        </button>
      </div>

      {/* Contact Person */}
      {contact.contact && (
        <div className="flex items-center gap-2 mb-2">
          <User className="w-3.5 h-3.5 text-white/50 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-medium">{contact.contact}</span>
            {contact.role && <span className="text-white/60 ml-1.5">• {contact.role}</span>}
          </div>
        </div>
      )}

      {/* Phone Numbers */}
      {phoneNumbers.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-1.5 text-xs text-white/50 mb-1">
            <Smartphone className="w-3 h-3" />
            <span className="uppercase tracking-wide font-semibold">Nummer</span>
          </div>
          <div className="space-y-0.5">
            {phoneNumbers.slice(0, 2).map((phone, idx) => (
              <div key={idx} className="text-sm font-mono bg-white/5 rounded-lg px-2.5 py-1">
                {phone.replace(/[\s-]/g, '')}
              </div>
            ))}
            {phoneNumbers.length > 2 && (
              <div className="text-xs text-white/50 pl-2.5">
                +{phoneNumbers.length - 2} fler nummer
              </div>
            )}
          </div>
        </div>
      )}

      {/* Users */}
      {users.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-1.5 text-xs text-white/50 mb-1">
            <Users className="w-3 h-3" />
            <span className="uppercase tracking-wide font-semibold">Användare</span>
          </div>
          <div className="text-sm text-white/80">
            {users.slice(0, 2).join(', ')}
            {users.length > 2 && <span className="text-white/50"> +{users.length - 2}</span>}
          </div>
        </div>
      )}

      {/* Operators */}
      {operators.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 text-xs text-white/50 mb-1.5">
            <Briefcase className="w-3 h-3" />
            <span className="uppercase tracking-wide font-semibold">Operatörer</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {operators.slice(0, 2).map((op, idx) => {
              const operator = op.toLowerCase();
              let color = 'bg-gray-500/20 text-gray-300';
              if (operator.includes('telia')) color = 'bg-purple-500/20 text-purple-300';
              else if (operator.includes('tele2')) color = 'bg-green-500/20 text-green-300';
              else if (operator.includes('hi3g') || operator.includes('tre')) color = 'bg-blue-500/20 text-blue-300';
              else if (operator.includes('telenor')) color = 'bg-cyan-500/20 text-cyan-300';

              return (
                <span
                  key={idx}
                  className={cn("text-xs px-2 py-0.5 rounded-full font-medium", color)}
                >
                  {op.length > 20 ? op.substring(0, 20) + '...' : op}
                </span>
              );
            })}
            {operators.length > 2 && (
              <span className="text-xs text-white/50">+{operators.length - 2}</span>
            )}
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex items-center gap-2 pt-3 border-t border-white/10">
        {/* Status Selector */}
        <div className="flex-1" onClick={(e) => e.stopPropagation()}>
          <select
            value={contact.status}
            onChange={(e) => onStatusChange(e.target.value as Contact['status'])}
            className={cn(
              "w-full px-3 py-2 rounded-lg text-xs font-semibold border-0 cursor-pointer",
              getStatusColor(contact.status)
            )}
          >
            <option value="new">Ny</option>
            <option value="contacted">Logga</option>
            <option value="interested">Intresserad</option>
            <option value="not_interested">Ej intresserad</option>
            <option value="converted">Konverterad</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onCall}
            className="p-2 rounded-lg glass-hover text-green-400"
            title="Ring"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg glass-hover text-red-400"
            title="Radera"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
