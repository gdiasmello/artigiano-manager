import { db, render } from "../main.js";
import { ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export function carregarDash(user) {
    render(`
        <div style="padding: 20px; padding-top: 60px; min-height: 100vh; background: #f2f2f7;">
            <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <div>
                    <h1 style="margin:0; font-size: 26px; font-weight: 900;">Olá, ${user.nome}</h1>
                    <p style="margin:0; color: #8e8e93; font-weight: 600;">Artigiano Londrina</p>
                </div>
                <button id="btn-feriado" onclick="window.app.toggleFeriado()" style="border:none; border-radius:12px; padding: 8px 12px; font-weight:800; font-size:11px;">
                    CARREGANDO...
                </button>
            </header>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 100px;">
                <div class="glass-card active-press" onclick="window.app.abrirGestaoItens('sacolao')" style="border-left: 6px solid #34c759; text-align:center;">
                    <i data-lucide="leaf" style="color:#34c759; margin-bottom:10px;"></i>
                    <span style="display:block; font-weight:800;">Sacolão</span>
                </div>
                <div class="glass-card active-press" onclick="window.app.abrirGestaoItens('insumos')" style="border-left: 6px solid #ffcc00; text-align:center;">
                    <i data-lucide="box" style="color:#ffcc00; margin-bottom:10px;"></i>
                    <span style="display:block; font-weight:800;">Insumos</span>
                </div>
                <div class="glass-card active-press" onclick="window.app.abrirChecklist()" style="border-left: 6px solid #5856d6; text-align:center;">
                    <i data-lucide="list-checks" style="color:#5856d6; margin-bottom:10px;"></i>
                    <span style="display:block; font-weight:800;">Check-list</span>
                </div>
                <div class="glass-card active-press" onclick="window.app.abrirHistorico()" style="border-left: 6px solid #af52de; text-align:center;">
                    <i data-lucide="file-text" style="color:#af52de; margin-bottom:10px;"></i>
                    <span style="display:block; font-weight:800;">Histórico</span>
                </div>
            </div>

            <nav style="position:fixed; bottom:0; left:0; right:0; height:85px; background: rgba(255,255,255,0.8); backdrop-filter:blur(15px); display:flex; justify-content:space-around; align-items:center; border-top:1px solid rgba(0,0,0,0.05); padding-bottom: env(safe-area-inset-bottom);">
                <i data-lucide="home" style="color:#008C45;"></i>
                <div onclick="window.app.abrirCarrinho()" style="width:60px; height:60px; background:#008C45; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-top:-35px; box-shadow:0 10px 20px rgba(0,140,69,0.3);">
                    <i data-lucide="shopping-cart" style="color:white;"></i>
                </div>
                <i data-lucide="settings" onclick="window.app.abrirFornecedores()"></i>
            </nav>
        </div>
    `);

    // Monitor do Modo Feriado
    onValue(ref(db, 'configuracoes/modoFeriado'), (snap) => {
        const ativo = snap.val();
        const btn = document.getElementById('btn-feriado');
        if(btn) {
            btn.innerText = ativo ? "FERIADO ATIVO ⚡" : "MODO NORMAL";
            btn.style.background = ativo ? "#ff9500" : "#e5e5ea";
            btn.style.color = ativo ? "white" : "#8e8e93";
        }
    });

    window.app.toggleFeriado = () => {
        const status = document.getElementById('btn-feriado').innerText.includes("ATIVO");
        update(ref(db, 'configuracoes'), { modoFeriado: !status });
    };
}
