import { db, render } from "../main.js";
import { ref, onValue, set, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export function carregarGestaoItens(setor) {
    // 1. Renderiza a casca industrial da tela
    render(`
        <div style="padding-bottom: 100px; background: #000; min-height: 100vh;">
            <header style="padding: 20px; display: flex; align-items: center; gap: 15px; border-bottom: 2px solid var(--it-green);">
                <button onclick="location.reload()" style="background:none; border:none; color:#fff;">
                    <i data-lucide="chevron-left"></i>
                </button>
                <h2 style="margin:0; text-transform: uppercase; font-weight: 900;">Contagem: ${setor}</h2>
            </header>

            <div id="lista-itens-contagem" style="padding: 10px;">
                <p style="text-align:center; color:#444; margin-top:50px;">Acessando Banco de Dados...</p>
            </div>
        </div>
    `);

    // 2. Busca o catálogo e as contagens atuais
    onValue(ref(db, 'configuracoes/catalogo'), async (snap) => {
        const catalogo = snap.val() || {};
        const contagemSnapshot = await get(ref(db, `contagem_atual/${setor}`));
        const contagemExistente = contagemSnapshot.val() || {};

        let html = "";

        Object.keys(catalogo).forEach(id => {
            const item = catalogo[id];
            if (item.setor !== setor) return;

            // Soma total de todos os locais para exibição rápida
            const locaisDoItem = contagemExistente[id] || {};
            const totalSoma = Object.values(locaisDoItem).reduce((a, b) => a + (parseFloat(b) || 0), 0);

            html += `
                <div class="tile bg-dark" style="aspect-ratio: auto; margin-bottom: 15px; padding: 20px; border-left: 5px solid ${totalSoma >= item.meta ? 'var(--it-green)' : 'var(--it-red)'};">
                    <div style="width:100%; display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <div style="text-align:left;">
                            <strong style="font-size:18px; display:block;">${item.nome}</strong>
                            <small style="color:#666;">META: ${item.meta} ${item.unidade}</small>
                        </div>
                        <div style="text-align:right;">
                            <span style="font-size:24px; font-weight:900; color:${totalSoma >= item.meta ? 'var(--it-green)' : 'var(--it-red)'};">
                                ${totalSoma}
                            </span>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                        ${window.app.locaisArmazenamento.map(local => `
                            <div style="display:flex; align-items:center; background:#111; padding:5px 10px; border:1px solid #222;">
                                <label style="font-size:10px; flex:1; color:#888;">${local.toUpperCase()}</label>
                                <input type="number" 
                                    value="${locaisDoItem[local] || ''}" 
                                    placeholder="0"
                                    onchange="window.app.salvarContagemLocal('${setor}', '${id}', '${local}', this.value)"
                                    style="width:80px; background:none!important; border:none!important; border-bottom:1px solid var(--it-green)!important; text-align:right; font-size:16px;">
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        document.getElementById('lista-itens-contagem').innerHTML = html || '<p style="text-align:center;">Nenhum item neste setor.</p>';
        window.lucide.createIcons();
    });

    // 3. Função para salvar individualmente cada local
    window.app.salvarContagemLocal = (setor, itemId, local, valor) => {
        window.app.tocarSom('click');
        const path = `contagem_atual/${setor}/${itemId}/${local}`;
        set(ref(db, path), parseFloat(valor) || 0);
    };
}
