import { db, render } from "../main.js";
import { ref, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export function carregarGestaoItens() {
    render(`
        <div class="glass-card" style="margin-top: 20px;">
            <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <button onclick="window.app.abrirConfig()" style="background:none; border:none; font-size: 20px;">🔙</button>
                <h2 style="margin:0;">Editar Itens</h2>
                <div></div>
            </header>

            <section style="background:white; padding:15px; border-radius:15px; margin-bottom:20px; text-align:left;">
                <h4 style="margin:0 0 10px 0;">Novo Item</h4>
                <select id="item-categoria" style="width:100%; padding:10px; border-radius:10px; margin-bottom:10px; border:1px solid #ddd;">
                    <option value="itens_sacolao">Sacolão (Verde)</option>
                    <option value="itens_limpeza">Limpeza (Azul)</option>
                    <option value="itens_insumos">Insumos (Cinza)</option>
                    <option value="itens_bebidas">Bebidas (Vermelho)</option>
                </select>
                <input type="text" id="item-nome" placeholder="Nome do Item">
                <div style="display:flex; gap:10px;">
                    <input type="number" id="item-meta" placeholder="Meta" style="width:50%;">
                    <input type="text" id="item-unidade" placeholder="Unid (Ex: Cx)" style="width:50%;">
                </div>
                <button class="btn-primary" onclick="window.app.salvarItem()">Salvar Item</button>
            </section>

            <div id="lista-itens-gestao" style="text-align: left; max-height: 300px; overflow-y: auto;"></div>
        </div>
    `);

    const atualizarLista = () => {
        const cat = document.getElementById('item-categoria').value;
        onValue(ref(db, `configuracoes/${cat}`), (snapshot) => {
            const itens = snapshot.val();
            const listaDiv = document.getElementById('lista-itens-gestao');
            if (!itens) { listaDiv.innerHTML = "<p style='text-align:center;'>Nenhum item.</p>"; return; }
            listaDiv.innerHTML = Object.keys(itens).map(id => `
                <div style="background:rgba(255,255,255,0.5); padding:10px; border-radius:10px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                    <div><strong>${itens[id].nome}</strong> <small>(${itens[id].meta} ${itens[id].unidade})</small></div>
                    <button onclick="window.app.removerItem('${cat}', '${id}')" style="background:#ff3b30; color:white; border:none; border-radius:8px; padding:5px 10px;">X</button>
                </div>
            `).join('');
        });
    };

    document.getElementById('item-categoria').onchange = atualizarLista;
    atualizarLista();

    window.app.salvarItem = async () => {
        const cat = document.getElementById('item-categoria').value;
        const nome = document.getElementById('item-nome').value;
        const meta = document.getElementById('item-meta').value;
        const unidade = document.getElementById('item-unidade').value;
        if (!nome || !meta) return alert("Preencha o nome e a meta!");
        const id = nome.toLowerCase().replace(/\s/g, '_');
        await set(ref(db, `configuracoes/${cat}/${id}`), { nome, meta, unidade });
        document.getElementById('item-nome').value = "";
        document.getElementById('item-meta').value = "";
    };

    window.app.removerItem = async (cat, id) => {
        if (confirm("Apagar este item?")) await remove(ref(db, `configuracoes/${cat}/${id}`));
    };
}
