import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

// --- CONFIGURAÇÕES E TIPOS ---
type Product = {
  id: string;
  name: string;
  category: string;
  supplier: string;
  purchaseUnit: string; // ex: Caixa
  countedUnit: string;  // ex: Unidade
  factor: number;       // ex: 12
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

const LOCATIONS = ['Estoque', 'Freezer', 'Cozinha', 'Outros'];

// --- APP PRINCIPAL ---
const App = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentScreen, setCurrentScreen] = useState<'Home' | 'Inventory' | 'Settings' | 'Summary'>('Home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('art_theme') === 'dark');
  
  // Dados do App
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('art_products_v2');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [counts, setCounts] = useState<Record<string, Count>>(() => {
    const saved = localStorage.getItem('art_counts_v2');
    return saved ? JSON.parse(saved) : {};
  });

  const [holidays, setHolidays] = useState<string[]>(() => {
    const saved = localStorage.getItem('art_holidays');
    return saved ? JSON.parse(saved) : [];
  });

  // --- LÓGICA DE CARREGAMENTO (Watchdog Fix) ---
  const removeLoader = () => {
    const loader = document.getElementById('watchdog');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 600);
    }
  };

  useEffect(() => {
    // Garantir que o loader suma independente de erros no JS
    const timer = setTimeout(removeLoader, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('art_products_v2', JSON.stringify(products));
    localStorage.setItem('art_counts_v2', JSON.stringify(counts));
    localStorage.setItem('art_holidays', JSON.stringify(holidays));
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('art_theme', isDarkMode ? 'dark' : 'light');
  }, [products, counts, holidays, isDarkMode]);

  // --- LÓGICA DE DEMANDA ---
  const getDemandMultiplier = () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    let multiplier = 1;

    // Feriados +50%
    if (holidays.includes(dateStr)) multiplier += 0.5;

    // Sexta-feira: Triplicar se for Sacolão (lógica aplicada no resumo)
    const isFriday = today.getDay() === 5;
    
    return { multiplier, isFriday };
  };

  // --- HAPTIC FEEDBACK ---
  const triggerHaptic = () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(20);
    }
  };

  // --- COMPONENTES ---

  const LoginScreen = () => {
    const [pin, setPin] = useState('');
    const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (pin === '1821') {
        setCurrentUser({ name: 'Administrador', role: 'Master' });
        triggerHaptic();
      } else {
        alert("Acesso Negado.");
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[var(--italy-white)] dark:bg-[#0A0A0A]">
        <div className="glass w-full max-w-sm p-10 rounded-[3rem] shadow-2xl animate-slide text-center border-t-4 border-[#008C45]">
          <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <i className="fa-solid fa-pizza-slice text-red-600 text-4xl"></i>
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter mb-2 text-gray-800 dark:text-white uppercase">Artigiano</h1>
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-10">Controle de Produção</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              placeholder="Digite o PIN" 
              className="ios-input text-center text-3xl font-black tracking-[0.4em]"
              value={pin}
              onChange={e => setPin(e.target.value)}
              autoFocus
            />
            <button className="btn-italiano w-full py-5 rounded-2xl uppercase font-black text-sm mt-4">Acessar</button>
          </form>
        </div>
      </div>
    );
  };

  const HomeScreen = () => (
    <div className="p-6 animate-slide pb-32">
      <header className="flex justify-between items-center mb-10 mt-4">
        <div>
          <h2 className="text-2xl font-black italic uppercase">Benvenuto!</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gestão de Insumos</p>
        </div>
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-12 h-12 glass rounded-2xl flex items-center justify-center shadow-sm">
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

      <div className="mt-10 bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800">
        <h3 className="text-xs font-black uppercase italic mb-6 opacity-30 tracking-[0.2em]">Painel de Status</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
             <div className="text-3xl font-black text-green-600">{products.length}</div>
             <div className="text-[9px] font-bold uppercase opacity-40">Produtos</div>
          </div>
          <div className="text-center">
             <div className="text-3xl font-black text-red-600">{Object.keys(counts).length}</div>
             <div className="text-[9px] font-bold uppercase opacity-40">Contados</div>
          </div>
        </div>
      </div>
    </div>
  );

  const InventoryScreen = () => {
    const filteredProducts = products.filter(p => p.category === selectedCategory);
    
    const updateCount = (productId: string, loc: string, val: number) => {
      const prod = products.find(p => p.id === productId);
      if (!prod) return;

      setCounts(prev => {
        const current = prev[productId] || { productId, locations: {}, total: 0, purchaseTotal: 0, timestamp: Date.now() };
        const newLocs = { ...current.locations, [loc]: val };
        const totalCounted = Object.values(newLocs).reduce((a, b) => a + b, 0);
        
        // Lógica de Conversão
        const purchaseTotal = prod.factorMode === 'multiply' 
          ? totalCounted * prod.factor 
          : totalCounted / prod.factor;

        return {
          ...prev,
          [productId]: { ...current, locations: newLocs, total: totalCounted, purchaseTotal, timestamp: Date.now() }
        };
      });
      triggerHaptic();
    };

    return (
      <div className="p-6 pb-32 animate-slide">
        <button onClick={() => setCurrentScreen('Home')} className="mb-6 font-black text-[10px] uppercase opacity-30 tracking-widest flex items-center">
          <i className="fa-solid fa-chevron-left mr-2"></i> Voltar
        </button>
        <h2 className="text-3xl font-black italic uppercase mb-10">{selectedCategory}</h2>

        <div className="space-y-6">
          {filteredProducts.length === 0 ? (
            <p className="text-center py-20 opacity-20 italic">Sem itens cadastrados.</p>
          ) : (
            filteredProducts.map(p => (
              <div key={p.id} className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-zinc-800">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-tighter">{p.name}</h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Ref: {p.countedUnit} → {p.purchaseUnit}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/10 text-green-600 px-3 py-1 rounded-full text-[10px] font-black">
                    {counts[p.id]?.purchaseTotal.toFixed(1) || '0.0'} {p.purchaseUnit}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {LOCATIONS.map(loc => (
                    <div key={loc}>
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
            ))
          )}
        </div>
      </div>
    );
  };

  const SettingsScreen = () => {
    const [newItem, setNewItem] = useState<Partial<Product>>({ category: 'geral', factorMode: 'divide', factor: 1 });
    const [isAdding, setIsAdding] = useState(false);

    const addProduct = () => {
      if (!newItem.name || !newItem.supplier) return;
      setProducts([...products, { ...newItem, id: Date.now().toString() } as Product]);
      setNewItem({ category: 'geral', factorMode: 'divide', factor: 1 });
      setIsAdding(false);
      triggerHaptic();
    };

    return (
      <div className="p-6 pb-32 animate-slide">
        <h2 className="text-3xl font-black italic uppercase mb-10 mt-4">Configurações</h2>
        
        {/* Adicionar Produto (Expandable) */}
        <div className="mb-6">
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="w-full bg-white dark:bg-zinc-900 p-6 rounded-[2rem] flex justify-between items-center shadow-sm font-black uppercase text-xs tracking-widest border border-gray-100 dark:border-zinc-800"
          >
            <span>Gerenciar Insumos</span>
            <i className={`fa-solid fa-chevron-down transition-transform ${isAdding ? 'rotate-180' : ''}`}></i>
          </button>

          {isAdding && (
            <div className="mt-4 bg-white dark:bg-zinc-900 p-8 rounded-[2rem] space-y-4 shadow-xl border border-gray-100 dark:border-zinc-800 animate-slide">
               <input placeholder="NOME DO ITEM" className="ios-input" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} />
               <input placeholder="FORNECEDOR" className="ios-input" value={newItem.supplier || ''} onChange={e => setNewItem({...newItem, supplier: e.target.value})} />
               <div className="grid grid-cols-2 gap-4">
                 <select className="ios-input" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                    {CATEGORIES.map(c => <option value={c.id}>{c.name}</option>)}
                 </select>
                 <input placeholder="FATOR (Ex: 12)" type="number" className="ios-input" onChange={e => setNewItem({...newItem, factor: parseFloat(e.target.value)})}/>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <input placeholder="UN. CONTAGEM" className="ios-input" onChange={e => setNewItem({...newItem, countedUnit: e.target.value})}/>
                 <input placeholder="UN. COMPRA" className="ios-input" onChange={e => setNewItem({...newItem, purchaseUnit: e.target.value})}/>
               </div>
               <button onClick={addProduct} className="btn-italiano w-full py-4 rounded-xl uppercase font-black text-xs">Salvar Produto</button>
            </div>
          )}
        </div>

        {/* Feriados */}
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-sm mb-6">
          <h4 className="text-[10px] font-black uppercase opacity-40 mb-4 tracking-widest">Cadastro de Feriados</h4>
          <input 
            type="date" 
            className="ios-input" 
            onChange={e => {
              if (e.target.value && !holidays.includes(e.target.value)) setHolidays([...holidays, e.target.value]);
            }} 
          />
          <div className="flex flex-wrap gap-2 mt-4">
            {holidays.map(h => (
              <span key={h} className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[9px] font-black flex items-center">
                {h} <i className="fa-solid fa-xmark ml-2 cursor-pointer" onClick={() => setHolidays(holidays.filter(x => x !== h))}></i>
              </span>
            ))}
          </div>
        </div>

        <button onClick={() => { setCurrentUser(null); triggerHaptic(); }} className="w-full p-6 text-red-600 font-black uppercase text-[10px] tracking-[0.3em]">Encerrar Sessão</button>
      </div>
    );
  };

  const SummaryScreen = () => {
    const { multiplier, isFriday } = getDemandMultiplier();
    
    // Agrupar por fornecedor
    const summary = useMemo(() => {
      const grouped: Record<string, any[]> = {};
      products.forEach(p => {
        const count = counts[p.id];
        if (count && count.total > 0) {
          if (!grouped[p.supplier]) grouped[p.supplier] = [];
          
          let finalDemand = count.purchaseTotal * multiplier;
          if (isFriday && p.category === 'sacolao') finalDemand *= 3;

          grouped[p.supplier].push({
            name: p.name,
            qty: finalDemand,
            unit: p.purchaseUnit
          });
        }
      });
      return grouped;
    }, [products, counts, multiplier, isFriday]);

    const sendWhatsApp = (supplier: string, items: any[]) => {
      const today = new Date().toLocaleDateString('pt-BR');
      let msg = `*PEDIDO ARTIGIANO - ${today}*\n*Fornecedor:* ${supplier}\n\n`;
      items.forEach(item => {
        msg += `• ${item.name}: ${item.qty.toFixed(1)} ${item.unit}\n`;
      });
      msg += `\n_Gerado via Artigiano Gestão_`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
      triggerHaptic();
    };

    return (
      <div className="p-6 pb-32 animate-slide">
        <h2 className="text-3xl font-black italic uppercase mb-4 mt-4">Pedidos</h2>
        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl mb-8 flex items-center">
           <i className="fa-solid fa-bolt text-amber-500 mr-3"></i>
           <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">Multiplicador Atual: x{multiplier.toFixed(1)} ${isFriday ? '+ Bônus Sexta' : ''}</p>
        </div>

        {Object.keys(summary).length === 0 ? (
          <p className="text-center py-20 opacity-30 italic">Nenhuma contagem realizada hoje.</p>
        ) : (
          Object.entries(summary).map(([supplier, items]) => (
            <div key={supplier} className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-sm mb-6 border border-gray-100 dark:border-zinc-800">
               <h3 className="font-black text-xs uppercase mb-6 tracking-widest text-green-600 border-b border-gray-50 pb-4">{supplier}</h3>
               <div className="space-y-3 mb-8">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="font-medium opacity-70 uppercase text-[11px]">{item.name}</span>
                      <span className="font-black">{item.qty.toFixed(1)} {item.unit}</span>
                    </div>
                  ))}
               </div>
               <button 
                onClick={() => sendWhatsApp(supplier, items)}
                className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 active:scale-95 transition-all"
               >
                 <i className="fa-brands fa-whatsapp text-lg"></i> Enviar via WhatsApp
               </button>
            </div>
          ))
        )}
      </div>
    );
  };

  if (!currentUser) return <LoginScreen />;

  return (
    <div className="max-w-md mx-auto min-h-screen relative bg-[var(--italy-white)] dark:bg-[#0A0A0A] text-[#111] dark:text-[#F3F4F6]">
      {currentScreen === 'Home' && <HomeScreen />}
      {currentScreen === 'Inventory' && <InventoryScreen />}
      {currentScreen === 'Settings' && <SettingsScreen />}
      {currentScreen === 'Summary' && <SummaryScreen />}

      {/* Navegação iOS Style */}
      <nav className="fixed bottom-8 left-6 right-6 h-20 glass rounded-[2.5rem] shadow-2xl flex items-center justify-around px-4 z-50">
        <button 
          onClick={() => { setCurrentScreen('Home'); triggerHaptic(); }}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all ${currentScreen === 'Home' ? 'text-green-600 scale-110' : 'opacity-20'}`}
        >
          <i className="fa-solid fa-house"></i>
        </button>
        <button 
          onClick={() => { setCurrentScreen('Summary'); triggerHaptic(); }}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all ${currentScreen === 'Summary' ? 'text-green-600 scale-110' : 'opacity-20'}`}
        >
          <i className="fa-solid fa-list-check"></i>
        </button>
        <button 
          onClick={() => { setCurrentScreen('Settings'); triggerHaptic(); }}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all ${currentScreen === 'Settings' ? 'text-green-600 scale-110' : 'opacity-20'}`}
        >
          <i className="fa-solid fa-sliders"></i>
        </button>
      </nav>
    </div>
  );
};

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<App />);
}