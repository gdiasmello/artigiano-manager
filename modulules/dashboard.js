import { render } from "../main.js";

export function carregarDash(usuario) {
    render(`
        <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div><h2 style="margin:0;">Olá, ${usuario.nome}</h2><small style="opacity:0.7;">${usuario.cargo}</small></div>
            <div style="display: flex; gap: 15px;">
                <i data-lucide="help-circle"></i>
                ${usuario.cargo === 'admin' ? `<i data-lucide="settings" onclick="window.app.abrirConfig()"></i>` : ''}
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
    `);
}
