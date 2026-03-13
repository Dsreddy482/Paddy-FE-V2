import { supabase } from './api';
import { Season, CreateSeasonData, UpdateSeasonData } from '../types/season';

export const seasonService = {
  async getAllSeasons(): Promise<Season[]> {
    const { data, error } = await supabase
      .from('seasons')
      .select('*')
      .order('year', { ascending: false })
      .order('season_number', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getActiveSeason(): Promise<Season | null> {
    const { data, error } = await supabase
      .from('seasons')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getSeasonById(id: string): Promise<Season | null> {
    const { data, error } = await supabase
      .from('seasons')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createSeason(seasonData: CreateSeasonData): Promise<Season> {
    const { data, error } = await supabase
      .from('seasons')
      .insert([seasonData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSeason(id: string, updates: UpdateSeasonData): Promise<Season> {
    const { data, error } = await supabase
      .from('seasons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async setActiveSeason(id: string): Promise<Season> {
    const { data, error } = await supabase
      .from('seasons')
      .update({ is_active: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSeason(id: string): Promise<void> {
    const { error } = await supabase
      .from('seasons')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getSeasonsByYear(year: number): Promise<Season[]> {
    const { data, error } = await supabase
      .from('seasons')
      .select('*')
      .eq('year', year)
      .order('season_number', { ascending: true });

    if (error) throw error;
    return data || [];
  }
};
