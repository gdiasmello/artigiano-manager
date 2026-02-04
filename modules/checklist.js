import { db, render } from "../main.js";
import { ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export function carregarChecklist() {
    render(`
        <div style="padding-bottom: 100px; background: #000; min-height: 100vh;">
            <header style="padding: 20px; display: flex; align-items: center; gap: 15px; border-bottom: 2px solid var(--it-purple); background: #0a0a0a;">
                <button onclick="location.reload()" style="background:none; border:none; color:#fff;">
                    <i data-lucide="chevron-left"></i>
                </button>
                <h2 style="margin:0; font-size:18px; font-weight:900; letter-spacing:1px;">MISE EN PLACE</h2>
            </header>

            <div id="container-checklist" style="padding: 15px;">
                <p style="text-align:center; color:#444; margin-top:50px;">Sincronizando tarefas...</p>
            </div>
        </div>
    `);

    onValue(ref(db, 'operacao/checklist'), (snap) => {
        const tarefas = snap.val() || {
            abertura: { "Ligar Forno": false, "Limpar Bancadas": false, "Conferir Massas": false, "Repor Cubas": false },
            fechamento: { "Desligar Gás": false, "Limpar Fatiador": false, "Lixo Fora": false, "Lavar Chão": false }
        };

        const renderSecao = (titulo, idNode) => `
            <div style="margin-bottom: 25px;">
                <h3 style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; padding-left: 5px;">${titulo}</h3>
                <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                    ${Object.keys(tarefas[idNode]).map(t => `
                        <div onclick="window.app.checkTask('${idNode}', '${t}', ${tarefas[idNode][t]})" 
                             style="display: flex; align-items: center; justify-content: space-between; padding: 20px; background: ${tarefas[idNode][t] ? 'rgba(0,140,69,0.2)' : '#111'}; border: 1px solid ${tarefas[idNode][t] ? 'var(--it-green)' : '#222'}; transition: 0.2s;">
                            <span style="font-weight: 800; font-size: 14px; color: ${tarefas[idNode][t] ? '#888' : '#fff'}; text-decoration: ${tarefas[idNode][t] ? 'line-through' : 'none'};">
                                ${t.toUpperCase()}
                            </span>
                            <div style="width: 24px; height: 24px; border: 2px solid ${tarefas[idNode][t] ? 'var(--it-green)' : '#444'}; background: ${tarefas[idNode][t] ? 'var(--it-green)' : 'transparent'}; display: flex; align-items: center; justify-content: center;">
                                ${tarefas[idNode][t] ? '<i data-lucide="check" style="color:#000; width:16px;"></i>' : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.getElementById('container-checklist').innerHTML = `
            ${renderSecao('Abertura da Loja', 'abertura')}
            ${renderSecao('Fechamento da Loja', 'fechamento')}
            
            <button onclick="window.app.resetChecklist()" style="width:100%; padding: 15px; background: none; border: 1px dashed var(--it-red); color: var(--it-red); font-weight: 900; font-size: 11px; margin-top: 20px; text-transform: uppercase;">
                Reiniciar Checklist Diário
            </button>
        `;
        window.lucide.createIcons();
    });

    window.app.checkTask = (sessao, tarefa, status) => {
        window.app.tocarSom('click');
        update(ref(db, `operacao/checklist/${sessao}`), { [tarefa]: !status });
    };

    window.app.resetChecklist = () => {
        if(window.app.verificarPermissaoMaster()) {
            if(confirm("Deseja resetar todas as tarefas?")) {
                const defaultTasks = {
                    abertura: { "Ligar Forno": false, "Limpar Bancadas": false, "Conferir Massas": false, "Repor Cubas": false },
                    fechamento: { "Desligar Gás": false, "Limpar Fatiador": false, "Lixo Fora": false, "Lavar Chão": false }
                };
                update(ref(db, 'operacao/checklist'), defaultTasks);
            }
        }
    };
}
