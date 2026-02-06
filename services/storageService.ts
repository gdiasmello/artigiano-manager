
import { User, Insumo, Config, HistoryRecord, BlocoId, CalcType } from '../types';

const KEYS = {
  USERS: 'usuarios_cache',
  DNA: 'catalogoDNA_cache',
  CONFIG: 'config_cache',
  HISTORY: 'historico_cache',
  SESSION: 'pm_session'
};

const LEGACY_KEYS = ['pm_usuarios', 'pm_catalogoDNA', 'pm_config', 'pm_historico', 'usuarios', 'catalogoDNA', 'config', 'historico'];

export const storageService = {
  clearOldCache: () => {
    LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
  },

  // Getters de Cache (para carregamento instantâneo antes do Firebase conectar)
  getCachedUsers: (): User[] => {
    const data = localStorage.getItem(KEYS.USERS);
    return data ? JSON.parse(data) : [];
  },
  getCachedDNA: (): Insumo[] => {
    const data = localStorage.getItem(KEYS.DNA);
    return data ? JSON.parse(data) : [];
  },
  getCachedConfig: (): Config | null => {
    const data = localStorage.getItem(KEYS.CONFIG);
    return data ? JSON.parse(data) : null;
  },
  getCachedHistory: (): HistoryRecord[] => {
    const data = localStorage.getItem(KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  },

  // Setters de Cache
  setCacheUsers: (data: User[]) => localStorage.setItem(KEYS.USERS, JSON.stringify(data)),
  setCacheDNA: (data: Insumo[]) => localStorage.setItem(KEYS.DNA, JSON.stringify(data)),
  setCacheConfig: (data: Config) => localStorage.setItem(KEYS.CONFIG, JSON.stringify(data)),
  setCacheHistory: (data: HistoryRecord[]) => localStorage.setItem(KEYS.HISTORY, JSON.stringify(data)),

  // Sessão Local
  getSession: (): User | null => {
    const data = localStorage.getItem(KEYS.SESSION);
    return data ? JSON.parse(data) : null;
  },
  setSession: (user: User | null) => localStorage.setItem(KEYS.SESSION, JSON.stringify(user)),

  fullReset: () => {
    localStorage.clear();
    window.location.reload();
  }
};
