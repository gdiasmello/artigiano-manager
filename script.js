
/**
 * Pizzeria Master - Core Application Script
 * Sênior Engineering Approach: Vanilla JS for maximum performance and portability.
 */

// 1. Firebase Config (Usando as credenciais injetadas ou pré-configuradas)
const firebaseConfig = {
  apiKey: "AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4", // Nota: Idealmente vindo de process.env, mas mantendo para portabilidade imediata
  authDomain: "artigiano-app.firebaseapp.com",
  databaseURL: "https://artigiano-app-default-rtdb.firebaseio.com",
  projectId: "artigiano-app",
  storageBucket: "artigiano-app.firebasestorage.app",
  messagingSenderId: "212218495726",
  appId: "1:212218495726:web:dd6fec7a4a8c7ad572a9ff"
};

// Inicialização Global
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// 2. Estado do Aplicativo
const state = {
    view: 'login', // login, dashboard, inventory, admin, orders, register
    user: null,
    theme: localStorage.getItem('theme') || 'light',
    activeCategory: null,
    
    // Data Sync
    users: [],
    products: [],
    suppliers: [],
    routes: [],
    orders: [],
    
    // UI Local State
    counts: {},
    isAddingUser: false,
    authError: '',
    loading: true
};

// 3. Constantes
const MASTER_USER = { usuario: 'Gabriel', senha: '21gabriel' };
const CATEGORIES = ['Hortifruti', 'Geral/Insumos', 'Bebidas', 'Limpeza'];
const ROLES = ['Pizzaiolo', 'Gerente', 'Atendente'];

// 4. Inicialização do Tema
if (state.theme === 'dark') document.documentElement.classList.add('dark');

// 5. Motor de Sincronização (Real-time Database)
function startSync() {
    // Sincronizar Usuários
    db.ref('users').on('value', snapshot => {
        const val = snapshot.val();
        state.users = val ? Object.entries(val).map(([id, item]) => ({ ...item, id })) : [];
        render();
    });

    // Sincronizar Produtos
    db.ref('products').on('value', snapshot => {
        const val = snapshot.val();
        state.products = val || [];
        render();
    });

    // Sincronizar Fornecedores
    db.ref('suppliers').on('value', snapshot => {
        const val = snapshot.val();
        state.suppliers = val || [];
        render();
    });

    // Sincronizar Rotas
    db.ref('routes').on('value', snapshot => {
        const val = snapshot.val();
        state.routes = val || [];
        render();
    });

    // Sincronizar Pedidos
    db.ref('orders').on('value', snapshot => {
        const val = snapshot.val();
        state.orders = val ? Object.entries(val).map(([id, item]) => ({ ...item, id })) : [];
        render();
    });
}

// 6. Monitoramento de Sessão
auth.onAuthStateChanged(firebaseUser => {
    state.loading = false;
    if (firebaseUser) {
        db.ref(`users/${firebaseUser.uid}`).on('value', snapshot => {
            state.user = snapshot.val();
            if (state.user) {
                if (state.user.status === 'Aprovado') {
                    state.view = state.view === 'login' ? 'dashboard' : state.view;
                    startSync();
                } else {
                    auth.signOut();
                    state.authError = "Seu acesso está pendente de aprovação.";
                    state.view = 'login';
                }
            } else {
                state.view = 'login';
            }
            render();
        });
    } else {
        state.user = null;
        if (state.view !== 'register') state.view = 'login';
        render();
    }
});

// 7. Handlers de Ação
window.navigate = (view, category = null) => {
    state.view = view;
    if (category) {
        state.activeCategory = category;
        state.counts = {};
    }
    render();
};

window.toggleDarkMode = () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', state.theme);
    document.documentElement.classList.toggle('dark');
    render();
};

