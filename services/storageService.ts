
import { User, Insumo, Config, HistoryRecord, BlocoId, CalcType } from '../types';

const KEYS = {
  USERS: 'pm_users',
  DNA: 'pm_dna',
  CONFIG: 'pm_config',
  HISTORY: 'pm_history',
  SESSION: 'pm_session'
};

const DEFAULT_DNA: Insumo[] = [
  { id: '1', nome: 'Mussarela', bloco: BlocoId.INSUMOS, un_contagem: 'un', meta: 20, tipo_calculo: CalcType.CAIXA, fator: 2, locais: ['Geladeira forno', 'Quartinho'] },
  { id: '2', nome: 'Tomate', bloco: BlocoId.SACOLAO, un_contagem: 'un', meta: 30, tipo_calculo: CalcType.DIRETO, fator: 1, locais: ['Estoque seco'] },
  { id: '3', nome: 'Farinha 00', bloco: BlocoId.INSUMOS, un_contagem: 'saco', meta: 50, tipo_calculo: CalcType.CAIXA, fator: 10, locais: ['Quartinho'] }
];

const DEFAULT_CONFIG: Config = {
  rota: ['Estoque seco', 'Geladeira forno', 'Freezer cong.', 'Freezer Bufulas', 'Cozinha freela', 'Quartinho'],
  destinos: {
    sacolao: '5511999999999',
    insumos: '5511988888888'
  },
  checklist: ['Ligar forno', 'Verificar gás', 'Limpar bancadas', 'Conferir validade'],
  notices: 'Equipe, hoje o movimento será forte! Foco na higienização.',
  isLocked: false
};

export const storageService = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(KEYS.USERS);
    return data ? JSON.parse(data) : [];
  },
  saveUsers: (users: User[]) => localStorage.setItem(KEYS.USERS, JSON.stringify(users)),

  getDNA: (): Insumo[] => {
    const data = localStorage.getItem(KEYS.DNA);
    return data ? JSON.parse(data) : DEFAULT_DNA;
  },
  saveDNA: (dna: Insumo[]) => localStorage.setItem(KEYS.DNA, JSON.stringify(dna)),

  getConfig: (): Config => {
    const data = localStorage.getItem(KEYS.CONFIG);
    return data ? JSON.parse(data) : DEFAULT_CONFIG;
  },
  saveConfig: (config: Config) => localStorage.setItem(KEYS.CONFIG, JSON.stringify(config)),

  getHistory: (): HistoryRecord[] => {
    const data = localStorage.getItem(KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  },
  addHistory: (record: Omit<HistoryRecord, 'id' | 'timestamp'>) => {
    const history = storageService.getHistory();
    const newRecord: HistoryRecord = { 
      ...record, 
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    localStorage.setItem(KEYS.HISTORY, JSON.stringify([newRecord, ...history]));
  },

  getSession: (): User | null => {
    const data = localStorage.getItem(KEYS.SESSION);
    return data ? JSON.parse(data) : null;
  },
  setSession: (user: User | null) => localStorage.setItem(KEYS.SESSION, JSON.stringify(user))
};
