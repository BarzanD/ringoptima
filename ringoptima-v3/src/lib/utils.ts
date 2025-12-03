import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), 'PPp', { locale: sv });
  } catch {
    return dateString;
  }
}

export function formatPhoneNumber(phone: string): string {
  return phone.replace(/\s+/g, ' ').trim();
}

export function getOperatorColor(operator: string): string {
  const op = operator.toLowerCase();
  if (op.includes('telenor')) return 'text-cyan-400';
  if (op.includes('tele2')) return 'text-green-400';
  if (op.includes('hi3g') || op.includes('tre')) return 'text-purple-400';
  if (op.includes('telia')) return 'text-orange-400';
  return 'text-gray-400';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'new':
      return 'bg-blue-500/20 text-blue-300';
    case 'contacted':
      return 'bg-yellow-500/20 text-yellow-300';
    case 'interested':
      return 'bg-green-500/20 text-green-300';
    case 'not_interested':
      return 'bg-red-500/20 text-red-300';
    case 'converted':
      return 'bg-emerald-500/20 text-emerald-300';
    default:
      return 'bg-gray-500/20 text-gray-300';
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return 'text-red-400';
    case 'medium':
      return 'text-yellow-400';
    case 'low':
      return 'text-green-400';
    default:
      return 'text-gray-400';
  }
}

export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
