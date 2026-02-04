import { render } from "../main.js";

export const Erros = {
    // Tela de Erro Crítico (Sistema Travado)
    exibirErroCritico: (codigo, mensagem) => {
        render(`
            <div style="height: 100vh; background: var(--it-red); color: #fff; padding: 30px; display: flex; flex-direction: column; justify-content: center;">
                <h1 style="font-size: 80px; margin: 0; font-weight: 900;">:(</h1>
                <h2 style="font-size: 24px; font-weight: 900; margin-top: 20px; text-transform: uppercase;">Ocorreu um problema</h2>
                <p style="font-size: 14px; font-weight: 700; line-height: 1.6; opacity: 0.9;">
                    O PiZZA Maser encontrou um erro e precisa ser reiniciado. 
                    Isso pode ser causado por falta de internet ou falha no terminal.
                </p>
                
                <div style="background: rgba(0,0,0,0.2); padding: 15px; margin-top: 20px; border: 1px solid rgba(255,255,255,0.3);">
                    <span style="display: block; font-size: 10px; font-weight: 800;">CÓDIGO DO ERRO:</span>
                    <span style="font-family: monospace; font-size: 12px;">${codigo}</span>
                </div>

                <button onclick="location.reload()" style="margin-top: 40px; height: 60px; background: #fff; border: none; color: var(--it-red); font-weight: 900; text-transform: uppercase;">
                    Reiniciar Terminal
                </button>
            </div>
        `);
    },

    // Notificação de Acesso Negado (Sobreposição)
    notificarAcessoNegado: () => {
        const overlay = document.createElement('div');
        overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(196, 30, 58, 0.95); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; text-align:center; animation: fadeIn 0.2s;";
        overlay.innerHTML = `
            <i data-lucide="shield-alert" style="width:80px; height:80px; margin-bottom:20px;"></i>
            <h2 style="font-weight:900; font-size:30px;">ACESSO NEGADO</h2>
            <p style="font-weight:700;">ESTA ÁREA É RESTRITA AO ADM (GABRIEL)</p>
            <button onclick="this.parentElement.remove()" style="margin-top:30px; padding:15px 40px; background:white; color:var(--it-red); border:none; font-weight:900;">VOLTAR</button>
        `;
        document.body.appendChild(overlay);
        window.lucide.createIcons();
    }
};
