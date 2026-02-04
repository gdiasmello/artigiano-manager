import { db, render } from "../main.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export function carregarConfig() {
    render(`
        <div class="glass-card" style="margin-top: 20px;">
            <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <button onclick="location.reload()" style="background:none; border:none; font-size: 20px;">🔙</button>
                <h2 style="margin:0;">Configurações</h2>
                <div></div>
            </header>

            <button class="btn-primary" style="background:#007aff; margin-bottom:20px;" onclick="window.app.abrirGestaoItens()">
                📦 Editar Itens do Sacolão
            </button>

            <section style="text-align: left; margin-bottom: 25px;">
                <h3 style="font-size: 16px; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 5px;">👥 Cadastrar Funcionário</h3>
                <input type="text" id="new-user-name" placeholder="Nome">
                <input type="number" id="new-user-pin" placeholder="PIN (4 dígitos)" maxlength="4" inputmode="numeric">
                <select id="new-user-role" style="width:100%; padding:15px; border-radius:15px; border:none; background:white; margin-bottom:10px; font-size:16px;">
                    <option value="pizzaiolo">Pizzaiolo</option>
                    <option value="gerente">Gerente</option>
                </select>
                <button class="btn-primary" onclick="window.app.salvarUsuario()">Salvar PIN</button>
            </section>
        </div>
    `);

    window.app.salvarUsuario = async () => {
        const nome = document.getElementById('new-user-name').value;
        const pin = document.getElementById('new-user-pin').value;
        const cargo = document.getElementById('new-user-role').value;
        if(!nome || pin.length !== 4) return alert("Preenche corretamente!");
        try {
            await set(ref(db, 'usuarios/' + nome.toLowerCase()), { nome, pin, cargo });
            alert("Utilizador " + nome + " cadastrado!");
            carregarConfig();
        } catch (e) { alert("Erro ao guardar."); }
    };
}
