import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { carregarLogin } from "./modules/auth.js";

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
    if(container) {
        container.innerHTML = html;
        lucide.createIcons();
    }
}

window.app = {
    abrirProducao: () => import("./modules/producao.js").then(m => m.carregarProducao()),
    abrirConfig: () => import("./modules/config.js").then(m => m.carregarConfig()),
    abrirSacolao: () => import("./modules/sacolao.js").then(m => m.carregarSacolao()),
    abrirLimpeza: () => import("./modules/limpeza.js").then(m => m.carregarLimpeza()),
    abrirInsumos: () => import("./modules/insumos.js").then(m => m.carregarInsumos()),
    abrirBebidas: () => import("./modules/bebidas.js").then(m => m.carregarBebidas()),
    abrirGestaoItens: () => import("./modules/gestao_itens.js").then(m => m.carregarGestaoItens()),
    abrirHistorico: () => import("./modules/historico.js").then(m => m.carregarHistorico())
};

document.addEventListener('DOMContentLoaded', carregarLogin);
