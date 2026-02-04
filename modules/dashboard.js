import { render } from "../main.js";

export function carregarDash(user) {
    render(`
        <div style="background: #000; min-height: 100vh;">
            <div style="padding: 25px 20px; background: #000; border-bottom: 1px solid #222;">
                <h1 style="margin:0; font-size: 22px; font-weight: 900; letter-spacing: 1px;">
                    ARTIGIANO <span style="color:var(--it-green)">LOG</span>
                </h1>
                <div style="display:flex; align-items:center; gap:8px; margin-top:5px;">
                    <div style="width:8px; height:8px; background:var(--it-green); border-radius:50%;"></div>
                    <span style="font-size:10px; color:#666; font-weight:800; text-transform:uppercase;">Sistema Operacional Ativo</span>
                </div>
            </div>

            <div class="tile-grid">
                <div class="tile bg-green" onclick="window.app.tocarSom('click'); window.app.abrirGestaoItens('sacolao')">
                    <i data-lucide="leaf"></i>
                    Sacolão
                </div>
                
                <div class="tile bg-blue" onclick="window.app.tocarSom('click'); window.app.abrirProducao()">
                    <i data-lucide="chef-hat"></i>
                    Massa
                </div>

                <div class="tile bg-purple" onclick="window.app.tocarSom('click'); window.app.abrirChecklist()">
                    <i data-lucide="list-checks"></i>
                    Checklist
                </div>

                <div class="tile bg-gold" onclick="window.app.tocarSom('click'); window.app.abrirHistorico()">
                    <i data-lucide="database"></i>
                    Histórico
                </div>

                <div class="tile bg-red" onclick="window.app.tocarSom('click'); window.app.abrirCarrinho()" style="grid-column: span 2; aspect-ratio: 2.1/1;">
                    <i data-lucide="shopping-cart"></i>
                    Gerar Pedido de Compra
                </div>
            </div>

            <div style="position: fixed; bottom: 0; width: 100%; height: 60px; background: #111; display: flex; justify-content: space-around; align-items: center; border-top: 1px solid #222;">
                <i data-lucide="settings" onclick="window.app.abrirConfig()" style="color:#444;"></i>
                <i data-lucide="user" style="color:var(--it-green);"></i>
                <i data-lucide="power" onclick="window.app.logout()" style="color:var(--it-red);"></i>
            </div>
        </div>
    `);
}
