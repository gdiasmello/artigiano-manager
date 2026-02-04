// script.js
const { createApp } = Vue;

createApp({
    data() {
        return {
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
                const user = { 
                    nome: this.loginUser, 
                    role: this.loginPass === '1821' ? 'ADMIN' : 'OPERADOR' 
                };
                this.usuarioLogado = user;
                this.sessaoAtiva = true;
                localStorage.setItem('pizzamaster_session', JSON.stringify(user));
                this.carregarDados();
            } else {
                this.msgErro = "PIN INVÁLIDO!";
            }
        },
        logout() {
            localStorage.removeItem('pizzamaster_session');
            location.reload();
        },
        carregarDados() {
            db.ref('configuracoes/catalogo').on('value', s => this.catalogo = s.val() || {});
            db.ref('contagem_atual').on('value', s => this.contagens = s.val() || {});
            db.ref('configuracoes/modoFeriado').on('value', s => this.modoFeriado = s.val() || false);
        },
        abrirSetor(s) {
            this.setorAtivo = s;
            this.telaAtiva = 'contagem';
        },
        salvarContagem(setor, itemId, local, valor) {
            db.ref(`contagem_atual/${setor}/${itemId}/${local}`).set(parseFloat(valor) || 0);
        },
        totalNoEstoque(setor, itemId) {
            if (!this.contagens[setor] || !this.contagens[setor][itemId]) return 0;
            return Object.values(this.contagens[setor][itemId]).reduce((a, b) => a + b, 0);
        },
        calcularSugestao(item, id) {
            let meta = parseFloat(item.meta);
            const estoque = this.totalNoEstoque(item.setor, id);
            if (this.modoFeriado) meta *= 1.5;
            const falta = meta - estoque;
            return falta > 0 ? Math.ceil(falta / parseFloat(item.fator)) : 0;
        }
    },
    mounted() {
        const s = localStorage.getItem('pizzamaster_session');
        if (s) {
            this.usuarioLogado = JSON.parse(s);
            this.sessaoAtiva = true;
            this.carregarDados();
        }
    }
}).mount('#app');
