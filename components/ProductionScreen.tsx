
import React, { useState } from 'react';

interface ProductionScreenProps {
  onFinish: (bolinhas: number, text: string) => void;
  isNight: boolean;
}

const ProductionScreen: React.FC<ProductionScreenProps> = ({ onFinish, isNight }) => {
  const [qtdBolinhas, setQtdBolinhas] = useState<number>(0);
  const [flourInput, setFlourInput] = useState<string>('');
  const [mode, setMode] = useState<'bolinhas' | 'farinha'>('bolinhas');

  const GRAMS_PER_BOLINHA = 133;

  const calculateFromBolinhas = (qtd: number) => {
    return {
      farinha: (qtd * GRAMS_PER_BOLINHA) / 1000,
      sal: Math.ceil(qtd * 4),
      levain: Math.ceil((qtd * GRAMS_PER_BOLINHA) * 0.06),
      aguaTotal: Math.ceil((qtd * GRAMS_PER_BOLINHA) * 0.70)
    };
  };

  const calculateFromFlour = (kg: number) => {
    const totalGrams = kg * 1000;
    const bolinhas = Math.floor(totalGrams / GRAMS_PER_BOLINHA);
    return {
      bolinhas,
      sal: Math.ceil(bolinhas * 4),
      levain: Math.ceil(totalGrams * 0.06),
      aguaTotal: Math.ceil(totalGrams * 0.70)
    };
  };

  const results = mode === 'bolinhas' 
    ? calculateFromBolinhas(qtdBolinhas) 
    : calculateFromFlour(parseFloat(flourInput) || 0);

  const aguaMineral = Math.ceil(results.aguaTotal * 0.70);
  const gelo = Math.ceil(results.aguaTotal * 0.30);

  const cardClass = isNight ? 'bg-[#1E1E1E] text-white border-white/10' : 'bg-white text-gray-800 border-gray-100';
  const inputClass = isNight ? 'bg-[#2A2A2A] text-[#D4AF37] border-white/10' : 'bg-gray-50 text-[#D4AF37] border-gray-100';

  return (
    <div className="p-4 space-y-4 animate-fadeIn">
      <div className={`rounded-3xl p-6 shadow-xl border overflow-hidden relative ${cardClass}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#D4AF37] rounded-full flex items-center justify-center text-white text-xl shadow-lg">
              <i className="fas fa-calculator"></i>
            </div>
            <h3 className="font-black text-xl">Massa Inversa</h3>
          </div>
          <button 
            onClick={() => setMode(mode === 'bolinhas' ? 'farinha' : 'bolinhas')}
            className="text-[10px] font-black uppercase tracking-widest bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1 rounded-full border border-[#D4AF37]/30"
          >
            Trocar Modo
          </button>
        </div>

        <div className="mb-8">
          <label className="text-[10px] font-black opacity-50 uppercase tracking-widest block mb-2">
            {mode === 'bolinhas' ? 'Quantidade de Bolinhas' : 'Total de Farinha (KG)'}
          </label>
          <div className="flex items-center gap-4">
            {mode === 'bolinhas' ? (
              <input 
                type="number" 
                inputMode="numeric"
                className={`flex-1 p-4 rounded-2xl border-2 text-3xl font-black outline-none ${inputClass}`}
                placeholder="0"
                value={qtdBolinhas || ''}
                onChange={(e) => setQtdBolinhas(parseInt(e.target.value) || 0)}
              />
            ) : (
              <input 
                type="number" 
                inputMode="decimal"
                className={`flex-1 p-4 rounded-2xl border-2 text-3xl font-black outline-none ${inputClass}`}
                placeholder="0.0"
                value={flourInput}
                onChange={(e) => setFlourInput(e.target.value)}
              />
            )}
            <span className="text-xl font-black opacity-30 uppercase">{mode === 'bolinhas' ? 'un' : 'kg'}</span>
          </div>
        </div>

        {(qtdBolinhas > 0 || flourInput) && (
          <div className="space-y-3 animate-slideUp">
             {mode === 'farinha' && (
              <div className={`flex justify-between items-center p-3 rounded-xl ${isNight ? 'bg-white/5' : 'bg-gray-50'}`}>
                <span className="font-bold opacity-70">Resultado em Bolinhas</span>
                <span className="font-black text-[#D4AF37]">{(results as any).bolinhas} un</span>
              </div>
            )}
            <div className={`flex justify-between items-center p-3 rounded-xl ${isNight ? 'bg-white/5' : 'bg-gray-50'}`}>
              <span className="font-bold opacity-70">Farinha Necessária</span>
              <span className="font-black">{(results as any).farinha || flourInput} KG</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <span className="font-bold text-blue-400">Água Mineral (70%)</span>
              <span className="font-black text-blue-500">{aguaMineral}g</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
              <span className="font-bold text-cyan-400">Gelo (30%)</span>
              <span className="font-black text-cyan-500">{gelo}g</span>
            </div>
            <div className={`flex justify-between items-center p-3 rounded-xl ${isNight ? 'bg-white/5' : 'bg-gray-50'}`}>
              <span className="font-bold opacity-70">Sal</span>
              <span className="font-black">{results.sal}g</span>
            </div>
            
            <div className={`mt-6 p-4 rounded-2xl border ${isNight ? 'bg-[#D4AF37]/5 border-[#D4AF37]/10 text-white/80' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
              <h4 className="text-[10px] font-black uppercase mb-2"><i className="fas fa-info-circle mr-1"></i> Protocolo de Sequência</h4>
              <p className="text-[11px] leading-relaxed font-semibold">
                1. Misturar Farinha e Fermento.<br/>
                2. Adicionar Água e Gelo.<br/>
                3. Bater por 5min.<br/>
                4. Adicionar Sal e finalizar batida.
              </p>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => {
          const b = mode === 'bolinhas' ? qtdBolinhas : (results as any).bolinhas;
          // Fix: Explicitly cast 'results' to 'any' to resolve type mismatch on 'farinha' property within union type
          const text = `*REGISTRO DE MASSA*\nModo: ${mode === 'bolinhas' ? 'Direto' : 'Inverso'}\nBolinhas: ${b} un\nFarinha: ${mode === 'bolinhas' ? (results as any).farinha : flourInput} KG`;
          onFinish(b, text);
        }}
        disabled={qtdBolinhas <= 0 && !flourInput}
        className="w-full py-5 rounded-2xl bg-[#008C45] text-white font-black text-lg shadow-xl shadow-green-900/20 active:scale-95 disabled:opacity-50 transition-all uppercase tracking-widest"
      >
        Finalizar Produção
      </button>
    </div>
  );
};

export default ProductionScreen;
