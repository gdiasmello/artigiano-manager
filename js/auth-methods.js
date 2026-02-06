import { db } from './firebase-config.js';

export const authMethods = {
    efetuarLogin() {
        this.loginErro = false; 
        const u = this.loginUser.trim().toLowerCase(); 
        const p = String(this.loginPass).trim();

        // SEU ACESSO MESTRE
        if (u === 'gabriel' && p === '1821') {
            this.entrar({ 
                id: 'master', 
                nome: 'Gabriel', 
                user: 'gabriel', 
                pass: '1821', 
                permissoes: { admin: true, sacolao: true, insumos: true, producao: true, gelo: true, checklist: true, bebidas: true, limpeza: true } 
            }); 
            return;
        }

        const user = this.usuarios.find(x => x.user.toLowerCase() === u && String(x.pass) === p);
        if (user) {
            this.entrar(user);
        } else {
            this.loginErro = true; 
            this.msgAuth = "PIN INVÁLIDO"; 
            if(navigator.vibrate) navigator.vibrate(200); 
            setTimeout(() => { this.loginErro = false; }, 500);
        }
    },

    entrar(user) { 
        this.usuarioLogado = user; 
        this.sessaoAtiva = true; 
        localStorage.setItem('artigiano_session_v1', JSON.stringify(user)); 
        this.verificarVersao(); 
    },

    logout() { 
        if(confirm("Tem certeza que deseja sair do App?")) {
            localStorage.removeItem('artigiano_session_v1'); 
            location.reload(); 
        }
    },

    // Esta função controla quais botões aparecem no menu para cada funcionário
    blocosPermitidos() {
        if (!this.usuarioLogado) return [];
        return this.listaTodosBlocos.filter(b => this.usuarioLogado.permissoes && this.usuarioLogado.permissoes[b.id]);
    }
};