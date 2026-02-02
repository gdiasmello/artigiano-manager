import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

// --- DATABASE & TYPES ---
const DB_NAME = 'PizzaMaster_v4';
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
  targetStock?: number;
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
  const [currentMode, setCurrentMode] = useState<'Home' | 'Inventory' | 'Massas' | 'Settings' | 'History' | 'Terms'>('Home');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('pm_theme') === 'dark');
  const [rejectionTime, setRejectionTime] = useState<number | null>(() => {
    const saved = localStorage.getItem('pm_rejection_time');
    return saved ? parseInt(saved) : null;
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>(JSON.parse(localStorage.getItem('pm_products') || '[]'));
  const [suppliers, setSuppliers] = useState<Supplier[]>(JSON.parse(localStorage.getItem('pm_suppliers') || '[]'));
  const [logs, setLogs] = useState<LogEntry[]>([]);

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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('pm_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const init = async () => {
      const db = await openDB();
      const tx = db.transaction('users', 'readonly');
      const store = tx.objectStore('users');
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result as User[];
        if (!list.find(u => u.username === 'ADM')) {
          const adm: User = { 
            username: 'ADM', 
            pin: '1821', 
            role: 'ADM', 
            name: 'Administrador Supremo', 
            permissions: ALL_CATEGORIES, 
            acceptedTerms: true 
          };
          const txW = db.transaction('users', 'readwrite');
          txW.objectStore('users').add(adm);
          setUsers([adm, ...list]);
        } else {
          setUsers(list);
        }
      };
      
      const txL = db.transaction('logs', 'readonly').objectStore('logs').getAll();
      txL.onsuccess = () => setLogs(txL.result);
    };
    init();
    
    setTimeout(() => {
      const watchdog = document.getElementById('watchdog');
      if (watchdog) {
        watchdog.style.opacity = '0';
        setTimeout(() => watchdog.remove(), 500);
      }
    }, 1500);
  }, []);

  useEffect(() => {
    localStorage.setItem('pm_products', JSON.stringify(products));
    localStorage.setItem('pm_suppliers', JSON.stringify(suppliers));
  }, [products, suppliers]);

  const canEdit = currentUser?.role === 'ADM' || currentUser?.role === 'Gerente';

  const logout = () => {
    setCurrentUser(null);
    setCurrentMode('Home');
    feedback('click');
  };

  const isLocked = () => {
    if (!rejectionTime) return false;
    const diff = (Date.now() - rejectionTime) / 1000;
    return diff < 180; // 3 minutes lock
  };

  const getLockCountdown = () => {
    if (!rejectionTime) return 0;
    const remaining = 180 - (Date.now() - rejectionTime) / 1000;
    return Math.max(0, Math.ceil(remaining));
  };

  // --- SCREENS ---

  const TermsScreen = () => {
    const handleAccept = async () => {
      if (!currentUser) return;
      const updated = { ...currentUser, acceptedTerms: true };
      const db = await openDB();
      await db.transaction('users', 'readwrite').objectStore('users').put(updated);
      setCurrentUser(updated);
      setCurrentMode('Home');
      feedback('success');
    };

    const handleReject = () => {
      const now = Date.now();
      localStorage.setItem('pm_rejection_time', now.toString());
      setRejectionTime(now);
      setCurrentUser(null);
      feedback('error');
    };

    return (
      <div className="min-h-screen bg-[var(--italy-white)] dark:bg-zinc-950 p-6 flex flex-col items-center justify-center animate-slide">
        <div className="glass max-w-md w-full p-8 rounded-[3rem] shadow-2xl overflow-hidden border-t-8 border-italy-green">
          <h2 className="text-2xl font-black uppercase italic mb-6">Termos de Uso</h2>
          <div className="h-64 overflow-y-auto text-xs space-y-4 pr-2 custom-scroll mb-8 font-medium opacity-80 leading-relaxed">
            <p><strong>Artigiano Manager:</strong> Ao utilizar este software, você concorda em gerir o estoque de forma ética e profissional.</p>
            <p><strong>Responsabilidade:</strong> O desenvolvedor isenta-se de qualquer erro de pedido. A conferência final no WhatsApp é obrigatória.</p>
            <p><strong>Dados:</strong> Os logs de contagem são vinculados ao seu usuário para fins de histórico e auditoria interna.</p>
            <p><strong>Propriedade:</strong> Algoritmos e design pertencem à Artigiano Pizzaria.</p>
            <p><strong>Bloqueio:</strong> Em caso de recusa, seu acesso será suspenso por 3 minutos para resfriamento de sistema.</p>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={handleAccept} className="btn-italiano w-full py-4 rounded-2xl uppercase tracking-widest text-sm">Aceitar e Continuar</button>
            <button onClick={handleReject} className="w-full py-3 text-red-500 font-bold uppercase text-[10px] tracking-widest">Recusar Termos</button>
          </div>
        </div>
      </div>
    );
  };

  const Login = () => {
    const [u, setU] = useState('');
    const [p, setP] = useState('');
    const [locked, setLocked] = useState(isLocked());
    const [seconds, setSeconds] = useState(getLockCountdown());

    useEffect(() => {
      let timer: number;
      if (locked) {
        timer = window.setInterval(() => {
          const c = getLockCountdown();
          setSeconds(c);
          if (c <= 0) {
            setLocked(false);
            localStorage.removeItem('pm_rejection_time');
            setRejectionTime(null);
          }
        }, 1000);
      }
      return () => clearInterval(timer);
    }, [locked]);

    const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      const found = users.find(user => user.username === u.toUpperCase() && user.pin === p);
      if (found) {
        setCurrentUser(found);
        if (!found.acceptedTerms) setCurrentMode('Terms');
        feedback('success');
      } else {
        feedback('error');
        alert("ID ou PIN incorreto");
      }
    };

    if (locked) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-red-50 dark:bg-zinc-950">
          <div className="text-center">
            <i className="fa-solid fa-clock-rotate-left text-red-600 text-6xl mb-6 animate-pulse"></i>
            <h2 className="text-2xl font-black uppercase text-gray-800 dark:text-white">Acesso Suspenso</h2>
            <p className="text-sm font-bold text-gray-400 mt-2 uppercase">Aguarde o resfriamento de sistema</p>
            <div className="mt-8 text-6xl font-black text-red-600 tracking-tighter">{seconds}s</div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-italy-white dark:bg-zinc-950">
        <div className="glass w-full max-w-md p-10 rounded-[3.5rem] shadow-2xl border-b-[14px] border-[#CD212A] border-t-[14px] border-[#008C45] text-center">
          <div className="w-24 h-24 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6 mx-auto shadow-xl border-4 border-gray-50 dark:border-zinc-700">
            <i className="fa-solid fa-pizza-slice text-red-600 text-5xl transform -rotate-12"></i>
          </div>
          <h1 className="text-4xl font-black text-gray-800 dark:text-white uppercase italic tracking-tighter mb-1">PIZZAMASTER</h1>
          <p className="text-gray-400 font-bold text-[10px] tracking-[0.3em] uppercase mb-10">Premium Italian Workflow</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="ID USUÁRIO" className="ios-input" value={u} onChange={e => setU(e.target.value.toUpperCase())} required />
            <input type="password" inputMode="numeric" placeholder="PIN" className="ios-input text-center tracking-[1em] text-2xl font-black" value={p} onChange={e => setP(e.target.value.slice(0,4))} required />
            <button type="submit" className="btn-italiano w-full py-5 rounded-3xl uppercase tracking-widest text-lg mt-4">Entrar</button>
          </form>
          <p className="mt-8 text-[9px] font-black text-gray-400 uppercase tracking-widest opacity-50">Artigiano Manager v4.2.0</p>
        </div>
      </div>
    );
  };

  const DoughCalculator = () => {
    const day = new Date().getDay(); // 0-Sun, 1-Mon, ...
    // Mon(1), Tue(2), Wed(3), Sun(0) -> 60. Thu(4), Fri(5), Sat(6) -> 100.
    const suggested = (day === 0 || day <= 3) ? 60 : 100;
    const [massasCount, setMassasCount] = useState(suggested);
    
    const calc = (n: number) => ({
      farinha: (n * 133.3).toFixed(1),
      agua: (n * 83.1).toFixed(1),
      liq: (n * 58.2).toFixed(1),
      gelo: (n * 24.9).toFixed(1),
      levain: (n * 6).toFixed(1),
      sal: (n * 4).toFixed(1)
    });

    const res = calc(massasCount);

    return (
      <div className="p-6 pb-32 animate-slide">
        <button onClick={() => setCurrentMode('Home')} className="mb-6 flex items-center text-gray-400 dark:text-gray-500 uppercase font-black text-[10px] tracking-widest"><i className="fa-solid fa-chevron-left mr-2"></i> Voltar</button>
        <h2 className="text-3xl font-black uppercase italic mb-2">Calculadora de Massas</h2>
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-sm border-l-8 border-[#008C45] mb-8">
          <p className="text-xs font-bold text-gray-400 uppercase mb-4">Sugestão p/ Hoje: <span className="text-green-600">{suggested} Massas</span></p>
          <div className="flex items-center gap-4">
            <input type="range" min="15" max="150" step="5" value={massasCount} onChange={e => setMassasCount(parseInt(e.target.value))} className="flex-1 h-3 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#CD212A]" />
            <span className="text-4xl font-black italic text-gray-800 dark:text-white">{massasCount}</span>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase mt-4 text-center">Peso Unitário Final: ~226g</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-sm flex flex-col items-center">
            <i className="fa-solid fa-wheat-awn text-[#008C45] text-2xl mb-2"></i>
            <p className="text-[10px] font-black uppercase text-gray-400">Farinha</p>
            <p className="text-2xl font-black">{res.farinha}g</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-sm flex flex-col items-center">
            <i className="fa-solid fa-droplet text-blue-500 text-2xl mb-2"></i>
            <p className="text-[10px] font-black uppercase text-gray-400">Água Total</p>
            <p className="text-2xl font-black">{res.agua}g</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-3xl border border-blue-100 dark:border-blue-800/50 flex flex-col items-center">
            <p className="text-[10px] font-black uppercase text-blue-500">Líquida (70%)</p>
            <p className="text-xl font-black text-blue-700 dark:text-blue-300">{res.liq}g</p>
          </div>
          <div className="bg-cyan-50 dark:bg-cyan-900/10 p-5 rounded-3xl border border-cyan-100 dark:border-cyan-800/50 flex flex-col items-center">
            <p className="text-[10px] font-black uppercase text-cyan-500">Gelo (30%)</p>
            <p className="text-xl font-black text-cyan-700 dark:text-cyan-300">{res.gelo}g</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-sm flex flex-col items-center">
            <i className="fa-solid fa-bacteria text-orange-400 text-2xl mb-2"></i>
            <p className="text-[10px] font-black uppercase text-gray-400">Levain</p>
            <p className="text-2xl font-black">{res.levain}g</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-sm flex flex-col items-center">
            <i className="fa-solid fa-cubes-stacked text-gray-400 text-2xl mb-2"></i>
            <p className="text-[10px] font-black uppercase text-gray-400">Sal</p>
            <p className="text-2xl font-black">{res.sal}g</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-italy-red flex items-center"><i className="fa-solid fa-list-check mr-2"></i> Processo Operacional (POP)</h3>
          <div className="space-y-3">
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-gray-100 dark:border-zinc-800">
               <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Passo 1: Mistura 1</p>
               <p className="text-[11px] opacity-70">Água Líquida + Gelo + Sal + 50% Farinha. Bater até homogeneizar.</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-gray-100 dark:border-zinc-800">
               <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Passo 2: Mistura 2</p>
               <p className="text-[11px] opacity-70">Restante Farinha (50%) + Levain. Bater até ponto de véu/cera ("ploc ploc").</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-gray-100 dark:border-zinc-800">
               <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Passo 3: Modelagem</p>
               <p className="text-[11px] opacity-70">Cortar massas de 220g, bolear e colocar nas caixas (6 por bandeja).</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Inventory = () => {
    const filtered = products.filter(p => p.category === selectedCategory);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    
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
        const itemLogs = logs.filter(l => l.productName === p.name);
        const latest = itemLogs[itemLogs.length - 1];
        const currentCount = latest ? (latest.locations.freezer + latest.locations.shelf + latest.locations.other) : 0;
        const target = p.targetStock || 20;
        const diff = Math.max(0, target - currentCount);
        const orderQty = p.conversionType === 'divide' ? (diff / p.conversionFactor) : (diff * p.conversionFactor);
        
        if (orderQty > 0) {
            itemsMsg += `• ${p.name}: ${orderQty.toFixed(1)} ${p.purchaseUnit}\n`;
        }
      });

      if (!itemsMsg) {
          alert("Nenhum item abaixo da meta!");
          return;
      }

      const fullMsg = `${sup.greeting}\n\n*PEDIDO PIZZAMASTER*\n*Setor:* ${selectedCategory}\n\n${itemsMsg}\n_Solicitado por: ${currentUser?.name}_`;
      window.open(`https://wa.me/${sup.phone}?text=${encodeURIComponent(fullMsg)}`, '_blank');
      feedback('success');
    };

    return (
      <div className="p-6 pb-40 animate-slide">
        <div className="flex items-center justify-between mb-8">
            <button onClick={() => setCurrentMode('Home')} className="w-10 h-10 glass rounded-2xl flex items-center justify-center text-gray-500 shadow-sm"><i className="fa-solid fa-chevron-left"></i></button>
            <h2 className="text-2xl font-black uppercase italic text-gray-800 dark:text-white">{selectedCategory}</h2>
            <div className="w-10"></div>
        </div>

        <div className="space-y-4">
          {filtered.map(p => {
            const itemLogs = logs.filter(l => l.productName === p.name);
            const latest = itemLogs[itemLogs.length - 1];
            return (
              <div key={p.id} className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-zinc-800 relative">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                        <h4 className="font-black uppercase italic text-gray-800 dark:text-gray-100 text-lg">{p.name}</h4>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base: {p.baseUnit}</p>
                    </div>
                    {canEdit && <button onClick={() => setEditingProduct(p)} className="text-gray-300 hover:text-italy-red p-2"><i className="fa-solid fa-ellipsis-vertical"></i></button>}
                 </div>
                 <div className="grid grid-cols-3 gap-3">
                   {['freezer', 'shelf', 'other'].map(l => (
                     <div key={l} className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-gray-400 block text-center">{l}</label>
                        <input 
                            type="number" 
                            placeholder="0" 
                            defaultValue={latest ? latest.locations[l as keyof LogEntry['locations']] : ''}
                            className="ios-input text-center text-sm p-3 h-12" 
                            onBlur={e => handleUpdate(p, l, e.target.value)} 
                        />
                     </div>
                   ))}
                 </div>
              </div>
            );
          })}
        </div>

        {/* Action Bar */}
        <div className="fixed bottom-24 left-6 right-6 flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {suppliers.map(s => (
                <button key={s.id} onClick={() => handleSendOrder(s.id)} className="whitespace-nowrap bg-black text-white px-8 py-5 rounded-[1.8rem] font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 flex items-center gap-2">
                   <i className="fa-brands fa-whatsapp text-lg"></i>
                   Pedir: {s.name}
                </button>
            ))}
        </div>

        {/* Modal Edição Simples */}
        {editingProduct && (
            <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[3rem] p-8 animate-slide">
                    <h3 className="text-xl font-black uppercase mb-6">Editar {editingProduct.name}</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase opacity-50 block mb-1">Meta de Estoque</label>
                            <input type="number" className="ios-input" value={editingProduct.targetStock || 20} onChange={e => {
                                const val = parseInt(e.target.value);
                                setProducts(products.map(it => it.id === editingProduct.id ? {...it, targetStock: val} : it));
                                setEditingProduct({...editingProduct, targetStock: val});
                            }} />
                        </div>
                        <button onClick={() => setEditingProduct(null)} className="w-full btn-italiano py-4 rounded-2xl uppercase font-black">Salvar Alterações</button>
                        <button onClick={() => {
                            if(confirm("Deseja apagar este item?")) {
                                setProducts(products.filter(it => it.id !== editingProduct.id));
                                setEditingProduct(null);
                            }
                        }} className="w-full py-2 text-red-500 font-bold uppercase text-[10px] tracking-widest">Excluir Produto</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  };

  const Settings = () => {
    const [subTab, setSubTab] = useState<'users' | 'suppliers' | 'products'>('users');
    const [newUser, setNewUser] = useState<Partial<User>>({ role: 'Atendente', permissions: [] });
    const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({});
    const [newProduct, setNewProduct] = useState<Partial<Product>>({ category: 'Geral', conversionType: 'divide', conversionFactor: 1 });

    const togglePermission = async (user: User, cat: Category) => {
        const newPerms = user.permissions.includes(cat) 
            ? user.permissions.filter(p => p !== cat) 
            : [...user.permissions, cat];
        const updated = { ...user, permissions: newPerms };
        const db = await openDB();
        await db.transaction('users', 'readwrite').objectStore('users').put(updated);
        setUsers(users.map(u => u.username === user.username ? updated : u));
        feedback('click');
    };

    return (
      <div className="p-6 pb-32 animate-slide">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black uppercase italic">Painel Admin</h2>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-amber-500 shadow-md">
                <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
        </div>
        
        <div className="flex gap-2 mb-8 bg-white dark:bg-zinc-900 p-2 rounded-[2rem] shadow-sm">
           <button onClick={() => setSubTab('users')} className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all ${subTab === 'users' ? 'bg-italy-green text-white shadow-lg' : 'text-gray-400'}`}>Equipe</button>
           <button onClick={() => setSubTab('products')} className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all ${subTab === 'products' ? 'bg-italy-red text-white shadow-lg' : 'text-gray-400'}`}>Insumos</button>
           <button onClick={() => setSubTab('suppliers')} className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all ${subTab === 'suppliers' ? 'bg-black text-white shadow-lg' : 'text-gray-400'}`}>Contatos</button>
        </div>

        {subTab === 'users' && (
            <div className="space-y-6">
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-sm">
                    <h3 className="font-black uppercase italic mb-6 text-sm">Novo Colaborador</h3>
                    <div className="space-y-4">
                        <input type="text" placeholder="Nome" className="ios-input" onChange={e => setNewUser({...newUser, name: e.target.value})} />
                        <div className="flex gap-2">
                            <input type="text" placeholder="ID" className="ios-input" onChange={e => setNewUser({...newUser, username: e.target.value.toUpperCase()})} />
                            <input type="text" placeholder="PIN" className="ios-input" onChange={e => setNewUser({...newUser, pin: e.target.value.slice(0,4)})} />
                        </div>
                        <select className="ios-input" onChange={e => setNewUser({...newUser, role: e.target.value as Role})}>
                            <option value="Atendente">Atendente</option>
                            <option value="Pizzaiolo">Pizzaiolo</option>
                            <option value="Gerente">Gerente</option>
                            <option value="ADM">ADM</option>
                        </select>
                        <button onClick={async () => {
                            if (!newUser.username || !newUser.pin) return;
                            const userToAdd = { ...newUser, permissions: [], acceptedTerms: false } as User;
                            const db = await openDB();
                            await db.transaction('users', 'readwrite').objectStore('users').add(userToAdd);
                            setUsers([...users, userToAdd]);
                            feedback('success');
                        }} className="btn-italiano w-full py-4 rounded-2xl uppercase font-black">Adicionar</button>
                    </div>
                </div>
                <div className="space-y-4">
                    {users.map(u => (
                        <div key={u.username} className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-zinc-800">
                           <div className="flex justify-between items-center mb-4">
                             <h4 className="font-black uppercase italic">{u.name}</h4>
                             <span className="text-[10px] font-black bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded-full uppercase opacity-60">{u.role}</span>
                           </div>
                           <p className="text-[9px] font-black uppercase text-gray-400 mb-3 tracking-widest">Acesso por Setor:</p>
                           <div className="flex flex-wrap gap-2">
                             {ALL_CATEGORIES.map(cat => (
                                 <button key={cat} onClick={() => togglePermission(u, cat)} className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border transition-all ${u.permissions.includes(cat) ? 'bg-italy-green border-italy-green text-white' : 'bg-transparent border-gray-200 text-gray-400'}`}>{cat}</button>
                             ))}
                           </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {subTab === 'products' && (
            <div className="space-y-6">
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-sm">
                    <h3 className="font-black uppercase italic mb-6 text-sm">Novo Produto</h3>
                    <div className="space-y-4">
                        <input type="text" placeholder="Nome" className="ios-input" onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                        <div className="flex gap-2">
                            <select className="ios-input" onChange={e => setNewProduct({...newProduct, category: e.target.value as Category})}>
                                {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select className="ios-input" onChange={e => setNewProduct({...newProduct, supplierId: e.target.value})}>
                                <option value="">Fornecedor</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <input type="text" placeholder="Un. Base (Ex: kg)" className="ios-input" onChange={e => setNewProduct({...newProduct, baseUnit: e.target.value})} />
                            <input type="text" placeholder="Un. Compra (Ex: cx)" className="ios-input" onChange={e => setNewProduct({...newProduct, purchaseUnit: e.target.value})} />
                        </div>
                        <button onClick={() => {
                            setProducts([...products, { ...newProduct, id: Date.now().toString() } as Product]);
                            feedback('success');
                        }} className="btn-italiano w-full py-4 rounded-2xl uppercase font-black">Salvar Insumo</button>
                    </div>
                </div>
                {/* List products for reference */}
                <div className="grid grid-cols-2 gap-3">
                   {products.map(p => (
                       <div key={p.id} className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-gray-100 dark:border-zinc-800">
                           <p className="font-black uppercase italic text-[10px] truncate">{p.name}</p>
                           <p className="text-[8px] font-black text-gray-400 uppercase">{p.category}</p>
                       </div>
                   ))}
                </div>
            </div>
        )}

        {subTab === 'suppliers' && (
            <div className="space-y-6">
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-sm">
                    <h3 className="font-black uppercase italic mb-6 text-sm">Novo Fornecedor</h3>
                    <div className="space-y-4">
                        <input type="text" placeholder="Nome Empresa" className="ios-input" onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} />
                        <input type="text" placeholder="WhatsApp (DDD+Num)" className="ios-input" onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} />
                        <textarea placeholder="Saudação Inicial Personalizada" className="ios-input h-24 resize-none" onChange={e => setNewSupplier({...newSupplier, greeting: e.target.value})}></textarea>
                        <button onClick={() => {
                            setSuppliers([...suppliers, { ...newSupplier, id: Date.now().toString() } as Supplier]);
                            feedback('success');
                        }} className="btn-italiano w-full py-4 rounded-2xl uppercase font-black">Registrar Contato</button>
                    </div>
                </div>
                <div className="space-y-3">
                    {suppliers.map(s => (
                        <div key={s.id} className="bg-white dark:bg-zinc-900 p-5 rounded-[2rem] shadow-sm border border-gray-100 dark:border-zinc-800">
                           <div className="flex justify-between items-center">
                             <h4 className="font-black uppercase italic">{s.name}</h4>
                             <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">{s.phone}</span>
                           </div>
                           <p className="text-[9px] mt-2 opacity-50 italic truncate">"{s.greeting}"</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    );
  };

  const Navbar = () => (
    <div className="fixed bottom-0 left-0 right-0 glass pb-safe px-6 py-5 flex justify-between items-center z-50 border-t border-gray-100 dark:border-zinc-800">
      <button onClick={() => setCurrentMode('Home')} className={`flex flex-col items-center transition-all ${currentMode === 'Home' ? 'text-green-600 scale-110' : 'text-gray-400 opacity-60'}`}>
        <i className="fa-solid fa-house-chimney text-xl"></i>
        <span className="text-[9px] font-black uppercase mt-1 tracking-widest">Início</span>
      </button>
      <button onClick={() => setCurrentMode('History')} className={`flex flex-col items-center transition-all ${currentMode === 'History' ? 'text-green-600 scale-110' : 'text-gray-400 opacity-60'}`}>
        <i className="fa-solid fa-receipt text-xl"></i>
        <span className="text-[9px] font-black uppercase mt-1 tracking-widest">Histórico</span>
      </button>
      {canEdit && (
        <button onClick={() => setCurrentMode('Settings')} className={`flex flex-col items-center transition-all ${currentMode === 'Settings' ? 'text-green-600 scale-110' : 'text-gray-400 opacity-60'}`}>
          <i className="fa-solid fa-screwdriver-wrench text-xl"></i>
          <span className="text-[9px] font-black uppercase mt-1 tracking-widest">Painel</span>
        </button>
      )}
      <button onClick={logout} className="flex flex-col items-center text-red-500 opacity-80 hover:opacity-100">
        <i className="fa-solid fa-power-off text-xl"></i>
        <span className="text-[9px] font-black uppercase mt-1 tracking-widest">Sair</span>
      </button>
    </div>
  );

  if (!currentUser) return <Login />;
  if (currentUser && !currentUser.acceptedTerms) return <TermsScreen />;

  return (
    <div className="max-w-md mx-auto min-h-screen relative pb-32">
      {currentMode === 'Home' && (
          <div className="p-6 animate-slide">
             <header className="mb-10 flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">CIAO, {currentUser.name.split(' ')[0]}!</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{currentUser.role}</p>
                </div>
                <div className="w-14 h-14 glass rounded-[1.5rem] flex items-center justify-center text-green-600 shadow-md border border-green-100">
                  <i className="fa-solid fa-circle-user text-2xl"></i>
                </div>
             </header>
             <div className="grid grid-cols-2 gap-5">
                {currentUser.permissions.map(cat => {
                    const icon = cat === 'Sacolão' ? 'fa-carrot' : cat === 'Massas' ? 'fa-bowl-rice' : cat === 'Geral' ? 'fa-boxes-stacked' : cat === 'Limpeza' ? 'fa-soap' : 'fa-wine-bottle';
                    const color = cat === 'Massas' ? 'bg-[#008C45]' : cat === 'Sacolão' ? 'bg-orange-500' : cat === 'Geral' ? 'bg-[#CD212A]' : cat === 'Bebidas' ? 'bg-blue-500' : 'bg-zinc-600';
                    return (
                        <button 
                            key={cat} onClick={() => { if(cat === 'Massas') setCurrentMode('Massas'); else { setSelectedCategory(cat); setCurrentMode('Inventory'); } feedback('click'); }}
                            className="bg-white dark:bg-zinc-900 p-8 rounded-[3.5rem] shadow-sm flex flex-col items-center justify-center aspect-square border border-gray-100 dark:border-zinc-800 active:scale-95 transition-all hover:shadow-xl"
                        >
                            <div className={`${color} w-20 h-20 rounded-[2.2rem] flex items-center justify-center text-white text-4xl mb-5 shadow-xl`}>
                                <i className={`fa-solid ${icon}`}></i>
                            </div>
                            <span className="font-black text-gray-800 dark:text-gray-100 uppercase tracking-tighter text-xs">{cat}</span>
                        </button>
                    )
                })}
             </div>
             
             <div className="mt-12 bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-sm border border-gray-50 dark:border-zinc-800 card-italy-red">
                <h3 className="font-black uppercase tracking-tighter mb-4 text-xs italic">Estado da Masseira</h3>
                <div className="flex gap-4">
                    <div className="flex-1 bg-green-50 dark:bg-green-900/10 p-4 rounded-2xl border border-green-100 dark:border-green-800 flex items-center gap-3">
                        <i className="fa-solid fa-check-circle text-green-600"></i>
                        <span className="text-[10px] font-black uppercase">Limpa</span>
                    </div>
                    <div className="flex-1 bg-gray-50 dark:bg-zinc-800 p-4 rounded-2xl border border-gray-100 dark:border-zinc-700 flex items-center gap-3 opacity-50">
                        <i className="fa-solid fa-circle text-gray-400"></i>
                        <span className="text-[10px] font-black uppercase">Em uso</span>
                    </div>
                </div>
             </div>
          </div>
      )}
      {currentMode === 'Massas' && <DoughCalculator />}
      {currentMode === 'Inventory' && <Inventory />}
      {currentMode === 'Settings' && <Settings />}
      {currentMode === 'History' && (
          <div className="p-6 pb-32 animate-slide">
             <h2 className="text-3xl font-black uppercase italic mb-8">Histórico Geral</h2>
             <div className="space-y-4">
                {logs.length === 0 && <p className="text-center text-gray-400 font-black uppercase text-[10px] py-20">Nenhum log registrado</p>}
                {logs.slice(-40).reverse().map((l, i) => (
                    <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-800 flex justify-between items-center shadow-sm">
                        <div>
                            <p className="font-black text-sm uppercase italic text-gray-800 dark:text-gray-100">{l.productName}</p>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{l.userName} • {new Date(l.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                        <div className="flex gap-2">
                             <span className="text-[9px] font-black bg-green-50 dark:bg-green-900/20 text-green-600 px-3 py-1 rounded-lg">F:{l.locations.freezer}</span>
                             <span className="text-[9px] font-black bg-italy-red/5 text-italy-red px-3 py-1 rounded-lg">P:{l.locations.shelf}</span>
                        </div>
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
