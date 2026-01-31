
// 1. Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4",
  authDomain: "artigiano-app.firebaseapp.com",
  databaseURL: "https://artigiano-app-default-rtdb.firebaseio.com",
  projectId: "artigiano-app",
  storageBucket: "artigiano-app.firebasestorage.app",
  messagingSenderId: "212218495726",
  appId: "1:212218495726:web:dd6fec7a4a8c7ad572a9ff"
};

// Inicialização
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// 2. Estado Global do App
let appState = {
    view: 'login', // login, dashboard, inventory, admin, orders
    user: null,
    theme: localStorage.getItem('theme') || 'light',
    activeCategory: null,
    products: [],
    users: [],
    suppliers: [],
    routes: [],
    orders: [],
    counts: {} // Dados temporários da contagem atual
};

// 3. Constantes e Dados Iniciais
const MASTER_LOGIN = { usuario: 'Gabriel', senha: '21gabriel' };
const CATEGORIES = ['Hortifruti', 'Geral/Insumos', 'Bebidas', 'Limpeza'];
const INITIAL_PRODUCTS = [
  { id: 'p1', nome: 'Tomate Italiano', categoria: 'Hortifruti', localEstoque: 'Câmara Fria', unidadeContagem: 'kg', unidadeCompra: 'cx', fatorConversao: 10, meta: 50, supplierId: 's1' },
  { id: 'p2', nome: 'Coca-Cola 2L', categoria: 'Bebidas', localEstoque: 'Geladeira Bebidas', unidadeContagem: 'un', unidadeCompra: 'fardo', fatorConversao: 6, meta: 36, supplierId: 's2' }
];
const INITIAL_SUPPLIERS = [
  { id: 's1', nome: 'Sacolão do Zé', whatsapp: '5511999999999' },
  { id: 's2', nome: 'Distribuidora Bebidas', whatsapp: '5511888888888' }
];

// 4. Inicialização do Tema
if (appState.theme === 'dark') document.documentElement.classList.add('dark');

// 5. Funções de Sincronização com Firebase
function startSync() {
    // Sincronizar Usuários
    db.ref('users').on('value', snapshot => {
        const val = snapshot.val();
        appState.users = val ? Object.entries(val).map(([id, item]) => ({ ...item, id })) : [];
        if (appState.view === 'admin') render();
    });

    // Sincronizar Produtos
    db.ref('products').on('value', snapshot => {
        const val = snapshot.val();
        if (!val) db.ref('products').set(INITIAL_PRODUCTS);
        appState.products = val || INITIAL_PRODUCTS;
        if (appState.view === 'dashboard' || appState.view === 'inventory') render();
    });

    // Sincronizar Fornecedores
    db.ref('suppliers').on('value', snapshot => {
        const val = snapshot.val();
        if (!val) db.ref('suppliers').set(INITIAL_SUPPLIERS);
        appState.suppliers = val || INITIAL_SUPPLIERS;
    });

    // Sincronizar Rotas
    db.ref('routes').on('value', snapshot => {
        const val = snapshot.val();
        if (!val) db.ref('routes').set(['Câmara Fria', 'Geladeira Bebidas', 'Estoque Seco', 'Área de Limpeza']);
        appState.routes = val || [];
    });

    // Sincronizar Pedidos
    db.ref('orders').on('value', snapshot => {
        const val = snapshot.val();
        appState.orders = val ? Object.entries(val).map(([id, item]) => ({ ...item, id })) : [];
        if (appState.view === 'orders') render();
    });
}

// 6. Lógica de Autenticação
auth.onAuthStateChanged(firebaseUser => {
    if (firebaseUser) {
        db.ref(`users/${firebaseUser.uid}`).on('value', snapshot => {
            appState.user = snapshot.val();
            if (appState.user) {
                appState.view = 'dashboard';
                startSync();
            } else {
                auth.signOut();
            }
            render();
        });
    } else {
        appState.user = null;
        appState.view = 'login';
        render();
    }
});

async function handleLogin(e) {
    e.preventDefault();
    const user = e.target.username.value;
    const pass = e.target.password.value;
    const errorEl = document.getElementById('auth-error');
    
    try {
        // Login Mestre
        if (user === MASTER_LOGIN.usuario && pass === MASTER_LOGIN.senha) {
            const masterEmail = "admin@pizzeriamaster.com";
            try {
                await auth.signInWithEmailAndPassword(masterEmail, pass);
            } catch {
                const cred = await auth.createUserWithEmailAndPassword(masterEmail, pass);
                await db.ref(`users/${cred.user.uid}`).set({
                    nome: 'Gabriel (Master)',
                    usuario: 'Gabriel',
                    cargo: 'Admin',
                    status: 'Aprovado',
                    permissoes: CATEGORIES
                });
            }
            return;
        }

        const email = user.includes('@') ? user : `${user}@pizzeriamaster.com`;
        await auth.signInWithEmailAndPassword(email, pass);
    } catch (err) {
        errorEl.innerText = "Credenciais inválidas ou pendente de aprovação.";
        errorEl.classList.remove('hidden');
    }
}

