import { db } from './firebase-config.js';

export const authMethods = {
    // Tenta validar o usuário e criar a sessão no celular
    autenticar() {
        const user = this.usuarios.find(u => u.user === this.loginUser && u.pass === this.loginPass);
        if (user) {
            this.usuarioLogado = user;
            this.sessaoAtiva = true;
            localStorage.setItem('artigiano_session_v1', JSON.stringify(user));
            this.mostrarNotificacao(`Bem-vindo, ${user.nome}!`, 'success', 'fas fa-check');
            this.loginErro = false;
        } else {
            this.loginErro = true;
            this.msgAuth = "PIN incorreto ou usuário inválido";
        }
    },

    // Sai do sistema e limpa o celular
    logout() {
        localStorage.removeItem('artigiano_session_v1');
        location.reload();
    },

    // Adiciona um novo funcionário ao Firebase com o cargo escolhido
    criarUsuario() {
        if (!this.novoUser.nome || !this.novoUser.user || !this.novoUser.pass) {
            this.mostrarNotificacao('Preencha todos os campos!', 'error', 'fas fa-exclamation-triangle');
            return;
        }
        
        db.ref('usuarios').push({
            nome: this.novoUser.nome,
            user: this.novoUser.user,
            pass: this.novoUser.pass,
            cargo: this.novoUser.cargo
        });

        this.mostrandoNovoUsuario = false;
        this.novoUser = { nome: '', user: '', pass: '', cargo: 'pizzaiolo' };
        this.mostrarNotificacao('Membro cadastrado!', 'success', 'fas fa-user-plus');
    },

    // Salva quais blocos cada cargo pode ver (Configurações)
    salvarPermissoesCargo() {
        db.ref('config/permissoesCargos').set(this.permissoesGlobais);
        this.mostrarNotificacao('Regras de acesso salvas!', 'success', 'fas fa-shield-alt');
    },

    // Função que decide se o botão aparece ou não no menu
    temAcessoBloco(nomeBloco) {
        if (!this.usuarioLogado) return false;
        
        // Se o usuário tiver a flag "admin" no banco, ele vê TUDO
        if (this.usuarioLogado.permissoes?.admin) return true;
        
        const cargo = this.usuarioLogado.cargo;
        // Verifica se o bloco (ex: 'Sacolão') está na lista permitida do cargo dele
        return this.permissoesGlobais[cargo]?.blocos?.includes(nomeBloco);
    }
};
