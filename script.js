const firebaseConfig = {
    apiKey: "AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4",
    authDomain: "artigiano-app.firebaseapp.com",
    databaseURL: "https://artigiano-app-default-rtdb.firebaseio.com",
    projectId: "artigiano-app",
    storageBucket: "artigiano-app.firebasestorage.app",
    messagingSenderId: "212218495726",
    appId: "1:212218495726:web:dd6fec7a4a8c7ad572a9ff"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const { createApp } = Vue;

createApp({
    data() {
        return {
            atualizandoApp: false, mostrarNovidades: false,
            sessaoAtiva: false, telaAtiva: null, configAberto: 'DNA',
            usuarioLogado: null, loginUser: '', loginPass: '', msgAuth: '', loginErro: false,
            localAtual: '', contagemAtiva: {}, obsPorItem: {},
            mostrandoResumo: false, textoWhatsApp: '', textoBase: '', itensExtras: '',
            mostrandoHistorico: false, mostrarSucesso: false, mostrandoTermos: false,
            
            listaTodosBlocos: [
                { id: 'sacolao', nome: 'SACOLÃO', icon: 'fas fa-leaf', cor: 'green' },
                { id: 'insumos', nome: 'INSUMOS', icon: 'fas fa-box', cor: 'red' },
                { id: 'producao', nome: 'PRODUÇÃO', icon: 'fas fa-mortar-pestle', cor: 'gold' },
                { id: 'gelo', nome: 'GELO', icon: 'fas fa-cube', cor: 'ice' },
                { id: 'checklist', nome: 'CHECKLIST', icon: 'fas fa-clipboard-check', cor: 'temp' },
                { id: 'bebidas', nome: 'BEBIDAS', icon: 'fas fa-wine-bottle', cor: 'purple' },
                { id: 'limpeza', nome: 'LIMPEZA', icon: 'fas fa-hands-bubbles', cor: 'blue' }
            ],
            
            novoInsumo: { nome: '', un_contagem: '', un_pedido: '', tipo_calculo: 'direto', fator: 1, meta: 0, bloco: '', locais: [] },
            config: { rota: ['Geral'], destinos: {} },
            catalogoDNA: [], usuarios: [], historico: []
        }
    },
    computed: {
        tituloTela() {
            if(this.telaAtiva === 'config') return 'AJUSTES';
            const b = this.listaTodosBlocos.find(x => x.id === this.telaAtiva);
            return b ? b.nome : 'PIZZA MASTER';
        },
        blocosVisiveis() {
            if(!this.usuarioLogado) return [];
            return this.listaTodosBlocos.filter(b => this.usuarioLogado.permissoes?.[b.id] || this.usuarioLogado.permissoes?.admin);
        },
        itensDoSetor() {
            return this.catalogoDNA.filter(i => i.bloco === this.telaAtiva);
        }
    },
    methods: {
        // --- AUTH ---
        efetuarLogin() {
            const u = this.loginUser.trim().toLowerCase();
            const p = String(this.loginPass).trim();
            if(u === 'gabriel' && p === '1821') {
                this.entrar({ nome: 'Gabriel', user: 'gabriel', permissoes: { admin: true } });
                return;
            }
            const user = this.usuarios.find(x => x.user.toLowerCase() === u && String(x.pass) === p);
            if(user) this.entrar(user);
            else { this.loginErro = true; this.msgAuth = "PIN INCORRETO"; setTimeout(()=>this.loginErro=false, 500); }
        },
        entrar(u) {
            this.usuarioLogado = u; this.sessaoAtiva = true;
            localStorage.setItem('artigiano_session_v1', JSON.stringify(u));
        },
        logout() { localStorage.removeItem('artigiano_session_v1'); location.reload(); },

        // --- ESTOQUE (Suas lógicas de cálculo) ---
        abrirBloco(id) {
            this.telaAtiva = id;
            this.localAtual = this.config.rota[0];
            this.config.rota.forEach(l => {
                if(!this.contagemAtiva[l]) this.contagemAtiva[l] = {};
            });
        },
        voltarInicio() { this.telaAtiva = null; },

        gerarResumo() {
            let estoqueTotal = {};
            this.config.rota.forEach(l => {
                for(let item in this.contagemAtiva[l]) {
                    estoqueTotal[item] = (estoqueTotal[item] || 0) + this.contagemAtiva[l][item];
                }
            });

            let corpo = `*PEDIDO ${this.telaAtiva.toUpperCase()}*\n\n`;
            this.itensDoSetor.forEach(dna => {
                const estoque = estoqueTotal[dna.nome] || 0;
                if(dna.meta > estoque) {
                    const falta = dna.meta - estoque;
                    let qtd = dna.tipo_calculo === 'cx' ? Math.ceil(falta/dna.fator) : falta;
                    corpo += `• ${qtd} ${dna.un_pedido || dna.un_contagem} ${dna.nome}\n`;
                }
            });
            this.textoWhatsApp = corpo;
            this.mostrandoResumo = true;
        },

        enviarWhatsApp() {
            const tel = this.config.destinos[this.telaAtiva] || '554399999999';
            window.open(`https://api.whatsapp.com/send?phone=${tel}&text=${encodeURIComponent(this.textoWhatsApp)}`);
        },

        // --- FIREBASE SYNC ---
        sincronizar() {
            db.ref('usuarios').on('value', s => { const d=s.val(); this.usuarios = d ? Object.keys(d).map(k=>({...d[k], id:k})) : []; });
            db.ref('catalogoDNA').on('value', s => { const d=s.val(); this.catalogoDNA = d ? Object.keys(d).map(k=>({...d[k], id:k})) : []; });
            db.ref('config').on('value', s => { this.config = s.val() || this.config; });
        },
        exibirSucesso() { this.mostrarSucesso = true; setTimeout(()=>this.mostrarSucesso=false, 1500); }
    },
    mounted() {
        this.sincronizar();
        const s = localStorage.getItem('artigiano_session_v1');
        if(s) { this.usuarioLogado = JSON.parse(s); this.sessaoAtiva = true; }
    }
}).mount('#app');