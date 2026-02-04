import { db, render } from "../main.js";
import { ref, onValue, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export async function carregarLimpeza() {
    render(`
        <div class="glass-card" style="margin-top: 20px;">
            <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <button onclick="location.reload()" style="background:none; border:none; font-size: 20px;">🔙</button>
                <h2 style="margin:0;">Produtos de Limpeza</h2>
                <div></div>
            </header>
            <div id="lista-limpeza" style="text-align: left;"> Carregando... </div>
            <button class="btn-primary" style="background:#007aff; margin-top:20px;" onclick="window.app.gerarPedidoLimpeza()">Pedir Itens Marcados</button>
        </div>
    `);

    onValue(ref(db, 'configuracoes/itens_limpeza'), (snapshot) => {
        const itens = snapshot.val();
        const listaDiv = document.getElementById('lista-limpeza');
        if (!itens) { listaDiv.innerHTML = "<p>Configure os itens primeiro.</p>"; return; }

        listaDiv.innerHTML = Object.keys(itens).map(id => `
            <div style="background:white; padding:15px; border-radius:15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                <span><strong>${itens[id].nome}</strong></span>
                <input type="checkbox" class="check-limpeza" data-nome="${itens[id].nome}" data-meta="${itens[id].meta}" data-unidade="${itens[id].unidade}" style="width:25px; height:25px;">
            </div>
        `).join('');
    });

    window.app.gerarPedidoLimpeza = () => {
        const checks = document.querySelectorAll('.check-limpeza:checked');
        if (checks.length === 0) return alert("Marque o que está faltando!");

        let mensagem = `Olá, pedido de LIMPEZA da Artigiano:\n\n`;
        checks.forEach(check => {
            mensagem += `✅ ${check.dataset.meta}${check.dataset.unidade} de ${check.dataset.nome}\n`;
        });

        push(ref(db, 'historico'), { data: new Date().toLocaleString(), pedido: mensagem });
        window.open(`https://wa.me/5543999999999?text=${encodeURIComponent(mensagem)}`, '_blank');
    };
}
