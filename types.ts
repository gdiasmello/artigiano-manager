
export enum UserRole {
  ADM = 'ADM',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF'
}

export type ModuleId = 'massas' | 'estoque' | 'sacolao' | 'check' | 'perfil';

export interface User {
  id: string;
  name: string;
  email: string;
  pin: string;
  role: UserRole;
  birthday?: string;
  termsAccepted?: boolean;
  allowedModules?: ModuleId[];
}

export type Category = 'insumos' | 'sacolao' | 'gelo' | 'limpeza';

export interface StockItem {
  id: string;
  name: string;
  unit: string;
  goal: number;
  boxFactor: number;
  category: Category;
  countsByLocation: Record<string, number>;
}

export interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  category: 'abertura' | 'fechamento' | 'producao';
}

export interface ProductionBatch {
  massas: number;
  farinha: number;
  aguaLiquida: number;
  gelo: number;
  levain: number;
  sal: number;
  timestamp: number;
}
