import { db, render } from "../main.js";
import { ref, onValue, query, limitToLast } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export function carregarHistorico() {
    render(`
        <div class="glass-card" style="margin-top: 20px;">
            <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <button onclick="location.reload()" style="background:none; border:none; font-size: 20px;">🔙</button>
                <h2 style="margin:0;">Histórico de Pedidos</h2>
                <div></div>
            </header>
            <div id="lista-historico" style="text-align: left; max-height: 450px; overflow-y: auto; padding-right: 5px;">
                Carregando histórico...
            </div>
        </div>
    `);

    const histRef = query(ref(db, 'historico'), limitToLast(20));
    
    onValue(histRef, (snapshot) => {
        const dados = snapshot.val();
        const listaDiv = document.getElementById('lista-historico');
        
        if (!dados) {
            listaDiv.innerHTML = "<p style='text-align:center; opacity:0.5;'>Nenhum pedido registrado ainda.</p>";
            return;
        }

        // Converter objeto em array e inverter para mostrar o mais novo primeiro
        const listaOrdenada = Object.values(dados).reverse();

        listaDiv.innerHTML = listaOrdenada.map(item => `
            <div style="background:white; padding:15px; border-radius:15px; margin-bottom:12px; border-left: 5px solid #af52de;">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <small style="font-weight:bold; color:#af52de;">${item.data}</small>
                </div>
                <div style="white-space: pre-wrap; font-size: 13px; color: #333; line-height: 1.4;">${item.pedido}</div>
            </div>
        `).join('');
    });
}
