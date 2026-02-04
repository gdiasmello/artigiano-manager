import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
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

// Inicializa Firebase e Banco
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// Função para renderizar conteúdo no HTML
export function render(html) {
    document.getElementById('app-container').innerHTML = html;
    lucide.createIcons();
}

// Inicia com o Login
document.addEventListener('DOMContentLoaded', carregarLogin);
