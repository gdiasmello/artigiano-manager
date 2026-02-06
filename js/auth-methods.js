import { db } from './firebase-config.js';

export const authMethods = {
    autenticar() {
        // Busca o usuário na lista que veio do Firebase
        const user = this.usuarios.find(u => 
            u.user.toLowerCase() === this.loginUser.toLowerCase() && 
            u.pass === this.loginPass
        );

        if (user) {
            this.usuarioLogado = user;
            this.sessaoAtiva = true;
            localStorage.setItem('artigiano_session_v1', JSON.stringify(user));
            this.mostrarNotificacao(`Bem-vindo, ${user.nome}!`, 'success', 'fas fa-check');
            this.loginErro = false;
        } else {
            this.loginErro = true;
            this.msgAuth = "PIN incorreto ou usuário não encontrado";
        }
    },

    logout() {
        localStorage.removeItem('artigiano_session_v1');
        location.reload();
    },

    // ESTA É A PARTE QUE VOCÊ PERGUNTOU:
    temAcessoBloco(nomeBloco) {
        if (!this.usuarioLogado) return false;

        // 1. Se o seu nome for Gabriel (como no original) ou tiver flag admin, libera TUDO
        if (this.usuarioLogado.user.toLowerCase() === 'gabriel' || 
            this.usuarioLogado.permissoes?.admin === true) {
            return true;
        }

        // 2. Para os outros funcionários, verifica a regra do cargo deles
        const cargo = this.usuarioLogado.cargo;
        return this.permissoesGlobais[cargo]?.blocos?.includes(nomeBloco);
    },

    criarUsuario() {
        if (!this.novoUser.user || !this.novoUser.pass) return;
        
        // Salva com a estrutura que o seu original esperava
        db.ref('usuarios').push({
            nome: this.novoUser.nome,
            user: this.novoUser.user,
            pass: this.novoUser.pass,
            cargo: this.novoUser.cargo,
            permissoes: { 
                admin: false, // Só você é admin por padrão
                sacolao: true, 
                insumos: true 
            }
        });
        
        this.mostrandoNovoUsuario = false;
        this.novoUser = { nome: '', user: '', pass: '', cargo: 'pizzaiolo' };
        this.mostrarNotificacao('Funcionário cadastrado!', 'success', 'fas fa-user-plus');
    }
};
