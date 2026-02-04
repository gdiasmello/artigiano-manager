import { render } from "../main.js";

export function carregarLogin() {
    render(`
        <div class="glass-card active-press" style="width: 85%; max-width: 340px; margin: auto; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
            <h1 style="color: var(--it-green); font-size: 32px; font-weight: 900; margin: 0 0 10px 0;">Artigiano</h1>
            <p style="font-size: 14px; color: #8e8e93; margin-bottom: 30px;">Identifique-se para iniciar</p>
            
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <input type="text" id="user-name" placeholder="Nome" style="height: 50px; border-radius: 15px; border: 1px solid #ddd; padding: 0 15px;">
                
                <input type="password" id="pin-input" placeholder="PIN" maxlength="4" inputmode="numeric" pattern="[0-9]*"
                       style="height: 60px; font-size: 24px; letter-spacing: 15px;">
                
                <button class="btn-entrar" onclick="window.app.executarLogin()" 
                        style="background: var(--it-green); color: white; border-radius: 20px; font-weight: 800; font-size: 16px;">
                    ENTRAR NO TURNO
                </button>
            </div>
        </div>
    `);

    window.app.executarLogin = () => {
        const pin = document.getElementById('pin-input').value;
        
        if (pin === "1821") {
            if (navigator.vibrate) navigator.vibrate(50); // Sucesso: vibração curta
            // Lógica para carregar Dash...
        } else {
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Erro: vibração dupla pesada
            document.querySelector('.glass-card').classList.add('shake');
            setTimeout(() => document.querySelector('.glass-card').classList.remove('shake'), 400);
        }
    };
}
