
import React, { useState, useMemo, useEffect } from 'react';
import { HistoryRecord, User } from '../types';

interface HistoryScreenProps {
  history: HistoryRecord[];
  users: User[];
  onClear: () => void;
  isNight: boolean;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ history, users, onClear, isNight }) => {
  const [filterUser, setFilterUser] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [limit, setLimit] = useState(10);

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchUser = filterUser ? item.usuario === filterUser : true;
      const matchDate = filterDate ? item.data.includes(filterDate.split('-').reverse().join('/')) : true;
      return matchUser && matchDate;
    });
  }, [history, filterUser, filterDate]);

  const displayedHistory = filteredHistory.slice(0, limit);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop === e.currentTarget.clientHeight;
    if (bottom && limit < filteredHistory.length) {
      setLimit(prev => prev + 10);
    }
  };

  const textClass = isNight ? 'text-white/80' : 'text-gray-600';
  const labelClass = isNight ? 'text-white/40' : 'text-gray-400';
  const cardClass = isNight ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-gray-100';

  return (
    <div className="flex flex-col h-full overflow-hidden animate-fadeIn" onScroll={handleScroll}>
      <div className={`p-4 border-b sticky top-0 z-20 backdrop-blur-md ${isNight ? 'bg-[#121212]/80 border-white/5' : 'bg-white/80 border-gray-100'}`}>
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className={`font-black text-[10px] uppercase tracking-widest ${labelClass}`}>Filtros Avançados</h3>
            <button onClick={onClear} className="text-[10px] font-bold text-red-500 uppercase px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors">Limpar Tudo</button>
          </div>
          <div className="flex gap-2">
            <select 
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className={`flex-1 p-2 rounded-xl text-xs font-bold outline-none border ${isNight ? 'bg-[#2A2A2A] border-white/10 text-white' : 'bg-gray-50 border-gray-100 text-gray-700'}`}
            >
              <option value="">Todos Funcionários</option>
              {users.map(u => <option key={u.id} value={u.nome}>{u.nome}</option>)}
            </select>
            <input 
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className={`flex-1 p-2 rounded-xl text-xs font-bold outline-none border ${isNight ? 'bg-[#2A2A2A] border-white/10 text-white' : 'bg-gray-50 border-gray-100 text-gray-700'}`}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {displayedHistory.map(h => (
          <div key={h.id} className={`p-4 rounded-2xl shadow-sm border transition-all ${cardClass}`}>
            <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-[#008C45]">{h.data}</span>
                {h.localizacao && (
                  <span className="text-[9px] font-bold text-blue-500 flex items-center gap-1">
                    <i className="fas fa-map-pin"></i> {h.localizacao}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-black uppercase ${labelClass}`}>{h.usuario}</span>
            </div>
            <pre className={`text-[11px] font-semibold whitespace-pre-wrap leading-relaxed ${textClass}`}>{h.itens}</pre>
          </div>
        ))}
        
        {displayedHistory.length < filteredHistory.length && (
          <div className="text-center py-4">
            <button 
              onClick={() => setLimit(prev => prev + 10)}
              className="text-[10px] font-black uppercase text-[#008C45] tracking-widest bg-green-500/10 px-4 py-2 rounded-full"
            >
              Carregar mais...
            </button>
          </div>
        )}

        {filteredHistory.length === 0 && (
          <div className="text-center py-20 opacity-40">
            <i className="fas fa-folder-open text-4xl mb-4"></i>
            <p className="italic text-sm">Nenhum registro encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryScreen;
