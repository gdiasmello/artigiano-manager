import { render } from "../main.js";
import { carregarDash } from "./dashboard.js";

export function carregarLogin() {
    render(`
        <div class="glass-card" style="margin-top: 20vh;">
            <h1 style="font-size: 3rem;">🍕</h1>
            <h2>Artigiano PRO</h2>
            <input type="password" id="pin-input" placeholder="PIN de 4 dígitos" maxlength="4" inputmode="numeric">
            <button id="btn-entrar" class="btn-primary">Entrar</button>
        </div>
    `);
    document.getElementById('btn-entrar').onclick = () => {
        const pin = document.getElementById('pin-input').value;
        if (pin === "1821") {
            carregarDash({ nome: "Gabriel", cargo: "admin" });
        } else {
            alert("PIN incorreto");
        }
    };
}
