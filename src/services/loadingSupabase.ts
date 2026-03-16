import { createClient } from '@supabase/supabase-js';
import { LoadingEntry, LoadingEntryDetails } from '../types/loading';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const loadingSupabaseService = {
  async getLoadingEntries(): Promise<LoadingEntryDetails[]> {
    try {
      const { data, error } = await supabase
        .from('loading_entries')
        .select(`
          *,
          dealer:dealer_id(id, name, phone_number),
          amali:amali_id(id, name, phone_number)
        `)
        .order('loaded_date', { ascending: false });

      if (error) throw error;

      return (data || []).map((entry: any) => ({
        id: entry.id,
        userId: entry.dealer_id || '',
        lorryNumber: entry.lorry_number,
        loadedDate: entry.loaded_date,
        dealerId: entry.dealer_id || '',
        amaliId: entry.amali_id || '',
        season_id: entry.season_id,
        amaliName: entry.amali?.name || '',
        delaerName: entry.dealer?.name || '',
        totalLoadWeight: entry.total_load_weight,
        totalNoOfBags: entry.total_no_of_bags,
        status: entry.status,
        paymentDone: entry.payment_done,

        isCombinedOperation: entry.is_combined_operation,
        combinedTeam: entry.is_combined_operation ? {
          teamId: entry.combined_team_id,
          teamName: entry.combined_team_name || '',
          ratePerBag: entry.combined_rate_per_bag || 0
        } : undefined,

        pothaTeam: !entry.is_combined_operation && entry.potha_team_name ? {
          teamId: entry.potha_team_id,
          teamName: entry.potha_team_name,
          ratePerBag: entry.potha_rate_per_bag || 0
        } : undefined,

        kataTeam: !entry.is_combined_operation && entry.kata_team_name ? {
          teamId: entry.kata_team_id,
          teamName: entry.kata_team_name,
          ratePerBag: entry.kata_rate_per_bag || 0
        } : undefined,

        loadingTeam: !entry.is_combined_operation && entry.loading_team_name ? {
          teamId: entry.loading_team_id,
          teamName: entry.loading_team_name,
          ratePerBag: entry.loading_rate_per_bag || 0
        } : undefined,
      }));
    } catch (error) {
      console.error('Failed to fetch loading entries:', error);
      throw error;
    }
  },

  async createLoadingEntry(data: LoadingEntry): Promise<LoadingEntry> {
    try {
      const insertData: any = {
        lorry_number: data.lorryNumber,
        loaded_date: data.loadedDate,
        dealer_id: data.dealerId,
        amali_id: data.amaliId,
        season_id: data.season_id,
        total_load_weight: data.totalLoadWeight || 0,
        total_no_of_bags: data.totalNoOfBags || 0,
        status: data.status || 'pending',
        payment_done: data.paymentDone || false,
        is_combined_operation: data.isCombinedOperation || false,
      };

      if (data.isCombinedOperation && data.combinedTeam) {
        insertData.combined_team_id = data.combinedTeam.teamId;
        insertData.combined_team_name = data.combinedTeam.teamName;
        insertData.combined_rate_per_bag = data.combinedTeam.ratePerBag;
      } else {
        if (data.pothaTeam) {
          insertData.potha_team_id = data.pothaTeam.teamId;
          insertData.potha_team_name = data.pothaTeam.teamName;
          insertData.potha_rate_per_bag = data.pothaTeam.ratePerBag;
        }
        if (data.kataTeam) {
          insertData.kata_team_id = data.kataTeam.teamId;
          insertData.kata_team_name = data.kataTeam.teamName;
          insertData.kata_rate_per_bag = data.kataTeam.ratePerBag;
        }
        if (data.loadingTeam) {
          insertData.loading_team_id = data.loadingTeam.teamId;
          insertData.loading_team_name = data.loadingTeam.teamName;
          insertData.loading_rate_per_bag = data.loadingTeam.ratePerBag;
        }
      }

      const { data: newEntry, error } = await supabase
        .from('loading_entries')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        id: newEntry.id,
      };
    } catch (error) {
      console.error('Failed to create loading entry:', error);
      throw error;
    }
  },

  async updateLoadingEntry(id: string, data: LoadingEntry): Promise<LoadingEntry> {
    try {
      const updateData: any = {
        lorry_number: data.lorryNumber,
        loaded_date: data.loadedDate,
        dealer_id: data.dealerId,
        amali_id: data.amaliId,
        season_id: data.season_id,
        total_load_weight: data.totalLoadWeight || 0,
        total_no_of_bags: data.totalNoOfBags || 0,
        status: data.status || 'pending',
        payment_done: data.paymentDone || false,
        is_combined_operation: data.isCombinedOperation || false,
        updated_at: new Date().toISOString(),
      };

      if (data.isCombinedOperation && data.combinedTeam) {
        updateData.combined_team_id = data.combinedTeam.teamId;
        updateData.combined_team_name = data.combinedTeam.teamName;
        updateData.combined_rate_per_bag = data.combinedTeam.ratePerBag;
        updateData.potha_team_id = null;
        updateData.potha_team_name = null;
        updateData.potha_rate_per_bag = 0;
        updateData.kata_team_id = null;
        updateData.kata_team_name = null;
        updateData.kata_rate_per_bag = 0;
        updateData.loading_team_id = null;
        updateData.loading_team_name = null;
        updateData.loading_rate_per_bag = 0;
      } else {
        updateData.combined_team_id = null;
        updateData.combined_team_name = null;
        updateData.combined_rate_per_bag = 0;

        if (data.pothaTeam) {
          updateData.potha_team_id = data.pothaTeam.teamId;
          updateData.potha_team_name = data.pothaTeam.teamName;
          updateData.potha_rate_per_bag = data.pothaTeam.ratePerBag;
        }
        if (data.kataTeam) {
          updateData.kata_team_id = data.kataTeam.teamId;
          updateData.kata_team_name = data.kataTeam.teamName;
          updateData.kata_rate_per_bag = data.kataTeam.ratePerBag;
        }
        if (data.loadingTeam) {
          updateData.loading_team_id = data.loadingTeam.teamId;
          updateData.loading_team_name = data.loadingTeam.teamName;
          updateData.loading_rate_per_bag = data.loadingTeam.ratePerBag;
        }
      }

      const { data: updatedEntry, error } = await supabase
        .from('loading_entries')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        id: updatedEntry.id,
      };
    } catch (error) {
      console.error('Failed to update loading entry:', error);
      throw error;
    }
  },

  async deleteLoadingEntry(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('loading_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete loading entry:', error);
      throw error;
    }
  },

  async calculateTeamPayments(loadingId: string): Promise<{
    pothaPayment: number;
    kataPayment: number;
    loadingPayment: number;
    combinedPayment: number;
    totalPayment: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('loading_entries')
        .select('*')
        .eq('id', loadingId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Loading entry not found');

      const totalBags = data.total_no_of_bags || 0;

      if (data.is_combined_operation) {
        const combinedPayment = totalBags * (data.combined_rate_per_bag || 0);
        return {
          pothaPayment: 0,
          kataPayment: 0,
          loadingPayment: 0,
          combinedPayment,
          totalPayment: combinedPayment
        };
      } else {
        const pothaPayment = totalBags * (data.potha_rate_per_bag || 0);
        const kataPayment = totalBags * (data.kata_rate_per_bag || 0);
        const loadingPayment = totalBags * (data.loading_rate_per_bag || 0);
        const totalPayment = pothaPayment + kataPayment + loadingPayment;

        return {
          pothaPayment,
          kataPayment,
          loadingPayment,
          combinedPayment: 0,
          totalPayment
        };
      }
    } catch (error) {
      console.error('Failed to calculate team payments:', error);
      throw error;
    }
  }
};
