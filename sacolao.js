import { db, render } from "../main.js";
import { ref, get, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export async function carregarSacolao() {
    render(`
        <div class="glass-card" style="margin-top: 20px;">
            <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <button onclick="location.reload()" style="background:none; border:none; font-size: 20px;">🔙</button>
                <h2 style="margin:0;">Estoque Sacolão</h2>
                <div></div>
            </header>
            <div id="lista-estoque" style="text-align: left;"> Carregando itens... </div>
            <button class="btn-primary" style="background:#34c759; margin-top:20px;" onclick="window.app.gerarPedido()">Gerar Pedido WhatsApp</button>
        </div>
    `);

    const itensRef = ref(db, 'configuracoes/itens_sacolao');
    onValue(itensRef, (snapshot) => {
        const itens = snapshot.val();
        const listaDiv = document.getElementById('lista-estoque');
        if (!itens) {
            listaDiv.innerHTML = "<p>Nenhum item configurado. Vá às Configurações.</p>";
            return;
        }

        listaDiv.innerHTML = Object.keys(itens).map(id => `
            <div style="background:white; padding:15px; border-radius:15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                <span><strong>${itens[id].nome}</strong></span>
                <input type="number" class="input-estoque" 
                    data-nome="${itens[id].nome}" 
                    data-meta="${itens[id].meta}" 
                    data-unidade="${itens[id].unidade}" 
                    placeholder="Tem: 0" style="width:80px; margin:0; padding:8px;">
            </div>
        `).join('');
    });

    window.app.gerarPedido = () => {
        const inputs = document.querySelectorAll('.input-estoque');
        let mensagem = `Olá, aqui é o Gabriel da Artigiano. Pedido de Sacolão:\n\n`;
        let temPedido = false;

        inputs.forEach(input => {
            const atual = parseFloat(input.value) || 0;
            const meta = parseFloat(input.dataset.meta);
            if (atual < meta) {
                mensagem += `✅ ${meta - atual}${input.dataset.unidade} de ${input.dataset.nome}\n`;
                temPedido = true;
            }
        });

        if (!temPedido) return alert("Estoque cheio!");
        
        push(ref(db, 'historico'), { data: new Date().toLocaleString(), pedido: mensagem });
        window.open(`https://wa.me/5543999999999?text=${encodeURIComponent(mensagem)}`, '_blank');
    };
}
