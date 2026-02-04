import { db, render } from "../main.js";
import { ref, get, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export function carregarLogin() {
    render(`
        <div id="login-container" class="glass-login">
            <div class="logo-pulse" style="margin-bottom: 30px;">
                <div style="background: white; width: 90px; height: 90px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; border: 3px solid var(--it-red);">
                    <i data-lucide="pizza" style="color: var(--it-red); width: 50px; height: 50px;"></i>
                </div>
            </div>

            <h1 style="color: white; font-size: 36px; font-weight: 800; margin: 0;">Artigiano</h1>
            <p style="color: rgba(255,255,255,0.7); margin-bottom: 30px;">Inicie o seu turno</p>

            <div style="display: flex; flex-direction: column; gap: 15px;">
                <input type="text" id="user-name" placeholder="Nome do Funcionário" style="color: #333; background: white;">
                
                <input type="password" id="pin-input" placeholder="••••" maxlength="4" inputmode="numeric" 
                       style="letter-spacing: 10px; font-size: 24px;">
                
                <label style="color: white; font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <input type="checkbox" id="keep-session" style="width: 18px; height: 18px; margin:0;"> Manter Sessão
                </label>

                <button class="btn-entrar" onclick="window.app.handleLogin()">ENTRAR</button>
            </div>
        </div>
    `);

    // UX: Auto-Focus no PIN ao carregar
    setTimeout(() => document.getElementById('pin-input').focus(), 500);

    window.app.handleLogin = async () => {
        const pin = document.getElementById('pin-input').value;
        const nome = document.getElementById('user-name').value;
        const container = document.getElementById('login-container');
        const persistir = document.getElementById('keep-session').checked;

        const erroLogin = () => {
            container.classList.add('shake');
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Vibração iOS/Android
            setTimeout(() => container.classList.remove('shake'), 400);
            alert("Acesso Negado.");
        };

        if (pin === "1821" && nome.toLowerCase() === "gabriel") {
            const user = { nome: "Gabriel", cargo: "admin" };
            if (persistir) localStorage.setItem('artigiano_user', JSON.stringify(user));
            irParaDash(user);
        } else {
            const userQuery = query(ref(db, 'usuarios'), orderByChild('pin'), equalTo(pin));
            const snapshot = await get(userQuery);
            if (snapshot.exists()) {
                const userData = Object.values(snapshot.val())[0];
                if (persistir) localStorage.setItem('artigiano_user', JSON.stringify(userData));
                irParaDash(userData);
            } else {
                erroLogin();
            }
        }
    };

    async function irParaDash(user) {
        document.body.style.background = "#f2f2f7"; // Limpa o gradiente
        const { carregarDash } = await import("./dashboard.js");
        carregarDash(user);
    }
}
