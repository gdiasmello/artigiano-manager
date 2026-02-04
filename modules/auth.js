import { render } from "../main.js";

export function carregarLogin() {
    render(`
        <div class="glass-card" style="width: 85%; max-width: 340px; margin: auto; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 30px; text-align: center;">
            <h1 style="color: #008C45; font-size: 32px; font-weight: 900; margin-bottom: 10px;">Artigiano</h1>
            <p style="font-size: 14px; color: #8e8e93; margin-bottom: 30px;">Identifique-se para iniciar</p>
            
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <input type="text" id="user-name" placeholder="Seu Nome" style="height: 50px; border-radius: 15px; border: 1px solid #ddd; padding: 0 15px; text-align: center;">
                <input type="password" id="pin-input" placeholder="PIN" maxlength="4" inputmode="numeric" style="height: 60px; font-size: 24px; letter-spacing: 15px; text-align: center; border-radius: 15px; border: 1px solid #ddd;">
                <button id="btn-entrar" style="background: #008C45; color: white; height: 55px; border: none; border-radius: 20px; font-weight: 800; font-size: 16px; margin-top: 10px;">
                    ENTRAR NO TURNO
                </button>
            </div>
        </div>
    `);

    document.getElementById('btn-entrar').addEventListener('click', () => {
        const nome = document.getElementById('user-name').value;
        const pin = document.getElementById('pin-input').value;

        if (pin === "1821" || pin === "2026") { // PIN Gabriel ou Gerente Geral
            const cargo = (pin === "1821") ? "Administrador" : "Gerente";
            localStorage.setItem('artigiano_user', JSON.stringify({ nome, cargo }));
            location.reload();
        } else {
            alert("PIN Inválido!");
        }
    });
}
