import { render } from "../main.js";
import { Logistica } from "./logistica.js";

export function carregarProducao() {
    render(`
        <div style="padding: 20px; padding-top: 65px; background: #f2f2f7; min-height: 100vh;">
            <header style="display: flex; align-items: center; gap: 15px; margin-bottom: 25px;">
                <button onclick="location.reload()" class="active-press" style="background: white; border: none; width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                    <i data-lucide="chevron-left"></i>
                </button>
                <h2 style="margin:0; font-size: 20px; font-weight: 900;">Massa Artigiano</h2>
            </header>

            <div class="glass-card" style="margin-bottom: 20px;">
                <label style="display:block; margin-bottom:10px; font-weight:700; color: #8e8e93; font-size: 12px; text-transform: uppercase;">Meta de Bolinhas</label>
                <input type="number" id="input-bolinhas" placeholder="Ex: 60" inputmode="numeric" 
                       oninput="window.app.atualizarReceita()" 
                       style="font-size: 32px; height: 70px; text-align: center; font-weight: 800; border: 2px solid #008C45;">
            </div>

            <div id="resultado-massa" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                </div>
            
            <p style="text-align:center; font-size: 11px; color: #8e8e93; margin-top: 20px;">
                *Cálculo baseado em 133g/bolinha e 70% de hidratação.
            </p>
        </div>
    `);

    window.app.atualizarReceita = () => {
        const qtd = document.getElementById('input-bolinhas').value;
        if (!qtd || qtd <= 0) {
            document.getElementById('resultado-massa').innerHTML = "";
            return;
        }

        const r = Logistica.calcularMassa(qtd);
        document.getElementById('resultado-massa').innerHTML = `
            <div class="glass-card" style="border-top: 5px solid #008C45; padding: 15px;">
                <small style="color:#8e8e93; font-weight:700;">FARINHA</small>
                <div style="font-size:22px; font-weight:900;">${r.farinha}<span style="font-size:12px;">kg</span></div>
            </div>
            <div class="glass-card" style="border-top: 5px solid #008C45; padding: 15px;">
                <small style="color:#8e8e93; font-weight:700;">SAL</small>
                <div style="font-size:22px; font-weight:900;">${r.sal}<span style="font-size:12px;">g</span></div>
            </div>
            <div class="glass-card" style="border-top: 5px solid #007aff; padding: 15px;">
                <small style="color:#007aff; font-weight:700;">ÁGUA MINERAL</small>
                <div style="font-size:22px; font-weight:900;">${r.aguaMineral}<span style="font-size:12px;">ml</span></div>
            </div>
            <div class="glass-card" style="border-top: 5px solid #5ac8fa; padding: 15px;">
                <small style="color:#5ac8fa; font-weight:700;">GELO (30%)</small>
                <div style="font-size:22px; font-weight:900;">${r.gelo}<span style="font-size:12px;">g</span></div>
            </div>
        `;
        window.lucide.createIcons();
    };
}
