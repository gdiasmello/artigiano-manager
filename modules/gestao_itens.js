import { db, render } from "../main.js";
import { ref, onValue, set, push, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export function carregarGestaoItens(setorAlvo = 'sacolao') {
    render(`
        <div style="padding: 20px; padding-top: 65px; padding-bottom: 50px; background: #f2f2f7; min-height: 100vh;">
            
            <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <button onclick="location.reload()" style="background: white; border: none; width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                    <i data-lucide="chevron-left" style="color: #333;"></i>
                </button>
                <h2 style="margin:0; font-size: 22px; font-weight: 800;">Dicionário: ${setorAlvo.toUpperCase()}</h2>
                <div style="width: 45px;"></div>
            </header>

            <div class="glass-card" style="margin-bottom: 30px; border-top: 5px solid var(--it-green);">
                <h3 style="margin-top:0; font-size: 16px;">Novo Item</h3>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <input type="text" id="item-nome" placeholder="Nome (Ex: Tomate Cereja)">
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <input type="number" id="item-meta" placeholder="Meta Stock" inputmode="numeric">
                        <input type="text" id="item-unidade" placeholder="Un. (kg, un)">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <input type="number" id="item-fator" placeholder="Fator Emb. (Ex: 12)" inputmode="numeric">
                        <input type="text" id="item-u-compra" placeholder="Un. Compra (cx)">
                    </div>

                    <select id="item-fornecedor" style="height: 50px; border-radius: 15px; padding: 0 10px; border: 1px solid #ddd;">
                        <option value="">Selecione o Fornecedor</option>
                        </select>

                    <button class="btn-primary" onclick="window.app.salvarItem('${setorAlvo}')" style="background: var(--it-green);">
                        ADICIONAR AO CATÁLOGO
                    </button>
                </div>
            </div>

            <div id="lista-itens-config" style="display: flex; flex-direction: column; gap: 10px;">
                <p style="text-align: center; color: #8e8e93;">Carregando catálogo...</p>
            </div>
        </div>
    `);

    const selForn = document.getElementById('item-fornecedor');
    const listaDiv = document.getElementById('lista-itens-config');

    // Carregar Fornecedores para o Select
    onValue(ref(db, 'configuracoes/fornecedores'), (snap) => {
        const forns = snap.val();
        if(forns) {
            selForn.innerHTML = '<option value="">Selecione o Fornecedor</option>' + 
                Object.keys(forns).map(id => `<option value="${id}">${forns[id].nome}</option>`).join('');
        }
    });

    // Carregar Itens do Setor
    onValue(ref(db, `configuracoes/catalogo`), (snap) => {
        const itens = snap.val();
        if(!itens) { listaDiv.innerHTML = "Nenhum item cadastrado."; return; }

        listaDiv.innerHTML = Object.keys(itens)
            .filter(id => itens[id].setor === setorAlvo)
            .map(id => `
            <div class="glass-card" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-left: 5px solid ${itens[id].cor || '#ccc'};">
                <div>
                    <strong style="display: block;">${itens[id].nome}</strong>
                    <small style="color: #8e8e93;">Meta: ${itens[id].meta}${itens[id].unidade} | Emb: ${itens[id].fator}${itens[id].uCompra}</small>
                </div>
                <button onclick="window.app.excluirItem('${id}')" style="background: none; border: none; color: var(--it-red);">
                    <i data-lucide="trash-2" style="width: 20px;"></i>
                </button>
            </div>
        `).join('');
        window.lucide.createIcons();
    });

    // Lógica de Salvar
    window.app.salvarItem = (setor) => {
        const nome = document.getElementById('item-nome').value;
        const meta = document.getElementById('item-meta').value;
        const unidade = document.getElementById('item-unidade').value;
        const fator = document.getElementById('item-fator').value;
        const uCompra = document.getElementById('item-u-compra').value;
        const fornecedorId = document.getElementById('item-fornecedor').value;

        // Atribuição de Cores por Setor (Identidade Visual)
        const cores = {
            'sacolao': '#34c759', // Verde Hortifruti
            'insumos': '#ffcc00', // Amarelo Farinha
            'limpeza': '#af52de', // Roxo Químico
            'bebidas': '#ff3b30', // Vermelho Gelado
            'geral': '#007aff'    // Azul Admin
        };

        if(!nome || !meta || !fornecedorId) return alert("Preencha Nome, Meta e Fornecedor!");

        const novoItem = {
            nome, 
            meta: parseFloat(meta), 
            unidade, 
            fator: parseFloat(fator) || 1, 
            uCompra, 
            fornecedorId,
            setor,
            cor: cores[setor] || '#8e8e93'
        };

        push(ref(db, `configuracoes/catalogo`), novoItem);
        alert("Item cadastrado com sucesso!");
        
        // Limpar inputs
        document.querySelectorAll('input').forEach(i => i.value = '');
    };

    window.app.excluirItem = (id) => {
        if(confirm("Deseja remover este item do catálogo?")) {
            remove(ref(db, `configuracoes/catalogo/${id}`));
        }
    };

    window.lucide.createIcons();
}
