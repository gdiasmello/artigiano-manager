import { db, render } from "../main.js";
import { ref, get, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export function carregarLogin() {
    render(`
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 90vh; padding: 20px;">
            <div style="width: 80px; height: 80px; background: var(--it-green); border-radius: 20px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center;">
                <i data-lucide="pizza" style="color: white; width: 40px; height: 40px;"></i>
            </div>
            <h1 style="font-weight: 800; font-size: 32px; margin-bottom: 5px;">Artigiano</h1>
            <p style="opacity: 0.6; margin-bottom: 30px;">Manager Pro</p>
            
            <div class="glass-card" style="width: 100%; max-width: 300px; text-align: center;">
                <input type="password" id="pin-input" placeholder="PIN de 4 dígitos" maxlength="4" inputmode="numeric" style="text-align: center; letter-spacing: 5px; font-size: 24px;">
                <button class="btn-primary" onclick="window.app.handleLogin()">Entrar</button>
            </div>
        </div>
    `);

    window.app.handleLogin = async () => {
        const pin = document.getElementById('pin-input').value;
        if (pin === "1821") {
            const { carregarDash } = await import("./dashboard.js");
            carregarDash({ nome: "Gabriel", cargo: "admin" });
            return;
        }

        const userQuery = query(ref(db, 'usuarios'), orderByChild('pin'), equalTo(pin));
        const snapshot = await get(userQuery);
        if (snapshot.exists()) {
            const userData = Object.values(snapshot.val())[0];
            const { carregarDash } = await import("./dashboard.js");
            carregarDash(userData);
        } else {
            alert("PIN incorreto.");
        }
    };
}
