export interface Contact {
  id?: number;
  batchId?: number;
  name: string;
  org: string;
  address: string;
  city: string;
  phones: string;
  users: string;
  operators: string;
  contact: string;
  role: string;
  notes: string;
  priority: 'high' | 'medium' | 'low';
  status: 'new' | 'contacted' | 'interested' | 'not_interested' | 'converted';
  lastCalled?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Batch {
  id?: number;
  name: string;
  fileName: string;
  count: number;
  createdAt: string;
}

export interface CallLog {
  id?: number;
  contactId: number;
  duration: number;
  outcome: 'answered' | 'no_answer' | 'busy' | 'voicemail';
  notes: string;
  nextFollowUp?: string;
  createdAt: string;
}

export interface Filter {
  search: string;
  operator: string;
  status: string;
  priority: string;
  sort: 'name-asc' | 'name-desc' | 'phones-desc' | 'phones-asc' | 'recent' | '';
}

export interface SavedFilter {
  id?: number;
  name: string;
  filter: Filter;
  createdAt: string;
}

export type Operator = 'telenor' | 'tele2' | 'tre' | 'telia' | 'all';
