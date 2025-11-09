/**
 * Special Requirements Management
 * 
 * Manages the editable list of special requirements that can be selected for trips
 */
import { supabase } from './minimal-supabase';

export interface SpecialRequirement {
  id: string;
  name: string;
  is_custom: boolean; // If true, allows custom text input
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const specialRequirementsStorage = {
  async getAll() {
    const { data, error } = await supabase
      .from('special_requirements')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('special_requirements')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(requirement: Omit<SpecialRequirement, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('special_requirements')
      .insert(requirement)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<SpecialRequirement>) {
    const { data, error } = await supabase
      .from('special_requirements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    // Soft delete by setting is_active to false
    const { data, error } = await supabase
      .from('special_requirements')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

