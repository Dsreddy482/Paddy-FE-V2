export interface Season {
  id: string;
  name: string;
  year: number;
  season_number: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSeasonData {
  name: string;
  year: number;
  season_number: string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
}

export interface UpdateSeasonData {
  name?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}
