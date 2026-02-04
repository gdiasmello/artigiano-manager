import { db, render } from "../main.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export async function carregarCheckout() {
    render(`
        <div style="padding-bottom: 100px; background: #000; min-height: 100vh;">
            <header style="padding: 20px; border-bottom: 2px solid var(--it-red); background: #0a0a0a;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <button onclick="location.reload()" style="background:none; border:none; color:#fff;">
                        <i data-lucide="chevron-left"></i>
                    </button>
                    <h2 style="margin:0; font-size:18px; font-weight:900; letter-spacing:1px;">PEDIDO DE COMPRA</h2>
                    <i data-lucide="truck" style="color:var(--it-red);"></i>
                </div>
            </header>

            <div id="container-pedido" style="padding: 15px;">
                <p style="text-align:center; color:#444; margin-top:50px;">Processando Logística Preditiva...</p>
            </div>
        </div>
    `);

    // Busca dados para o cálculo
    const configSnap = await get(ref(db, 'configuracoes'));
    const contagemSnap = await get(ref(db, 'contagem_atual'));
    
    const config = configSnap.val() || {};
    const catalogo = config.catalogo || {};
    const contagemGeral = contagemSnap.val() || {};
    const modoFeriado = config.modoFeriado || false;

    let htmlItens = "";
    const hoje = new Date();
    const eSexta = hoje.getDay() === 5;

    Object.keys(catalogo).forEach(id => {
        const item = catalogo[id];
        let metaFinal = parseFloat(item.meta);

        // Aplicação dos Multiplicadores Dinâmicos
        if (modoFeriado) metaFinal *= 1.5;
        else if (eSexta && item.setor === 'sacolao') metaFinal *= 3;

        // Soma de todos os locais de armazenamento para este item
        let totalEstoque = 0;
        if (contagemGeral[item.setor] && contagemGeral[item.setor][id]) {
            const locais = contagemGeral[item.setor][id];
            totalEstoque = Object.values(locais).reduce((a, b) => a + (parseFloat(b) || 0), 0);
        }

        const emFalta = metaFinal - totalEstoque;

        if (emFalta > 0) {
            // A FÓRMULA MESTRA: Arredondamento por Teto (Ceil)
            const fator = parseFloat(item.fator) || 1;
            const quantidadePedir = Math.ceil(emFalta / fator);

            htmlItens += `
                <div class="tile bg-dark" style="aspect-ratio: auto; margin-bottom: 10px; border-left: 4px solid var(--it-red); padding: 15px; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
                    <div style="text-align: left;">
                        <strong style="display: block; font-size: 16px;">${item.nome}</strong>
                        <small style="color: #666; font-size: 10px;">TEM: ${totalEstoque}${item.unidade} | META: ${metaFinal}${item.unidade}</small>
                    </div>
                    <div style="text-align: right;">
                        <span style="display: block; font-size: 22px; font-weight: 900; color: var(--it-red);">${quantidadePedir}</span>
                        <small style="font-size: 9px; font-weight: 800; color: #444;">${item.uCompra || 'UN'}</small>
                    </div>
                </div>
            `;
        }
    });

    document.getElementById('container-pedido').innerHTML = htmlItens || `
        <div style="text-align:center; padding: 40px;">
            <i data-lucide="check-circle" style="width:48px; height:48px; color:var(--it-green); margin-bottom:10px;"></i>
            <p style="font-weight:900;">ESTOQUE COMPLETO!</p>
            <p style="font-size:12px; color:#444;">Nenhuma compra necessária no momento.</p>
        </div>
    `;
    
    window.lucide.createIcons();
}
