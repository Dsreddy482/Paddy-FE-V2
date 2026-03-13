import { create } from 'zustand';
import { User } from '../types/auth';
import { Season } from '../types/season';

interface AuthState {
  user: User | null;
  token: string | null;
  selectedSeason: Season | null;
  setAuth: (user: User, token: string) => void;
  setSelectedSeason: (season: Season | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  selectedSeason: null,
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token });
  },
  setSelectedSeason: (season) => {
    if (season) {
      localStorage.setItem('selectedSeasonId', season.id);
    } else {
      localStorage.removeItem('selectedSeasonId');
    }
    set({ selectedSeason: season });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('selectedSeasonId');
    set({ user: null, token: null, selectedSeason: null });
  },
}));