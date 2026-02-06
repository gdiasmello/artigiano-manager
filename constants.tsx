
import React from 'react';
import { BlocoId } from './types';

export const COLORS = {
  GREEN: '#008C45',
  WHITE: '#FDFBF7',
  RED: '#CD212A',
  GOLD: '#D4AF37',
  DARK: '#1f2937',
};

export const BLOCAS_CONFIG = [
  { id: BlocoId.SACOLAO, nome: 'SACOLÃO', icon: 'fa-leaf', color: 'bg-[#008C45]' },
  { id: BlocoId.INSUMOS, nome: 'INSUMOS', icon: 'fa-box', color: 'bg-[#CD212A]' },
  { id: BlocoId.PRODUCAO, nome: 'PRODUÇÃO', icon: 'fa-mortar-pestle', color: 'bg-[#D4AF37]' },
  { id: BlocoId.GELO, nome: 'GELO', icon: 'fa-cube', color: 'bg-[#0ea5e9]' },
  { id: BlocoId.CHECKLIST, nome: 'CHECKLIST', icon: 'fa-clipboard-check', color: 'bg-[#fb7185]' },
  { id: BlocoId.BEBIDAS, nome: 'BEBIDAS', icon: 'fa-wine-bottle', color: 'bg-[#8b5cf6]' },
  { id: BlocoId.LIMPEZA, nome: 'LIMPEZA', icon: 'fa-hands-bubbles', color: 'bg-[#3b82f6]' }
];

export const MASTER_USER = {
  id: 'master',
  nome: 'Gabriel',
  user: 'gabriel',
  pass: '1821',
  permissoes: {
    admin: true,
    sacolao: true,
    insumos: true,
    producao: true,
    gelo: true,
    checklist: true,
    bebidas: true,
    limpeza: true
  }
};
