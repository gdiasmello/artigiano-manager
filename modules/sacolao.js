import { db, render } from "../main.js";
import { ref, onValue, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export async function carregarSacolao() {
    render(`
        <div class="glass-card" style="margin-top: 10px;">
            <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
                <button onclick="location.reload()" style="background:none; border:none; font-size:24px;">🔙</button>
                <h2 style="margin:0; font-weight:800;">Sacolão</h2>
                <i data-lucide="leaf" style="color:var(--it-green)"></i>
            </header>
            
            <div id="lista-estoque" style="text-align:left;"> Carregando itens... </div>
            
            <button class="btn-primary" style="margin-top:20px;" onclick="window.app.gerarPedido()">
                Gerar Pedido WhatsApp
            </button>
        </div>
    `);

    onValue(ref(db, 'configuracoes/itens_sacolao'), (snapshot) => {
        const itens = snapshot.val();
        const listaDiv = document.getElementById('lista-estoque');
        if (!itens) { listaDiv.innerHTML = "<p>Nenhum item configurado.</p>"; return; }

        listaDiv.innerHTML = Object.keys(itens).map(id => `
            <div style="background:white; padding:18px; border-radius:18px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                <div>
                    <span style="display:block; font-weight:700;">${itens[id].nome}</span>
                    <small style="color:#8e8e93;">Meta: ${itens[id].meta}${itens[id].unidade}</small>
                </div>
                <input type="number" class="input-estoque" 
                    data-nome="${itens[id].nome}" data-meta="${itens[id].meta}" data-unidade="${itens[id].unidade}" 
                    placeholder="Tem" style="width:75px; margin:0; padding:10px; border-radius:10px;">
            </div>
        `).join('');
    });

    window.app.gerarPedido = () => {
        const inputs = document.querySelectorAll('.input-estoque');
        let mensagem = `*Artigiano Pizzaria - Pedido Sacolão*\n\n`;
        let temPedido = false;

        inputs.forEach(input => {
            const atual = parseFloat(input.value) || 0;
            const meta = parseFloat(input.dataset.meta);
            if (atual < meta) {
                mensagem += `✅ ${meta - atual}${input.dataset.unidade} de ${input.dataset.nome}\n`;
                temPedido = true;
            }
        });

        if (!temPedido) return alert("Stock completo!");
        push(ref(db, 'historico'), { data: new Date().toLocaleString(), pedido: mensagem });
        window.open(`https://wa.me/5543999999999?text=${encodeURIComponent(mensagem)}`, '_blank');
    };
}
