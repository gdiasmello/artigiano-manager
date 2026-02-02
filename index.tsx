import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

// --- TIPOS ---
type Product = {
  id: string;
  name: string;
  category: string;
  supplier: string;
  purchaseUnit: string;
  countedUnit: string;
  factor: number;
  factorMode: 'multiply' | 'divide';
  minStock: number;
};

type Count = {
  productId: string;
  locations: Record<string, number>;
  total: number;
  purchaseTotal: number;
  timestamp: number;
};

const CATEGORIES = [
  { id: 'sacolao', name: 'Sacolão', icon: 'fa-leaf' },
  { id: 'geral', name: 'Geral', icon: 'fa-boxes-stacked' },
  { id: 'limpeza', name: 'Limpeza', icon: 'fa-soap' },
  { id: 'massas', name: 'Massas', icon: 'fa-bowl-rice' }
];

const LOCATIONS = ['Estoque Central', 'Freezer 01', 'Cozinha', 'Prateleira'];

// --- APP PRINCIPAL ---
const App = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentScreen, setCurrentScreen] = useState<'Home' | 'Inventory' | 'Settings' | 'Summary'>('Home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('art_theme') === 'dark');
  
  // Persistência com Auto-Save
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('art_products_v3');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [counts, setCounts] = useState<Record<string, Count>>(() => {
    const saved = localStorage.getItem('art_counts_v3');
    return saved ? JSON.parse(saved) : {};
  });

  const [holidays, setHolidays] = useState<string[]>(() => {
    const saved = localStorage.getItem('art_holidays_v3');
    return saved ? JSON.parse(saved) : [];
  });

  // Watchdog: Remover loader
  useEffect(() => {
    const loader = document.getElementById('watchdog');
    if (loader) {
      setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 600);
      }, 1000);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('art_products_v3', JSON.stringify(products));
    localStorage.setItem('art_counts_v3', JSON.stringify(counts));
    localStorage.setItem('art_holidays_v3', JSON.stringify(holidays));
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('art_theme', isDarkMode ? 'dark' : 'light');
  }, [products, counts, holidays, isDarkMode]);

  // Haptic Feedback
  const triggerHaptic = () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(25);
    }
  };

  // Lógica de Gatilhos de Demanda
  const getDemandStats = () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const isFriday = today.getDay() === 5;
    const isHoliday = holidays.includes(dateStr);
    
    let baseMultiplier = 1;
    if (isHoliday) baseMultiplier += 0.5;

    return { isFriday, isHoliday, baseMultiplier };
  };

  // --- TELAS ---

  const Login = () => {
    const [pin, setPin] = useState('');
    const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (pin === '1821') {
        setCurrentUser({ name: 'Chef Master', role: 'Administrador' });
        triggerHaptic();
      } else {
        alert("PIN Incorreto.");
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[var(--italy-white)] dark:bg-[#0A0A0A]">
        <div className="glass w-full max-w-sm p-10 rounded-[3rem] shadow-2xl animate-slide text-center border-t-8 border-[#008C45]">
          <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
            <i className="fa-solid fa-pizza-slice text-[#CD212A] text-4xl"></i>
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter mb-2 text-gray-800 dark:text-white uppercase">Artigiano</h1>
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-10">Inteligência de Gestão</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              placeholder="Digite o PIN" 
              className="ios-input text-center text-3xl font-black tracking-[0.4em]"
              value={pin}
              onChange={e => setPin(e.target.value)}
              autoFocus
            />
            <button className="btn-italiano w-full py-5 rounded-2xl uppercase font-black text-sm mt-4">Entrar</button>
          </form>
        </div>
      </div>
    );
  };

  const Home = () => (
    <div className="p-6 animate-slide pb-32">
      <header className="flex justify-between items-center mb-10 mt-6">
        <div>
          <h2 className="text-2xl font-black italic uppercase">Salute, {currentUser.name.split(' ')[0]}!</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Selecione o Modo de Gestão</p>
        </div>
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-12 h-12 glass rounded-2xl flex items-center justify-center">
          <i className={`fa-solid ${isDarkMode ? 'fa-sun text-amber-500' : 'fa-moon text-blue-600'}`}></i>
        </button>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {CATEGORIES.map(cat => (
          <button 
            key={cat.id}
            onClick={() => { setSelectedCategory(cat.id); setCurrentScreen('Inventory'); triggerHaptic(); }}
            className="ios-card bg-white dark:bg-zinc-900 p-8 flex flex-col items-center shadow-sm border border-gray-100 dark:border-zinc-800"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-2xl ${cat.id === 'sacolao' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
              <i className={`fa-solid ${cat.icon}`}></i>
            </div>
            <span className="font-black text-[11px] uppercase tracking-tighter text-gray-500 dark:text-gray-300">{cat.name}</span>
          </button>
        ))}
      </div>

      <div className="mt-10 bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <i className="fa-solid fa-chart-line text-green-600"></i>
          <h3 className="text-xs font-black uppercase italic opacity-30 tracking-[0.2em]">Painel de Controle</h3>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
             <div className="text-3xl font-black text-[#008C45]">{products.length}</div>
             <div className="text-[9px] font-bold uppercase opacity-40">Insumos</div>
          </div>
          <div className="text-center">
             <div className="text-3xl font-black text-[#CD212A]">{Object.keys(counts).length}</div>
             <div className="text-[9px] font-bold uppercase opacity-40">Contagens</div>
          </div>
        </div>
      </div>
    </div>
  );

  const Inventory = () => {
    const filtered = products.filter(p => p.category === selectedCategory);
    
    const updateCount = (productId: string, loc: string, val: number) => {
      const p = products.find(prod => prod.id === productId);
      if (!p) return;

      setCounts(prev => {
        const current = prev[productId] || { productId, locations: {}, total: 0, purchaseTotal: 0, timestamp: Date.now() };
        const newLocs = { ...current.locations, [loc]: val };
        const total = Object.values(newLocs).reduce((a, b) => a + b, 0);
        
        // Fator de Conversão
        const purchaseTotal = p.factorMode === 'multiply' ? total * p.factor : total / p.factor;

        return {
          ...prev,
          [productId]: { ...current, locations: newLocs, total, purchaseTotal, timestamp: Date.now() }
        };
      });
      triggerHaptic();
    };

    return (
      <div className="p-6 pb-32 animate-slide">
        <div className="flex items-center justify-between mb-8">
           <button onClick={() => setCurrentScreen('Home')} className="font-black text-[10px] uppercase opacity-30 tracking-widest flex items-center">
             <i className="fa-solid fa-chevron-left mr-2"></i> Voltar
           </button>
           <div className="bg-green-50 dark:bg-green-900/10 px-4 py-1 rounded-full text-[9px] font-black text-green-600 uppercase tracking-widest">
             {selectedCategory}
           </div>
        </div>
        
        <div className="space-y-6">
          {filtered.map(p => (
            <div key={p.id} className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-zinc-800">
               <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-tighter text-gray-700 dark:text-gray-200">{p.name}</h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase mt-1 italic">{p.countedUnit} ➔ {p.purchaseUnit}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-green-600">{counts[p.id]?.purchaseTotal.toFixed(1) || '0.0'}</div>
                    <div className="text-[8px] font-bold uppercase opacity-30">{p.purchaseUnit}</div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  {LOCATIONS.map(loc => (
                    <div key={loc} className="relative">
                      <label className="text-[8px] font-black uppercase text-gray-400 mb-1 ml-1 block">{loc}</label>
                      <input 
                        type="number" 
                        placeholder="0" 
                        className="ios-input h-14 text-lg font-bold"
                        value={counts[p.id]?.locations[loc] || ''}
                        onChange={e => updateCount(p.id, loc, parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  ))}
               </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Summary = () => {
    const { isFriday, isHoliday, baseMultiplier } = getDemandStats();
    
    // Agrupamento por Fornecedor
    const supplierOrders = useMemo(() => {
      const orders: Record<string, any[]> = {};
      products.forEach(p => {
        const count = counts[p.id];
        if (count && count.total > 0) {
          if (!orders[p.supplier]) orders[p.supplier] = [];
          
          let demandFactor = baseMultiplier;
          if (isFriday && p.category === 'sacolao') demandFactor *= 3;

          const neededQty = count.purchaseTotal * demandFactor;
          
          orders[p.supplier].push({
            name: p.name,
            qty: neededQty,
            unit: p.purchaseUnit
          });
        }
      });
      return orders;
    }, [products, counts, baseMultiplier, isFriday]);

    const handleWhatsApp = (supplier: string, items: any[]) => {
      const date = new Date().toLocaleDateString('pt-BR');
      let msg = `*PEDIDO ARTIGIANO - ${date}*\n`;
      msg += `*Fornecedor:* ${supplier}\n`;
      msg += `*Gatilhos:* ${isHoliday ? 'FERIADO (+50%) ' : ''}${isFriday ? 'SEXTA (Sacolão x3)' : ''}\n\n`;
      
      items.forEach(item => {
        msg += `• ${item.name}: *${item.qty.toFixed(1)} ${item.unit}*\n`;
      });
      
      msg += `\n_Gerado automaticamente via Artigiano Gestão_`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
      triggerHaptic();
    };

    return (
      <div className="p-6 pb-32 animate-slide">
        <h2 className="text-3xl font-black italic uppercase mb-4 mt-6">Pedidos Sugeridos</h2>
        <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-[2rem] mb-10 flex items-center shadow-sm border border-amber-100 dark:border-amber-900/30">
           <i className="fa-solid fa-triangle-exclamation text-amber-500 mr-4 text-xl"></i>
           <div className="text-[10px] font-black text-amber-800 dark:text-amber-400 uppercase leading-relaxed">
             Base: x{baseMultiplier.toFixed(1)} ${isHoliday ? '(Feriado)' : ''} ${isFriday ? '| Sacolão: x3.0 (Sexta)' : ''}
           </div>
        </div>

        {Object.entries(supplierOrders).map(([supplier, items]) => (
          <div key={supplier} className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-sm mb-6 border border-gray-100 dark:border-zinc-800">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-sm uppercase tracking-widest text-[#008C45]">{supplier}</h3>
                <span className="text-[9px] font-bold opacity-30 uppercase">{items.length} itens</span>
             </div>
             <div className="space-y-4 mb-8">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between border-b border-gray-50 dark:border-zinc-800 pb-2">
                    <span className="text-xs font-medium uppercase opacity-60 tracking-tighter">{item.name}</span>
                    <span className="text-sm font-black text-gray-800 dark:text-white">{item.qty.toFixed(1)} {item.unit}</span>
                  </div>
                ))}
             </div>
             <button 
              onClick={() => handleWhatsApp(supplier, items)}
              className="w-full bg-[#25D366] text-white py-5 rounded-2xl font-black uppercase text-[11px] flex items-center justify-center gap-3 shadow-lg shadow-green-500/20 active:scale-95 transition-all"
             >
               <i className="fa-brands fa-whatsapp text-xl"></i> Finalizar no WhatsApp
             </button>
          </div>
        ))}
      </div>
    );
  };

  const Settings = () => {
    const [expanded, setExpanded] = useState<string | null>(null);
    const [newP, setNewP] = useState<Partial<Product>>({ category: 'geral', factorMode: 'divide', factor: 1 });
    const [search, setSearch] = useState('');

    const toggle = (id: string) => setExpanded(expanded === id ? null : id);

    const suggestions = useMemo(() => {
      if (!search) return [];
      return products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 3);
    }, [search, products]);

    return (
      <div className="p-6 pb-32 animate-slide">
        <h2 className="text-3xl font-black italic uppercase mb-10 mt-6 text-gray-800 dark:text-white">Ajustes Master</h2>
        
        <div className="space-y-4">
          {/* Cadastro de Produtos */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-sm overflow-hidden border border-gray-100 dark:border-zinc-800">
            <button onClick={() => toggle('prod')} className="w-full p-8 flex justify-between items-center font-black uppercase text-[11px] tracking-widest">
              <span>Gestão de Insumos</span>
              <i className={`fa-solid fa-chevron-right transition-transform ${expanded === 'prod' ? 'rotate-90' : ''}`}></i>
            </button>
            {expanded === 'prod' && (
              <div className="p-8 pt-0 space-y-4 animate-slide">
                <div className="relative">
                  <input placeholder="NOME DO INSUMO" className="ios-input" value={search} onChange={e => { setSearch(e.target.value); setNewP({...newP, name: e.target.value}); }} />
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white dark:bg-zinc-800 shadow-xl rounded-2xl mt-2 z-10 p-4 border border-gray-100 dark:border-zinc-700">
                       <p className="text-[9px] font-black uppercase opacity-30 mb-2">Já existente?</p>
                       {suggestions.map(s => <div key={s.id} className="p-2 font-bold uppercase text-[10px] text-green-600">{s.name}</div>)}
                    </div>
                  )}
                </div>
                <input placeholder="FORNECEDOR" className="ios-input" value={newP.supplier || ''} onChange={e => setNewP({...newP, supplier: e.target.value})} />
                <div className="grid grid-cols-2 gap-3">
                  <select className="ios-input" value={newP.category} onChange={e => setNewP({...newP, category: e.target.value})}>
                    {CATEGORIES.map(c => <option value={c.id}>{c.name}</option>)}
                  </select>
                  <input placeholder="FATOR" type="number" className="ios-input" onChange={e => setNewP({...newP, factor: parseFloat(e.target.value)})}/>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setNewP({...newP, factorMode: 'multiply'})} className={`flex-1 py-3 rounded-xl text-[9px] font-black border ${newP.factorMode === 'multiply' ? 'bg-green-600 text-white border-green-600' : 'border-gray-100 opacity-40'}`}>MULTIPLICAR</button>
                  <button onClick={() => setNewP({...newP, factorMode: 'divide'})} className={`flex-1 py-3 rounded-xl text-[9px] font-black border ${newP.factorMode === 'divide' ? 'bg-red-600 text-white border-red-600' : 'border-gray-100 opacity-40'}`}>DIVIDIR</button>
                </div>
                <button 
                  onClick={() => {
                    if (newP.name && newP.supplier) {
                      setProducts([...products, { ...newP, id: Date.now().toString() } as Product]);
                      setNewP({ category: 'geral', factorMode: 'divide', factor: 1 });
                      setSearch('');
                      triggerHaptic();
                    }
                  }} 
                  className="w-full btn-italiano py-4 rounded-2xl uppercase font-black text-[10px]"
                >
                  Salvar Insumo
                </button>
              </div>
            )}
          </div>

          {/* Cadastro de Feriados */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-sm overflow-hidden border border-gray-100 dark:border-zinc-800">
            <button onClick={() => toggle('hol')} className="w-full p-8 flex justify-between items-center font-black uppercase text-[11px] tracking-widest">
              <span>Datas & Feriados</span>
              <i className={`fa-solid fa-chevron-right transition-transform ${expanded === 'hol' ? 'rotate-90' : ''}`}></i>
            </button>
            {expanded === 'hol' && (
              <div className="p-8 pt-0 animate-slide">
                <input type="date" className="ios-input mb-4" onChange={e => {
                  if (e.target.value && !holidays.includes(e.target.value)) {
                    setHolidays([...holidays, e.target.value]);
                    triggerHaptic();
                  }
                }} />
                <div className="flex flex-wrap gap-2">
                  {holidays.map(h => (
                    <span key={h} className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[9px] font-black flex items-center">
                      {h} <i className="fa-solid fa-xmark ml-2 cursor-pointer" onClick={() => setHolidays(holidays.filter(x => x !== h))}></i>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <button onClick={() => { setCurrentUser(null); triggerHaptic(); }} className="w-full p-8 text-[#CD212A] font-black uppercase text-[10px] tracking-[0.4em] mt-10">Desconectar Sistema</button>
      </div>
    );
  };

  if (!currentUser) return <Login />;

  return (
    <div className="max-w-md mx-auto min-h-screen relative bg-[var(--italy-white)] dark:bg-[#0A0A0A]">
      {currentScreen === 'Home' && <Home />}
      {currentScreen === 'Inventory' && <Inventory />}
      {currentScreen === 'Summary' && <Summary />}
      {currentScreen === 'Settings' && <Settings />}

      <nav className="fixed bottom-8 left-6 right-6 h-20 glass rounded-[2.5rem] shadow-2xl flex items-center justify-around px-4 z-50">
        <button 
          onClick={() => { setCurrentScreen('Home'); triggerHaptic(); }}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all ${currentScreen === 'Home' ? 'text-[#008C45] scale-110' : 'opacity-20'}`}
        >
          <i className="fa-solid fa-house"></i>
        </button>
        <button 
          onClick={() => { setCurrentScreen('Summary'); triggerHaptic(); }}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all ${currentScreen === 'Summary' ? 'text-[#008C45] scale-110' : 'opacity-20'}`}
        >
          <i className="fa-solid fa-list-check"></i>
        </button>
        <button 
          onClick={() => { setCurrentScreen('Settings'); triggerHaptic(); }}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all ${currentScreen === 'Settings' ? 'text-[#008C45] scale-110' : 'opacity-20'}`}
        >
          <i className="fa-solid fa-gears"></i>
        </button>
      </nav>
    </div>
  );
};

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<App />);
}