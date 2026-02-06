
import React, { useState, useMemo } from 'react';
import { ChecklistItem } from '../types';
import { audio } from '../services/audioService';

interface ChecklistScreenProps {
  items: ChecklistItem[];
  onFinish: (summary: string) => void;
  userName: string;
  isNight: boolean;
}

const ChecklistScreen: React.FC<ChecklistScreenProps> = ({ items, onFinish, userName, isNight }) => {
  const [localItems, setLocalItems] = useState<ChecklistItem[]>(items);
  const [activeTab, setActiveTab] = useState<'abertura' | 'turno' | 'fechamento'>('abertura');

  const progress = useMemo(() => {
    if (localItems.length === 0) return 0;
    const concluded = localItems.filter(i => i.concluida).length;
    return Math.round((concluded / localItems.length) * 100);
  }, [localItems]);

  const toggleItem = (id: string) => {
    setLocalItems(prev => prev.map(item => {
      if (item.id === id) {
        const newState = !item.concluida;
        if (newState) {
          audio.playCash();
          if (navigator.vibrate) navigator.vibrate(15);
        }
        return { ...item, concluida: newState };
      }
      return item;
    }));
  };

  const filtered = localItems.filter(i => i.categoria === activeTab);

  const handleFinish = () => {
    const total = localItems.length;
    const ok = localItems.filter(i => i.concluida).length;
    const summary = `*CHECKLIST OPERACIONAL*\nResponsável: ${userName}\nStatus: ${ok}/${total} concluídos (${progress}%)\nData: ${new Date().toLocaleString()}\n\n_Checklist finalizado com sucesso._`;
    audio.playSuccess();
    onFinish(summary);
  };

  return (
    <div className="p-4 space-y-6 animate-fadeIn pb-24">
      {/* Progress Bar Tricolore */}
      <div className={`sticky top-0 z-30 p-4 rounded-3xl glass shadow-xl ${isNight ? 'bg-black/40' : 'bg-white/80'}`}>
        <div className="flex justify-between items-end mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#008C45]">Progresso Operacional</span>
          <span className="text-xl font-black text-[#CD212A]">{progress}%</span>
        </div>
        <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden flex">
          <div className="h-full bg-[#008C45] transition-all duration-500" style={{ width: `${Math.min(progress, 33)}%` }}></div>
          <div className="h-full bg-white transition-all duration-500" style={{ width: `${progress > 33 ? Math.min(progress - 33, 34) : 0}%` }}></div>
          <div className="h-full bg-[#CD212A] transition-all duration-500" style={{ width: `${progress > 67 ? progress - 67 : 0}%` }}></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-200/50 rounded-2xl">
        {(['abertura', 'turno', 'fechamento'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); audio.playPop(); }}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
              activeTab === tab ? 'bg-white shadow-md text-[#008C45]' : 'text-gray-500'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map(item => (
          <div 
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={`p-5 rounded-[2rem] border transition-all flex items-center gap-4 active:scale-95 cursor-pointer ${
              item.concluida 
                ? (isNight ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200')
                : (isNight ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100')
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
              item.concluida ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
            }`}>
              {item.concluida && <i className="fas fa-check text-xs"></i>}
            </div>
            <span className={`text-sm font-bold flex-1 ${item.concluida ? 'opacity-50 line-through' : ''}`}>
              {item.tarefa}
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center py-10 text-gray-400 italic text-sm">Nenhuma tarefa nesta categoria.</p>
        )}
      </div>

      <button 
        onClick={handleFinish}
        className="w-full py-5 bg-[#008C45] text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-green-900/20 active:scale-95 transition-all uppercase"
      >
        Finalizar Turno
      </button>
    </div>
  );
};

export default ChecklistScreen;
