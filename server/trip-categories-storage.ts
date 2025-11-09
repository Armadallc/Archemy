/**
 * Trip Categories Storage for New Architectural Blueprint
 * 
 * Manages trip categories (Medical, Legal, Personal, Program, 12-Step, Group, Staff, Carpool)
 * with program-level organization and corporate client awareness
 */
import { supabase } from './db';

export interface TripCategory {
  id: string;
  program_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  program?: {
    id: string;
    name: string;
    corporate_client_id: string;
    corporateClient?: {
      id: string;
      name: string;
    };
  };
}

export const tripCategoriesStorage = {
  async getAllTripCategories() {
    const { data, error } = await supabase
      .from('trip_categories')
      .select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `)
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async getTripCategory(id: string) {
    const { data, error } = await supabase
      .from('trip_categories')
      .select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getTripCategoriesByProgram(programId: string) {
    const { data, error } = await supabase
      .from('trip_categories')
      .select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `)
      .eq('program_id', programId)
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async createTripCategory(category: Omit<TripCategory, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('trip_categories')
      .insert({
        ...category,
        id: `trip_category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateTripCategory(id: string, updates: Partial<TripCategory>) {
    const { data, error } = await supabase
      .from('trip_categories')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteTripCategory(id: string) {
    const { data, error } = await supabase
      .from('trip_categories')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
    return data;
  },

  // Get default trip categories for a program
  async getDefaultTripCategories(programId: string) {
    const defaultCategories = [
      { name: 'Medical', description: 'Medical appointments and healthcare visits' },
      { name: 'Legal', description: 'Legal appointments and court visits' },
      { name: 'Personal', description: 'Personal errands and appointments' },
      { name: 'Program', description: 'Program-related activities and meetings' },
      { name: '12-Step', description: '12-Step program meetings and activities' },
      { name: 'Group', description: 'Group activities and outings' },
      { name: 'Staff', description: 'Staff transportation and meetings' },
      { name: 'Carpool', description: 'Carpool and shared transportation' }
    ];

    const categories = [];
    for (const category of defaultCategories) {
      try {
        const newCategory = await this.createTripCategory({
          program_id: programId,
          name: category.name,
          description: category.description,
          is_active: true
        });
        categories.push(newCategory);
      } catch (error) {
        console.log(`Category ${category.name} may already exist for program ${programId}`);
      }
    }

    return categories;
  }
};


