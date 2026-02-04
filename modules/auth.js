import { render } from "../main.js";

export function carregarLogin() {
    render(`
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; padding:30px;">
            <div style="text-align:center; margin-bottom:40px;">
                <h1 style="font-size:40px; font-weight:900; margin:0;">LOGIN</h1>
                <p style="color:var(--it-green); font-weight:800; letter-spacing:2px;">ARTIGIANO SYSTEM</p>
            </div>
            
            <input type="text" id="user-name" placeholder="USUÁRIO" style="width:100%; margin-bottom:10px; text-align:center;">
            <input type="password" id="pin-input" placeholder="PIN" maxlength="4" style="width:100%; margin-bottom:20px; text-align:center; font-size:24px;">
            
            <button onclick="window.app.executarLogin()" style="width:100%; height:60px; background:var(--it-green); border:none; color:white; font-weight:900; font-size:18px;">
                ACESSAR TERMINAL
            </button>
        </div>
    `);

    window.app.executarLogin = () => {
        const nome = document.getElementById('user-name').value;
        const pin = document.getElementById('pin-input').value;

        if (pin === "1821" || pin === "2026") {
            window.app.tocarSom('click');
            localStorage.setItem('artigiano_user', JSON.stringify({ nome, cargo: pin === "1821" ? 'ADM' : 'GERENTE' }));
            location.reload();
        } else {
            alert("PIN INVÁLIDO");
        }
    };
}
