import { render } from "../main.js";

export function carregarDash(usuario) {
    render(`
        <div style="padding: 20px; padding-top: 60px; padding-bottom: 100px; background: #f2f2f7; min-height: 100vh;">
            
            <div class="glass-card" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; background: rgba(255,255,255,0.9);">
                <h2 style="margin:0; font-size: 28px; font-weight: 700;">Olá, ${usuario.nome}</h2>
                <div style="background: #34c759; color: white; padding: 6px 12px; border-radius: 10px; font-size: 12px; font-weight: bold; display: flex; align-items: center; gap: 5px;">
                    Feriado Ativo <i data-lucide="power" style="width:12px;"></i>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="card-ios" style="border: 3px solid #34c759;" onclick="window.app.abrirSacolao()">
                    <i data-lucide="leaf" style="color: #34c759;"></i><span>Sacolão</span>
                </div>
                <div class="card-ios" style="border: 3px solid #ffcc00;" onclick="window.app.abrirProducao()">
                    <i data-lucide="scale" style="color: #ffcc00;"></i><span>Produção</span>
                </div>
                <div class="card-ios" style="border: 3px solid #007aff;" onclick="window.app.abrirLimpeza()">
                    <i data-lucide="sparkles" style="color: #007aff;"></i><span>Limpeza</span>
                </div>
                <div class="card-ios" style="border: 3px solid #8e8e93;" onclick="window.app.abrirInsumos()">
                    <i data-lucide="package" style="color: #8e8e93;"></i><span>Insumos</span>
                </div>
                <div class="card-ios" style="border: 3px solid #ff3b30;" onclick="window.app.abrirBebidas()">
                    <i data-lucide="beer" style="color: #ff3b30;"></i><span>Bebidas</span>
                </div>
                <div class="card-ios" style="border: 3px solid #af52de;" onclick="window.app.abrirHistorico()">
                    <i data-lucide="scroll-text" style="color: #af52de;"></i><span>Histórico</span>
                </div>
            </div>

            <nav style="position: fixed; bottom: 20px; left: 20px; right: 20px; height: 70px; background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); border-radius: 35px; display: flex; justify-content: space-around; align-items: center; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                <i data-lucide="home" style="color: #000; width: 28px;"></i>
                <div style="background: #f2f2f7; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-top: -30px; border: 4px solid #f2f2f7;">
                    <i data-lucide="shopping-cart" style="color: #333;"></i>
                    <span style="position: absolute; top: 12px; right: 12px; background: #ff3b30; color: white; border-radius: 50%; width: 16px; height: 16px; font-size: 10px; display: flex; align-items: center; justify-content: center;">3</span>
                </div>
                <i data-lucide="settings" style="color: #8e8e93; width: 28px;" onclick="window.app.abrirConfig()"></i>
            </nav>
        </div>
    `);
}
