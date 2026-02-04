import { render } from "../main.js";

export function carregarDash(user) {
    render(`
        <div style="min-height: 100vh; background: #000; color: #fff;">
            
            <div class="app-header">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h1 class="brand">PiZZA <span>Maser</span></h1>
                        <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                            <div style="width: 8px; height: 8px; background: var(--it-green); border-radius: 50%; box-shadow: 0 0 10px var(--it-green);"></div>
                            <span style="font-size: 10px; font-weight: 900; color: #666; text-transform: uppercase; letter-spacing: 1px;">Terminal: ${user.nome}</span>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <span style="display: block; font-size: 10px; font-weight: 800; color: #444;">V 0.0.13</span>
                        <span style="display: block; font-size: 10px; font-weight: 800; color: var(--it-green);">LON-PR</span>
                    </div>
                </div>
            </div>

            <div class="tile-grid">
                
                <div class="tile bg-green" onclick="window.app.tocarSom('click'); window.app.abrirGestaoItens('sacolao')">
                    <i data-lucide="leaf"></i>
                    <span class="tile-text">Sacolão</span>
                </div>

                <div class="tile bg-blue" onclick="window.app.tocarSom('click'); window.app.abrirProducao()">
                    <i data-lucide="chef-hat"></i>
                    <span class="tile-text">Massa</span>
                </div>

                <div class="tile bg-dark" onclick="window.app.tocarSom('click'); window.app.abrirGestaoItens('insumos')" style="border: 2px solid #333;">
                    <i data-lucide="box" style="color: var(--it-gold);"></i>
                    <span class="tile-text">Insumos</span>
                </div>

                <div class="tile bg-purple" onclick="window.app.tocarSom('click'); window.app.abrirChecklist()">
                    <i data-lucide="clipboard-check"></i>
                    <span class="tile-text">Mise en Place</span>
                </div>

                <div class="tile bg-gold" onclick="window.app.tocarSom('click'); window.app.abrirHistorico()">
                    <i data-lucide="database" style="color: #000;"></i>
                    <span class="tile-text" style="color: #000;">Histórico</span>
                </div>

                <div class="tile bg-dark" onclick="window.app.tocarSom('click'); window.app.abrirConfig()" style="border: 2px solid #333;">
                    <i data-lucide="settings" style="color: #666;"></i>
                    <span class="tile-text" style="color: #666;">Ajustes</span>
                </div>

                <div class="tile bg-red" onclick="window.app.tocarSom('click'); window.app.abrirCarrinho()" style="grid-column: span 2; aspect-ratio: 2.2 / 1; border: none;">
                    <div style="display: flex; align-items: center; gap: 25px;">
                        <i data-lucide="shopping-cart" style="width: 50px !important; height: 50px !important;"></i>
                        <div style="text-align: left;">
                            <span class="tile-text" style="font-size: 18px; display: block;">Gerar Pedido</span>
                            <small style="font-size: 9px; font-weight: 700; opacity: 0.8;">CÁLCULO POR ARREDONDAMENTO (CEIL)</small>
                        </div>
                    </div>
                </div>
            </div>

            <div style="position: fixed; bottom: 0; width: 100%; height: 60px; background: #0a0a0a; display: flex; justify-content: space-around; align-items: center; border-top: 1px solid #222;">
                <button onclick="window.app.logout()" style="background: none; border: none; color: var(--it-red); display: flex; align-items: center; gap: 10px; font-weight: 900; font-size: 12px; text-transform: uppercase;">
                    <i data-lucide="power" style="width: 20px;"></i> Desligar Terminal
                </button>
            </div>
        </div>
    `);
}
