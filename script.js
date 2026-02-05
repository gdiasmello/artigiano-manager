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
            version: '1.1.0',
            sessaoAtiva: false, telaAtiva: null,
            usuarioLogado: null, loginUser: '', loginPass: '', msgAuth: '', loginErro: false,
            localAtual: '', contagemAtiva: {}, mostrandoResumo: false, textoWhatsApp: '',
            mostrandoHistorico: false, mostrarInstalacao: false, mostrarNovidades: false, mostrandoNovoUsuario: false,
            notificacao: { ativa: false, texto: '', tipo: '', icone: '' },
            novoLocal: '', novoInsumo: { nome: '', un_contagem: '', un_pedido: '', conversao: 1 },
            novoUser: { nome: '', user: '', pass: '' },
            
            qtdBolinhas: 0,
            
            listaTodosBlocos: [
                { id: 'sacolao', nome: 'SACOLÃO', icon: 'fas fa-leaf', cor: 'green' },
                { id: 'insumos', nome: 'INSUMOS', icon: 'fas fa-box', cor: 'red' },
                { id: 'producao', nome: 'PRODUÇÃO', icon: 'fas fa-mortar-pestle', cor: 'gold' },
                { id: 'gelo', nome: 'GELO', icon: 'fas fa-cube', cor: 'ice' },
                { id: 'temp', nome: 'TEMP.', icon: 'fas fa-thermometer-half', cor: 'temp' },
                { id: 'bebidas', nome: 'BEBIDAS', icon: 'fas fa-wine-bottle', cor: 'purple' },
                { id: 'limpeza', nome: 'LIMPEZA', icon: 'fas fa-hands-bubbles', cor: 'blue' }
            ],
            usuarios: [], catalogoDNA: [], config: { rota: ['Geral'] }, historico: []
        }
    },
    computed: {
        blocosPermitidos() {
            if (!this.usuarioLogado) return [];
            return this.listaTodosBlocos.filter(b => this.usuarioLogado.permissoes && this.usuarioLogado.permissoes[b.id]);
        },
        tituloTela() {
            if (this.telaAtiva === 'config') return 'AJUSTES';
            const bloco = this.listaTodosBlocos.find(b => b.id === this.telaAtiva);
            return bloco ? bloco.nome : 'PIZZA MASTER';
        },
        receita() {
            const farinha = Math.ceil(this.qtdBolinhas * 133);
            const totalAgua = Math.ceil(farinha * 0.70);
            return {
                farinha: farinha,
                sal: Math.ceil(this.qtdBolinhas * 4),
                levain: Math.ceil(farinha * 0.06),
                totalAgua: totalAgua,
                agua: Math.ceil(totalAgua * 0.70),
                gelo: Math.ceil(totalAgua * 0.30)
            };
        }
    },
    methods: {
        mostrarNotificacao(texto, tipo = 'info') {
            this.notificacao = { ativa: true, texto, tipo, icone: tipo === 'success' ? 'fas fa-check-circle' : 'fas fa-info-circle' };
            setTimeout(() => this.notificacao.ativa = false, 3000);
        },
        efetuarLogin() {
            this.loginErro = false;
            const u = this.loginUser.trim().toLowerCase();
            const p = String(this.loginPass).trim();

            if (u === 'gabriel' && p === '1821') {
                this.entrar({ id: 'master', nome: 'Gabriel', user: 'gabriel', pass: '1821', permissoes: { admin: true, sacolao: true, insumos: true, producao: true, gelo: true, temp: true, bebidas: true, limpeza: true } });
                return;
            }
            const user = this.usuarios.find(x => x.user.toLowerCase() === u && String(x.pass) === p);
            if (user) this.entrar(user);
            else { 
                this.loginErro = true; this.msgAuth = "PIN INVÁLIDO";
                if(navigator.vibrate) navigator.vibrate(200);
                setTimeout(() => this.loginErro = false, 500);
            }
        },
        entrar(user) { 
            this.usuarioLogado = user; 
            this.sessaoAtiva = true; 
            localStorage.setItem('artigiano_session_v1', JSON.stringify(user)); 
            this.checarNovidades();
            this.mostrarNotificacao(`Bem-vindo, ${user.nome}!`, 'success');
        },
        checarNovidades() {
            const lastVersion = localStorage.getItem('artigiano_version');
            if (lastVersion !== this.version) {
                this.mostrarNovidades = true;
            }
        },
        fecharNovidades() {
            this.mostrarNovidades = false;
            localStorage.setItem('artigiano_version', this.version);
        },
        logout() { localStorage.removeItem('artigiano_session_v1'); location.reload(); },
        
        // CORREÇÃO: Abre a rota padrão se estiver vazia
        abrirBloco(id) {
            this.telaAtiva = id; 
            if (!this.config.rota || this.config.rota.length === 0) {
                this.config.rota = ['Geral'];
                db.ref('config/rota').set(['Geral']);
            }
            this.localAtual = this.config.rota[0];
            this.config.rota.forEach(l => { 
                if(!this.contagemAtiva[l]) this.contagemAtiva[l] = {}; 
            });
        },
        voltarInicio() { this.telaAtiva = null; },

        gerarResumo() {
            let texto = `*PEDIDO: ${this.telaAtiva.toUpperCase()}*\n`;
            let totais = {};
            this.config.rota.forEach(l => {
                for(let item in this.contagemAtiva[l]) totais[item] = (totais[item] || 0) + this.contagemAtiva[l][item];
            });
            for(let item in totais) { 
                const dna = this.catalogoDNA.find(d => d.nome === item);
                if(totais[item] > 0) texto += `• ${item}: ${totais[item]} ${dna ? dna.un_contagem : ''}\n`; 
            }
            this.textoWhatsApp = texto; this.mostrandoResumo = true;
        },
        finalizarProducao() {
            const texto = `*PRODUÇÃO DE MASSA*\nQuant: ${this.qtdBolinhas} un\nResponsável: ${this.usuarioLogado.nome}`;
            db.ref('historico').push({ data: new Date().toLocaleString(), usuario: this.usuarioLogado.nome, itens: texto });
            this.mostrarNotificacao('Produção Registrada!', 'success');
            this.qtdBolinhas = 0; this.telaAtiva = null;
        },
        enviarWhatsApp() {
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(this.textoWhatsApp)}`, '_blank');
            db.ref('historico').push({ data: new Date().toLocaleString(), usuario: this.usuarioLogado.nome, itens: this.textoWhatsApp });
            this.telaAtiva = null; this.mostrandoResumo = false;
        },

        adicionarAoDNA() { db.ref('catalogoDNA').push(this.novoInsumo); this.novoInsumo = { nome: '', un_contagem: '', un_pedido: '', conversao: 1 }; this.mostrarNotificacao('Item Salvo!'); },
        removerDoDNA(id) { if(confirm("Remover item?")) db.ref('catalogoDNA').child(id).remove(); },
        adicionarLocal() { this.config.rota.push(this.novoLocal); db.ref('config/rota').set(this.config.rota); this.novoLocal = ''; },
        removerLocal(i) { this.config.rota.splice(i, 1); db.ref('config/rota').set(this.config.rota); },
        atualizarUsuario(u) { db.ref('usuarios').child(u.id).update(u); this.mostrarNotificacao('Atualizado!', 'success'); },
        removerUsuario(id) { if(confirm("Remover?")) db.ref('usuarios').child(id).remove(); },
        criarUsuario() {
            if(!this.novoUser.user || !this.novoUser.pass) return;
            const u = { ...this.novoUser, permissoes: { sacolao: true, insumos: true, producao: false, admin: false } };
            db.ref('usuarios').push(u); this.mostrandoNovoUsuario = false; this.novoUser = { nome: '', user: '', pass: '' };
            this.mostrarNotificacao('Funcionário Criado!', 'success');
        },

        sincronizar() {
            db.ref('usuarios').on('value', s => { const d=s.val(); this.usuarios = d ? Object.keys(d).map(k=>({...d[k], id:k})) : []; });
            db.ref('catalogoDNA').on('value', s => { const d=s.val(); this.catalogoDNA = d ? Object.keys(d).map(k=>({...d[k], id:k})) : []; });
            db.ref('config/rota').on('value', s => this.config.rota = s.val() || ['Geral']);
            db.ref('historico').limitToLast(50).on('value', s => { const d=s.val(); this.historico = d ? Object.values(d).reverse() : []; });
        }
    },
    mounted() { 
        this.sincronizar(); 
        const s = localStorage.getItem('artigiano_session_v1'); 
        if(s) { this.usuarioLogado = JSON.parse(s); this.sessaoAtiva = true; this.checarNovidades(); }
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.mostrarInstalacao = true;
        });
    }
}).mount('#app');
