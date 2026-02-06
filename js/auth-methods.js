import { db } from './firebase-config.js';

export const authMethods = {
    autenticar() {
        const user = this.usuarios.find(u => 
            u.user.toLowerCase() === this.loginUser.toLowerCase() && 
            u.pass === this.loginPass
        );

        if (user) {
            this.usuarioLogado = user;
            this.sessaoAtiva = true;
            localStorage.setItem('artigiano_session_v1', JSON.stringify(user));
            this.mostrarNotificacao(`Bem-vindo, ${user.nome}!`);
            this.loginErro = false;
        } else {
            this.loginErro = true;
            this.msgAuth = "PIN incorreto ou usuário não cadastrado";
        }
    },

    logout() {
        localStorage.removeItem('artigiano_session_v1');
        location.reload();
    },

    temAcessoBloco(bloco) {
        if (!this.usuarioLogado) return false;
        
        // Se for você ou admin, libera tudo
        if (this.usuarioLogado.user.toLowerCase() === 'gabriel' || this.usuarioLogado.permissoes?.admin) {
            return true;
        }

        const p = this.usuarioLogado.permissoes;
        if (!p) return false;

        // Mapeia os nomes dos blocos para as chaves do seu banco
        if (bloco === 'Sacolão') return p.sacolao;
        if (bloco === 'Insumos') return p.insumos;
        if (bloco === 'Produção') return p.producao;
        
        return false;
    }
};
