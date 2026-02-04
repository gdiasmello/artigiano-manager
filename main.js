import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4",
    authDomain: "artigiano-app.firebaseapp.com",
    databaseURL: "https://artigiano-app-default-rtdb.firebaseio.com",
    projectId: "artigiano-app",
    storageBucket: "artigiano-app.firebasestorage.app",
    messagingSenderId: "212218495726",
    appId: "1:212218495726:web:dd6fec7a4a8c7ad572a9ff"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

window.app = {};

// Sons de Operação
const audioSwipe = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'); // Som de slide
const audioClick = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); // Som de clique mecânico

window.app.tocarSom = (tipo) => {
    if (tipo === 'click') audioClick.play();
    if (tipo === 'swipe') audioSwipe.play();
};

export function render(html) {
    const container = document.getElementById('app-container');
    if (container) {
        window.app.tocarSom('swipe');
        container.innerHTML = `<div class="page-transition">${html}</div>`;
        if (window.lucide) window.lucide.createIcons();
    }
}

window.app.verificarPermissaoMaster = () => {
    const user = JSON.parse(localStorage.getItem('artigiano_user') || '{}');
    if (user.nome !== "Gabriel") {
        const pin = prompt("ACESSO RESTRITO. PIN MASTER:");
        if (pin !== "1821") return false;
    }
    return true;
};

// Rotas
window.app.abrirProducao = () => import("./modules/producao.js").then(m => m.carregarProducao());
window.app.abrirGestaoItens = (s) => import("./modules/gestao_itens.js").then(m => m.carregarGestaoItens(s));
window.app.abrirChecklist = () => import("./modules/checklist.js").then(m => m.carregarChecklist());
window.app.abrirCarrinho = () => import("./modules/checkout.js").then(m => m.carregarCheckout());
window.app.abrirHistorico = () => import("./modules/historico.js").then(m => m.carregarHistorico());
window.app.abrirConfig = () => import("./modules/fornecedores.js").then(m => m.carregarConfig());
window.app.logout = () => { localStorage.removeItem('artigiano_user'); location.reload(); };

async function inicializar() {
    const user = localStorage.getItem('artigiano_user');
    if (user) {
        const { carregarDash } = await import("./modules/dashboard.js");
        carregarDash(JSON.parse(user));
    } else {
        const { carregarLogin } = await import("./modules/auth.js");
        carregarLogin();
    }
}

inicializar();
