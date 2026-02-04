import { db, render } from "../main.js";
import { ref, onValue, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export async function carregarSacolao() {
    render(`
        <div style="padding: 20px; padding-top: 60px; background: #f2f2f7; min-height: 100vh; font-family: -apple-system, sans-serif;">
            
            <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <button onclick="location.reload()" style="background: white; border: none; width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                    <i data-lucide="chevron-left" style="color: #333;"></i>
                </button>
                <h2 style="margin:0; font-size: 24px; font-weight: 800; color: #008C45;">Sacolão</h2>
                <div style="width: 45px;"></div>
            </header>

            <div id="lista-estoque" style="display: flex; flex-direction: column; gap: 12px;">
                <p style="text-align: center; opacity: 0.5;">Carregando itens...</p>
            </div>

            <div style="margin-top: 30px; padding-bottom: 40px;">
                <button class="btn-primary" style="background: #008C45; box-shadow: 0 10px 20px rgba(0, 140, 69, 0.2);" onclick="window.app.gerarPedido()">
                    ENVIAR PEDIDO WHATSAPP
                </button>
            </div>
        </div>
    `);

    onValue(ref(db, 'configuracoes/itens_sacolao'), (snapshot) => {
        const itens = snapshot.val();
        const listaDiv = document.getElementById('lista-estoque');
        if (!itens) { listaDiv.innerHTML = "<p>Configure os itens no menu de admin.</p>"; return; }

        listaDiv.innerHTML = Object.keys(itens).map(id => `
            <div style="background: white; padding: 18px; border-radius: 20px; display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #34c759; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                <div>
                    <span style="display: block; font-weight: 700; font-size: 16px;">${itens[id].nome}</span>
                    <small style="color: #8e8e93; font-weight: 600;">Meta: ${itens[id].meta}${itens[id].unidade}</small>
                </div>
                <input type="number" class="input-estoque" 
                    data-nome="${itens[id].nome}" data-meta="${itens[id].meta}" data-unidade="${itens[id].unidade}" 
                    placeholder="Tem" style="width: 80px; height: 45px; border-radius: 12px; border: 1px solid #e5e5ea; background: #f9f9f9; text-align: center; font-weight: 700;">
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
                mensagem += `✅ *${meta - atual}${input.dataset.unidade}* de ${input.dataset.nome}\n`;
                temPedido = true;
            }
        });

        if (!temPedido) return alert("Estoque está completo!");
        
        // Salva no histórico e abre WhatsApp
        push(ref(db, 'historico'), { data: new Date().toLocaleString(), pedido: mensagem });
        window.open(`https://wa.me/5543999999999?text=${encodeURIComponent(mensagem)}`, '_blank');
    };
}