window.handleLogin = async (e) => {
    e.preventDefault();
    const user = e.target.username.value;
    const pass = e.target.password.value;
    state.authError = '';
    render();

    try {
        // Login Master Gabriel
        if (user === MASTER_USER.usuario && pass === MASTER_USER.senha) {
            const masterEmail = "admin@pizzeriamaster.com";
            try {
                await auth.signInWithEmailAndPassword(masterEmail, pass);
            } catch {
                const cred = await auth.createUserWithEmailAndPassword(masterEmail, pass);
                await db.ref(`users/${cred.user.uid}`).set({
                    id: cred.user.uid,
                    nome: 'Gabriel (Master)',
                    usuario: 'Gabriel',
                    senha: pass,
                    cargo: 'Admin',
                    status: 'Aprovado',
                    permissoes: CATEGORIES
                });
            }
            return;
        }

        const email = user.includes('@') ? user : `${user.toLowerCase()}@pizzeriamaster.com`;
        await auth.signInWithEmailAndPassword(email, pass);
    } catch (err) {
        state.authError = "Usuário ou senha inválidos.";
        render();
    }
};

window.handleRegister = async (e) => {
    e.preventDefault();
    const d = new FormData(e.target);
    const data = Object.fromEntries(d.entries());
    
    try {
        const email = `${data.usuario.toLowerCase()}@pizzeriamaster.com`;
        const cred = await auth.createUserWithEmailAndPassword(email, data.senha);
        await db.ref(`users/${cred.user.uid}`).set({
            id: cred.user.uid,
            nome: data.nome,
            usuario: data.usuario,
            senha: data.senha,
            cargo: data.cargo,
            status: 'Pendente',
            permissoes: []
        });
        alert('Cadastro enviado! Aguarde aprovação do administrador.');
        state.view = 'login';
        render();
    } catch (err) {
        alert('Erro ao cadastrar: ' + err.message);
    }
};

window.updateCount = (id, val) => {
    const num = parseFloat(val) || 0;
    const p = state.products.find(prod => prod.id === id);
    if (!p) return;

    const unitsNeeded = p.meta - num;
    const boxes = unitsNeeded > 0 ? Math.ceil(unitsNeeded / p.fatorConversao) : 0;

    state.counts[id] = {
        productId: id,
        quantidade: num,
        skip: state.counts[id]?.skip || false,
        pedir: boxes
    };
    render();
};

window.toggleSkip = (id) => {
    if (!state.counts[id]) state.counts[id] = { productId: id, quantidade: 0, skip: false, pedir: 0 };
    state.counts[id].skip = !state.counts[id].skip;
    if (state.counts[id].skip) state.counts[id].pedir = 0;
    render();
};

