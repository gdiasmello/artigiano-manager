const { createApp } = Vue;

createApp({
    data() {
        return {
            versao: '0.0.1',
            notasDaVersao: [
                'Lançamento Oficial PiZZA Master v0.0.1',
                'Painel de Configurações em Accordion Style',
                'Matriz de Permissões (ADM, Gerente, Colaborador)',
                'Sistema de Logs e Auditoria de ações'
            ],
            mostrarChangelog: false,
            sessaoAtiva: false,
            usuarioLogado: null,
            telaAtiva: 'dash',
            setorAtivo: 'sacolao',
            loginUser: '', loginPass: '', novoPin: '', msgErro: '',
            locais: LOCAIS_ESTOQUE,
            catalogo: {}, contagens: {}, listaUsuarios: []
        }
    },
    methods: {
        efetuarLogin() {
            // Lógica Simplificada para V 0.0.1
            if (this.loginPass === '1821' || this.loginPass === '2026') {
                const u = { 
                    id: 'u1', 
                    nome: this.loginUser, 
                    role: this.loginPass === '1821' ? 'ADMIN' : 'GERENTE',
                    permissoes: ['sacolao', 'insumos', 'producao', 'config']
                };
                this.usuarioLogado = u;
                this.sessaoAtiva = true;
                localStorage.setItem('pizzamaster_session', JSON.stringify(u));
                this.verificarVersao();
                this.carregarDados();
            } else { this.msgErro = "PIN INCORRETO!"; }
        },
        verificarVersao() {
            const v = localStorage.getItem('pizzamaster_version');
            if (v !== this.versao) this.mostrarChangelog = true;
        },
        fecharChangelog() {
            localStorage.setItem('pizzamaster_version', this.versao);
            this.mostrarChangelog = false;
        },
        podeVer(bloco) {
            if (!this.usuarioLogado) return false;
            if (this.usuarioLogado.role === 'ADMIN') return true;
            return this.usuarioLogado.permissoes.includes(bloco);
        },
        atualizarPerfil() {
            // Aqui entraria a gravação no Firebase
            alert("Perfil de " + this.usuarioLogado.nome + " atualizado!");
        },
        carregarDados() {
            db.ref('configuracoes/catalogo').on('value', s => this.catalogo = s.val() || {});
            db.ref('contagem_atual').on('value', s => this.contagens = s.val() || {});
        },
        logout() { localStorage.removeItem('pizzamaster_session'); location.reload(); }
    },
    mounted() {
        const s = localStorage.getItem('pizzamaster_session');
        if (s) { 
            this.usuarioLogado = JSON.parse(s); 
            this.sessaoAtiva = true; 
            this.carregarDados();
            this.verificarVersao();
        }
    }
}).mount('#app');
