import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Suas chaves de acesso ao Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4",
  authDomain: "artigiano-app.firebaseapp.com",
  databaseURL: "https://artigiano-app-default-rtdb.firebaseio.com",
  projectId: "artigiano-app",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// Função global para renderizar as telas
export function render(html) {
    document.getElementById('app-container').innerHTML = html;
    lucide.createIcons();
}

window.app = {
    abrirProducao: () => import("./modules/producao.js").then(m => m.carregarProducao()),
    abrirSacolao: () => import("./modules/sacolao.js").then(m => m.carregarSacolao()),
    abrirLimpeza: () => import("./modules/limpeza.js").then(m => m.carregarLimpeza()),
    abrirInsumos: () => import("./modules/insumos.js").then(m => m.carregarInsumos()),
    abrirBebidas: () => import("./modules/bebidas.js").then(m => m.carregarBebidas()),
    abrirHistorico: () => import("./modules/historico.js").then(m => m.carregarHistorico())
};
