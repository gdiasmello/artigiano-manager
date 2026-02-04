import { db, render } from "../main.js";
import { ref, onValue, push, remove, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export function carregarFornecedores() {
    render(`
        <div style="padding: 20px; padding-top: 65px; background: #f2f2f7; min-height: 100vh; font-family: -apple-system, sans-serif;">
            
            <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <button onclick="location.reload()" style="background: white; border: none; width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                    <i data-lucide="chevron-left" style="color: #333;"></i>
                </button>
                <h2 style="margin:0; font-size: 22px; font-weight: 800; color: #1c1c1e;">Fornecedores</h2>
                <div style="width: 45px;"></div>
            </header>

            <div class="glass-card" style="margin-bottom: 30px; border-top: 5px solid #25D366;">
                <h3 style="margin-top:0; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="user-plus" style="width: 18px; color: #25D366;"></i> Novo Contacto
                </h3>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <input type="text" id="forn-nome" placeholder="Nome (Ex: Distribuidora Silva)">
                    <input type="tel" id="forn-tel" placeholder="WhatsApp (Ex: 43999999999)" inputmode="tel">
                    
                    <div style="background: rgba(0,0,0,0.03); padding: 12px; border-radius: 15px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span style="display:block; font-weight:700; font-size: 14px;">Regra de Sexta-feira</span>
                            <small style="color: #8e8e93;">Triplicar metas (3x) no fim de semana</small>
                        </div>
                        <label class="ios-switch">
                            <input type="checkbox" id="forn-sexta">
                            <span class="slider"></span>
                        </label>
                    </div>

                    <button class="btn-primary" onclick="window.app.salvarFornecedor()" style="background: #25D366; box-shadow: 0 8px 15px rgba(37, 211, 102, 0.2);">
                        CADASTRAR FORNECEDOR
                    </button>
                </div>
            </div>

            <div id="lista-fornecedores" style="display: flex; flex-direction: column; gap: 12px;">
                <p style="text-align: center; color: #8e8e93;">Carregando fornecedores...</p>
            </div>
        </div>
    `);

    const listaDiv = document.getElementById('lista-fornecedores');

    // Listagem em Tempo Real
    onValue(ref(db, 'configuracoes/fornecedores'), (snap) => {
        const forns = snap.val();
        if (!forns) { listaDiv.innerHTML = "<p style='text-align:center; opacity:0.5;'>Nenhum fornecedor cadastrado.</p>"; return; }

        listaDiv.innerHTML = Object.keys(forns).map(id => `
            <div class="glass-card" style="display: flex; justify-content: space-between; align-items: center; padding: 15px;">
                <div>
                    <strong style="display: block; font-size: 16px;">${forns[id].nome}</strong>
                    <div style="display: flex; gap: 10px; margin-top: 4px;">
                        <small style="color: #25D366; font-weight: 700;"><i data-lucide="phone" style="width:10px; height:10px;"></i> ${forns[id].telefone}</small>
                        ${forns[id].regraSexta ? '<small style="color: #ff9500; font-weight: 700;">● Regra 3x Ativa</small>' : ''}
                    </div>
                </div>
                <button onclick="window.app.excluirFornecedor('${id}')" style="background: #fff1f0; border: none; width: 35px; height: 35px; border-radius: 10px; color: #ff3b30;">
                    <i data-lucide="user-minus" style="width: 18px;"></i>
                </button>
            </div>
        `).join('');
        window.lucide.createIcons();
    });

    // Lógica de Salvar
    window.app.salvarFornecedor = () => {
        const nome = document.getElementById('forn-nome').value;
        const telefone = document.getElementById('forn-tel').value;
        const regraSexta = document.getElementById('forn-sexta').checked;

        if (!nome || !telefone) return alert("Nome e Telefone são obrigatórios!");

        const novoForn = {
            nome,
            telefone: telefone.replace(/\D/g, ''), // Remove parênteses e traços
            regraSexta
        };

        push(ref(db, 'configuracoes/fornecedores'), novoForn);
        
        // Limpar campos
        document.getElementById('forn-nome').value = '';
        document.getElementById('forn-tel').value = '';
        document.getElementById('forn-sexta').checked = false;
    };

    window.app.excluirFornecedor = (id) => {
        if (confirm("Remover este fornecedor? Isso afetará os itens vinculados a ele.")) {
            remove(ref(db, `configuracoes/fornecedores/${id}`));
        }
    };

    window.lucide.createIcons();
}
