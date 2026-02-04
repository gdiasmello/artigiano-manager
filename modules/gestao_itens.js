import { db, render } from "../main.js";
import { ref, onValue, push, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

let silenciarAte = 0;

export function carregarGestaoItens(setorAlvo = 'sacolao') {
    render(`
        <div style="padding: 20px; padding-top: 65px; background: #f2f2f7; min-height: 100vh;">
            <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <button onclick="location.reload()" style="background: white; border: none; width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                    <i data-lucide="chevron-left" style="color: #333;"></i>
                </button>
                <h2 style="margin:0; font-size: 20px; font-weight: 800;">Setor: ${setorAlvo.toUpperCase()}</h2>
                <div style="width: 45px;"></div>
            </header>

            <div class="glass-card" style="margin-bottom: 25px; border-top: 5px solid var(--it-green);">
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <input type="text" id="item-nome" placeholder="Nome do Produto">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <input type="number" id="item-meta" placeholder="Meta" inputmode="numeric">
                        <input type="text" id="item-unidade" placeholder="Unidade (KG/UN)">
                    </div>
                    <select id="item-fornecedor" style="height: 50px; border-radius: 15px; border: 1px solid #ddd;"></select>
                    <button class="btn-primary" onclick="window.app.salvarItem('${setorAlvo}')" style="background: var(--it-green);">ADICIONAR</button>
                </div>
            </div>

            <div id="lista-itens-config" style="display: flex; flex-direction: column; gap: 10px;"></div>

            <div id="confirmacao-toast" style="display:none; position:fixed; bottom:100px; left:20px; right:20px; background:#1c1c1e; color:white; padding:15px; border-radius:15px; box-shadow:0 10px 30px rgba(0,0,0,0.3); z-index:9999;">
                <p style="margin:0 0 10px 0; font-size:14px;">✅ Item adicionado ao catálogo!</p>
                <button onclick="window.app.silenciarConfirmacao()" style="background:none; border:none; color:#007aff; font-weight:800; padding:0;">Silenciar por 5 min</button>
            </div>
        </div>
    `);

    // Carregar dados e popular lista
    const listaDiv = document.getElementById('lista-itens-config');
    onValue(ref(db, 'configuracoes/catalogo'), (snap) => {
        const itens = snap.val() || {};
        listaDiv.innerHTML = Object.keys(itens).filter(id => itens[id].setor === setorAlvo).map(id => `
            <div class="glass-card" style="display:flex; justify-content:space-between; align-items:center; border-left: 5px solid ${itens[id].cor}">
                <span><strong>${itens[id].nome}</strong> (${itens[id].meta}${itens[id].unidade})</span>
                <button onclick="window.app.excluirItem('${id}')" style="background:none; border:none; color:var(--it-red);">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `).join('');
        window.lucide.createIcons();
    });

    // Função Salvar (Qualquer um pode adicionar)
    window.app.salvarItem = (setor) => {
        const nome = document.getElementById('item-nome').value;
        const meta = document.getElementById('item-meta').value;
        if (!nome || !meta) return alert("Preencha nome e meta!");

        const novo = { nome, meta, setor, unidade: document.getElementById('item-unidade').value, cor: "#008C45" };
        push(ref(db, 'configuracoes/catalogo'), novo);

        // Mostrar confirmação se não estiver silenciado
        if (Date.now() > silenciarAte) {
            const toast = document.getElementById('confirmacao-toast');
            toast.style.display = 'block';
            setTimeout(() => toast.style.display = 'none', 4000);
        }
        
        document.getElementById('item-nome').value = '';
        document.getElementById('item-meta').value = '';
    };

    // Silenciador
    window.app.silenciarConfirmacao = () => {
        silenciarAte = Date.now() + (5 * 60 * 1000);
        document.getElementById('confirmacao-toast').style.display = 'none';
    };

    // Exclusão (Apenas ADM ou Gerente via PIN)
    window.app.excluirItem = (id) => {
        const pin = prompt("Para excluir, insira o PIN Administrativo ou Gerente:");
        if (pin === "1821" || pin === "2026") {
            remove(ref(db, `configuracoes/catalogo/${id}`));
        } else {
            alert("Acesso Negado: PIN incorreto.");
        }
    };
}
