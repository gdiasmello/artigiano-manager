import { render } from "../main.js";

export function carregarProducao() {
    render(`
        <div class="glass-card" style="margin-top: 10px;">
            <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <button onclick="location.reload()" style="background:none; border:none; font-size: 20px;">🔙</button>
                <h2 style="margin:0;">Produção</h2>
                <div></div>
            </header>

            <div style="background: white; padding: 20px; border-radius: 15px; margin-bottom: 20px;">
                <h3 style="margin-top: 0; color: var(--it-green);">🔢 Calculadora (220g)</h3>
                <input type="number" id="qtd-massas" placeholder="Quantas massas?" oninput="window.app.calcular()">
                
                <div id="resultado-calculo" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
                    </div>
            </div>

            <div style="text-align: left;">
                <h3 style="color: var(--it-red);">📖 Manuais (POPs)</h3>
                <button class="btn-primary" style="background: white; color: #333; margin-bottom: 10px; border: 1px solid #ddd;" onclick="alert('POP 01: Batimento...')">Batimento</button>
                <button class="btn-primary" style="background: white; color: #333; border: 1px solid #ddd;" onclick="alert('POP 02: Boleamento...')">Boleamento</button>
            </div>
        </div>
    `);

    window.app.calcular = () => {
        const n = document.getElementById('qtd-massas').value || 0;
        const res = document.getElementById('resultado-calculo');
        
        // Mantendo sua lógica de 220g por bolinha
        const farinha = n * 125;
        const agua = farinha * 0.61;
        const sal = farinha * 0.03;
        const levain = farinha * 0.15;

        res.innerHTML = `
            <div style="background:#f9f9f9; padding:10px; border-radius:10px;"><strong>Farinha:</strong><br>${Math.round(farinha)}g</div>
            <div style="background:#f9f9f9; padding:10px; border-radius:10px;"><strong>Água:</strong><br>${Math.round(agua)}g</div>
            <div style="background:#f9f9f9; padding:10px; border-radius:10px;"><strong>Sal:</strong><br>${Math.round(sal)}g</div>
            <div style="background:#f9f9f9; padding:10px; border-radius:10px;"><strong>Levain:</strong><br>${Math.round(levain)}g</div>
        `;
    };
}
