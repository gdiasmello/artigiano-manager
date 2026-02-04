import { db, render } from "../main.js";
import { ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export function carregarChecklist() {
    render(`
        <div style="padding: 20px; padding-top: 65px; background: #f2f2f7; min-height: 100vh; padding-bottom: 100px;">
            <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <button onclick="location.reload()" style="background: white; border: none; width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                    <i data-lucide="chevron-left" style="color: #333;"></i>
                </button>
                <h2 style="margin:0; font-size: 20px; font-weight: 900;">Mise en Place</h2>
                <div style="width: 45px;"></div>
            </header>

            <div id="container-checklist">
                <p style="text-align:center; padding: 40px; opacity:0.5;">A sincronizar tarefas...</p>
            </div>
        </div>
    `);

    onValue(ref(db, 'operacao/checklist'), (snap) => {
        const tarefas = snap.val() || {
            abertura: { "Ligar Forno": false, "Limpar Bancadas": false, "Conferir Massas": false },
            fechamento: { "Desligar Gás": false, "Limpar Fatiador": false, "Lixo Fora": false }
        };

        const renderSecao = (titulo, idNode) => `
            <div class="glass-card" style="margin-bottom: 20px;">
                <h3 style="margin-top:0; font-size: 14px; color: #8e8e93; text-transform: uppercase; letter-spacing: 1px;">${titulo}</h3>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${Object.keys(tarefas[idNode]).map(t => `
                        <div onclick="window.app.checkTask('${idNode}', '${t}', ${tarefas[idNode][t]})" 
                             style="display: flex; align-items: center; gap: 12px; padding: 15px; border-radius: 15px; background: ${tarefas[idNode][t] ? 'rgba(0,140,69,0.1)' : 'white'}; border: 1px solid ${tarefas[idNode][t] ? 'var(--it-green)' : 'rgba(0,0,0,0.05)'};">
                            <div style="width: 22px; height: 22px; border-radius: 6px; border: 2px solid ${tarefas[idNode][t] ? 'var(--it-green)' : '#ddd'}; background: ${tarefas[idNode][t] ? 'var(--it-green)' : 'transparent'}; display: flex; align-items: center; justify-content: center;">
                                ${tarefas[idNode][t] ? '<i data-lucide="check" style="color:white; width:14px;"></i>' : ''}
                            </div>
                            <span style="font-weight: 700; font-size: 14px; color: ${tarefas[idNode][t] ? '#8e8e93' : '#1c1c1e'}; text-decoration: ${tarefas[idNode][t] ? 'line-through' : 'none'};">
                                ${t}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.getElementById('container-checklist').innerHTML = `
            ${renderSecao('Abertura da Loja', 'abertura')}
            ${renderSecao('Fechamento da Loja', 'fechamento')}
            <button onclick="window.app.resetChecklist()" style="width:100%; padding: 15px; background: none; border: 1px dashed var(--it-red); color: var(--it-red); border-radius: 15px; font-weight: 800; font-size: 12px; margin-top: 10px;">
                REINICIAR TAREFAS (ADM)
            </button>
        `;
        window.lucide.createIcons();
    });

    window.app.checkTask = (sessao, tarefa, status) => {
        update(ref(db, `operacao/checklist/${sessao}`), { [tarefa]: !status });
        if(navigator.vibrate) navigator.vibrate(40);
    };

    window.app.resetChecklist = () => {
        if(window.app.verificarPermissaoMaster()) {
            if(confirm("Deseja limpar todos os checks para um novo dia?")) {
                const defaultTasks = {
                    abertura: { "Ligar Forno": false, "Limpar Bancadas": false, "Conferir Massas": false, "Repor Cubas": false },
                    fechamento: { "Desligar Gás": false, "Limpar Fatiador": false, "Lixo Fora": false, "Lavar Chão": false }
                };
                update(ref(db, 'operacao/checklist'), defaultTasks);
            }
        }
    };
}
