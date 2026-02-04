import { db, render } from "../main.js";
import { ref, orderByChild, equalTo, get, query } from "firebase/database";

export function carregarLogin() {
    const html = `
        <div class="screen active">
            <div class="login-card glass-card">
                <h1 style="font-size: 3rem; margin-bottom: 10px;">🍕</h1>
                <h2 style="margin-bottom: 20px;">Artigiano PRO</h2>
                <input type="password" id="pin-input" placeholder="PIN de 4 dígitos" maxlength="4" inputmode="numeric">
                <button id="btn-entrar" class="btn-primary">Entrar</button>
                <p style="margin-top: 15px; font-size: 12px; opacity: 0.6;">v1.5.0-PWA</p>
            </div>
        </div>
    `;
    render(html);

    // Adiciona o evento de clique no botão após renderizar
    document.getElementById('btn-entrar').onclick = validarPIN;
}

async function validarPIN() {
    const pin = document.getElementById('pin-input').value;
    
    // 1. Atalho para o seu acesso Master
    if (pin === "1821") {
        alert("Bem-vindo, Gabriel!");
        // Aqui chamaremos o carregarDash() futuramente
        return;
    }

    // 2. Consulta no seu banco Firebase
    try {
        const usuariosRef = ref(db, 'usuarios');
        const consulta = query(usuariosRef, orderByChild('pin'), equalTo(pin));
        const snapshot = await get(consulta);

        if (snapshot.exists()) {
            const dados = snapshot.val();
            const usuario = dados[Object.keys(dados)[0]];
            alert(`Olá, ${usuario.nome}!`);
            // Futuro: carregarDash(usuario)
        } else {
            alert("PIN Inválido!");
        }
    } catch (error) {
        console.error("Erro ao acessar banco:", error);
        alert("Erro de conexão.");
    }
}
