import { render } from "../main.js";

export function carregarProducao() {
    render(`
        <div class="glass-card">
            <h3>🔢 Quantidade de Massas</h3>
            <input type="number" id="input-massas" placeholder="Ex: 30" oninput="window.app.calcular()">
            <div id="res-calc" style="text-align: left; margin-top: 15px; line-height: 1.8;"></div>
            <button class="btn-primary" onclick="location.reload()" style="margin-top:15px;">Voltar</button>
        </div>
    `);
    
    window.app.calcular = () => {
        const n = document.getElementById('input-massas').value;
        if (!n || n <= 0) return;
        
        const farinha = (n * 220) / 1.6987;
        const temp = new Date().getDay() === 1 ? '14°C' : '20°C';

        document.getElementById('res-calc').innerHTML = `
            <b>Farinha 00:</b> ${Math.round(farinha)}g<br>
            <b>Água:</b> ${Math.round(farinha * 0.4365)}g<br>
            <b>Gelo:</b> ${Math.round(farinha * 0.1872)}g<br>
            <b>Sal:</b> ${Math.round(farinha * 0.03)}g<br>
            <b>Levain:</b> ${Math.round(farinha * 0.045)}g<br>
            <b>🌡️ Fermentadora:</b> ${temp}
        `;
    };
}
