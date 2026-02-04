const { createApp } = Vue;

createApp({
    data() {
        return {
            versao: '0.0.1',
            notasDaVersao: [
                'Novo design centralizado PiZZA Master v0.0.1',
                'Sistema de 6 locais de estoque (Freezers, Quartinho, etc)',
                'Logística Preditiva com arredondamento automático',
                'Painel de novidades integrado'
            ],
            mostrarChangelog: false,
            sessaoAtiva: false, 
            usuarioLogado: null, 
            telaAtiva: 'dash', 
            setorAtivo: 'sacolao',
            loginUser: '', 
            loginPass: '', 
            msgErro: '', 
            locais: LOCAIS_ESTOQUE,
            catalogo: {}, 
            contagens: {}, 
            modoFeriado: false
        }
    },
    methods: {
        efetuarLogin() {
            if (this.loginPass === '1821' || this.loginPass === '2026') {
                const u = { nome: this.loginUser, role: this.loginPass === '1821'?'ADMIN':'OPERADOR' };
                this.usuarioLogado = u;
                this.sessaoAtiva = true;
                localStorage.setItem('pizzamaster_session', JSON.stringify(u));
                this.carregarDados();
                this.verificarVersao();
            } else { this.msgErro = "PIN INVÁLIDO!"; }
        },
        verificarVersao() {
            const ultimaVersaoVista = localStorage.getItem('pizzamaster_version');
            if (ultimaVersaoVista !== this.versao) {
                this.mostrarChangelog = true;
            }
        },
        fecharChangelog() {
            localStorage.setItem('pizzamaster_version', this.versao);
            this.mostrarChangelog = false;
        },
        logout() { localStorage.removeItem('pizzamaster_session'); location.reload(); },
        carregarDados() {
            db.ref('configuracoes/catalogo').on('value', s => this.catalogo = s.val() || {});
            db.ref('contagem_atual').on('value', s => this.contagens = s.val() || {});
        },
        abrirSetor(s) { this.setorAtivo = s; this.telaAtiva = 'contagem'; },
        salvarContagem(setor, itemId, local, valor) {
            db.ref(`contagem_atual/${setor}/${itemId}/${local}`).set(parseFloat(valor) || 0);
        },
        getVal(setor, itemId, local) {
            try { return this.contagens[setor][itemId][local] || ''; } catch(e) { return ''; }
        },
        totalNoEstoque(setor, itemId) {
            if (!this.contagens[setor] || !this.contagens[setor][itemId]) return 0;
            return Object.values(this.contagens[setor][itemId]).reduce((a, b) => a + b, 0);
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
