import { db, render } from "../main.js";
import { ref, onValue, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export async function carregarBebidas() {
    render(`
        <div class="glass-card" style="margin-top: 20px;">
            <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <button onclick="location.reload()" style="background:none; border:none; font-size: 20px;">🔙</button>
                <h2 style="margin:0;">Estoque de Bebidas</h2>
                <div></div>
            </header>
            <div id="lista-bebidas" style="text-align: left;"> Carregando... </div>
            <button class="btn-primary" style="background:#ff3b30; margin-top:20px;" onclick="window.app.gerarPedidoBebidas()">Gerar Pedido de Bebidas</button>
        </div>
    `);

    onValue(ref(db, 'configuracoes/itens_bebidas'), (snapshot) => {
        const itens = snapshot.val();
        const listaDiv = document.getElementById('lista-bebidas');
        if (!itens) { listaDiv.innerHTML = "<p>Configure as bebidas nas Configurações.</p>"; return; }

        listaDiv.innerHTML = Object.keys(itens).map(id => `
            <div style="background:white; padding:15px; border-radius:15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                <span><strong>${itens[id].nome}</strong></span>
                <input type="number" class="input-bebida" 
                    data-nome="${itens[id].nome}" 
                    data-meta="${itens[id].meta}" 
                    data-unidade="${itens[id].unidade}" 
                    placeholder="Tem: 0" style="width:80px; margin:0; padding:8px;">
            </div>
        `).join('');
    });

    window.app.gerarPedidoBebidas = () => {
        const inputs = document.querySelectorAll('.input-bebida');
        let mensagem = `Olá, aqui é o Gabriel da Artigiano. Pedido de BEBIDAS:\n\n`;
        let temPedido = false;

        inputs.forEach(input => {
            const atual = parseFloat(input.value) || 0;
            const meta = parseFloat(input.dataset.meta);
            if (atual < meta) {
                mensagem += `✅ ${meta - atual} ${input.dataset.unidade} de ${input.dataset.nome}\n`;
                temPedido = true;
            }
        });

        if (!temPedido) return alert("Stock de bebidas completo!");
        
        push(ref(db, 'historico'), { data: new Date().toLocaleString(), pedido: mensagem });
        window.open(`https://wa.me/5543999999999?text=${encodeURIComponent(mensagem)}`, '_blank');
    };
}
