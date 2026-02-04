import { db, render } from "../main.js";
import { ref, onValue, set, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export function carregarConfig() {
    render(`
        <div style="padding: 20px; padding-top: 65px; background: #f2f2f7; min-height: 100vh; font-family: -apple-system, sans-serif;">
            
            <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <button onclick="location.reload()" style="background: white; border: none; width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                    <i data-lucide="chevron-left" style="color: #333;"></i>
                </button>
                <h2 style="margin:0; font-size: 24px; font-weight: 800; color: #1c1c1e;">Ajustes</h2>
                <div style="width: 45px;"></div>
            </header>

            <div class="glass-card" style="border: 2px solid #ff3b30; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 style="margin:0; color: #ff3b30;">Modo Feriado (+50%)</h4>
                    <small style="color: #8e8e93;">Infla metas globalmente</small>
                </div>
                <label class="ios-switch">
                    <input type="checkbox" id="switch-feriado" onchange="window.app.toggleFeriado(this.checked)">
                    <span class="slider"></span>
                </label>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
                
                <details class="ios-accordion">
                    <summary><i data-lucide="shield-check"></i> Equipa e Segurança</summary>
                    <div class="acc-content">
                        <button class="btn-acc" onclick="alert('Funcionalidade em breve: Gestão de PINs')">Gerir PINs de Acesso</button>
                        <button class="btn-acc" onclick="alert('Logs: Ver histórico de envios')">Auditoria de Logs</button>
                    </div>
                </details>

                <details class="ios-accordion">
                    <summary><i data-lucide="database"></i> Catálogo de Itens</summary>
                    <div class="acc-content">
                        <button class="btn-acc" onclick="window.app.abrirGestaoItens('sacolao')">Itens Sacolão</button>
                        <button class="btn-acc" onclick="window.app.abrirGestaoItens('insumos')">Itens Insumos</button>
                        <button class="btn-acc" onclick="window.app.abrirGestaoItens('bebidas')">Itens Bebidas</button>
                    </div>
                </details>

                <details class="ios-accordion">
                    <summary><i data-lucide="truck"></i> Logística e WhatsApp</summary>
                    <div class="acc-content">
                        <input type="text" placeholder="WhatsApp Fornecedor" style="margin-bottom:10px;">
                        <button class="btn-acc" style="background: #008C45; color: white;">Salvar Contactos</button>
                    </div>
                </details>

                <details class="ios-accordion">
                    <summary><i data-lucide="hard-drive"></i> Backup e Sistema</summary>
                    <div class="acc-content">
                        <p style="font-size:12px; color:#666;">Status: <span style="color:green;">Sincronizado com Firebase</span></p>
                        <button class="btn-acc" onclick="window.app.exportarDados()">Exportar JSON (Backup)</button>
                    </div>
                </details>

            </div>
        </div>
    `);

    // Lógica Modo Feriado
    onValue(ref(db, 'configuracoes/modo_feriado'), (snap) => {
        const status = snap.val();
        document.getElementById('switch-feriado').checked = !!status;
    });

    window.app.toggleFeriado = (checked) => {
        set(ref(db, 'configuracoes/modo_feriado'), checked);
    };

    window.app.exportarDados = () => {
        onValue(ref(db, 'configuracoes'), (snap) => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snap.val()));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "artigiano_backup.json");
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }, { onlyOnce: true });
    };
}
