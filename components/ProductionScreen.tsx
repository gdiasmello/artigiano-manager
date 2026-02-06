
import React, { useState } from 'react';

interface ProductionScreenProps {
  onFinish: (bolinhas: number) => void;
}

const ProductionScreen: React.FC<ProductionScreenProps> = ({ onFinish }) => {
  const [qtdBolinhas, setQtdBolinhas] = useState<number>(0);

  const receita = {
    farinha: Math.ceil(qtdBolinhas * 133),
    sal: Math.ceil(qtdBolinhas * 4),
    levain: Math.ceil((qtdBolinhas * 133) * 0.06),
    aguaTotal: Math.ceil((qtdBolinhas * 133) * 0.70)
  };

  const aguaMineral = Math.ceil(receita.aguaTotal * 0.70);
  const gelo = Math.ceil(receita.aguaTotal * 0.30);

  return (
    <div className="p-4 space-y-4 animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[#D4AF37] rounded-full flex items-center justify-center text-white text-xl shadow-lg">
            <i className="fas fa-calculator"></i>
          </div>
          <h3 className="font-black text-xl text-gray-800">Calculadora de Massa</h3>
        </div>

        <div className="mb-8">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Meta de Produção</label>
          <div className="flex items-center gap-4">
            <input 
              type="number" 
              inputMode="numeric"
              className="flex-1 p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 text-3xl font-black text-[#D4AF37] focus:border-[#D4AF37] outline-none"
              placeholder="0"
              value={qtdBolinhas || ''}
              onChange={(e) => setQtdBolinhas(parseInt(e.target.value) || 0)}
            />
            <span className="text-xl font-black text-gray-300">BOLINHAS</span>
          </div>
        </div>

        {qtdBolinhas > 0 && (
          <div className="space-y-3 animate-slideUp">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="font-bold text-gray-600">Farinha (133g/un)</span>
              <span className="font-black text-[#1f2937]">{receita.farinha}g</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <span className="font-bold text-blue-700">Água Mineral (70%)</span>
              <span className="font-black text-blue-800">{aguaMineral}g</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-cyan-50/50 rounded-xl border border-cyan-100">
              <span className="font-bold text-cyan-700">Gelo (30%)</span>
              <span className="font-black text-cyan-800">{gelo}g</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="font-bold text-gray-600">Levain (6%)</span>
              <span className="font-black text-[#1f2937]">{receita.levain}g</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="font-bold text-gray-600">Sal (4g/un)</span>
              <span className="font-black text-[#1f2937]">{receita.sal}g</span>
            </div>
            
            <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <h4 className="text-[10px] font-black text-amber-700 uppercase mb-2"><i className="fas fa-info-circle mr-1"></i> Protocolo de Sequência</h4>
              <p className="text-[11px] text-amber-800 leading-relaxed font-semibold">
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
        onClick={() => onFinish(qtdBolinhas)}
        disabled={qtdBolinhas <= 0}
        className="w-full py-5 rounded-2xl bg-[#008C45] text-white font-black text-lg shadow-xl shadow-green-900/20 active:scale-95 disabled:opacity-50 transition-all uppercase tracking-widest"
      >
        Finalizar & Registrar
      </button>
    </div>
  );
};

export default ProductionScreen;
