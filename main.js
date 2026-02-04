import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { carregarLogin } from "./modules/auth.js";

// Configuração do Firebase da Artigiano
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

// Função mestre de renderização (Estilo iOS)
export function render(html) {
    const container = document.getElementById('app-container');
    if(container) {
        container.innerHTML = html;
        // Reinicializa os ícones do Lucide sempre que a tela muda
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
}

// Objeto global de navegação do App
window.app = {
    abrirProducao: () => import("./modules/producao.js").then(m => m.carregarProducao()),
    abrirSacolao: () => import("./modules/sacolao.js").then(m => m.carregarSacolao()),
    abrirLimpeza: () => import("./modules/limpeza.js").then(m => m.carregarLimpeza()),
    abrirInsumos: () => import("./modules/insumos.js").then(m => m.carregarInsumos()),
    abrirBebidas: () => import("./modules/bebidas.js").then(m => m.carregarBebidas()),
    abrirHistorico: () => import("./modules/historico.js").then(m => m.carregarHistorico()),
    abrirConfig: () => import("./modules/config.js").then(m => m.carregarConfig()),
    abrirGestaoItens: () => import("./modules/gestao_itens.js").then(m => m.carregarGestaoItens())
};

// Inicia o sistema pela tela de Login
document.addEventListener('DOMContentLoaded', carregarLogin);
