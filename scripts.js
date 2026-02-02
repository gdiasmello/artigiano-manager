import { h, render } from 'https://esm.sh/preact';
import { useState, useEffect, useMemo } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';

const html = htm.bind(h);

// --- CONFIGURAÇÕES E BANCO ---
const DB_NAME = 'ArtigianoDB_v5';
const DB_VERSION = 1;
const ALL_CATEGORIES = ['Sacolão', 'Geral', 'Limpeza', 'Massas', 'Bebidas'];

const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'username' });
            if (!db.objectStoreNames.contains('logs')) db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const App = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [currentMode, setCurrentMode] = useState('Home');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('pm_theme') === 'dark');
    const [rejectionTime, setRejectionTime] = useState(() => {
        const saved = localStorage.getItem('pm_rejection_time');
        return saved ? parseInt(saved) : null;
    });

    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState(JSON.parse(localStorage.getItem('pm_products') || '[]'));
    const [suppliers, setSuppliers] = useState(JSON.parse(localStorage.getItem('pm_suppliers') || '[]'));
    const [logs, setLogs] = useState([]);

    // Feedback tátil
    const feedback = (type) => {
        if (navigator.vibrate) navigator.vibrate(40);
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(type === 'success' ? 880 : type === 'error' ? 220 : 440, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        } catch (e) {}
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
                const list = req.result;
                if (!list.find(u => u.username === 'ADM')) {
                    const adm = { username: 'ADM', pin: '1821', role: 'ADM', name: 'Administrador', permissions: ALL_CATEGORIES, acceptedTerms: true };
                    const txW = db.transaction('users', 'readwrite');
                    txW.objectStore('users').add(adm);
                    setUsers([adm, ...list]);
                } else {
                    setUsers(list);
                }
            };
            const txL = db.transaction('logs', 'readonly').objectStore('logs').getAll();
            txL.onsuccess = () => setLogs(txL.result);
            
            setTimeout(() => {
                const watchdog = document.getElementById('watchdog');
                if (watchdog) {
                    watchdog.style.opacity = '0';
                    setTimeout(() => watchdog.remove(), 500);
                }
            }, 1000);
        };
        init();
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
        return (Date.now() - rejectionTime) / 1000 < 180;
    };

    // --- COMPONENTES ---

    const Login = () => {
        const [u, setU] = useState('');
        const [p, setP] = useState('');
        const locked = isLocked();

        if (locked) return html`
            <div className="min-h-screen flex items-center justify-center p-6 bg-red-50 dark:bg-zinc-950">
                <div className="text-center">
                    <i className="fa-solid fa-clock text-red-600 text-6xl mb-6 animate-pulse"></i>
                    <h2 className="text-2xl font-black uppercase">Acesso Suspenso</h2>
                    <p className="text-sm font-bold text-gray-400 mt-2">Aguarde 3 minutos</p>
                </div>
            </div>`;

        return html`
            <div className="min-h-screen flex items-center justify-center p-6 bg-italy-white dark:bg-zinc-950">
                <div className="glass w-full max-w-md p-10 rounded-[3.5rem] shadow-2xl border-b-[14px] border-[#CD212A] border-t-[14px] border-[#008C45] text-center">
                    <div className="w-24 h-24 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6 mx-auto shadow-xl">
                        <i className="fa-solid fa-pizza-slice text-red-600 text-5xl transform -rotate-12"></i>
                    </div>
                    <h1 className="text-4xl font-black text-gray-800 dark:text-white uppercase italic tracking-tighter mb-1">ARTIGIANO</h1>
                    <p className="text-gray-400 font-bold text-[10px] tracking-[0.3em] uppercase mb-10">Workflow de Elite</p>
                    <form onSubmit=${(e) => {
                        e.preventDefault();
                        const found = users.find(user => user.username === u.toUpperCase() && user.pin === p);
                        if (found) {
                            setCurrentUser(found);
                            if (!found.acceptedTerms) setCurrentMode('Terms');
                            feedback('success');
                        } else {
                            feedback('error');
                            alert("Login inválido");
                        }
                    }} className="space-y-4">
                        <input type="text" placeholder="USUÁRIO" className="ios-input" value=${u} onInput=${e => setU(e.target.value.toUpperCase())} required />
                        <input type="password" placeholder="PIN" className="ios-input text-center tracking-[1em] text-2xl font-black" value=${p} onInput=${e => setP(e.target.value.slice(0,4))} required />
                        <button type="submit" className="btn-italiano w-full py-5 rounded-3xl uppercase tracking-widest text-lg mt-4">Entrar</button>
                    </form>
                </div>
            </div>`;
    };

    const DoughCalculator = () => {
        const day = new Date().getDay();
        const suggested = (day === 0 || day <= 3) ? 60 : 100;
        const [count, setCount] = useState(suggested);
        
        const res = useMemo(() => ({
            farinha: (count * 133.3).toFixed(1),
            agua: (count * 83.1).toFixed(1),
            liq: (count * 58.2).toFixed(1),
            gelo: (count * 24.9).toFixed(1),
            levain: (count * 6).toFixed(1),
            sal: (count * 4).toFixed(1)
        }), [count]);

        return html`
            <div className="p-6 pb-32 animate-slide">
                <button onClick=${() => setCurrentMode('Home')} className="mb-6 flex items-center text-gray-400 uppercase font-black text-[10px] tracking-widest"><i className="fa-solid fa-chevron-left mr-2"></i> Voltar</button>
                <h2 className="text-3xl font-black uppercase italic mb-2">Calculadora de Massas</h2>
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-sm border-l-8 border-[#008C45] mb-8">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-4">Sugestão: <span className="text-green-600">${suggested} Massas</span></p>
                    <div className="flex items-center gap-4">
                        <input type="range" min="15" max="150" step="5" value=${count} onChange=${e => setCount(parseInt(e.target.value))} className="flex-1 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#CD212A]" />
                        <span className="text-4xl font-black italic">${count}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-10">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-sm flex flex-col items-center">
                        <i className="fa-solid fa-wheat-awn text-green-600 mb-2"></i>
                        <p className="text-[10px] font-black uppercase text-gray-400">Farinha</p>
                        <p className="text-2xl font-black">${res.farinha}g</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-sm flex flex-col items-center">
                        <i className="fa-solid fa-droplet text-blue-500 mb-2"></i>
                        <p className="text-[10px] font-black uppercase text-gray-400">Água Total</p>
                        <p className="text-2xl font-black">${res.agua}g</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-3xl flex flex-col items-center border border-blue-100 dark:border-blue-800">
                        <p className="text-[10px] font-black text-blue-500 uppercase">Líquida (70%)</p>
                        <p className="text-lg font-black text-blue-700 dark:text-blue-300">${res.liq}g</p>
                    </div>
                    <div className="bg-cyan-50 dark:bg-cyan-900/10 p-5 rounded-3xl flex flex-col items-center border border-cyan-100 dark:border-cyan-800">
                        <p className="text-[10px] font-black text-cyan-500 uppercase">Gelo (30%)</p>
                        <p className="text-lg font-black text-cyan-700 dark:text-cyan-300">${res.gelo}g</p>
                    </div>
                </div>
                
                <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase text-red-600 tracking-widest">Processo (POP)</h3>
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl text-xs opacity-70 border border-gray-100 dark:border-zinc-800">
                        1. Mistura 1: Água Líq + Gelo + Sal + 50% Farinha.
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl text-xs opacity-70 border border-gray-100 dark:border-zinc-800">
                        2. Mistura 2: Restante Farinha + Levain. Bater até ponto de véu.
                    </div>
                </div>
            </div>`;
    };

    const Inventory = () => {
        const filtered = products.filter(p => p.category === selectedCategory);
        
        const handleUpdate = async (p, loc, val) => {
            const num = parseFloat(val) || 0;
            const db = await openDB();
            const tx = db.transaction('logs', 'readwrite');
            const entry = {
                userName: currentUser.name,
                productName: p.name,
                locations: { freezer: 0, shelf: 0, other: 0, ...{ [loc]: num } },
                timestamp: Date.now()
            };
            tx.objectStore('logs').add(entry);
            setLogs([...logs, entry]);
            feedback('click');
        };

        const handleSendOrder = (supplierId) => {
            const sup = suppliers.find(s => s.id === supplierId);
            if (!sup) return;
            const supProds = products.filter(p => p.supplierId === supplierId && p.category === selectedCategory);
            let itemsMsg = "";
            supProds.forEach(p => {
                const itemLogs = logs.filter(l => l.productName === p.name);
                const latest = itemLogs[itemLogs.length - 1];
                const count = latest ? (latest.locations.freezer + latest.locations.shelf + latest.locations.other) : 0;
                const target = p.targetStock || 20;
                if (count < target) {
                    const diff = target - count;
                    itemsMsg += `• ${p.name}: ${diff} ${p.baseUnit}\n`;
                }
            });

            if (!itemsMsg) return alert("Nada para pedir!");

            const fullMsg = `${sup.greeting}\n\n*PEDIDO ARTIGIANO*\nSetor: ${selectedCategory}\n\n${itemsMsg}\n_Enviado por: ${currentUser.name}_`;
            window.open(`https://wa.me/${sup.phone}?text=${encodeURIComponent(fullMsg)}`, '_blank');
            feedback('success');
        };

        return html`
            <div className="p-6 pb-40 animate-slide">
                <div className="flex items-center justify-between mb-8">
                    <button onClick=${() => setCurrentMode('Home')} className="w-10 h-10 glass rounded-2xl flex items-center justify-center text-gray-500"><i className="fa-solid fa-chevron-left"></i></button>
                    <h2 className="text-2xl font-black uppercase italic">${selectedCategory}</h2>
                    <div className="w-10"></div>
                </div>

                <div className="space-y-4">
                    ${filtered.map(p => html`
                        <div