// 7. Componentes de Interface (Templates)
function render() {
    const root = document.getElementById('root');
    
    if (appState.view === 'login') {
        root.innerHTML = renderLogin();
        return;
    }

    root.innerHTML = `
        <div class="min-h-screen flex bg-gray-50 dark:bg-gray-950">
            ${renderSidebar()}
            <main class="flex-1 p-4 md:p-8 overflow-y-auto pt-20 md:pt-8 animate-fadeIn">
                ${renderContent()}
            </main>
        </div>
    `;
}

function renderLogin() {
    return `
    <div class="min-h-screen flex items-center justify-center p-4">
        <div class="max-w-md w-full bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl p-10 border border-gray-100 dark:border-gray-800 animate-fadeInUp">
            <div class="text-center mb-10">
                <div class="w-20 h-20 bg-italian-green mx-auto rounded-3xl flex items-center justify-center text-white text-4xl mb-6 shadow-xl shadow-green-900/30">
                   <i class="fas fa-pizza-slice"></i>
                </div>
                <h1 class="text-3xl font-black">Pizzeria <span class="text-italian-red">Master</span></h1>
                <p class="text-gray-400 font-medium mt-2">Gestão Profissional de Estoque</p>
            </div>
            <div id="auth-error" class="hidden bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold mb-6"></div>
            <form onsubmit="handleLogin(event)" class="space-y-5">
                <div>
                    <input type="text" name="username" required placeholder="Usuário" class="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-6 py-4 focus:border-italian-green outline-none dark:text-white">
                </div>
                <div>
                    <input type="password" name="password" required placeholder="Senha" class="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-6 py-4 focus:border-italian-green outline-none dark:text-white">
                </div>
                <button class="w-full bg-italian-green text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-green-900/30 hover:scale-[1.02] active:scale-95 transition-all">ENTRAR</button>
            </form>
        </div>
    </div>`;
}

function renderSidebar() {
    const isAdmin = appState.user.cargo === 'Admin' || appState.user.cargo === 'Gerente';
    return `
    <aside class="hidden md:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 p-6">
        <div class="flex items-center gap-3 mb-10">
            <div class="w-10 h-10 bg-italian-green rounded-lg flex items-center justify-center text-white"><i class="fas fa-pizza-slice"></i></div>
            <span class="font-bold text-lg">Master Gestão</span>
        </div>
        <nav class="flex-1 space-y-2">
            <button onclick="navigate('dashboard')" class="w-full flex items-center gap-4 px-4 py-3 rounded-xl ${appState.view === 'dashboard' ? 'bg-italian-green text-white' : 'text-gray-500'}">
                <i class="fas fa-home"></i> Início
            </button>
            <button onclick="navigate('orders')" class="w-full flex items-center gap-4 px-4 py-3 rounded-xl ${appState.view === 'orders' ? 'bg-italian-green text-white' : 'text-gray-500'}">
                <i class="fas fa-history"></i> Pedidos
            </button>
            ${isAdmin ? `
            <button onclick="navigate('admin')" class="w-full flex items-center gap-4 px-4 py-3 rounded-xl ${appState.view === 'admin' ? 'bg-italian-green text-white' : 'text-gray-500'}">
                <i class="fas fa-cog"></i> Admin
            </button>` : ''}
        </nav>
        <div class="pt-6 border-t border-gray-100 dark:border-gray-800 mt-6">
            <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl mb-4">
                <p class="text-sm font-bold truncate">${appState.user.nome}</p>
                <p class="text-[10px] text-gray-500 uppercase font-black">${appState.user.cargo}</p>
            </div>
            <button onclick="toggleDarkMode()" class="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-gray-500">
                <i class="fas ${appState.theme === 'light' ? 'fa-moon' : 'fa-sun'}"></i> Tema
            </button>
            <button onclick="auth.signOut()" class="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-500">
                <i class="fas fa-sign-out-alt"></i> Sair
            </button>
        </div>
    </aside>
    <!-- Mobile Header -->
    <div class="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b dark:border-gray-800 md:hidden flex items-center justify-between px-6 z-50">
        <span class="font-bold">Pizzeria <span class="text-italian-red">Master</span></span>
        <button onclick="auth.signOut()" class="text-red-500"><i class="fas fa-sign-out-alt"></i></button>
    </div>`;
}

