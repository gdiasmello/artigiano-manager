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

export function render(html) {
    const container = document.getElementById('app-container');
    if (container) {
        container.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();
    }
}

window.app = {};

// Trava de Segurança Master
window.app.verificarPermissaoMaster = () => {
    const user = JSON.parse(localStorage.getItem('artigiano_user') || '{}');
    if (user.nome !== "Gabriel") {
        const desafio = prompt("Ação Restrita. Digite o PIN Master:");
        if (desafio !== "1821") {
            alert("Acesso Negado.");
            return false;
        }
    }
    return true;
};

async function inicializar() {
    const usuarioLogado = localStorage.getItem('artigiano_user');
    if (usuarioLogado) {
        const { carregarDash } = await import("./modules/dashboard.js");
        carregarDash(JSON.parse(usuarioLogado));
    } else {
        const { carregarLogin } = await import("./modules/auth.js");
        carregarLogin();
    }
}

// Rotas Globais
window.app.abrirCarrinho = () => import("./modules/checkout.js").then(m => m.carregarCheckout());
window.app.abrirFornecedores = () => import("./modules/fornecedores.js").then(m => m.carregarFornecedores());
window.app.abrirHistorico = () => import("./modules/historico.js").then(m => m.carregarHistorico());
window.app.abrirChecklist = () => import("./modules/checklist.js").then(m => m.carregarChecklist());
window.app.abrirGestaoItens = (setor) => import("./modules/gestao_itens.js").then(m => m.carregarGestaoItens(setor));
window.app.logout = () => { localStorage.removeItem('artigiano_user'); location.reload(); };

inicializar();
