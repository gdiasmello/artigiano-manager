import { render } from "../main.js";

export function carregarDash(usuario) {
    render(`
        <header style="display:flex; justify-content:space-between; align-items:center; padding: 10px 5px 25px 5px;">
            <div>
                <h1 style="margin:0; font-size:32px; font-weight:800;">Artigiano</h1>
                <span style="color:var(--it-green); font-weight:600; font-size:14px;">Olá, ${usuario.nome} 🇮🇹</span>
            </div>
            <div style="display:flex; gap:15px;">
                ${usuario.cargo === 'admin' ? `<i data-lucide="settings" onclick="window.app.abrirConfig()" style="color:#8e8e93;"></i>` : ''}
            </div>
        </header>

        <div class="grid-dashboard">
            <div class="card green" onclick="window.app.abrirSacolao()"> <i data-lucide="leaf"></i><span>Sacolão</span> </div>
            <div class="card yellow" onclick="window.app.abrirProducao()"> <i data-lucide="scale"></i><span>Produção</span> </div>
            <div class="card blue" onclick="window.app.abrirLimpeza()"> <i data-lucide="sparkles"></i><span>Limpeza</span> </div>
            <div class="card grey" onclick="window.app.abrirInsumos()"> <i data-lucide="package"></i><span>Insumos</span> </div>
            <div class="card red" onclick="window.app.abrirBebidas()"> <i data-lucide="beer"></i><span>Bebidas</span> </div>
            <div class="card purple" onclick="window.app.abrirHistorico()"> <i data-lucide="scroll-text"></i><span>Histórico</span> </div>
        </div>
        
        <footer style="margin-top:40px; text-align:center; opacity:0.3; font-size:12px;">
            Artigiano Manager Pro • v2.0
        </footer>
    `);
}
