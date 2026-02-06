
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

export interface Permissions {
  admin: boolean;
  [key: string]: boolean;
}

export interface User {
  id: string;
  nome: string;
  user: string;
  pass: string;
  cargo?: string;
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
}

export interface HistoryRecord {
  id: string;
  data: string;
  usuario: string;
  itens: string;
}

export interface ContagemState {
  [local: string]: Record<string, number>;
}

export interface ObsState {
  [local: string]: Record<string, string>;
}
