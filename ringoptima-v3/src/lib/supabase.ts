import { createClient } from '@supabase/supabase-js';
import type { Contact, Batch, CallLog, SavedFilter } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database operations with Supabase
export class SupabaseDB {
  // Auth operations
  async signInAnonymously() {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return data;
  }

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Batch operations
  async addBatch(batch: Omit<Batch, 'id'>): Promise<number> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('batches')
      .insert([{
        ...batch,
        user_id: user.id,
        file_name: batch.fileName,
      }])
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

    return (data || []).map(batch => ({
      id: batch.id,
      name: batch.name,
      fileName: batch.file_name,
      count: batch.count,
      createdAt: batch.created_at,
    }));
  }

  async deleteBatch(id: number): Promise<void> {
    // Delete batch (contacts will be set to null due to ON DELETE SET NULL)
    const { error } = await supabase
      .from('batches')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Also delete contacts associated with this batch
    await supabase
      .from('contacts')
      .delete()
      .eq('batch_id', id);
  }

  // Contact operations
  async addContacts(contacts: Omit<Contact, 'id'>[]): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const contactsWithUserId = contacts.map(contact => ({
      ...contact,
      user_id: user.id,
      batch_id: contact.batchId,
      created_at: contact.createdAt,
      updated_at: contact.updatedAt,
      last_called: contact.lastCalled,
    }));

    const { error } = await supabase
      .from('contacts')
      .insert(contactsWithUserId);

    if (error) throw error;
  }

  async getAllContacts(): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(contact => ({
      id: contact.id,
      batchId: contact.batch_id,
      name: contact.name,
      org: contact.org,
      address: contact.address,
      city: contact.city,
      phones: contact.phones,
      users: contact.users,
      operators: contact.operators,
      contact: contact.contact,
      role: contact.role,
      notes: contact.notes,
      priority: contact.priority,
      status: contact.status,
      lastCalled: contact.last_called,
      createdAt: contact.created_at,
      updatedAt: contact.updated_at,
    }));
  }

  async getContact(id: number): Promise<Contact | undefined> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      throw error;
    }

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
      lastCalled: data.last_called,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async updateContact(id: number, updates: Partial<Contact>): Promise<void> {
    const { error } = await supabase
      .from('contacts')
      .update({
        ...updates,
        batch_id: updates.batchId,
        last_called: updates.lastCalled,
        updated_at: new Date().toISOString(),
      })
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
    const lowerQuery = query.toLowerCase();
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .or(`name.ilike.%${lowerQuery}%,org.ilike.%${lowerQuery}%,phones.ilike.%${lowerQuery}%,contact.ilike.%${lowerQuery}%`);

    if (error) throw error;

    return (data || []).map(contact => ({
      id: contact.id,
      batchId: contact.batch_id,
      name: contact.name,
      org: contact.org,
      address: contact.address,
      city: contact.city,
      phones: contact.phones,
      users: contact.users,
      operators: contact.operators,
      contact: contact.contact,
      role: contact.role,
      notes: contact.notes,
      priority: contact.priority,
      status: contact.status,
      lastCalled: contact.last_called,
      createdAt: contact.created_at,
      updatedAt: contact.updated_at,
    }));
  }

  // Call log operations
  async addCallLog(callLog: Omit<CallLog, 'id'>): Promise<number> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('call_logs')
      .insert([{
        ...callLog,
        user_id: user.id,
        contact_id: callLog.contactId,
        next_follow_up: callLog.nextFollowUp,
        created_at: callLog.createdAt,
      }])
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  async getCallLogsForContact(contactId: number): Promise<CallLog[]> {
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(log => ({
      id: log.id,
      contactId: log.contact_id,
      duration: log.duration,
      outcome: log.outcome,
      notes: log.notes,
      nextFollowUp: log.next_follow_up,
      createdAt: log.created_at,
    }));
  }

  async getAllCallLogs(): Promise<CallLog[]> {
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(log => ({
      id: log.id,
      contactId: log.contact_id,
      duration: log.duration,
      outcome: log.outcome,
      notes: log.notes,
      nextFollowUp: log.next_follow_up,
      createdAt: log.created_at,
    }));
  }

  // Saved filter operations
  async addSavedFilter(savedFilter: Omit<SavedFilter, 'id'>): Promise<number> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('saved_filters')
      .insert([{
        name: savedFilter.name,
        filter: savedFilter.filter,
        user_id: user.id,
        created_at: savedFilter.createdAt,
      }])
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

    return (data || []).map(filter => ({
      id: filter.id,
      name: filter.name,
      filter: filter.filter,
      createdAt: filter.created_at,
    }));
  }

  async getSavedFilter(id: number): Promise<SavedFilter | undefined> {
    const { data, error } = await supabase
      .from('saved_filters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }

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

  // Clear all data (for testing)
  async clearAll(): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    await Promise.all([
      supabase.from('contacts').delete().eq('user_id', user.id),
      supabase.from('batches').delete().eq('user_id', user.id),
      supabase.from('call_logs').delete().eq('user_id', user.id),
      supabase.from('saved_filters').delete().eq('user_id', user.id),
    ]);
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

export const db = new SupabaseDB();
