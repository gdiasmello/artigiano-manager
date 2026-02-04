import { db, render } from "../main.js";
import { ref, get, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export function carregarLogin() {
    render(`
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f9f9f9; font-family: -apple-system, sans-serif;">
            
            <div style="position: fixed; top: 0; width: 100%; height: 40px; display: flex; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <div style="flex: 1; background: #008C45;"></div>
                <div style="flex: 1; background: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: #333;">12:10 PM</div>
                <div style="flex: 1; background: #CD212A;"></div>
            </div>

            <div class="glass-card" style="width: 85%; max-width: 350px; padding: 40px 20px; text-align: center; background: #ffffff; border-radius: 30px; border: none;">
                
                <div style="width: 100px; height: 100px; background: #CD212A; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 20px rgba(205, 33, 42, 0.2);">
                    <i data-lucide="pizza" style="color: white; width: 50px; height: 50px;"></i>
                </div>

                <h1 style="color: #004225; font-size: 42px; font-weight: 800; margin: 0; letter-spacing: -1px;">Artigiano</h1>
                <p style="color: #8e8e93; font-size: 14px; margin-bottom: 30px;">Gestão Pro</p>

                <div style="position: relative; margin-bottom: 15px;">
                    <i data-lucide="user" style="position: absolute; left: 15px; top: 12px; color: #008C45; width: 20px;"></i>
                    <input type="password" id="pin-input" placeholder="PIN de Acesso" maxlength="4" inputmode="numeric" 
                        style="padding-left: 45px; height: 50px; border-radius: 25px; border: 1px solid #e5e5ea; background: #fafafa; letter-spacing: 2px;">
                </div>

                <button class="btn-primary" onclick="window.app.handleLogin()" 
                    style="background: #CD212A; height: 55px; border-radius: 15px; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-top: 10px; box-shadow: 0 8px 15px rgba(205, 33, 42, 0.3);">
                    ENTRAR
                </button>
            </div>
        </div>
    `);

    // Lógica de Login (Mantida)
    window.app.handleLogin = async () => {
        const pin = document.getElementById('pin-input').value;
        if (!pin) return;

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
