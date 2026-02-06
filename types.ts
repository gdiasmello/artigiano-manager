
export enum BlocoId {
  SACOLAO = 'sacolao',
  INSUMOS = 'insumos',
  PRODUCAO = 'producao',
  GELO = 'gelo',
  CHECKLIST = 'checklist',
  BEBIDAS = 'bebidas',
  LIMPEZA = 'limpeza'
}

export enum CalcType {
  DIRETO = 'direto',
  CAIXA = 'cx',
  KG = 'kg'
}

export type UserCargo = 'admin' | 'gerente' | 'pizzaiolo' | 'atendente';

export interface Permissions {
  admin: boolean;
  gerente: boolean;
  [key: string]: boolean | undefined;
}

export interface User {
  id: string;
  nome: string;
  user: string;
  pass: string;
  cargo: UserCargo;
  permissoes: Permissions;
}

export interface Insumo {
  id: string;
  nome: string;
  bloco: BlocoId;
  un_contagem: string;
  meta: number;
  tipo_calculo: CalcType;
  fator: number;
  locais: string[];
}

export interface Config {
  rota: string[];
  destinos: Record<string, string>;
  checklist: string[];
  notices: string;
  isLocked: boolean;
  templateSaudacao: string;
  templateAgradecimento: string;
}

export interface HistoryRecord {
  id: string;
  data: string;
  timestamp: number;
  usuario: string;
  itens: string;
  localizacao?: string;
}

export interface ContagemState {
  [local: string]: Record<string, number>;
}

export interface ObsState {
  [local: string]: Record<string, string>;
}