function renderContent() {
    if (appState.view === 'dashboard') return renderDashboard();
    if (appState.view === 'inventory') return renderInventory();
    if (appState.view === 'admin') return renderAdmin();
    if (appState.view === 'orders') return renderOrders();
    return '';
}

function renderDashboard() {
    const cats = [
        { id: 'Hortifruti', icon: 'fa-apple-whole', color: 'bg-emerald-500' },
        { id: 'Geral/Insumos', icon: 'fa-box-open', color: 'bg-blue-500' },
        { id: 'Bebidas', icon: 'fa-wine-bottle', color: 'bg-amber-500' },
        { id: 'Limpeza', icon: 'fa-broom', color: 'bg-purple-500' },
    ];
    
    // Filtrar por permissão
    const filteredCats = (appState.user.cargo === 'Admin' || appState.user.cargo === 'Gerente')
        ? cats
        : cats.filter(c => appState.user.permissoes && appState.user.permissoes.includes(c.id));

    return `
    <div class="space-y-8">
        <header>
            <h1 class="text-3xl font-black">Olá, ${appState.user.nome.split(' ')[0]} 👋</h1>
            <p class="text-gray-500">Selecione o setor para contagem.</p>
        </header>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            ${filteredCats.map(cat => `
                <button onclick="startInventory('${cat.id}')" class="group bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left border border-gray-100 dark:border-gray-800">
                    <div class="w-14 h-14 ${cat.color} rounded-2xl flex items-center justify-center text-white text-2xl mb-6 shadow-lg">
                        <i class="fas ${cat.icon}"></i>
                    </div>
                    <h3 class="text-lg font-bold">${cat.id}</h3>
                    <p class="text-sm text-gray-500 mt-2">Clique para iniciar.</p>
                </button>
            `).join('')}
        </div>
    </div>`;
}

function renderInventory() {
    const products = appState.products
        .filter(p => p.categoria === appState.activeCategory)
        .sort((a, b) => (appState.routes.indexOf(a.localEstoque) - appState.routes.indexOf(b.localEstoque)));

    return `
    <div class="space-y-6 pb-24">
        <header class="flex items-center justify-between">
            <button onclick="navigate('dashboard')" class="text-gray-500 font-bold"><i class="fas fa-chevron-left"></i> Voltar</button>
            <h1 class="text-2xl font-black">${appState.activeCategory}</h1>
        </header>
        <div class="space-y-4">
            ${products.map(p => {
                const count = appState.counts[p.id] || { quantidade: 0, skip: false, pedir: 0 };
                return `
                <div class="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center gap-4 ${count.skip ? 'opacity-50 grayscale' : ''}">
                    <div class="flex-1 w-full">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-[10px] font-black text-italian-green uppercase tracking-widest">${p.localEstoque}</span>
                            <button onclick="toggleSkip('${p.id}')" class="text-gray-400 hover:text-red-500"><i class="fas fa-ban"></i></button>
                        </div>
                        <h3 class="text-xl font-bold">${p.nome}</h3>
                        <p class="text-xs text-gray-500">Unidade: ${p.unidadeContagem} | Meta: ${p.meta}</p>
                    </div>
                    <div class="flex items-center gap-4 w-full sm:w-auto">
                        <div class="relative">
                            <input type="number" 
                                value="${count.quantidade || ''}" 
                                placeholder="0" 
                                oninput="updateCount('${p.id}', this.value)"
                                ${count.skip ? 'disabled' : ''}
                                class="w-full sm:w-28 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl py-4 text-center font-black text-xl outline-none focus:border-italian-green">
                        </div>
                        ${count.pedir > 0 && !count.skip ? `
                        <div class="bg-italian-green text-white px-6 py-4 rounded-2xl text-center shadow-lg shadow-green-900/20 animate-bounce-subtle">
                            <p class="text-[10px] font-black uppercase opacity-80">Pedir</p>
                            <p class="text-xl font-black">${count.pedir} ${p.unidadeCompra}</p>
                        </div>` : ''}
                    </div>
                </div>`;
            }).join('')}
        </div>
        <div class="fixed bottom-6 left-4 right-4 md:left-auto md:right-8 md:w-64 z-50">
            <button onclick="finishInventory()" class="w-full bg-italian-green text-white py-5 rounded-3xl font-black shadow-2xl hover:scale-[1.02] transition-all">FINALIZAR E ENVIAR</button>
        </div>
    </div>`;
}

