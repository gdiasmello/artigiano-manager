import { render } from "../main.js";

export function carregarProducao() {
    render(`
        <div style="padding: 20px; padding-top: 60px; background: #f2f2f7; min-height: 100vh; font-family: -apple-system, sans-serif;">
            
            <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <button onclick="location.reload()" style="background: white; border: none; width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                    <i data-lucide="chevron-left" style="color: #333;"></i>
                </button>
                <h2 style="margin:0; font-size: 24px; font-weight: 800; color: #fbc02d;">Produção</h2>
                <div style="width: 45px;"></div>
            </header>

            <div class="glass-card" style="border: 3px solid #ffcc00; margin-bottom: 20px;">
                <h3 style="margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="calculator" style="width: 20px; color: #fbc02d;"></i> Calculadora de Massa (220g)
                </h3>
                <input type="number" id="qtd-massas" placeholder="Qtd. de Bolinhas" oninput="window.app.calcular()" 
                    style="height: 55px; font-size: 20px; font-weight: 800; text-align: center; border: 2px solid #ffcc00; border-radius: 15px; background: #fffdf0;">
                
                <div id="resultado-calculo" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px;">
                    </div>
            </div>

            <div class="glass-card" style="background: #fff;">
                <h3 style="margin: 0 0 15px 0; font-size: 18px;">📖 Manuais (POPs)</h3>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button class="btn-primary" style="background: #f2f2f7; color: #333; border: 1px solid #e5e5ea;" onclick="alert('POP 01: Batimento - 12min velocidade 1...')">BATIMENTO</button>
                    <button class="btn-primary" style="background: #f2f2f7; color: #333; border: 1px solid #e5e5ea;" onclick="alert('POP 02: Boleamento - Bolinhas de 220g firmes...')">BOLEAMENTO</button>
                </div>
            </div>
        </div>
    `);

    window.app.calcular = () => {
        const n = document.getElementById('qtd-massas').value || 0;
        const res = document.getElementById('resultado-calculo');
        
        // Sua regra técnica: 220g total por bolinha
        // Proporção baseada em 125g de farinha por bolinha
        const farinha = n * 125;
        const agua = farinha * 0.61;
        const sal = farinha * 0.03;
        const levain = farinha * 0.15;

        if (n > 0) {
            res.innerHTML = `
                <div style="background:#fff9e6; padding:15px; border-radius:15px; text-align:center; border: 1px solid #ffeeba;">
                    <small style="display:block; color:#856404; font-weight:bold;">FARINHA</small>
                    <span style="font-size:20px; font-weight:800;">${Math.round(farinha)}g</span>
                </div>
                <div style="background:#eef7ff; padding:15px; border-radius:15px; text-align:center; border: 1px solid #cce5ff;">
                    <small style="display:block; color:#004085; font-weight:bold;">ÁGUA</small>
                    <span style="font-size:20px; font-weight:800;">${Math.round(agua)}g</span>
                </div>
                <div style="background:#f4f4f4; padding:15px; border-radius:15px; text-align:center; border: 1px solid #ddd;">
                    <small style="display:block; color:#383d41; font-weight:bold;">SAL</small>
                    <span style="font-size:20px; font-weight:800;">${Math.round(sal)}g</span>
                </div>
                <div style="background:#fdf2f2; padding:15px; border-radius:15px; text-align:center; border: 1px solid #f5c6cb;">
                    <small style="display:block; color:#721c24; font-weight:bold;">LEVAIN</small>
                    <span style="font-size:20px; font-weight:800;">${Math.round(levain)}g</span>
                </div>
            `;
        } else {
            res.innerHTML = "";
        }
    };
}
