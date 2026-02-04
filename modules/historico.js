import { db, render } from "../main.js";
import { ref, onValue, query, limitToLast, orderByKey } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export function carregarHistorico() {
    render(`
        <div style="padding: 20px; padding-top: 65px; background: #f2f2f7; min-height: 100vh; font-family: -apple-system, sans-serif;">
            
            <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <button onclick="location.reload()" style="background: white; border: none; width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                    <i data-lucide="chevron-left" style="color: #333;"></i>
                </button>
                <h2 style="margin:0; font-size: 22px; font-weight: 800; color: #1c1c1e;">Auditoria</h2>
                <div style="width: 45px;"></div>
            </header>

            <div id="timeline-pedidos" style="display: flex; flex-direction: column; gap: 15px;">
                <p style="text-align: center; color: #8e8e93; margin-top: 40px;">Buscando registros...</p>
            </div>
        </div>
    `);

    const listaDiv = document.getElementById('timeline-pedidos');
    const historicoRef = query(ref(db, 'history'), orderByKey(), limitToLast(30));

    onValue(historicoRef, (snapshot) => {
        const dados = snapshot.val();
        if (!dados) {
            listaDiv.innerHTML = `
                <div style="text-align:center; padding:40px; opacity:0.5;">
                    <i data-lucide="archive" style="width:48px; height:48px; margin-bottom:10px;"></i>
                    <p>Nenhum pedido registrado ainda.</p>
                </div>`;
            return;
        }

        // Inverter para mostrar os mais recentes primeiro
        const logs = Object.keys(dados).reverse().map(id => {
            const item = dados[id];
            const dataObj = new Date(item.data);
            const dataFormatada = dataObj.toLocaleDateString('pt-BR');
            const horaFormatada = dataObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});

            return `
                <div class="glass-card" style="padding: 18px; border-left: 5px solid #007aff; position: relative;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                        <div>
                            <span style="display: block; font-weight: 800; font-size: 16px; color: #1c1c1e;">${item.fornecedor}</span>
                            <small style="color: #8e8e93; font-weight: 600;">${dataFormatada} às ${horaFormatada}</small>
                        </div>
                        <div style="background: #eef7ff; color: #007aff; padding: 4px 8px; border-radius: 8px; font-size: 10px; font-weight: 900;">
                            POR: ${item.usuario.toUpperCase()}
                        </div>
                    </div>
                    
                    <div style="background: rgba(0,0,0,0.02); padding: 12px; border-radius: 12px; font-family: monospace; font-size: 12px; color: #444; white-space: pre-wrap; line-height: 1.5;">${item.pedido}</div>
                    
                    <button onclick="window.app.recompartilhar('${id}')" style="margin-top: 12px; width: 100%; background: white; border: 1px solid #e5e5ea; border-radius: 12px; padding: 10px; font-size: 12px; font-weight: 700; color: #007aff; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <i data-lucide="share-2" style="width: 14px;"></i> REENVIAR / COMPARTILHAR
                    </button>
                </div>
            `;
        }).join('');

        listaDiv.innerHTML = logs;
        window.lucide.createIcons();

        // Lógica de Recompartilhamento
        window.app.recompartilhar = (id) => {
            const pedido = dados[id].pedido;
            if (navigator.share) {
                navigator.share({ title: 'Pedido Artigiano', text: pedido });
            } else {
                // Fallback para cópia
                navigator.clipboard.writeText(pedido);
                alert("Copiado para a área de transferência!");
            }
        };
    });
}
