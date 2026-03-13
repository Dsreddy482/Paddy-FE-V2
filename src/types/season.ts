export interface Season {
  Id: string;
  Name: string;
  Year: number;
  SeasonNumber: string;
  StartDate: string;
  EndDate: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface CreateSeasonData {
  Name: string;
  Year: number;
  SeasonNumber: string;
  StartDate: string;
  EndDate: string;
  IsActive?: boolean;
}

export interface UpdateSeasonData {
  Name?: string;
  StartDate?: string;
  EndDate?: string;
  IsActive?: boolean;
}
