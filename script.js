const { createApp } = Vue;

createApp({
    data() {
        return {
            versao: '0.0.1',
            notasDaVersao: [
                'Nova Tela de Login Premium v0.0.1',
                'Design centralizado com efeito glassmorphism',
                'Sistema automático de avisos de atualização',
                'Estrutura de permissões ADM/Gerente preparada'
            ],
            mostrarChangelog: false,
            loadingAuth: false,
            sessaoAtiva: false,
            usuarioLogado: null,
            telaAtiva: 'dash',
            setorAtivo: 'sacolao',
            loginUser: '', loginPass: '', msgErro: '',
            locais: LOCAIS_ESTOQUE,
            catalogo: {}, contagens: {}
        }
    },
    methods: {
        efetuarLogin() {
            if (!this.loginUser || !this.loginPass) {
                this.msgErro = "Preencha todos os campos!";
                return;
            }
            this.loadingAuth = true;
            
            // Simulação de delay para efeito visual
            setTimeout(() => {
                if (this.loginPass === '1821' || this.loginPass === '2026') {
                    const u = { 
                        nome: this.loginUser, 
                        role: this.loginPass === '1821' ? 'ADMIN' : 'GERENTE' 
                    };
                    this.usuarioLogado = u;
                    this.sessaoAtiva = true;
                    localStorage.setItem('pizzamaster_session', JSON.stringify(u));
                    this.carregarDados();
                    this.verificarVersao();
                } else {
                    this.msgErro = "PIN INVÁLIDO!";
                }
                this.loadingAuth = false;
            }, 800);
        },
        verificarVersao() {
            const v = localStorage.getItem('pizzamaster_version');
            if (v !== this.versao) this.mostrarChangelog = true;
        },
        fecharChangelog() {
            localStorage.setItem('pizzamaster_version', this.versao);
            this.mostrarChangelog = false;
        },
        logout() {
            localStorage.removeItem('pizzamaster_session');
            location.reload();
        },
        carregarDados() {
            db.ref('configuracoes/catalogo').on('value', s => this.catalogo = s.val() || {});
            db.ref('contagem_atual').on('value', s => this.contagens = s.val() || {});
        },
        abrirSetor(s) {
            this.setorAtivo = s;
            this.telaAtiva = 'contagem';
        }
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
