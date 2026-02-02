import { h, render } from 'https://esm.sh/preact';
import { useState, useEffect, useMemo } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';

const html = htm.bind(h);

// --- CONFIGURAÇÕES ---
const DB_NAME = 'ArtigianoDB_v7';
const DB_VERSION = 1;
const ALL_CATEGORIES = ['Sacolão', 'Geral', 'Limpeza', 'Massas', 'Bebidas'];

// --- BANCO DE DADOS ---
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'username' });
            if (!db.objectStoreNames.contains('logs')) db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Erro ao abrir banco");
    });
};

const App = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [currentMode, setCurrentMode] = useState('Home');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('art_theme') === 'dark');
    
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState(() => JSON.parse(localStorage.getItem('art_products') || '[]'));
    const [suppliers, setSuppliers] = useState(() => JSON.parse(localStorage.getItem('art_suppliers') || '[]'));
    const [logs, setLogs] = useState([]);

    // Inicialização Robusta
    useEffect(() => {
        const init = async () => {
            try {
                const db = await openDB();
                const tx = db.transaction('users', 'readwrite');
                const store = tx.objectStore('users');
                
                const req = store.getAll();
                req.onsuccess = () => {
                    let list = req.result;
                    if (!list.find(u => u.username === 'ADM')) {
                        const adm = { username: 'ADM', pin: '1821', role: 'ADM', name: 'Administrador', permissions: ALL_CATEGORIES, acceptedTerms: true };
                        store.add(adm);
                        list = [adm, ...list];
                    }
                    setUsers(list);
                };

                const txL = db.transaction('logs', 'readonly').objectStore('logs').getAll();
                txL.onsuccess = () => setLogs(txL.result);

            } catch (err) {
                console.warn("Erro ao carregar DB, usando fallback:", err);
            } finally {
                // Remove o loader EM QUALQUER CASO
                const loader = document.getElementById('watchdog');
                if (loader) {
                    loader.style.opacity = '0';
                    setTimeout(() => loader.remove(), 500);
                }
            }
        };
        init();
    }, []);

    useEffect(() => {
        localStorage.setItem('art_products', JSON.stringify(products));
        localStorage.setItem('art_suppliers', JSON.stringify(suppliers));
        document.documentElement.classList.toggle('dark', isDarkMode);
        localStorage.setItem('art_theme', isDarkMode ? 'dark' : 'light');
    }, [products, suppliers, isDarkMode]);

    const logout = () => { setCurrentUser(null); setCurrentMode('Home'); };

    // --- COMPONENTES DE TELA ---

    const Login = () => {
        const [u, setU] = useState('');
        const [p, setP] = useState('');

        const handleLogin = (e) => {
            e.preventDefault();
            const found = users.find(user => user.username === u.toUpperCase() && user.pin === p);
            if (found) {
                setCurrentUser(found);
                setCurrentMode('Home');
            } else {
                alert("ID ou PIN inválido (Dica: ADM / 1821)");
            }
        };

        return html`
            <div class="min-h-screen flex items-center justify-center p-6">
                <div class="glass w-full max-w-md p-10 rounded-[3rem] text-center shadow-2xl animate-slide">
                    <div class="w-20 h-20 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <i class="fa-solid fa-pizza-slice text-red-600 text-4xl"></i>
                    </div>
                    <h1 class="text-3xl font-black italic tracking-tighter mb-8">ARTIGIANO GESTÃO</h1>
                    <form onSubmit=${handleLogin} class="space-y-4">
                        <input type="text" placeholder="ID USUÁRIO" class="ios-input" value=${u} onInput=${e => setU(e.target.value)} />
                        <input type="password" placeholder="PIN" class="ios-input text-center text-2xl tracking-widest" value=${p} onInput=${e => setP(e.target.value)} />
                        <button type="submit" class="btn-italiano w-full py-4 rounded-2xl uppercase font-black mt-4">Entrar</button>
                    </form>
                </div>
            </div>`;
    };

    const Home = () => html`
        <div class="p-6 animate-slide">
            <header class="flex justify-between items-center mb-10">
                <div>
                    <h2 class="text-2xl font-black italic">CIAO, ${currentUser.name}!</h2>
                    <p class="text-[10px] uppercase font-bold text-gray-400">Cargo: ${currentUser.role}</p>
                </div>
                <button onClick=${() => setIsDarkMode(!isDarkMode)} class="w-10 h-10 glass rounded-xl">
                    <i class="fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-amber-500"></i>
                </button>
            </header>

            <div class="grid grid-cols-2 gap-4">
                ${currentUser.permissions.map(cat => html`
                    <button onClick=${() => { setSelectedCategory(cat); setCurrentMode(cat === 'Massas' ? 'Massas' : 'Inventory'); }}
                        class="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] shadow-sm flex flex-col items-center active:scale-95 transition-all">
                        <div class="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                            <i class="fa-solid ${cat === 'Massas' ? 'fa-bowl-rice' : 'fa-box'} text-xl text-green-600"></i>
                        </div>
                        <span class="font-black text-[10px] uppercase text-gray-600 dark:text-gray-300">${cat}</span>
                    </button>
                `)}
            </div>
        </div>`;

    const Inventory = () => {
        const filtered = products.filter(p => p.category === selectedCategory);
        
        const saveLog = async (p, val) => {
            const db = await openDB();
            const entry = { productName: p.name, userName: currentUser.name, value: val, timestamp: Date.now() };
            db.transaction('logs', 'readwrite').objectStore('logs').add(entry);
            if (navigator.vibrate) navigator.vibrate(30);
        };

        return html`
            <div class="p-6 pb-32 animate-slide">
                <button onClick=${() => setCurrentMode('Home')} class="mb-6 font-bold text-xs uppercase opacity-50">← Voltar</button>
                <h2 class="text-3xl font-black italic mb-6">${selectedCategory}</h2>
                <div class="space-y-4">
                    ${filtered.length === 0 ? html`<p class="text-center py-20 opacity-30 italic">Nenhum item cadastrado neste setor.</p>` : 
                      filtered.map(p => html`
                        <div class="bg-white dark:bg-zinc-900 p-5 rounded-[2rem] shadow-sm border border-gray-100 dark:border-zinc-800">
                            <h4 class="font-bold mb-4 uppercase text-sm">${p.name}</h4>
                            <div class="grid grid-cols-2 gap-2">
                                <input type="number" placeholder="Estoque" class="ios-input" onBlur=${e => saveLog(p, e.target.value)} />
                                <div class="bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-[10px] font-black opacity-40 uppercase">
                                    ${p.baseUnit}
                                </div>
                            </div>
                        </div>
                    `)}
                </div>
            </div>`;
    };

    const DoughCalc = () => {
        const [n, setN] = useState(60);
        const res = { 
            farinha: (n * 133.3).toFixed(0), 
            agua: (n * 83.1).toFixed(0), 
            sal: (n * 4).toFixed(0),
            gelo: (n * 24.9).toFixed(0)
        };

        return html`
            <div class="p-6 animate-slide">
                <button onClick=${() => setCurrentMode('Home')} class="mb-6 font-bold text-xs opacity-50 uppercase">← Voltar</button>
                <h2 class="text-3xl font-black italic mb-6">Calculadora de Massas</h2>
                <div class="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] mb-6 shadow-sm">
                    <p class="text-[10px] font-black uppercase text-gray-400 mb-4">Meta Diária</p>
                    <input type="range" min="20" max="150" step="5" value=${n} onInput=${e => setN(e.target.value)} class="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600" />
                    <div class="text-6xl font-black italic text-center mt-4 text-red-600">${n}</div>
                    <p class="text-center text-[9px] font-bold uppercase text-gray-400 mt-2">Unidades de 226g</p>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div class="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800">
                        <p class="text-[9px] font-bold text-gray-400 uppercase">Farinha</p>
                        <p class="text-lg font-black">${res.farinha}g</p>
                    </div>
                    <div class="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                        <p class="text-[9px] font-bold text-blue-500 uppercase">Água Total</p>
                        <p class="text-lg font-black text-blue-700 dark:text-blue-300">${res.agua}g</p>
                    </div>
                    <div class="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800">
                        <p class="text-[9px] font-bold text-gray-400 uppercase">Sal</p>
                        <p class="text-lg font-black">${res.sal}g</p>
                    </div>
                    <div class="bg-cyan-50 dark:bg-cyan-900/10 p-4 rounded-2xl border border-cyan-100 dark:border-cyan-900/30">
                        <p class="text-[9px] font-bold text-cyan-500 uppercase">Gelo</p>
                        <p class="text-lg font-black text-cyan-700 dark:text-cyan-300">${res.gelo}g</p>
                    </div>
                </div>
            </div>`;
    };

    const Settings = () => html`
        <div class="p-6 animate-slide">
            <h2 class="text-3xl font-black italic mb-8">Painel Admin</h2>
            <div class="space-y-4">
                <button onClick=${() => {
                    const name = prompt("Nome do Produto:");
                    const cat = prompt("Categoria (Sacolão, Geral, Limpeza, Massas, Bebidas):", "Geral");
                    if(name && cat) setProducts([...products, { id: Date.now(), name, category: cat, baseUnit: 'un' }]);
                }} class="w-full bg-white dark:bg-zinc-900 p-6 rounded-3xl font-bold uppercase text-xs text-left shadow-sm flex justify-between items-center">
                    <span>+ Novo Insumo</span>
                    <i class="fa-solid fa-plus opacity-30"></i>
                </button>
                
                <button onClick=${logout} class="w-full bg-red-100 text-red-600 p-6 rounded-3xl font-bold uppercase text-xs shadow-sm active:bg-red-200">
                    Encerrar Sessão
                </button>
            </div>
        </div>`;

    // Renderização Condicional
    if (!currentUser) return html`<${Login} />`;

    return html`
        <div class="max-w-md mx-auto min-h-screen relative pb-24">
            ${currentMode === 'Home' && html`<${Home} />`}
            ${currentMode === 'Inventory' && html`<${Inventory} />`}
            ${currentMode === 'Massas' && html`<${DoughCalc} />`}
            ${currentMode === 'Settings' && html`<${Settings} />`}
            
            <!-- Bottom Navbar -->
            <nav class="fixed bottom-0 left-0 right-0 glass h-20 flex justify-around items-center px-6 border-t border-white/20 z-40">
                <button onClick=${() => setCurrentMode('Home')} class="text-xl ${currentMode === 'Home' ? 'text-green-600' : 'opacity-30'} transition-all"><i class="fa-solid fa-house"></i></button>
                <button onClick=${() => setCurrentMode('Settings')} class="text-xl ${currentMode === 'Settings' ? 'text-green-600' : 'opacity-30'} transition-all"><i class="fa-solid fa-user-gear"></i></button>
            </nav>
        </div>`;
};

render(html`<${App} />`, document.getElementById('root'));