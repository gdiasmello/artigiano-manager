
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

// --- DATABASE & TYPES ---
const DB_NAME = 'PizzaMaster_v3';
const DB_VERSION = 1;

type Role = 'ADM' | 'Gerente' | 'Atendente' | 'Pizzaiolo';
type Category = 'Sacolão' | 'Geral' | 'Limpeza' | 'Massas' | 'Bebidas';

interface User {
  username: string;
  pin: string;
  role: Role;
  name: string;
  permissions: Category[];
  acceptedTerms: boolean;
}

interface Product {
  id: string;
  name: string;
  supplierId: string;
  category: Category;
  baseUnit: string;
  purchaseUnit: string;
  conversionFactor: number;
  conversionType: 'multiply' | 'divide';
}

interface Supplier {
  id: string;
  name: string;
  phone: string;
  greeting: string;
}

interface LogEntry {
  id?: number;
  userName: string;
  productName: string;
  locations: { freezer: number; shelf: number; other: number };
  timestamp: number;
}

const ALL_CATEGORIES: Category[] = ['Sacolão', 'Geral', 'Limpeza', 'Massas', 'Bebidas'];

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'username' });
      if (!db.objectStoreNames.contains('logs')) db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// --- APP COMPONENT ---
const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentMode, setCurrentMode] = useState<'Home' | 'Inventory' | 'Massas' | 'Settings' | 'History'>('Home');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('pm_theme') === 'dark');
  
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>(JSON.parse(localStorage.getItem('pm_products') || '[]'));
  const [suppliers, setSuppliers] = useState<Supplier[]>(JSON.parse(localStorage.getItem('pm_suppliers') || '[]'));
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Sound & Haptic
  const feedback = (type: 'success' | 'error' | 'click') => {
    if (navigator.vibrate) navigator.vibrate(40);
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.setValueAtTime(type === 'success' ? 880 : type === 'error' ? 220 : 440, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  };

  // Sync Theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('pm_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Init DB and Default ADM
  useEffect(() => {
    const init = async () => {
      const db = await openDB();
      const tx = db.transaction('users', 'readonly');
      const store = tx.objectStore('users');
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result as User[];
        if (!list.find(u => u.username === 'ADM')) {
          const adm: User = { username: 'ADM', pin: '1821', role: 'ADM', name: 'Admin Supremo', permissions: ALL_CATEGORIES, acceptedTerms: true };
          const txW = db.transaction('users', 'readwrite');
          txW.objectStore('users').add(adm);
          setUsers([adm]);
        } else {
          setUsers(list);
        }
      };
      
      const txL = db.transaction('logs', 'readonly').objectStore('logs').getAll();
      txL.onsuccess = () => setLogs(txL.result);
    };
    init();
    
    // Watchdog clean up
    const watchdog = document.getElementById('watchdog');
    if (watchdog) {
      setTimeout(() => {
        watchdog.style.opacity = '0';
        setTimeout(() => watchdog.remove(), 500);
      }, 1000);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pm_products', JSON.stringify(products));
    localStorage.setItem('pm_suppliers', JSON.stringify(suppliers));
  }, [products, suppliers]);

  const canEdit = currentUser?.role === 'ADM' || currentUser?.role === 'Gerente';

  // --- LOGOUT FUNCTION ---
  // Fix: Defined the missing logout function to clear the current user and reset navigation state
  const logout = () => {
    setCurrentUser(null);
    setCurrentMode('Home');
    feedback('click');
  };

  // --- SCREENS ---
  const Login = () => {
    const [u, setU] = useState('');
    const [p, setP] = useState('');
    
    const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      const found = users.find(user => user.username === u.toUpperCase() && user.pin === p);
      if (found) {
        setCurrentUser(found);
        feedback('success');
      } else {
        feedback('error');
        alert("PIN incorreto");
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-6 transition-all duration-700">
        <div className="glass w-full max-w-md p-10 rounded-[3rem] shadow-2xl border-b-[12px] border-[#CD212A] border-t-[12px] border-[#008C45] text-center">
          <div className="w-24 h-24 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6 mx-auto shadow-xl">
            <i className="fa-solid fa-pizza-slice text-red-600 text-4xl transform -rotate-12"></i>
          </div>
          <h1 className="text-4xl font-black text-gray-800 dark:text-white uppercase italic tracking-tighter mb-1">PIZZAMASTER</h1>
          <p className="text-gray-400 font-bold text-[10px] tracking-[0.3em] uppercase mb-10">Premium Italian Workflow</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="ID USUÁRIO" className="ios-input" value={u} onChange={e => setU(e.target.value.toUpperCase())} required />
            <input type="password" inputMode="numeric" placeholder="PIN" className="ios-input text-center tracking-[1em] text-2xl font-black" value={p} onChange={e => setP(e.target.value.slice(0,4))} required />
            <button type="submit" className="btn-italiano w-full py-5 rounded-3xl uppercase tracking-widest text-lg">Entrar</button>
          </form>
        </div>
      </div>
    );
  };

  const DoughCalculator = () => {
    const [massasCount, setMassasCount] = useState(60);
    const day = new Date().getDay(); // 0-Sun, 1-Mon, ...
    const suggested = (day === 0 || day <= 3) ? 60 : 100;
    
    const calc = (n: number) => ({
      farinha: (n * 133.3).toFixed(0),
      agua: (n * 83.1).toFixed(0),
      liq: (n * 58.2).toFixed(0),
      gelo: (n * 24.9).toFixed(0),
      levain: (n * 6).toFixed(0),
      sal: (n * 4).toFixed(0)
    });

    const res = calc(massasCount);

    return (
      <div className="p-6 pb-32 animate-slide">
        <button onClick={() => setCurrentMode('Home')} className="mb-6 flex items-center text-gray-400 uppercase font-black text-[10px] tracking-widest"><i className="fa-solid fa-chevron-left mr-2"></i> Voltar</button>
        <h2 className="text-3xl font-black uppercase italic mb-2">Calculadora de Massas</h2>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border-l-8 border-[#008C45] mb-6">
          <p className="text-xs font-bold text-gray-400 uppercase mb-4">Sugestão p/ Hoje: <span className="text-green-600">{suggested} Massas</span></p>
          <input type="range" min="15" max="150" step="5" value={massasCount} onChange={e => setMassasCount(parseInt(e.target.value))} className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#CD212A]" />
          <div className="flex justify-between mt-4">
            <span className="text-4xl font-black italic">{massasCount}</span>
            <span className="text-xs font-bold uppercase py-2">Massas de 226g</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm">
            <i className="fa-solid fa-wheat-awn text-[#008C45] mb-2"></i>
            <p className="text-[10px] font-black uppercase text-gray-400">Farinha</p>
            <p className="text-xl font-black">{res.farinha}g</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm">
            <i className="fa-solid fa-droplet text-blue-500 mb-2"></i>
            <p className="text-[10px] font-black uppercase text-gray-400">Água Total</p>
            <p className="text-xl font-black">{res.agua}g</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800">
            <p className="text-[10px] font-black uppercase text-blue-400">Líquida (70%)</p>
            <p className="text-lg font-black">{res.liq}g</p>
          </div>
          <div className="bg-cyan-50 dark:bg-cyan-900/20 p-6 rounded-3xl border border-cyan-100 dark:border-cyan-800">
            <p className="text-[10px] font-black uppercase text-cyan-400">Gelo (30%)</p>
            <p className="text-lg font-black">{res.gelo}g</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm">
            <i className="fa-solid fa-bacteria text-orange-400 mb-2"></i>
            <p className="text-[10px] font-black uppercase text-gray-400">Levain</p>
            <p className="text-xl font-black">{res.levain}g</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm">
            <i className="fa-solid fa-cubes-stacked text-gray-400 mb-2"></i>
            <p className="text-[10px] font-black uppercase text-gray-400">Sal</p>
            <p className="text-xl font-black">{res.sal}g</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-red-600">Processo Operacional (POP)</h3>
          {[
            "1. Mistura 1: Água Líq + Gelo + Sal + 50% Farinha. Bater até homogeneizar.",
            "2. Mistura 2: Restante Farinha + Levain. Bater até ponto de véu ('ploc ploc').",
            "3. Descanso: Retirar e cobrir com Perflex.",
            "4. Divisão: Cortar massas de 220g e bolear (6 por bandeja)."
          ].map((step, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl text-xs font-medium border border-gray-50 dark:border-zinc-800">{step}</div>
          ))}
        </div>
      </div>
    );
  };

  const Inventory = () => {
    const filtered = products.filter(p => p.category === selectedCategory);
    
    const handleUpdate = async (p: Product, loc: string, val: string) => {
      const num = parseFloat(val) || 0;
      const db = await openDB();
      const tx = db.transaction('logs', 'readwrite');
      const entry: LogEntry = {
        userName: currentUser!.name,
        productName: p.name,
        locations: { freezer: 0, shelf: 0, other: 0, ...{ [loc]: num } },
        timestamp: Date.now()
      };
      tx.objectStore('logs').add(entry);
      setLogs([...logs, entry]);
      feedback('click');
    };

    const handleSendOrder = (supplierId: string) => {
      const sup = suppliers.find(s => s.id === supplierId);
      if (!sup) return;
      const supProds = products.filter(p => p.supplierId === supplierId && p.category === selectedCategory);
      let itemsMsg = "";
      supProds.forEach(p => {
        // Logic for orders: Simplified here for demonstration
        itemsMsg += `• ${p.name}: [QTDE]\n`;
      });

      const fullMsg = `${sup.greeting}\n\n*PEDIDO PIZZAMASTER*\n*Setor:* ${selectedCategory}\n\n${itemsMsg}\n_Enviado por: ${currentUser?.name}_`;
      window.open(`https://wa.me/${sup.phone}?text=${encodeURIComponent(fullMsg)}`, '_blank');
      feedback('success');
    };

    return (
      <div className="p-6 pb-32 animate-slide">
        <button onClick={() => setCurrentMode('Home')} className="mb-6 flex items-center text-gray-400 uppercase font-black text-[10px] tracking-widest"><i className="fa-solid fa-chevron-left mr-2"></i> Voltar</button>
        <h2 className="text-3xl font-black uppercase italic mb-6">{selectedCategory}</h2>
        <div className="space-y-4">
          {filtered.map(p => (
            <div key={p.id} className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-zinc-800">
               <div className="flex justify-between mb-4">
                 <h4 className="font-black uppercase italic text-gray-800 dark:text-gray-100">{p.name}</h4>
                 <span className="text-[9px] font-black uppercase opacity-40">{p.baseUnit}</span>
               </div>
               <div className="grid grid-cols-3 gap-2">
                 {['freezer', 'shelf', 'other'].map(l => (
                   <input 
                    key={l} type="number" placeholder={l} 
                    className="ios-input text-center text-xs p-3" 
                    onChange={e => handleUpdate(p, l, e.target.value)} 
                   />
                 ))}
               </div>
               {canEdit && <button className="mt-4 text-[9px] font-black uppercase text-red-400"><i className="fa-solid fa-pen mr-1"></i> Editar Item</button>}
            </div>
          ))}
        </div>
        <div className="fixed bottom-24 left-6 right-6 flex space-x-2 overflow-x-auto pb-4 scrollbar-hide">
          {suppliers.map(s => (
            <button key={s.id} onClick={() => handleSendOrder(s.id)} className="whitespace-nowrap bg-black text-white px-6 py-4 rounded-2xl font-black uppercase tracking-tighter text-xs shadow-xl active:scale-95">Pedir: {s.name}</button>
          ))}
        </div>
      </div>
    );
  };

  const Settings = () => {
    const [subTab, setSubTab] = useState<'users' | 'others'>('users');
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const togglePermission = async (user: User, cat: Category) => {
        const newPerms = user.permissions.includes(cat) 
            ? user.permissions.filter(p => p !== cat) 
            : [...user.permissions, cat];
        const updated = { ...user, permissions: newPerms };
        const db = await openDB();
        db.transaction('users', 'readwrite').objectStore('users').put(updated);
        setUsers(users.map(u => u.username === user.username ? updated : u));
    };

    return (
      <div className="p-6 pb-32 animate-slide">
        <h2 className="text-3xl font-black uppercase italic mb-8">Configurações</h2>
        
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-sm mb-6">
           <div className="flex items-center justify-between">
              <span className="font-black uppercase tracking-tighter text-sm">Modo Noturno</span>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-14 h-8 rounded-full p-1 transition-all ${isDarkMode ? 'bg-green-600' : 'bg-gray-200'}`}>
                <div className={`w-6 h-6 bg-white rounded-full shadow transition-all transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
           </div>
        </div>

        <div className="flex space-x-2 mb-6">
           <button onClick={() => setSubTab('users')} className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] ${subTab === 'users' ? 'bg-[#008C45] text-white' : 'bg-white dark:bg-zinc-900 text-gray-400'}`}>Colaboradores</button>
           <button onClick={() => setSubTab('others')} className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] ${subTab === 'others' ? 'bg-[#CD212A] text-white' : 'bg-white dark:bg-zinc-900 text-gray-400'}`}>Insumos & Forn.</button>
        </div>

        {subTab === 'users' && (
            <div className="space-y-4">
               {users.map(u => (
                   <div key={u.username} className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-black uppercase italic">{u.name}</h4>
                        <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-full">{u.role}</span>
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Permissões de Acesso:</p>
                      <div className="flex flex-wrap gap-2">
                        {ALL_CATEGORIES.map(cat => (
                            <button 
                                key={cat} onClick={() => togglePermission(u, cat)}
                                className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border transition-all ${u.permissions.includes(cat) ? 'bg-green-600 border-green-600 text-white' : 'bg-transparent border-gray-200 text-gray-400'}`}
                            >
                                {cat}
                            </button>
                        ))}
                      </div>
                   </div>
               ))}
            </div>
        )}
      </div>
    );
  };

  const Navbar = () => (
    <div className="fixed bottom-0 left-0 right-0 glass pb-safe px-6 py-4 flex justify-between items-center z-50 border-t border-gray-100 dark:border-zinc-800">
      <button onClick={() => setCurrentMode('Home')} className={`flex flex-col items-center ${currentMode === 'Home' ? 'text-green-600' : 'text-gray-400'}`}>
        <i className="fa-solid fa-house-chimney text-xl"></i>
        <span className="text-[9px] font-black uppercase mt-1 tracking-widest">Início</span>
      </button>
      <button onClick={() => setCurrentMode('History')} className={`flex flex-col items-center ${currentMode === 'History' ? 'text-green-600' : 'text-gray-400'}`}>
        <i className="fa-solid fa-clock-rotate-left text-xl"></i>
        <span className="text-[9px] font-black uppercase mt-1 tracking-widest">Histórico</span>
      </button>
      {canEdit && (
        <button onClick={() => setCurrentMode('Settings')} className={`flex flex-col items-center ${currentMode === 'Settings' ? 'text-green-600' : 'text-gray-400'}`}>
          <i className="fa-solid fa-screwdriver-wrench text-xl"></i>
          <span className="text-[9px] font-black uppercase mt-1 tracking-widest">Painel</span>
        </button>
      )}
      <button onClick={logout} className="flex flex-col items-center text-red-500">
        <i className="fa-solid fa-power-off text-xl"></i>
        <span className="text-[9px] font-black uppercase mt-1 tracking-widest">Sair</span>
      </button>
    </div>
  );

  if (!currentUser) return <Login />;

  return (
    <div className="max-w-md mx-auto min-h-screen relative pb-32">
      {currentMode === 'Home' && (
          <div className="p-6 animate-slide">
             <header className="mb-10 flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">CIAO, {currentUser.name.split(' ')[0]}!</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{currentUser.role}</p>
                </div>
                <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-green-600 shadow-sm border border-green-100">
                  <i className="fa-solid fa-circle-user text-xl"></i>
                </div>
             </header>
             <div className="grid grid-cols-2 gap-4">
                {currentUser.permissions.map(cat => {
                    const icon = cat === 'Sacolão' ? 'fa-carrot' : cat === 'Massas' ? 'fa-bowl-rice' : cat === 'Geral' ? 'fa-boxes-stacked' : cat === 'Limpeza' ? 'fa-soap' : 'fa-wine-bottle';
                    const color = cat === 'Massas' ? 'bg-[#008C45]' : cat === 'Sacolão' ? 'bg-orange-500' : cat === 'Geral' ? 'bg-[#CD212A]' : cat === 'Bebidas' ? 'bg-blue-500' : 'bg-gray-600';
                    return (
                        <button 
                            key={cat} onClick={() => { if(cat === 'Massas') setCurrentMode('Massas'); else { setSelectedCategory(cat); setCurrentMode('Inventory'); } feedback('click'); }}
                            className="bg-white dark:bg-zinc-900 p-6 rounded-[3rem] shadow-sm flex flex-col items-center justify-center aspect-square border border-gray-100 dark:border-zinc-800 active:scale-95 transition-all"
                        >
                            <div className={`${color} w-16 h-16 rounded-3xl flex items-center justify-center text-white text-3xl mb-4 shadow-lg`}>
                                <i className={`fa-solid ${icon}`}></i>
                            </div>
                            <span className="font-black text-gray-700 dark:text-gray-200 uppercase tracking-tighter text-[10px]">{cat}</span>
                        </button>
                    )
                })}
             </div>
          </div>
      )}
      {currentMode === 'Massas' && <DoughCalculator />}
      {currentMode === 'Inventory' && <Inventory />}
      {currentMode === 'Settings' && <Settings />}
      {currentMode === 'History' && (
          <div className="p-6 pb-32 animate-slide">
             <h2 className="text-3xl font-black uppercase italic mb-8">Histórico Recente</h2>
             <div className="space-y-3">
                {logs.slice(-30).reverse().map((l, i) => (
                    <div key={i} className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-gray-50 dark:border-zinc-800 flex justify-between items-center">
                        <div>
                            <p className="font-black text-xs uppercase italic">{l.productName}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase">{l.userName} • {new Date(l.timestamp).toLocaleTimeString()}</p>
                        </div>
                        <div className="text-[10px] font-black text-green-600">CONFIRMADO</div>
                    </div>
                ))}
             </div>
          </div>
      )}
      <Navbar />
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