window.finishInventory = async (isMonday = false) => {
    const itemsToOrder = Object.values(state.counts).filter(c => !c.skip && c.pedir > 0);
    if (itemsToOrder.length === 0) return alert('Nenhum item para pedir.');

    const orderData = {
        data: new Date().toLocaleDateString('pt-BR'),
        titulo: isMonday ? `PARA SEGUNDA-FEIRA (${state.activeCategory})` : `Pedido ${state.activeCategory}`,
        items: itemsToOrder,
        category: state.activeCategory
    };

    await db.ref('orders').push(orderData);

    if (!isMonday) {
        const bySupplier = {};
        itemsToOrder.forEach(item => {
            const prod = state.products.find(p => p.id === item.productId);
            if (!bySupplier[prod.supplierId]) bySupplier[prod.supplierId] = [];
            bySupplier[prod.supplierId].push({ nome: prod.nome, pedir: item.pedir, unid: prod.unidadeCompra });
        });

        for (const supId in bySupplier) {
            const sup = state.suppliers.find(s => s.id === supId);
            let msg = `*PEDIDO PIZZERIA MASTER*\nSetor: ${state.activeCategory}\n----------------\n`;
            bySupplier[supId].forEach(i => msg += `• ${i.nome}: *PEDIR ${i.pedir} ${i.unid}*\n`);
            window.open(`https://wa.me/${sup.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
        }
    }

    alert(isMonday ? 'Lista salva para segunda-feira!' : 'Pedidos enviados via WhatsApp!');
    navigate('dashboard');
};

// Admin Helpers
window.approveUser = (id) => db.ref(`users/${id}`).update({ status: 'Aprovado', permissoes: CATEGORIES });
window.deleteUser = (id) => confirm('Excluir este funcionário?') && db.ref(`users/${id}`).remove();
window.updatePerm = (userId, cat) => {
    const u = state.users.find(x => x.id === userId);
    const perms = u.permissoes || [];
    const newPerms = perms.includes(cat) ? perms.filter(p => p !== cat) : [...perms, cat];
    db.ref(`users/${userId}`).update({ permissoes: newPerms });
};

// 8. Renderização do Template (Vanilla Engine)
function render() {
    const root = document.getElementById('root');
    
    if (state.loading) return;

    if (state.view === 'login') {
        root.innerHTML = templateLogin();
    } else if (state.view === 'register') {
        root.innerHTML = templateRegister();
    } else {
        root.innerHTML = `
            <div class="min-h-screen flex bg-gray-50 dark:bg-gray-950">
                ${templateSidebar()}
                <main class="flex-1 p-4 md:p-8 overflow-y-auto pt-20 md:pt-8 animate-fadeIn">
                    ${templateContent()}
                </main>
            </div>
        `;
    }
}

function templateLogin() {
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
            ${state.authError ? `<div class="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold mb-6">${state.authError}</div>` : ''}
            <form onsubmit="handleLogin(event)" class="space-y-5">
                <input type="text" name="username" required placeholder="Usuário" class="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-6 py-4 focus:border-italian-green outline-none dark:text-white">
                <input type="password" name="password" required placeholder="Senha" class="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-6 py-4 focus:border-italian-green outline-none dark:text-white">
                <button class="w-full bg-italian-green text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-green-900/30 hover:scale-[1.02] active:scale-95 transition-all">ENTRAR</button>
            </form>
            <div class="text-center mt-6">
                <button onclick="navigate('register')" class="text-sm font-bold text-gray-400 hover:text-italian-green underline">Solicitar Acesso</button>
            </div>
        </div>
    </div>`;
}

function templateRegister() {
    return `
    <div class="min-h-screen flex items-center justify-center p-4">
        <div class="max-w-md w-full bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl p-10 border border-gray-100 dark:border-gray-800 animate-fadeInUp">
            <h2 class="text-2xl font-black mb-8 text-center">Cadastro de Funcionário</h2>
            <form onsubmit="handleRegister(event)" class="space-y-4">
                <input type="text" name="nome" required placeholder="Nome Completo" class="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-6 py-4 outline-none focus:border-italian-green">
                <input type="text" name="usuario" required placeholder="Usuário (ex: gabriel)" class="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-6 py-4 outline-none focus:border-italian-green">
                <input type="password" name="senha" required placeholder="Senha" class="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-6 py-4 outline-none focus:border-italian-green">
                <select name="cargo" class="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-6 py-4 outline-none">
                    ${ROLES.map(r => `<option value="${r}">${r}</option>`).join('')}
                </select>
                <button class="w-full bg-italian-red text-white py-5 rounded-2xl font-black">SOLICITAR ACESSO</button>
                <button type="button" onclick="navigate('login')" class="w-full text-gray-400 font-bold">Voltar</button>
            </form>
        </div>
    </div>`;
}

function templateSidebar() {
    const isAdmin = state.user.cargo === 'Admin' || state.user.cargo === 'Gerente';
    return `
    <aside class="hidden md:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 p-6">
        <div class="flex items-center gap-3 mb-10">
            <div class="w-10 h-10 bg-italian-green rounded-lg flex items-center justify-center text-white"><i class="fas fa-pizza-slice"></i></div>
            <span class="font-bold text-lg">Master Gestão</span>
        </div>
        <nav class="flex-1 space-y-2">
            <button onclick="navigate('dashboard')" class="w-full flex items-center gap-4 px-4 py-3 rounded-xl ${state.view === 'dashboard' ? 'bg-italian-green text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}">
                <i class="fas fa-home"></i> Início
            </button>
            <button onclick="navigate('orders')" class="w-full flex items-center gap-4 px-4 py-3 rounded-xl ${state.view === 'orders' ? 'bg-italian-green text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}">
                <i class="fas fa-history"></i> Pedidos
            </button>
            ${isAdmin ? `
            <button onclick="navigate('admin')" class="w-full flex items-center gap-4 px-4 py-3 rounded-xl ${state.view === 'admin' ? 'bg-italian-green text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}">
                <i class="fas fa-cog"></i> Admin
            </button>` : ''}
        </nav>
        <div class="pt-6 border-t border-gray-100 dark:border-gray-800 mt-6 space-y-4">
            <button onclick="toggleDarkMode()" class="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-gray-500">
                <i class="fas ${state.theme === 'light' ? 'fa-moon' : 'fa-sun'}"></i> Tema
            </button>
            <button onclick="auth.signOut()" class="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-500">
                <i class="fas fa-sign-out-alt"></i> Sair
            </button>
            <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                <p class="text-sm font-bold truncate">${state.user.nome}</p>
                <p class="text-[10px] text-gray-500 uppercase font-black">${state.user.cargo}</p>
            </div>
        </div>
    </aside>
    <!-- Mobile Header -->
    <div class="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b dark:border-gray-800 md:hidden flex items-center justify-between px-6 z-50">
        <span class="font-bold">Pizzeria <span class="text-italian-red">Master</span></span>
        <button onclick="auth.signOut()" class="text-red-500 p-2"><i class="fas fa-sign-out-alt"></i></button>
    </div>`;
}

function templateContent() {
    switch(state.view) {
        case 'dashboard': return templateDashboard();
        case 'inventory': return templateInventory();
        case 'admin': return templateAdmin();
        case 'orders': return templateOrders();
        default: return templateDashboard();
    }
}

function templateDashboard() {
    const cats = [
        { id: 'Hortifruti', icon: 'fa-apple-whole', color: 'bg-emerald-500' },
        { id: 'Geral/Insumos', icon: 'fa-box-open', color: 'bg-blue-500' },
        { id: 'Bebidas', icon: 'fa-wine-bottle', color: 'bg-amber-500' },
        { id: 'Limpeza', icon: 'fa-broom', color: 'bg-purple-500' },
    ];
    
    const filteredCats = (state.user.cargo === 'Admin' || state.user.cargo === 'Gerente')
        ? cats : cats.filter(c => state.user.permissoes?.includes(c.id));

    return `
    <div class="space-y-8">
        <header>
            <h1 class="text-3xl font-black">Olá, ${state.user.nome.split(' ')[0]} 👋</h1>
            <p class="text-gray-500">Selecione o setor para contagem.</p>
        </header>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            ${filteredCats.map(cat => `
                <button onclick="navigate('inventory', '${cat.id}')" class="group bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left border border-gray-100 dark:border-gray-800 relative overflow-hidden">
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

function templateInventory() {
    const products = state.products
        .filter(p => p.categoria === state.activeCategory)
        .sort((a, b) => (state.routes.indexOf(a.localEstoque) - state.routes.indexOf(b.localEstoque)));

    return `
    <div class="space-y-6 pb-40">
        <header class="flex items-center justify-between">
            <button onclick="navigate('dashboard')" class="text-gray-500 font-bold"><i class="fas fa-chevron-left"></i> Voltar</button>
            <h1 class="text-2xl font-black">${state.activeCategory}</h1>
        </header>
        <div class="space-y-4">
            ${products.map(p => {
                const count = state.counts[p.id] || { quantidade: 0, skip: false, pedir: 0 };
                return `
                <div class="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center gap-4 ${count.skip ? 'opacity-40 grayscale' : ''}">
                    <div class="flex-1 w-full">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-[10px] font-black text-italian-green uppercase tracking-widest">${p.localEstoque}</span>
                            <button onclick="toggleSkip('${p.id}')" class="text-gray-400 hover:text-red-500 p-2"><i class="fas fa-ban"></i></button>
                        </div>
                        <h3 class="text-xl font-bold">${p.nome}</h3>
                        <p class="text-xs text-gray-500">Unidade: ${p.unidadeContagem} | Meta: ${p.meta}</p>
                    </div>
                    <div class="flex items-center gap-4 w-full sm:w-auto">
                        <input type="number" 
                            value="${count.quantidade || ''}" 
                            placeholder="0" 
                            oninput="updateCount('${p.id}', this.value)"
                            ${count.skip ? 'disabled' : ''}
                            class="w-full sm:w-28 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl py-4 text-center font-black text-2xl outline-none focus:border-italian-green">
                        ${count.pedir > 0 && !count.skip ? `
                        <div class="bg-italian-green text-white px-6 py-4 rounded-2xl text-center shadow-lg shadow-green-900/20 animate-bounce-subtle min-w-[120px]">
                            <p class="text-[10px] font-black uppercase opacity-80">Pedir</p>
                            <p class="text-xl font-black">${count.pedir} ${p.unidadeCompra}</p>
                        </div>` : ''}
                    </div>
                </div>`;
            }).join('')}
        </div>
        <div class="fixed bottom-6 left-6 right-6 flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto z-40">
            <button onclick="finishInventory(true)" class="flex-1 bg-white border-2 border-italian-green text-italian-green py-5 rounded-3xl font-black shadow-xl hover:scale-[1.02] transition-all">PARA SEGUNDA-FEIRA</button>
            <button onclick="finishInventory(false)" class="flex-1 bg-italian-green text-white py-5 rounded-3xl font-black shadow-2xl hover:scale-[1.02] transition-all">FINALIZAR E PEDIR</button>
        </div>
    </div>`;
}

function templateAdmin() {
    return `
    <div class="space-y-8 pb-10">
        <h1 class="text-3xl font-black">Administração</h1>
        <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead class="bg-gray-50 dark:bg-gray-800">
                        <tr class="text-[10px] font-black uppercase text-gray-400">
                            <th class="px-6 py-4">Equipe / Senha</th>
                            <th class="px-6 py-4">Status</th>
                            <th class="px-6 py-4">Permissões</th>
                            <th class="px-6 py-4">Ações</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                        ${state.users.map(u => `
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td class="px-6 py-4">
                                    <p class="font-bold">${u.nome}</p>
                                    <p class="text-xs text-gray-400">User: ${u.usuario} | Pass: ${u.senha}</p>
                                </td>
                                <td class="px-6 py-4">
                                    <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase ${u.status === 'Aprovado' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}">${u.status}</span>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex flex-wrap gap-2 max-w-[250px]">
                                        ${CATEGORIES.map(cat => `
                                            <label class="flex items-center gap-1 cursor-pointer">
                                                <input type="checkbox" ${u.permissoes?.includes(cat) ? 'checked' : ''} 
                                                    onchange="updatePerm('${u.id}', '${cat}')" 
                                                    ${u.cargo === 'Admin' ? 'disabled' : ''}
                                                    class="accent-italian-green">
                                                <span class="text-[9px] font-bold text-gray-500">${cat}</span>
                                            </label>
                                        `).join('')}
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    ${u.status === 'Pendente' ? `<button onclick="approveUser('${u.id}')" class="text-green-500 mr-4 text-xl"><i class="fas fa-check-circle"></i></button>` : ''}
                                    ${u.usuario !== 'Gabriel' ? `<button onclick="deleteUser('${u.id}')" class="text-red-500 text-xl"><i class="fas fa-trash-alt"></i></button>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;
}

function templateOrders() {
    return `
    <div class="space-y-8">
        <h1 class="text-3xl font-black">Histórico de Pedidos</h1>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            ${state.orders.length === 0 ? '<p class="text-gray-400 font-bold">Nenhum pedido realizado.</p>' : 
              state.orders.sort((a,b) => b.data.localeCompare(a.data)).map(o => `
                <div class="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <span class="text-[10px] bg-green-50 text-italian-green px-2 py-1 rounded-full font-bold">${o.data}</span>
                            <h3 class="text-xl font-bold mt-2">${o.titulo}</h3>
                        </div>
                    </div>
                    <div class="space-y-2 border-t pt-4 border-gray-100 dark:border-gray-800">
                        ${o.items.map(i => {
                            const p = state.products.find(prod => prod.id === i.productId);
                            return `<div class="flex justify-between text-sm"><span class="text-gray-500">${p?.nome || 'Item Removido'}</span> <span class="font-bold">Pedir ${i.pedir} ${p?.unidadeCompra || ''}</span></div>`;
                        }).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>`;
}

// Início
render();
