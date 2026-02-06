
import React, { useState, useMemo } from 'react';
import { Config, Insumo, BlocoId, ContagemState, ObsState, CalcType } from '../types';
import { storageService } from '../services/storageService';

interface InventoryScreenProps {
  blocoId: BlocoId;
  config: Config;
  dna: Insumo[];
  onFinish: (summary: string) => void;
  onBack: () => void;
}

const InventoryScreen: React.FC<InventoryScreenProps> = ({ blocoId, config, dna, onFinish, onBack }) => {
  const [localIndex, setLocalIndex] = useState(0);
  const [contagem, setContagem] = useState<ContagemState>({});
  const [obs, setObs] = useState<ObsState>({});

  const localAtual = config.rota[localIndex];

  const itensFiltrados = useMemo(() => {
    return dna.filter(item => {
      // Logic from legacy: Sacolão is separate, others are grouped or filtered by sector
      if (blocoId === BlocoId.SACOLAO) return item.bloco === BlocoId.SACOLAO && item.locais.includes(localAtual);
      return item.bloco === blocoId && item.locais.includes(localAtual);
    });
  }, [blocoId, dna, localAtual]);

  const handleInputChange = (itemNome: string, val: string) => {
    const num = parseFloat(val) || 0;
    setContagem(prev => ({
      ...prev,
      [localAtual]: {
        ...prev[localAtual],
        [itemNome]: num
      }
    }));
  };

  const handleObsChange = (itemNome: string, val: string) => {
    setObs(prev => ({
      ...prev,
      [localAtual]: {
        ...prev[localAtual],
        [itemNome]: val
      }
    }));
  };

  const handleNext = () => {
    if (localIndex < config.rota.length - 1) {
      setLocalIndex(localIndex + 1);
    } else {
      generateSummary();
    }
  };

  const generateSummary = () => {
    const now = new Date();
    const hora = now.getHours();
    const saudacao = hora < 12 ? 'Bom dia' : (hora < 18 ? 'Boa tarde' : 'Boa noite');
    
    let summary = `*${saudacao}! Segue lista (${blocoId.toUpperCase()}):*\n\n`;
    
    // Aggregate totals from all locations
    const totals: Record<string, number> = {};
    const allObs: Record<string, string[]> = {};

    Object.keys(contagem).forEach(loc => {
      Object.entries(contagem[loc]).forEach(([name, val]) => {
        // Fix: Explicitly cast 'val' as number to resolve type mismatch in arithmetic operation
        totals[name] = (totals[name] || 0) + (val as number);
      });
    });

    Object.keys(obs).forEach(loc => {
      Object.entries(obs[loc]).forEach(([name, val]) => {
        if (val) {
          if (!allObs[name]) allObs[name] = [];
          // Fix: Explicitly cast 'val' as string to resolve type mismatch when pushing to string array
          allObs[name].push(val as string);
        }
      });
    });

    let hasItems = false;
    const itemsOfSector = dna.filter(i => i.bloco === blocoId);

    itemsOfSector.forEach(item => {
      const current = totals[item.nome] || 0;
      if (current < item.meta) {
        const falta = item.meta - current;
        let finalQtd: number | string = 0;
        let finalUn = '';

        if (item.tipo_calculo === CalcType.CAIXA) {
          finalQtd = Math.ceil(falta / (item.fator || 1));
          finalUn = 'Cx';
        } else if (item.tipo_calculo === CalcType.KG) {
          finalQtd = (falta * (item.fator || 1)).toFixed(1).replace('.0', '');
          finalUn = 'Kg';
        } else {
          finalQtd = falta;
          finalUn = item.un_contagem;
        }

        if (Number(finalQtd) > 0) {
          summary += `• ${finalQtd} ${finalUn} ${item.nome}`;
          if (allObs[item.nome]) {
            summary += ` _(${allObs[item.nome].join(', ')})_`;
          }
          summary += `\n`;
          hasItems = true;
        }
      }
    });

    if (!hasItems) summary += "_Estoque em dia! Nada a pedir._\n";
    summary += `\nObrigado! 🍕`;
    onFinish(summary);
  };

  return (
    <div className="p-4 flex flex-col gap-4 animate-fadeIn">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {config.rota.map((local, idx) => (
          <button
            key={local}
            onClick={() => setLocalIndex(idx)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              localIndex === idx ? 'bg-[#008C45] text-white shadow-md' : 'bg-gray-200 text-gray-500'
            }`}
          >
            {local}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-black text-gray-400 uppercase mb-4 flex items-center gap-2">
          <i className="fas fa-map-marker-alt text-[#CD212A]"></i>
          {localAtual}
        </h3>

        <div className="space-y-4">
          {itensFiltrados.map(item => (
            <div key={item.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-gray-800">{item.nome}</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Meta: {item.meta} {item.un_contagem}</p>
                </div>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  className="w-16 p-2 text-center font-black rounded-lg border border-gray-200 focus:border-[#008C45] outline-none"
                  value={contagem[localAtual]?.[item.nome] || ''}
                  onChange={(e) => handleInputChange(item.nome, e.target.value)}
                />
              </div>
              <input
                type="text"
                placeholder="Observações..."
                className="w-full text-xs p-2 bg-transparent border-b border-gray-200 focus:border-[#008C45] outline-none text-gray-600"
                value={obs[localAtual]?.[item.nome] || ''}
                onChange={(e) => handleObsChange(item.nome, e.target.value)}
              />
            </div>
          ))}
          {itensFiltrados.length === 0 && (
            <p className="text-center py-10 text-gray-400 italic text-sm">Nenhum item deste setor neste local.</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-4 sticky bottom-4">
        <button 
          onClick={onBack}
          className="flex-1 py-4 rounded-xl bg-gray-200 text-gray-600 font-bold hover:bg-gray-300 transition-all"
        >
          CANCELAR
        </button>
        <button 
          onClick={handleNext}
          className="flex-1 py-4 rounded-xl bg-[#008C45] text-white font-bold shadow-lg shadow-green-900/20 active:scale-95 transition-all"
        >
          {localIndex < config.rota.length - 1 ? 'PRÓXIMO' : 'FINALIZAR'}
        </button>
      </div>
    </div>
  );
};

export default InventoryScreen;
