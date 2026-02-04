import { render } from "../main.js";

export function carregarLogin() {
    render(`
        <div style="height: 100vh; background: #000; display: flex; flex-direction: column; justify-content: center; padding: 40px; box-sizing: border-box;">
            <div style="text-align: center; margin-bottom: 50px;">
                <h1 style="font-size: 50px; font-weight: 900; letter-spacing: -3px; margin: 0; line-height: 0.8;">
                    PiZZA<br><span style="color: var(--it-green);">MASER</span>
                </h1>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="background: #111; padding: 10px; border: 1px solid #222;">
                    <label style="font-size: 10px; color: var(--it-green); font-weight: 900; display: block; margin-bottom: 5px;">OPERADOR</label>
                    <input type="text" id="user-name" value="Gabriel" style="width: 100%; background: none; border: none; color: #fff; font-size: 20px; font-weight: 700; outline: none;">
                </div>

                <div style="background: #111; padding: 10px; border: 1px solid #222;">
                    <label style="font-size: 10px; color: var(--it-green); font-weight: 900; display: block; margin-bottom: 5px;">CÓDIGO PIN</label>
                    <input type="password" id="pin-input" placeholder="****" maxlength="4" inputmode="numeric" style="width: 100%; background: none; border: none; color: #fff; font-size: 20px; font-weight: 700; outline: none; letter-spacing: 10px;">
                </div>

                <button onclick="window.app.forcarEntrada()" 
                    style="margin-top: 10px; height: 70px; background: var(--it-green); border: none; color: #000; font-weight: 900; font-size: 20px;">
                    ENTRAR NO SISTEMA
                </button>
            </div>
        </div>
    `);

    window.app.forcarEntrada = () => {
        const nome = document.getElementById('user-name').value.trim();
        const pin = document.getElementById('pin-input').value;

        // Validação local imediata para evitar o erro de Promessa Rejeitada
        if (pin === "1821" || pin === "2026") {
            const userData = {
                nome: nome,
                role: pin === "1821" ? "ADMIN" : "OPERADOR",
                time: Date.now()
            };
            
            // Grava no navegador primeiro
            localStorage.setItem('pizzamaser_user', JSON.stringify(userData));
            
            // Toca o som e pula para o dashboard sem esperar o Firebase
            window.app.tocarSom('click');
            
            // REDIRECIONAMENTO DE EMERGÊNCIA
            window.location.replace(window.location.origin + window.location.pathname);
        } else {
            alert("PIN INVÁLIDO");
        }
    };
}
