
import React, { useState } from 'react';
import { Insumo, BlocoId, CalcType } from '../types';
import { firebaseService } from '../services/firebaseService';
import { audio } from '../services/audioService';

interface DnaScreenProps {
  dna: Insumo[];
  onBack: () => void;
  isNight: boolean;
}

const DnaScreen: React.FC<DnaScreenProps> = ({ dna, onBack, isNight }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<Insumo | null>(null);

  const filteredDna = dna.filter(item => 
    item.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (item: Insumo) => {
    try {
      const updatedDna = dna.map(i => i.id === item.id ? item : i);
      await firebaseService.saveDNA(updatedDna);
      setEditingItem(null);
      audio.playSuccess();
    } catch (e) {
      alert("Erro ao salvar DNA");
    }
  };

  const cardClass = isNight ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-gray-100';

  return (
    <div className="p-4 space-y-4 animate-fadeIn pb-32">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-3 bg-gray-200 rounded-2xl"><i className="fas fa-arrow-left"></i></button>
        <h2 className="text-xl font-black uppercase tracking-tighter">Catálogo DNA</h2>
      </div>

      <input 
        type="text" 
        placeholder="Buscar insumo..." 
        className={`w-full p-4 rounded-2xl border font-bold ${isNight ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100'}`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="space-y-3">
        {filteredDna.map(item => (
          <div key={item.id} className={`p-5 rounded-[2rem] border shadow-sm flex justify-between items-center ${cardClass}`}>
            <div>
              <h4 className="font-black text-sm uppercase">{item.nome}</h4>
              <p className="text-[10px] font-bold opacity-40 uppercase">{item.bloco} • Meta: {item.meta} {item.un_contagem}</p>
            </div>
            <button 
              onClick={() => { setEditingItem(item); audio.playPop(); }}
              className="w-10 h-10 rounded-full bg-[#008C45]/10 text-[#008C45] flex items-center justify-center"
            >
              <i className="fas fa-edit"></i>
            </button>
          </div>
        ))}
      </div>

      {editingItem && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[300] flex items-center justify-center p-6">
          <div className={`w-full max-w-sm rounded-[3rem] p-8 shadow-2xl border ${isNight ? 'bg-[#1E1E1E] border-white/10' : 'bg-white'}`}>
            <h3 className="font-black uppercase mb-6 text-[#008C45]">Editar Insumo</h3>
            <div className="space-y-4 mb-8 h-[50vh] overflow-y-auto pr-2 scrollbar-hide">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase opacity-40 ml-2">Nome do Item</label>
                <input className={`w-full p-3 rounded-xl border font-bold text-sm ${isNight ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50'}`} value={editingItem.nome} onChange={e => setEditingItem({...editingItem, nome: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase opacity-40 ml-2">Meta</label>
                  <input type="number" className={`w-full p-3 rounded-xl border font-bold text-sm ${isNight ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50'}`} value={editingItem.meta} onChange={e => setEditingItem({...editingItem, meta: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase opacity-40 ml-2">Fator Caixa</label>
                  <input type="number" className={`w-full p-3 rounded-xl border font-bold text-sm ${isNight ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50'}`} value={editingItem.fator} onChange={e => setEditingItem({...editingItem, fator: parseFloat(e.target.value) || 1})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase opacity-40 ml-2">Tipo de Cálculo</label>
                <select className={`w-full p-3 rounded-xl border font-bold text-sm ${isNight ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50'}`} value={editingItem.tipo_calculo} onChange={e => setEditingItem({...editingItem, tipo_calculo: e.target.value as CalcType})}>
                  <option value={CalcType.DIRETO}>Direto (Falta)</option>
                  <option value={CalcType.CAIXA}>Caixa (Arredondado)</option>
                  <option value={CalcType.KG}>Quilo (Peso)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setEditingItem(null)} className="flex-1 font-black text-xs text-gray-400">CANCELAR</button>
              <button onClick={() => handleSave(editingItem)} className="flex-1 py-4 bg-[#008C45] text-white rounded-2xl font-black text-sm">SALVAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DnaScreen;
