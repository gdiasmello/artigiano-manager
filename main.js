import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { Erros } from "./modules/erros.js";

// 1. CONFIGURAÇÃO FIREBASE (Conexão Artigiano)
const firebaseConfig = {
    apiKey: "AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4",
    authDomain: "artigiano-app.firebaseapp.com",
    databaseURL: "https://artigiano-app-default-rtdb.firebaseio.com",
    projectId: "artigiano-app",
    storageBucket: "artigiano-app.firebasestorage.app",
    messagingSenderId: "212218495726",
    appId: "1:212218495726:web:dd6fec7a4a8c7ad572a9ff"
};

const firebaseApp = initializeApp(firebaseConfig);
export const db = getDatabase(firebaseApp);

window.app = {};

// 2. LOCAIS DE ARMAZENAMENTO DEFINIDOS
window.app.locaisArmazenamento = [
    "Estoque seco",
    "Geladeira do forno",
    "Freezer de congelamento",
    "Freezer das Bufulas",
    "Cozinha dos freelas",
    "Quartinho de baixo da escada"
];

// 3. SISTEMA DE SOM E FEEDBACK HÁPTICO
const sndClick = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
const sndMove = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

window.app.tocarSom = (tipo) => {
    try {
        if (tipo === 'click') sndClick.play();
        if (tipo === 'move') sndMove.play();
    } catch (e) { console.warn("Som bloqueado pelo navegador."); }
};

// 4. MOTOR DE RENDERIZAÇÃO COM CAPTURA DE ERRO
export function render(html) {
    const container = document.getElementById('app-container');
    if (container) {
        window.app.tocarSom('move');
        container.innerHTML = `<div class="fade-in">${html}</div>`;
        if (window.lucide) window.lucide.createIcons();
    } else {
        Erros.exibirErroCritico("DOM_MISSING", "Content container not found.");
    }
}

// 5. SEGURANÇA E PERMISSÕES (PIN 1821)
window.app.verificarPermissaoMaster = () => {
    const user = JSON.parse(localStorage.getItem('pizzamaser_user') || '{}');
    if (user.role !== "ADMIN") {
        const pin = prompt("ACESSO RESTRITO. DIGITE O PIN ADMINISTRATIVO:");
        if (pin !== "1821") {
            Erros.notificarAcessoNegado();
            return false;
        }
    }
    return true;
};

// 6. MAPEAMENTO DE ROTAS (DYNAMIC IMPORTS)
window.app.abrirDash = (u) => import("./modules/dashboard.js").then(m => m.carregarDash(u)).catch(e => Erros.exibirErroCritico("DASH_LOAD_FAIL", e));
window.app.abrirGestaoItens = (s) => import("./modules/gestao_itens.js").then(m => m.carregarGestaoItens(s)).catch(e => Erros.exibirErroCritico("GESTAO_LOAD_FAIL", e));
window.app.abrirProducao = () => import("./modules/producao.js").then(m => m.carregarProducao()).catch(e => Erros.exibirErroCritico("PROD_LOAD_FAIL", e));
window.app.abrirChecklist = () => import("./modules/checklist.js").then(m => m.carregarChecklist()).catch(e => Erros.exibirErroCritico("CHECK_LOAD_FAIL", e));
window.app.abrirCarrinho = () => import("./modules/checkout.js").then(m => m.carregarCheckout()).catch(e => Erros.exibirErroCritico("CHECKOUT_LOAD_FAIL", e));
window.app.abrirConfig = () => import("./modules/fornecedores.js").then(m => m.carregarConfig()).catch(e => Erros.exibirErroCritico("CONFIG_LOAD_FAIL", e));
window.app.logout = () => { localStorage.removeItem('pizzamaser_user'); location.reload(); };

// 7. TRATAMENTO GLOBAL DE ERROS (BSOD Style)
window.onerror = (msg, src, lin) => Erros.exibirErroCritico(`FATAL_V${lin}`, msg);
window.onunhandledrejection = (e) => Erros.exibirErroCritico("PROMISE_REJECTED", e.reason);

// 8. INICIALIZAÇÃO DO TERMINAL
async function inicializar() {
    try {
        const usuario = localStorage.getItem('pizzamaser_user');
        if (usuario) {
            window.app.abrirDash(JSON.parse(usuario));
        } else {
            const { carregarLogin } = await import("./modules/auth.js");
            carregarLogin();
        }
    } catch (e) {
        Erros.exibirErroCritico("INIT_SYSTEM_FAIL", e);
    }
}

inicializar();
