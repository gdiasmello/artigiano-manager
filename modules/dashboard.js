import { render } from "../main.js";

export function carregarDash(usuario) {
    render(`
        <div style="padding: 20px; padding-top: 65px; padding-bottom: 110px; background: #f2f2f7; min-height: 100vh;">
            
            <div class="glass-welcome" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h2 style="margin:0; font-size: 26px; font-weight: 800; letter-spacing: -1px;">Olá, ${usuario.nome}</h2>
                    <p style="margin:0; font-size: 14px; color: #8e8e93; font-weight: 500;">Pronto para o turno? 🇮🇹</p>
                </div>
                <div style="background: #34c759; color: white; padding: 8px 12px; border-radius: 12px; font-size: 11px; font-weight: 900; text-transform: uppercase;">
                    ON
                </div>
            </div>

            <div class="grid-dashboard">
                
                <div class="card-ios" style="border-bottom: 5px solid #34c759;" onclick="window.app.abrirSacolao()">
                    <i data-lucide="leaf" style="color: #34c759;"></i>
                    <span>Sacolão</span>
                </div>

                <div class="card-ios" style="border-bottom: 5px solid #ffcc00;" onclick="window.app.abrirProducao()">
                    <i data-lucide="scale" style="color: #ffcc00;"></i>
                    <span>Produção</span>
                </div>

                <div class="card-ios" style="border-bottom: 5px solid #007aff;" onclick="window.app.abrirLimpeza()">
                    <i data-lucide="sparkles" style="color: #007aff;"></i>
                    <span>Limpeza</span>
                </div>

                <div class="card-ios" style="border-bottom: 5px solid #8e8e93;" onclick="window.app.abrirInsumos()">
                    <i data-lucide="package" style="color: #8e8e93;"></i>
                    <span>Insumos</span>
                </div>

                <div class="card-ios" style="border-bottom: 5px solid #ff3b30;" onclick="window.app.abrirBebidas()">
                    <i data-lucide="beer" style="color: #ff3b30;"></i>
                    <span>Bebidas</span>
                </div>

                <div class="card-ios" style="border-bottom: 5px solid #af52de;" onclick="window.app.abrirHistorico()">
                    <i data-lucide="scroll-text" style="color: #af52de;"></i>
                    <span>Histórico</span>
                </div>

            </div>

            <nav style="position: fixed; bottom: 25px; left: 20px; right: 20px; height: 75px; background: rgba(255,255,255,0.9); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); border-radius: 38px; display: flex; justify-content: space-around; align-items: center; box-shadow: 0 15px 35px rgba(0,0,0,0.12); border: 1px solid rgba(255,255,255,0.4); z-index: 1001;">
                <i data-lucide="home" style="color: #008C45; width: 30px; height: 30px;"></i>
                
                <div style="background: #CD212A; width: 62px; height: 62px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-top: -35px; border: 5px solid #f2f2f7; box-shadow: 0 8px 20px rgba(205,33,42,0.3);">
                    <i data-lucide="plus" style="color: white; width: 32px; height: 32px;"></i>
                </div>

                <i data-lucide="settings" style="color: #8e8e93; width: 30px; height: 30px;" onclick="window.app.abrirConfig()"></i>
            </nav>
        </div>
    `);
}
