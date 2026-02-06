
import React, { useState, useMemo, useEffect } from 'react';
import { Config, Insumo, BlocoId, ContagemState, ObsState, QualityState, CalcType } from '../types';
import { audio } from '../services/audioService';

interface InventoryScreenProps {
  blocoId: BlocoId;
  config: Config;
  dna: Insumo[];
  onFinish: (summary: string) => void;
  onBack: () => void;
  userName: string;
  isNight: boolean;
}

const InventoryScreen: React.FC<InventoryScreenProps> = ({ blocoId, config, dna, onFinish, onBack, userName, isNight }) => {
  const [localIndex, setLocalIndex] = useState(0);
  const [contagem, setContagem] = useState<ContagemState>({});
  const [obs, setObs] = useState<ObsState>({});
  const [quality, setQuality] = useState<QualityState>({});

  const localAtual = config.rota[localIndex];

  useEffect(() => {
    audio.playPop();
  }, [localIndex]);

  const itensFiltrados = useMemo(() => {
    return dna.filter(item => {
      const matchBloco = item.bloco === blocoId;
      const matchLocal = item.locais.includes(localAtual);
      return matchBloco && matchLocal;
    });
  }, [blocoId, dna, localAtual]);

  const handleInputChange = (itemNome: string, val: string, meta: number) => {
    const num = parseFloat(val) || 0;
    if (val !== '') {
        audio.playCash();
        if (num > 0 && num < meta * 0.2) audio.playAlert();
    }
    setContagem(prev => ({
      ...prev,
      [localAtual]: { ...prev[localAtual], [itemNome]: num }
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
    const horaNum = now.getHours();
    const saudacaoVar = horaNum < 12 ? 'Bom dia' : (horaNum < 18 ? 'Boa tarde' : 'Boa noite');
    const dataVar = now.toLocaleDateString('pt-BR');
    const horaVar = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const blocoNome = blocoId.toUpperCase();

    const replaceVars = (template: string) => {
      if (!template) return '';
      return template
        .replace(/\[saudacao\]/g, saudacaoVar)
        .replace(/\[nome\]/g, userName)
        .replace(/\[bloco\]/g, blocoNome)
        .replace(/\[data\]/g, dataVar)
        .replace(/\[hora\]/g, horaVar);
    };

    let summary = replaceVars(config.templateSaudacao || '*[saudacao]! Segue lista de [bloco]:*') + '\n\n';
    
    const totals: Record<string, number> = {};
    const allObs: Record<string, string[]> = {};
    const allQuality: Record<string, string[]> = {};

    Object.keys(contagem).forEach(loc => {
      Object.entries(contagem[loc]).forEach(([name, val]) => {
        totals[name] = (totals[name] || 0) + (val as number);
      });
    });

    [obs, quality].forEach((state, idx) => {
      Object.keys(state).forEach(loc => {
        // Fix: Explicitly cast 'val' to string to avoid TypeScript 'unknown' error when pushing to string array
        Object.entries(state[loc]).forEach(([name, val]) => {
          if (val) {
            const target = idx === 0 ? allObs : allQuality;
            if (!target[name]) target[name] = [];
            target[name].push(val as string);
          }
        });
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
        let calcNote = '';

        if (item.tipo_calculo === CalcType.CAIXA) {
          finalQtd = Math.ceil(falta / (item.fator || 1));
          finalUn = item.fator > 1 ? 'caixas' : item.un_contagem;
          if (item.fator > 1) calcNote = ` (Falta: ${falta}${item.un_contagem})`;
        } else if (item.tipo_calculo === CalcType.KG) {
          finalQtd = (falta * (item.fator || 1)).toFixed(1).replace('.0', '');
          finalUn = 'Kg';
        } else {
          finalQtd = falta;
          finalUn = item.un_contagem;
        }

        if (Number(finalQtd) > 0) {
          summary += `• ${finalQtd} ${finalUn} ${item.nome}${calcNote}`;
          if (allQuality[item.nome]) summary += ` _[Qualidade: ${allQuality[item.nome].join(', ')}]_`;
          if (allObs[item.nome]) summary += ` _(Obs: ${allObs[item.nome].join(', ')})_`;
          summary += `\n`;
          hasItems = true;
        }
      }
    });

    if (!hasItems) summary += "_Estoque em dia! Nada a pedir._\n";
    summary += '\n' + replaceVars(config.templateAgradecimento || '_Enviado via PiZZA Master Pro 🍕_');
    
    onFinish(summary);
  };

  const isSacolao = blocoId === BlocoId.SACOLAO;

  return (
    <div className={`p-4 flex flex-col gap-4 animate-fadeIn pb-24 ${isNight ? 'text-white' : ''}`}>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {config.rota.map((local, idx) => (
          <button
            key={local}
            onClick={() => setLocalIndex(idx)}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              localIndex === idx ? 'bg-[#008C45] text-white shadow-lg' : 'bg-gray-200 text-gray-500'
            }`}
          >
            {local}
          </button>
        ))}
      </div>

      <div className={`rounded-[2.5rem] p-6 shadow-2xl border ${isNight ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-gray-100'}`}>
        <h3 className="text-[10px] font-black text-gray-400 uppercase mb-6 flex items-center gap-2 tracking-[0.2em]">
          <i className="fas fa-map-marker-alt text-[#CD212A]"></i>
          Setor: {localAtual}
        </h3>

        <div className={`grid ${isSacolao ? 'grid-cols-1' : 'grid-cols-1'} gap-4`}>
          {itensFiltrados.map(item => (
            <div key={item.id} className={`p-5 rounded-[2rem] border transition-all ${isNight ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${isNight ? 'bg-white/10 text-white' : 'bg-white text-gray-800 shadow-sm'}`}>
                    <i className={`fas ${item.icon || (isSacolao ? 'fa-leaf' : 'fa-box')}`}></i>
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase leading-none mb-1">{item.nome}</h4>
                    <p className="text-[9px] font-black opacity-40 uppercase tracking-tighter">Meta: {item.meta} {item.un_contagem}</p>
                  </div>
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  className={`w-16 p-3 text-center font-black rounded-2xl border outline-none transition-all ${
                    isNight ? 'bg-black/20 border-white/10 text-white focus:border-[#008C45]' : 'bg-white border-gray-200 focus:border-[#008C45]'
                  }`}
                  value={contagem[localAtual]?.[item.nome] || ''}
                  onChange={(e) => handleInputChange(item.nome, e.target.value, item.meta)}
                />
              </div>

              <div className="flex gap-2">
                 <input
                  type="text"
                  placeholder="Obs..."
                  className={`flex-1 text-[10px] p-3 bg-transparent border-b border-white/10 outline-none font-bold`}
                  value={obs[localAtual]?.[item.nome] || ''}
                  onChange={(e) => setObs(prev => ({...prev, [localAtual]: {...prev[localAtual], [item.nome]: e.target.value}}))}
                />
                {isSacolao && (
                  <select 
                    className={`text-[9px] font-black uppercase p-2 bg-transparent border-b border-white/10 outline-none`}
                    value={quality[localAtual]?.[item.nome] || ''}
                    onChange={(e) => setQuality(prev => ({...prev, [localAtual]: {...prev[localAtual], [item.nome]: e.target.value}}))}
                  >
                    <option value="">Qualidade</option>
                    <option value="Ótimo">Ótimo</option>
                    <option value="Médio">Médio</option>
                    <option value="Maduro">Maduro</option>
                    <option value="Ruim">Ruim</option>
                  </select>
                )}
              </div>
              {item.instrucoes && (
                <p className="mt-3 text-[9px] font-bold opacity-30 italic leading-tight">
                  <i className="fas fa-info-circle mr-1"></i> {item.instrucoes}
                </p>
              )}
            </div>
          ))}
          {itensFiltrados.length === 0 && (
            <p className="text-center py-10 text-gray-400 italic text-[10px] uppercase tracking-widest">Nada nesta rota.</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-4 sticky bottom-4">
        <button onClick={onBack} className="flex-1 py-5 rounded-2xl bg-gray-200 text-gray-600 font-black text-xs uppercase hover:bg-gray-300 transition-all">VOLTAR</button>
        <button onClick={handleNext} className="flex-2 py-5 rounded-2xl bg-[#008C45] text-white font-black text-xs shadow-xl active:scale-95 transition-all uppercase tracking-widest">
          {localIndex < config.rota.length - 1 ? 'PRÓXIMO LOCAL' : 'FECHAR LISTA'}
        </button>
      </div>
    </div>
  );
};

export default InventoryScreen;
