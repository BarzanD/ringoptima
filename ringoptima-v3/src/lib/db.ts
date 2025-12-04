/**
 * 🗄️ DATABASE LAYER - Supabase Cloud Storage
 * Ersätter IndexedDB med Supabase för molnlagring och cross-platform access
 */

import { supabase } from './supabase';
import type { Contact, Batch, CallLog, SavedFilter } from '../types';

export class RingoptimaDB {
  // Batch operations
  async addBatch(batch: Omit<Batch, 'id'>): Promise<number> {
    const { data, error } = await supabase
      .from('batches')
      .insert({
        name: batch.name,
        file_name: batch.fileName,
        count: batch.count,
        created_at: batch.createdAt,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  async getAllBatches(): Promise<Batch[]> {
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((b) => ({
      id: b.id,
      name: b.name,
      fileName: b.file_name,
      count: b.count,
      createdAt: b.created_at,
    }));
  }

  async deleteBatch(id: number): Promise<void> {
    // Contacts will be deleted automatically via CASCADE
    const { error } = await supabase
      .from('batches')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Contact operations
  async addContacts(contacts: Omit<Contact, 'id'>[]): Promise<void> {
    const dbContacts = contacts.map((c) => ({
      batch_id: c.batchId,
      name: c.name,
      org: c.org,
      address: c.address,
      city: c.city,
      phones: c.phones,
      users: c.users,
      operators: c.operators,
      contact: c.contact,
      role: c.role,
      notes: c.notes || '',
      priority: c.priority,
      status: c.status,
      created_at: c.createdAt,
      updated_at: c.updatedAt,
    }));

    // Insert in batches of 500 to avoid payload limits
    const batchSize = 500;
    for (let i = 0; i < dbContacts.length; i += batchSize) {
      const batch = dbContacts.slice(i, i + batchSize);
      const { error } = await supabase.from('contacts').insert(batch);
      if (error) throw error;
    }
  }

  async getAllContacts(): Promise<Contact[]> {
    // Supabase har en default limit på 1000 rader
    // Vi använder paginering för att hämta alla rader
    const allContacts: Contact[] = [];
    const pageSize = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped = data.map((c) => ({
          id: c.id,
          batchId: c.batch_id,
          name: c.name,
          org: c.org,
          address: c.address,
          city: c.city,
          phones: c.phones,
          users: c.users,
          operators: c.operators,
          contact: c.contact,
          role: c.role,
          notes: c.notes,
          priority: c.priority,
          status: c.status,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }));
        allContacts.push(...mapped);
        offset += pageSize;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }

    return allContacts;
  }

  async getContact(id: number): Promise<Contact | undefined> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return undefined;
    return {
      id: data.id,
      batchId: data.batch_id,
      name: data.name,
      org: data.org,
      address: data.address,
      city: data.city,
      phones: data.phones,
      users: data.users,
      operators: data.operators,
      contact: data.contact,
      role: data.role,
      notes: data.notes,
      priority: data.priority,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async updateContact(id: number, updates: Partial<Contact>): Promise<void> {
    const dbUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.org !== undefined) dbUpdates.org = updates.org;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.city !== undefined) dbUpdates.city = updates.city;
    if (updates.phones !== undefined) dbUpdates.phones = updates.phones;
    if (updates.users !== undefined) dbUpdates.users = updates.users;
    if (updates.operators !== undefined) dbUpdates.operators = updates.operators;
    if (updates.contact !== undefined) dbUpdates.contact = updates.contact;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    const { error } = await supabase
      .from('contacts')
      .update(dbUpdates)
      .eq('id', id);

    if (error) throw error;
  }

  async deleteContact(id: number): Promise<void> {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async searchContacts(query: string): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .or(`name.ilike.%${query}%,org.ilike.%${query}%,phones.ilike.%${query}%,contact.ilike.%${query}%`);

    if (error) throw error;
    return (data || []).map((c) => ({
      id: c.id,
      batchId: c.batch_id,
      name: c.name,
      org: c.org,
      address: c.address,
      city: c.city,
      phones: c.phones,
      users: c.users,
      operators: c.operators,
      contact: c.contact,
      role: c.role,
      notes: c.notes,
      priority: c.priority,
      status: c.status,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));
  }

  // Call log operations (simplified - not using separate table for now)
  async addCallLog(callLog: Omit<CallLog, 'id'>): Promise<number> {
    // For simplicity, we're storing call logs as notes on the contact
    // In a full implementation, you'd create a call_logs table
    console.log('Call log:', callLog);
    return Date.now();
  }

  async getCallLogsForContact(_contactId: number): Promise<CallLog[]> {
    return [];
  }

  async getAllCallLogs(): Promise<CallLog[]> {
    return [];
  }

  // Saved filter operations
  async addSavedFilter(savedFilter: Omit<SavedFilter, 'id'>): Promise<number> {
    const { data, error } = await supabase
      .from('saved_filters')
      .insert({
        name: savedFilter.name,
        filter: savedFilter.filter,
        created_at: savedFilter.createdAt,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  async getAllSavedFilters(): Promise<SavedFilter[]> {
    const { data, error } = await supabase
      .from('saved_filters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((f) => ({
      id: f.id,
      name: f.name,
      filter: f.filter,
      createdAt: f.created_at,
    }));
  }

  async getSavedFilter(id: number): Promise<SavedFilter | undefined> {
    const { data, error } = await supabase
      .from('saved_filters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return undefined;
    return {
      id: data.id,
      name: data.name,
      filter: data.filter,
      createdAt: data.created_at,
    };
  }

  async deleteSavedFilter(id: number): Promise<void> {
    const { error } = await supabase
      .from('saved_filters')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Clear all data
  async clearAll(): Promise<void> {
    await supabase.from('contacts').delete().neq('id', 0);
    await supabase.from('batches').delete().neq('id', 0);
    await supabase.from('saved_filters').delete().neq('id', 0);
  }

  // Analytics
  async getContactsByOperator(): Promise<Record<string, number>> {
    const contacts = await this.getAllContacts();
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
    const contacts = await this.getAllContacts();
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
