import { db, render } from "../main.js";
import { ref, onValue, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export async function carregarInsumos() {
    render(`
        <div class="glass-card" style="margin-top: 20px;">
            <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <button onclick="location.reload()" style="background:none; border:none; font-size: 20px;">🔙</button>
                <h2 style="margin:0;">Estoque de Insumos</h2>
                <div></div>
            </header>
            <div id="lista-insumos" style="text-align: left;"> Carregando... </div>
            <button class="btn-primary" style="background:#8e8e93; margin-top:20px;" onclick="window.app.gerarPedidoInsumos()">Gerar Pedido de Insumos</button>
        </div>
    `);

    onValue(ref(db, 'configuracoes/itens_insumos'), (snapshot) => {
        const itens = snapshot.val();
        const listaDiv = document.getElementById('lista-insumos');
        if (!itens) { listaDiv.innerHTML = "<p>Configure os insumos nas Configurações.</p>"; return; }

        listaDiv.innerHTML = Object.keys(itens).map(id => `
            <div style="background:white; padding:15px; border-radius:15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                <span><strong>${itens[id].nome}</strong></span>
                <input type="number" class="input-insumo" 
                    data-nome="${itens[id].nome}" 
                    data-meta="${itens[id].meta}" 
                    data-unidade="${itens[id].unidade}" 
                    placeholder="Tem: 0" style="width:80px; margin:0; padding:8px;">
            </div>
        `).join('');
    });

    window.app.gerarPedidoInsumos = () => {
        const inputs = document.querySelectorAll('.input-insumo');
        let mensagem = `Olá, aqui é o Gabriel da Artigiano. Pedido de INSUMOS:\n\n`;
        let temPedido = false;

        inputs.forEach(input => {
            const atual = parseFloat(input.value) || 0;
            const meta = parseFloat(input.dataset.meta);
            if (atual < meta) {
                mensagem += `✅ ${meta - atual}${input.dataset.unidade} de ${input.dataset.nome}\n`;
                temPedido = true;
            }
        });

        if (!temPedido) return alert("Tudo em ordem no estoque!");
        
        push(ref(db, 'historico'), { data: new Date().toLocaleString(), pedido: mensagem });
        window.open(`https://wa.me/5543999999999?text=${encodeURIComponent(mensagem)}`, '_blank');
    };
}
