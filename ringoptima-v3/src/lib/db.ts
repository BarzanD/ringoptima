import Dexie, { type Table } from 'dexie';
import type { Contact, Batch, CallLog, SavedFilter } from '../types';

export class RingoptimaDB extends Dexie {
  contacts!: Table<Contact, number>;
  batches!: Table<Batch, number>;
  callLogs!: Table<CallLog, number>;
  savedFilters!: Table<SavedFilter, number>;

  constructor() {
    super('RingoptimaV3');

    this.version(1).stores({
      contacts: '++id, batchId, name, status, priority, operators, createdAt, updatedAt, lastCalled',
      batches: '++id, name, createdAt',
      callLogs: '++id, contactId, createdAt',
    });

    // Version 2: Add savedFilters table
    this.version(2).stores({
      contacts: '++id, batchId, name, status, priority, operators, createdAt, updatedAt, lastCalled',
      batches: '++id, name, createdAt',
      callLogs: '++id, contactId, createdAt',
      savedFilters: '++id, name, createdAt',
    });
  }

  // Batch operations
  async addBatch(batch: Omit<Batch, 'id'>): Promise<number> {
    return await this.batches.add(batch as Batch);
  }

  async getAllBatches(): Promise<Batch[]> {
    return await this.batches.toArray();
  }

  async deleteBatch(id: number): Promise<void> {
    await Promise.all([
      this.batches.delete(id),
      this.contacts.where('batchId').equals(id).delete(),
    ]);
  }

  // Contact operations
  async addContacts(contacts: Omit<Contact, 'id'>[]): Promise<void> {
    await this.contacts.bulkAdd(contacts as Contact[]);
  }

  async getAllContacts(): Promise<Contact[]> {
    return await this.contacts.toArray();
  }

  async getContact(id: number): Promise<Contact | undefined> {
    return await this.contacts.get(id);
  }

  async updateContact(id: number, updates: Partial<Contact>): Promise<void> {
    await this.contacts.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  async deleteContact(id: number): Promise<void> {
    await this.contacts.delete(id);
  }

  async searchContacts(query: string): Promise<Contact[]> {
    const lowerQuery = query.toLowerCase();
    return await this.contacts
      .filter(
        (contact) =>
          contact.name.toLowerCase().includes(lowerQuery) ||
          contact.org.toLowerCase().includes(lowerQuery) ||
          contact.phones.includes(lowerQuery) ||
          contact.contact.toLowerCase().includes(lowerQuery)
      )
      .toArray();
  }

  // Call log operations
  async addCallLog(callLog: Omit<CallLog, 'id'>): Promise<number> {
    return await this.callLogs.add(callLog as CallLog);
  }

  async getCallLogsForContact(contactId: number): Promise<CallLog[]> {
    return await this.callLogs.where('contactId').equals(contactId).toArray();
  }

  async getAllCallLogs(): Promise<CallLog[]> {
    return await this.callLogs.toArray();
  }

  // Saved filter operations
  async addSavedFilter(savedFilter: Omit<SavedFilter, 'id'>): Promise<number> {
    return await this.savedFilters.add(savedFilter as SavedFilter);
  }

  async getAllSavedFilters(): Promise<SavedFilter[]> {
    return await this.savedFilters.orderBy('createdAt').reverse().toArray();
  }

  async getSavedFilter(id: number): Promise<SavedFilter | undefined> {
    return await this.savedFilters.get(id);
  }

  async deleteSavedFilter(id: number): Promise<void> {
    await this.savedFilters.delete(id);
  }

  // Clear all data
  async clearAll(): Promise<void> {
    await Promise.all([
      this.contacts.clear(),
      this.batches.clear(),
      this.callLogs.clear(),
      this.savedFilters.clear(),
    ]);
  }

  // Analytics
  async getContactsByOperator(): Promise<Record<string, number>> {
    const contacts = await this.contacts.toArray();
    const stats: Record<string, number> = {
      telenor: 0,
      tele2: 0,
      tre: 0,
      telia: 0,
      other: 0,
    };

    contacts.forEach((contact) => {
      const ops = contact.operators.toLowerCase();
      if (ops.includes('telenor')) stats.telenor++;
      else if (ops.includes('tele2')) stats.tele2++;
      else if (ops.includes('hi3g') || ops.includes('tre')) stats.tre++;
      else if (ops.includes('telia')) stats.telia++;
      else stats.other++;
    });

    return stats;
  }

  async getContactsByStatus(): Promise<Record<string, number>> {
    const contacts = await this.contacts.toArray();
    const stats: Record<string, number> = {
      new: 0,
      contacted: 0,
      interested: 0,
      not_interested: 0,
      converted: 0,
    };

    contacts.forEach((contact) => {
      stats[contact.status]++;
    });

    return stats;
  }
}

export const db = new RingoptimaDB();
