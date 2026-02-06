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
            versionNum: '1.8.0',
            versionName: 'Gestão Premium',
            sessaoAtiva: false, telaAtiva: null, configAberto: 'DNA',
            usuarioLogado: null, loginUser: '', loginPass: '', msgAuth: '', loginErro: false,
            localAtual: '', contagemAtiva: {}, obsPorItem: {}, 
            mostrandoResumo: false, textoWhatsApp: '', itensExtras: '',
            mostrarSucesso: false, mostrandoHistorico: false,
            
            listaTodosBlocos: [
                { id: 'sacolao', nome: 'SACOLÃO', icon: 'fas fa-leaf', cor: 'green' },
                { id: 'insumos', nome: 'INSUMOS', icon: 'fas fa-box', cor: 'red' },
                { id: 'producao', nome: 'PRODUÇÃO', icon: 'fas fa-mortar-pestle', cor: 'gold' },
                { id: 'gelo', nome: 'GELO', icon: 'fas fa-cube', cor: 'ice' },
                { id: 'checklist', nome: 'CHECKLIST', icon: 'fas fa-clipboard-check', cor: 'temp' },
                { id: 'bebidas', nome: 'BEBIDAS', icon: 'fas fa-wine-bottle', cor: 'purple' },
                { id: 'limpeza', nome: 'LIMPEZA', icon: 'fas fa-hands-bubbles', cor: 'blue' }
            ],
            
            config: { rota: ['Geral'], destinos: {}, checklist: [] },
            catalogoDNA: [], usuarios: [], historico: [],
            novoInsumo: { nome: '', un_contagem: '', un_pedido: '', tipo_calculo: 'direto', fator: 1, meta: 0, bloco: '' }
        }
    },
    methods: {
        efetuarLogin() {
            this.msgAuth = "";
            const u = this.loginUser.trim().toLowerCase();
            const p = String(this.loginPass).trim();

            if (u === 'gabriel' && p === '1821') {
                this.entrar({ nome: 'Gabriel', user: 'gabriel', permissoes: { admin: true } });
                return;
            }

            const user = this.usuarios.find(x => x.user.toLowerCase() === u && String(x.pass) === p);
            if (user) {
                this.entrar(user);
            } else {
                this.loginErro = true;
                this.msgAuth = "PIN INCORRETO";
                setTimeout(() => this.loginErro = false, 500);
            }
        },
        entrar(u) {
            this.usuarioLogado = u;
            this.sessaoAtiva = true;
            localStorage.setItem('artigiano_session_v1', JSON.stringify(u));
        },
        logout() {
            localStorage.removeItem('artigiano_session_v1');
            location.reload();
        },
        abrirBloco(id) {
            this.telaAtiva = id;
            if(!this.contagemAtiva[this.localAtual]) this.contagemAtiva[this.localAtual] = {};
        },
        // Adicione aqui suas funções de gerarResumo() e enviarWhatsApp() que te passei anteriormente
        exibirSucesso() {
            this.mostrarSucesso = true;
            setTimeout(() => this.mostrarSucesso = false, 1500);
        },
        sincronizar() {
            db.ref('usuarios').on('value', s => { const d=s.val(); this.usuarios = d ? Object.keys(d).map(k=>({...d[k], id:k})) : []; });
            db.ref('catalogoDNA').on('value', s => { const d=s.val(); this.catalogoDNA = d ? Object.keys(d).map(k=>({...d[k], id:k})) : []; });
            db.ref('config').on('value', s => { if(s.val()) this.config = s.val(); });
        }
    },
    mounted() {
        this.sincronizar();
        const s = localStorage.getItem('artigiano_session_v1');
        if (s) { this.usuarioLogado = JSON.parse(s); this.sessaoAtiva = true; }
    }
}).mount('#app');