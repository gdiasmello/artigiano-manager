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
            atualizandoApp: false, mostrarNovidades: false,
            sessaoAtiva: false, telaAtiva: null,
            usuarioLogado: null, loginUser: '', loginPass: '', msgAuth: '', loginErro: false,
            localAtual: '', contagemAtiva: {}, obsPorItem: {}, 
            mostrandoResumo: false, textoWhatsApp: '',
            mostrandoHistorico: false, mostrarSucesso: false,
            qtdGeloAtual: null,
            listaTodosBlocos: [
                { id: 'sacolao', nome: 'SACOLÃO', icon: 'fas fa-leaf', cor: 'green' },
                { id: 'insumos', nome: 'INSUMOS', icon: 'fas fa-box', cor: 'red' },
                { id: 'producao', nome: 'PRODUÇÃO', icon: 'fas fa-mortar-pestle', cor: 'gold' },
                { id: 'gelo', nome: 'GELO', icon: 'fas fa-cube', cor: 'ice' },
                { id: 'checklist', nome: 'CHECKLIST', icon: 'fas fa-clipboard-check', cor: 'temp' },
                { id: 'bebidas', nome: 'BEBIDAS', icon: 'fas fa-wine-bottle', cor: 'purple' },
                { id: 'limpeza', nome: 'LIMPEZA', icon: 'fas fa-hands-bubbles', cor: 'blue' }
            ],
            usuarios: [], catalogoDNA: [], config: { rota: ['Geral'], destinos: {} }, historico: []
        }
    },
    computed: {
        fullVersion() { return `v${this.versionNum} • ${this.versionName}`; },
        blocosPermitidos() {
            if (!this.usuarioLogado) return [];
            return this.listaTodosBlocos.filter(b => this.usuarioLogado.permissoes && this.usuarioLogado.permissoes[b.id]);
        },
        tituloTela() {
            if (this.telaAtiva === 'config') return 'AJUSTES';
            const b = this.listaTodosBlocos.find(x => x.id === this.telaAtiva);
            return b ? b.nome : 'PIZZA MASTER';
        }
    },
    methods: {
        efetuarLogin() {
            this.msgAuth = "";
            const u = this.loginUser.trim().toLowerCase();
            const p = String(this.loginPass).trim();

            // Login Mestre (Gabriel)
            if (u === 'gabriel' && p === '1821') {
                this.entrar({ nome: 'Gabriel', user: 'gabriel', permissoes: { admin: true, sacolao: true, insumos: true, producao: true, gelo: true, checklist: true, bebidas: true, limpeza: true } });
                return;
            }

            // Login Funcionários
            const user = this.usuarios.find(x => x.user.toLowerCase() === u && String(x.pass) === p);
            if (user) {
                this.entrar(user);
            } else {
                this.loginErro = true;
                this.msgAuth = "PIN INVÁLIDO";
                setTimeout(() => this.loginErro = false, 500);
            }
        },
        entrar(user) {
            this.usuarioLogado = user;
            this.sessaoAtiva = true;
            localStorage.setItem('artigiano_session_v1', JSON.stringify(user));
        },
        logout() {
            localStorage.removeItem('artigiano_session_v1');
            location.reload();
        },
        abrirBloco(id) {
            this.telaAtiva = id;
            if (id === 'gelo') this.qtdGeloAtual = null;
        },
        voltarInicio() { this.telaAtiva = null; },
        sincronizar() {
            db.ref('usuarios').on('value', s => { const d=s.val(); this.usuarios = d ? Object.keys(d).map(k=>({...d[k], id:k})) : []; });
            db.ref('catalogoDNA').on('value', s => { const d=s.val(); this.catalogoDNA = d ? Object.keys(d).map(k=>({...d[k], id:k})) : []; });
            db.ref('config').on('value', s => { const d=s.val() || {}; this.config.rota = d.rota || ['Geral']; this.config.destinos = d.destinos || {}; });
        }
    },
    mounted() {
        this.sincronizar();
        const s = localStorage.getItem('artigiano_session_v1');
        if (s) { this.usuarioLogado = JSON.parse(s); this.sessaoAtiva = true; }
    }
}).mount('#app');