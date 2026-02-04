import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { Erros } from "./modules/erros.js";

// 1. CONFIGURAÇÃO FIREBASE
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

// 2. LOCAIS DE ARMAZENAMENTO (PiZZA Maser)
window.app.locaisArmazenamento = [
    "Estoque seco",
    "Geladeira do forno",
    "Freezer de congelamento",
    "Freezer das Bufulas",
    "Cozinha dos freelas",
    "Quartinho de baixo da escada"
];

// 3. SISTEMA DE SOM
const sndClick = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
const sndMove = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

window.app.tocarSom = (tipo) => {
    try {
        if (tipo === 'click') sndClick.play();
        if (tipo === 'move') sndMove.play();
    } catch (e) { console.warn("Audio bloqueado"); }
};

// 4. MOTOR DE RENDERIZAÇÃO
export function render(html) {
    const container = document.getElementById('app-container');
    if (container) {
        window.app.tocarSom('move');
        container.innerHTML = `<div class="fade-in">${html}</div>`;
        if (window.lucide) window.lucide.createIcons();
    }
}

// 5. SEGURANÇA (PIN 1821)
window.app.verificarPermissaoMaster = () => {
    const user = JSON.parse(localStorage.getItem('pizzamaser_user') || '{}');
    if (user.role !== "ADMIN") {
        const pin = prompt("ACESSO RESTRITO. PIN MASTER:");
        if (pin !== "1821") {
            Erros.notificarAcessoNegado();
            return false;
        }
    }
    return true;
};

// 6. ROTAS COM PROTEÇÃO CONTRA DADOS NULOS
window.app.abrirDash = (u) => import("./modules/dashboard.js").then(m => m.carregarDash(u)).catch(e => Erros.exibirErroCritico("DASH_FAIL", e));
window.app.abrirGestaoItens = (s) => import("./modules/gestao_itens.js").then(m => m.carregarGestaoItens(s)).catch(e => Erros.exibirErroCritico("GESTAO_FAIL", e));
window.app.abrirProducao = () => import("./modules/producao.js").then(m => m.carregarProducao()).catch(e => Erros.exibirErroCritico("PROD_FAIL", e));
window.app.abrirChecklist = () => import("./modules/checklist.js").then(m => m.carregarChecklist()).catch(e => Erros.exibirErroCritico("CHECK_FAIL", e));

// Cálculo de Pedido usando a Fórmula de Arredondamento por Teto
window.app.abrirCarrinho = () => import("./modules/checkout.js").then(m => m.carregarCheckout()).catch(e => Erros.exibirErroCritico("CHECKOUT_FAIL", e));

window.app.abrirConfig = () => import("./modules/fornecedores.js").then(m => m.carregarConfig()).catch(e => Erros.exibirErroCritico("CONFIG_FAIL", e));
window.app.logout = () => { localStorage.removeItem('pizzamaser_user'); location.reload(); };

// 7. TRATAMENTO DE ERROS GLOBAIS
window.onerror = (msg) => Erros.exibirErroCritico("RUNTIME_ERROR", msg);
window.onunhandledrejection = (e) => {
    console.error("Erro de Promessa:", e.reason);
    // Evita a tela vermelha se for apenas um erro de carregamento de ícone ou recurso menor
    if(e.reason && e.reason.message && e.reason.message.includes("database")) {
        Erros.exibirErroCritico("PROMISE_REJECTED", "Falha na conexão com o Banco de Dados.");
    }
};

// 8. INICIALIZAÇÃO
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
        Erros.exibirErroCritico("INIT_FAIL", e);
    }
}

inicializar();
