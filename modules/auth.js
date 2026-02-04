import { db, render } from "../main.js";
import { ref, get, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export function carregarLogin() {
    render(`
        <div id="login-screen" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f9f9f9; transition: all 0.5s;">
            
            <div class="animated-header">
                <div style="background: rgba(255,255,255,0.8); padding: 2px 15px; border-radius: 20px; font-size: 12px; font-weight: 800; color: #333;">
                    ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
            </div>

            <div class="glass-card" style="width: 85%; max-width: 350px; text-align: center;">
                <div style="width: 100px; height: 100px; background: var(--it-red); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 20px rgba(205, 33, 42, 0.2);">
                    <i data-lucide="pizza" style="color: white; width: 50px; height: 50px;"></i>
                </div>

                <h1 style="color: #004225; font-size: 42px; font-weight: 800; margin: 0; letter-spacing: -1px;">Artigiano</h1>
                <p style="color: #8e8e93; font-size: 14px; margin-bottom: 30px;">Gestão Pro</p>

                <div style="position: relative; margin-bottom: 15px; text-align: left;">
                    <input type="password" id="pin-input" placeholder="PIN de Acesso" maxlength="4" inputmode="numeric" 
                        style="padding: 15px; height: 50px; border-radius: 25px; border: 1px solid #e5e5ea; background: #fafafa; width: 100%; text-align: center; letter-spacing: 5px; font-size: 20px;">
                </div>

                <button class="btn-primary" onclick="window.app.handleLogin()">ENTRAR</button>
            </div>
        </div>
    `);

    window.app.handleLogin = async () => {
        const pin = document.getElementById('pin-input').value;
        if (!pin) return;

        const realizarLogin = async (userData) => {
            const screen = document.getElementById('login-screen');
            screen.classList.add('zoom-out'); // Ativa o zoom
            
            setTimeout(async () => {
                const { carregarDash } = await import("./dashboard.js");
                carregarDash(userData);
            }, 500); // Aguarda a animação terminar
        };

        if (pin === "1821") {
            realizarLogin({ nome: "Gabriel", cargo: "admin" });
            return;
        }

        const userQuery = query(ref(db, 'usuarios'), orderByChild('pin'), equalTo(pin));
        const snapshot = await get(userQuery);
        
        if (snapshot.exists()) {
            const userData = Object.values(snapshot.val())[0];
            realizarLogin(userData);
        } else {
            alert("PIN incorreto.");
        }
    };
}
