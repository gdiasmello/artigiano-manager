
import { render } from "../main.js";

export function carregarProducao() {
    render(`
        <div style="padding-bottom: 100px; background: #000; min-height: 100vh;">
            <header style="padding: 20px; display: flex; align-items: center; gap: 15px; border-bottom: 2px solid var(--it-blue);">
                <button onclick="location.reload()" style="background:none; border:none; color:#fff;">
                    <i data-lucide="chevron-left"></i>
                </button>
                <h2 style="margin:0; text-transform: uppercase; font-weight: 900;">Produção de Massa</h2>
            </header>

            <div style="padding: 15px;">
                <div class="tile bg-dark" style="aspect-ratio: auto; padding: 30px; border: 2px solid #222; margin-bottom: 15px;">
                    <label style="color: var(--it-blue); font-weight: 900; font-size: 12px; letter-spacing: 2px; margin-bottom: 15px; display: block;">META DE BOLINHAS (UN)</label>
                    <input type="number" id="input-calc-bolinhas" placeholder="00" 
                           oninput="window.app.calcularReceitaMaser()"
                           style="width: 100%; background: none!important; border: none!important; border-bottom: 4px solid var(--it-blue)!important; font-size: 64px; text-align: center; font-weight: 900; color: #fff;">
                </div>

                <div id="painel-resultados-massa" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    </div>

                <div style="margin-top: 20px; background: #111; padding: 15px; border-left: 4px solid var(--it-blue);">
                    <p style="margin:0; font-size: 11px; color: #666; font-weight: 700; line-height: 1.5;">
                        <i data-lucide="info" style="width:12px; vertical-align: middle;"></i>
                        PADRÃO ARTIGIANO: 133g/un | Hidratação 70% | 30% Gelo para controle térmico na masseira.
                    </p>
                </div>
            </div>
        </div>
    `);

    window.app.calcularReceitaMaser = () => {
        const qtd = document.getElementById('input-calc-bolinhas').value;
        const painel = document.getElementById('painel-resultados-massa');
        
        if (!qtd || qtd <= 0) {
            painel.innerHTML = "";
            return;
        }

        // Lógica Técnica PiZZA Maser
        const farinhaTotal = qtd * 133; 
        const salTotal = qtd * 4;
        const aguaTotal = farinhaTotal * 0.70;
        const aguaMineral = aguaTotal * 0.70;
        const gelo = aguaTotal * 0.30;

        painel.innerHTML = `
            <div class="tile bg-dark" style="aspect-ratio: auto; padding: 15px; border: 1px solid #333;">
                <span style="font-size: 10px; color: #888; font-weight: 800;">FARINHA</span>
                <span style="font-size: 24px; font-weight: 900; color: var(--it-green);">${(farinhaTotal/1000).toFixed(2)}kg</span>
            </div>
            <div class="tile bg-dark" style="aspect-ratio: auto; padding: 15px; border: 1px solid #333;">
                <span style="font-size: 10px; color: #888; font-weight: 800;">SAL</span>
                <span style="font-size: 24px; font-weight: 900; color: var(--it-green);">${salTotal.toFixed(0)}g</span>
            </div>
            <div class="tile bg-dark" style="aspect-ratio: auto; padding: 15px; border: 1px solid #333;">
                <span style="font-size: 10px; color: #888; font-weight: 800;">ÁGUA</span>
                <span style="font-size: 24px; font-weight: 900; color: var(--it-blue);">${aguaMineral.toFixed(0)}ml</span>
            </div>
            <div class="tile bg-dark" style="aspect-ratio: auto; padding: 15px; border: 1px solid #333;">
                <span style="font-size: 10px; color: #888; font-weight: 800;">GELO (30%)</span>
                <span style="font-size: 24px; font-weight: 900; color: #5ac8fa;">${gelo.toFixed(0)}g</span>
            </div>
        `;
        
        window.lucide.createIcons();
    };
}
