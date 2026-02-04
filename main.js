import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. CONFIGURAÇÃO FIREBASE (Substitua pelos seus dados do console Firebase)
const firebaseConfig = {
    databaseURL: "https://SEU-PROJETO.firebaseio.com", 
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// 2. FUNÇÃO DE RENDERIZAÇÃO
export function render(html) {
    const container = document.getElementById('app-container');
    container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
}

// 3. NAMESPACE GLOBAL (Para os botões do HTML funcionarem)
window.app = {};

// 4. LÓGICA DE INICIALIZAÇÃO
async function inicializar() {
    const usuarioLogado = localStorage.getItem('artigiano_user');

    if (usuarioLogado) {
        // Se já estiver logado, vai direto para o Dashboard
        const { carregarDash } = await import("./modules/dashboard.js");
        carregarDash(JSON.parse(usuarioLogado));
    } else {
        // Senão, carrega a tela de login
        const { carregarLogin } = await import("./modules/auth.js");
        carregarLogin();
    }
}

// 5. MAPEAMENTO DE ROTAS (Para os menus e botões funcionarem)
window.app.abrirCarrinho = async () => {
    const { carregarCheckout } = await import("./modules/checkout.js");
    carregarCheckout();
};

window.app.abrirConfig = async () => {
    const { carregarConfig } = await import("./modules/config.js");
    carregarConfig();
};

window.app.abrirFornecedores = async () => {
    const { carregarFornecedores } = await import("./modules/fornecedores.js");
    carregarFornecedores();
};

window.app.abrirHistorico = async () => {
    const { carregarHistorico } = await import("./modules/historico.js");
    carregarHistorico();
};

window.app.abrirGestaoItens = async (setor) => {
    const { carregarGestaoItens } = await import("./modules/gestao_itens.js");
    carregarGestaoItens(setor);
};

window.app.logout = () => {
    localStorage.removeItem('artigiano_user');
    location.reload();
};

// Inicia o app
inicializar();
