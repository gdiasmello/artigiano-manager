import { db, render } from "../main.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export function carregarLogin() {
    render(`
        <div class="glass-card" style="width: 85%; max-width: 340px; margin: auto; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 30px; text-align: center;">
            <h1 style="color: #008C45; font-size: 32px; font-weight: 900; margin: 0;">Artigiano</h1>
            <p style="font-size: 14px; color: #8e8e93; margin-bottom: 30px;">Identifique-se para iniciar</p>
            
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <input type="text" id="user-name" placeholder="Gabriel" value="Gabriel" style="height: 50px; border-radius: 15px; border: 1px solid #ddd; padding: 0 15px; text-align: center;">
                
                <input type="password" id="pin-input" placeholder="PIN" maxlength="4" inputmode="numeric" 
                       style="height: 60px; font-size: 24px; letter-spacing: 15px; text-align: center; border-radius: 15px; border: 1px solid #ddd;">
                
                <button id="btn-login-trigger" style="background: #008C45; color: white; height: 50px; border: none; border-radius: 20px; font-weight: 800; font-size: 16px; cursor: pointer;">
                    ENTRAR NO TURNO
                </button>
            </div>
        </div>
    `);

    // Listener direto no botão para evitar falhas de escopo global
    document.getElementById('btn-login-trigger').addEventListener('click', async () => {
        const pin = document.getElementById('pin-input').value;
        const nome = document.getElementById('user-name').value;

        // Bypass manual para você não ficar travado enquanto o Firebase sincroniza
        if (pin === "1821") {
            const usuario = { nome: nome, cargo: "Administrador" };
            localStorage.setItem('artigiano_user', JSON.stringify(usuario));
            
            if (navigator.vibrate) navigator.vibrate(50);
            location.reload(); // Recarrega para o main.js identificar o novo usuário
        } else {
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            alert("PIN incorreto ou erro de conexão.");
        }
    });
}
