import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// 2. DEFINIÇÃO DE LOCAIS DE ARMAZENAMENTO (PiZZA Maser)
window.app.locaisArmazenamento = [
    "Estoque seco",
    "Geladeira do forno",
    "Freezer de congelamento",
    "Freezer das Bufulas",
    "Cozinha dos freelas",
    "Quartinho de baixo da escada"
];

// 3. SISTEMA DE SOM MECÂNICO
const sndClick = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
const sndMove = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

window.app.tocarSom = (tipo) => {
    if (tipo === 'click') sndClick.play();
    if (tipo === 'move') sndMove.play();
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

// 5. SEGURANÇA PIN MASTER (Gabriel)
window.app.verificarPermissaoMaster = () => {
    const user = JSON.parse(localStorage.getItem('pizzamaser_user') || '{}');
    if (user.nome !== "Gabriel") {
        const pin = prompt("ACESSO RESTRITO PiZZA Maser. PIN MASTER:");
        if (pin !== "1821") {
            alert("Acesso negado.");
            return false;
        }
    }
    return true;
};

// 6. ROTAS DINÂMICAS
window.app.abrirDash = (user) => import("./modules/dashboard.js").then(m => m.carregarDash(user));
window.app.abrirGestaoItens = (setor) => import("./modules/gestao_itens.js").then(m => m.carregarGestaoItens(setor));
window.app.abrirProducao = () => import("./modules/producao.js").then(m => m.carregarProducao());
window.app.abrirChecklist = () => import("./modules/checklist.js").then(m => m.carregarChecklist());
window.app.abrirCarrinho = () => import("./modules/checkout.js").then(m => m.carregarCheckout());
window.app.logout = () => { localStorage.removeItem('pizzamaser_user'); location.reload(); };

// 7. INICIALIZAÇÃO
async function inicializar() {
    const usuario = localStorage.getItem('pizzamaser_user');
    if (usuario) {
        window.app.abrirDash(JSON.parse(usuario));
    } else {
        const { carregarLogin } = await import("./modules/auth.js");
        carregarLogin();
    }
}

inicializar();