function renderOrders() {
    return `
    <div class="space-y-8">
        <h1 class="text-3xl font-black">Histórico de Pedidos</h1>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            ${appState.orders.map(o => `
                <div class="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <span class="text-xs text-italian-green font-bold">${o.data}</span>
                            <h3 class="text-xl font-bold">${o.titulo}</h3>
                        </div>
                        <i class="fas fa-file-invoice text-gray-200 text-2xl"></i>
                    </div>
                    <div class="space-y-1">
                        ${o.items.filter(i => i.pedir > 0).map(i => {
                            const p = appState.products.find(prod => prod.id === i.productId);
                            return `<div class="flex justify-between text-sm"><span class="text-gray-500">${p?.nome}</span> <span class="font-bold">Pedir ${i.pedir} ${p?.unidadeCompra}</span></div>`;
                        }).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>`;
}

function renderAdmin() {
    return `
    <div class="space-y-8">
        <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 class="text-3xl font-black">Administração</h1>
            <button onclick="resetData()" class="px-6 py-3 bg-red-500 text-white rounded-xl font-bold text-sm"><i class="fas fa-trash"></i> Reset Sistema</button>
        </header>
        <section class="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <table class="w-full text-left">
                <thead class="bg-gray-50 dark:bg-gray-800">
                    <tr class="text-[10px] font-black uppercase text-gray-400">
                        <th class="px-6 py-4">Equipe</th>
                        <th class="px-6 py-4">Status</th>
                        <th class="px-6 py-4">Ações</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                    ${appState.users.map(u => `
                        <tr>
                            <td class="px-6 py-4">
                                <p class="font-bold">${u.nome}</p>
                                <p class="text-xs text-gray-500">${u.cargo}</p>
                            </td>
                            <td class="px-6 py-4">
                                <span class="px-2 py-1 rounded-full text-[10px] font-black uppercase ${u.status === 'Aprovado' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}">${u.status}</span>
                            </td>
                            <td class="px-6 py-4">
                                ${u.status === 'Pendente' ? `<button onclick="approveUser('${u.id}')" class="text-green-500 mr-4"><i class="fas fa-check"></i></button>` : ''}
                                <button onclick="deleteUser('${u.id}')" class="text-red-500"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </section>
    </div>`;
}

// 8. Funções de Ação (Handlers)
function navigate(view) {
    appState.view = view;
    render();
}

function toggleDarkMode() {
    appState.theme = appState.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', appState.theme);
    document.documentElement.classList.toggle('dark');
    render();
}

function startInventory(cat) {
    appState.view = 'inventory';
    appState.activeCategory = cat;
    appState.counts = {};
    render();
}

function updateCount(id, val) {
    const num = parseFloat(val) || 0;
    const p = appState.products.find(prod => prod.id === id);
    const need = p.meta - num;
    const boxes = need > 0 ? Math.ceil(need / p.fatorConversao) : 0;
    
    appState.counts[id] = {
        productId: id,
        quantidade: num,
        skip: appState.counts[id]?.skip || false,
        pedir: boxes
    };
    render();
}

function toggleSkip(id) {
    if (!appState.counts[id]) appState.counts[id] = { productId: id, quantidade: 0, skip: false, pedir: 0 };
    appState.counts[id].skip = !appState.counts[id].skip;
    if (appState.counts[id].skip) appState.counts[id].pedir = 0;
    render();
}

async function finishInventory() {
    const items = Object.values(appState.counts).filter(i => i.pedir > 0);
    if (items.length === 0) return alert('Nenhum item para pedir.');

    // Salvar Pedido no DB
    const order = {
        data: new Date().toLocaleDateString('pt-BR'),
        titulo: `Pedido ${appState.activeCategory}`,
        items: items
    };
    await db.ref('orders').push(order);

    // Enviar WhatsApp (Agrupado por Fornecedor)
    const bySupplier = {};
    items.forEach(i => {
        const p = appState.products.find(prod => prod.id === i.productId);
        if (!bySupplier[p.supplierId]) bySupplier[p.supplierId] = [];
        bySupplier[p.supplierId].push({ nome: p.nome, pedir: i.pedir, unid: p.unidadeCompra });
    });

    for (const supId in bySupplier) {
        const sup = appState.suppliers.find(s => s.id === supId);
        let msg = `*PEDIDO PIZZERIA MASTER*\nSetor: ${appState.activeCategory}\n----------------\n`;
        bySupplier[supId].forEach(i => msg += `• ${i.nome}: *PEDIR ${i.pedir} ${i.unid}*\n`);
        window.open(`https://wa.me/${sup.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
    }

    alert('Pedidos enviados com sucesso!');
    navigate('dashboard');
}

function approveUser(id) {
    db.ref(`users/${id}`).update({ status: 'Aprovado', permissoes: CATEGORIES });
}

function deleteUser(id) {
    if (confirm('Excluir este funcionário?')) db.ref(`users/${id}`).remove();
}

function resetData() {
    if (confirm('RESET TOTAL? Isso apagará todos os dados do servidor.')) {
        db.ref('/').remove();
        location.reload();
    }
}

// Iniciar app
render();
