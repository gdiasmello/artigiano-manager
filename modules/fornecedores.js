import { db, render } from "../main.js";
import { ref, onValue, update, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export function carregarConfig() {
    render(`
        <div style="padding-bottom: 100px; background: #000; min-height: 100vh;">
            <header style="padding: 20px; display: flex; align-items: center; gap: 15px; border-bottom: 2px solid #333; background: #0a0a0a;">
                <button onclick="location.reload()" style="background:none; border:none; color:#fff;">
                    <i data-lucide="chevron-left"></i>
                </button>
                <h2 style="margin:0; font-size:18px; font-weight:900; letter-spacing:1px;">AJUSTES DO SISTEMA</h2>
            </header>

            <div style="padding: 15px;">
                <div class="tile bg-dark" style="aspect-ratio: auto; padding: 20px; border: 1px solid #222; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 15px 0; font-size: 12px; color: var(--it-gold);">INTELIGÊNCIA DE CALENDÁRIO</h3>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span style="display: block; font-weight: 900;">MODO FERIADO (1.5x)</span>
                            <small style="color: #666;">Aumenta todas as metas de segurança</small>
                        </div>
                        <button id="toggle-feriado" onclick="window.app.toggleModoFeriado()" 
                                style="padding: 10px 20px; border: none; font-weight: 900; cursor: pointer;">
                            CARREGANDO...
                        </button>
                    </div>
                </div>

                <h3 style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">Catálogo de Itens</h3>
                <div id="lista-ajuste-itens" style="display: flex; flex-direction: column; gap: 10px;">
                    </div>

                <button onclick="window.app.adicionarNovoItem()" 
                        style="width: 100%; margin-top: 20px; padding: 15px; background: var(--it-green); border: none; color: #000; font-weight: 900; text-transform: uppercase;">
                    + Adicionar Novo Item
                </button>
            </div>
        </div>
    `);

    // Sincronização de Configurações
    onValue(ref(db, 'configuracoes'), (snap) => {
        const config = snap.val() || {};
        const catalogo = config.catalogo || {};
        const feriadoAtivo = config.modoFeriado || false;

        // Atualiza Botão Feriado
        const btnFeriado = document.getElementById('toggle-feriado');
        if (btnFeriado) {
            btnFeriado.innerText = feriadoAtivo ? "ATIVADO" : "DESATIVADO";
            btnFeriado.style.background = feriadoAtivo ? "var(--it-red)" : "#222";
            btnFeriado.style.color = feriadoAtivo ? "#fff" : "#666";
        }

        // Renderiza Lista de Itens para Edição
        let html = "";
        Object.keys(catalogo).forEach(id => {
            const item = catalogo[id];
            html += `
                <div style="background: #111; padding: 15px; border-left: 4px solid #333; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="display: block;">${item.nome}</strong>
                        <small style="color: #444;">META: ${item.meta} | FATOR: ${item.fator}</small>
                    </div>
                    <button onclick="window.app.removerItem('${id}')" style="background:none; border:none; color:var(--it-red);">
                        <i data-lucide="trash-2" style="width: 18px;"></i>
                    </button>
                </div>
            `;
        });
        document.getElementById('lista-ajuste-itens').innerHTML = html;
        window.lucide.createIcons();
    });

    // Funções Administrativas
    window.app.toggleModoFeriado = () => {
        if (window.app.verificarPermissaoMaster()) {
            const btn = document.getElementById('toggle-feriado');
            const statusAtual = btn.innerText === "ATIVADO";
            update(ref(db, 'configuracoes'), { modoFeriado: !statusAtual });
            window.app.tocarSom('click');
        }
    };

    window.app.removerItem = (id) => {
        if (window.app.verificarPermissaoMaster()) {
            if (confirm("Deseja excluir permanentemente este item?")) {
                set(ref(db, `configuracoes/catalogo/${id}`), null);
            }
        }
    };

    window.app.adicionarNovoItem = () => {
        if (window.app.verificarPermissaoMaster()) {
            const nome = prompt("Nome do Item (ex: Mussarela):");
            const meta = prompt("Meta de Segurança (unidade final):");
            const fator = prompt("Fator de Embalagem (ex: 5 para peça de 5kg):");
            const setor = prompt("Setor (sacolao ou insumos):");

            if (nome && meta && fator && setor) {
                const novoId = Date.now();
                set(ref(db, `configuracoes/catalogo/${novoId}`), {
                    nome, meta, fator, setor, unidade: 'kg', uCompra: 'un'
                });
            }
        }
    };
}
