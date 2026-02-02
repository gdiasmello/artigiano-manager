var firebaseConfig = { 
    apiKey: "AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4", 
    authDomain: "artigiano-app.firebaseapp.com", 
    databaseURL: "https://artigiano-app-default-rtdb.firebaseio.com", 
    projectId: "artigiano-app" 
};

var db; try { firebase.initializeApp(firebaseConfig); db = firebase.database(); } catch (e) { console.error("Erro Firebase:", e); }

var { createApp } = Vue;

var app = createApp({
    data: function() {
        return {
            loadingInicial: true, sessaoAtiva: false, temaEscuro: false,
            usuarioLogado: null, loginUser: '', loginPass: '', msgAuth: '', loadingAuth: false,
            moduloAtivo: null, produtos: [], usuarios: [], 
            config: { destinos: [], rota: ['Geral'], cores: { hortifruti: '#10B981', geral: '#3B82F6', bebidas: '#EF4444', limpeza: '#8B5CF6' } },
            mostrandoConfig: false, mostrandoAdmin: false, mostrandoHistorico: false
        }
    },
    computed: {
        nomeModulo: function() {
            var nomes = { hortifruti: 'Hortifruti', geral: 'Geral', bebidas: 'Bebidas', limpeza: 'Limpeza', producao: 'Produção' };
            return nomes[this.moduloAtivo] || '';
        },
        produtosDoModulo: function() {
            var self = this;
            return this.produtos.filter(function(p) { return p.categoria === self.moduloAtivo; });
        }
    },
    methods: {
        podeAcessar: function(perm) {
            if (!this.usuarioLogado || !this.usuarioLogado.permissoes) return false;
            // O Gabriel Master sempre acessa tudo
            if (this.usuarioLogado.user.toLowerCase() === 'gabriel') return true;
            return this.usuarioLogado.permissoes.admin || this.usuarioLogado.permissoes[perm];
        },
        abrirModulo: function(m) { this.moduloAtivo = m; },
        getCorCategoria: function(cat) { return this.config.cores[cat] || '#ccc'; },
        sugestaoDia: function(mod) { 
            var dia = new Date().getDay(); 
            if(dia === 1) return mod === 'geral' || mod === 'limpeza'; 
            return mod === 'hortifruti'; 
        },
        fazerLogin: function() {
            this.loadingAuth = true;
            var self = this;
            var u = this.loginUser.trim().toLowerCase();
            var p = this.loginPass.trim();

            // LOGIN MESTRE PARA RECUPERAÇÃO
            if (u === 'gabriel' && p === '21gabriel') {
                var master = { 
                    nome: 'Gabriel Master', user: 'Gabriel', cargo: 'Gerente', 
                    permissoes: { admin: true, hortifruti: true, geral: true, bebidas: true, limpeza: true, producao: true } 
                };
                this.logar(master);
                return;
            }

            // Busca no banco
            var userFound = this.usuarios.find(function(x) { return x.user.toLowerCase() === u && x.pass === p; });
            if (userFound) { this.logar(userFound); } 
            else { this.msgAuth = "Usuário não encontrado."; this.loadingAuth = false; }
        },
        logar: function(user) {
            this.usuarioLogado = user;
            this.sessaoAtiva = true;
            localStorage.setItem('artigiano_session', JSON.stringify(user));
            this.loadingAuth = false;
        },
        salvarProdutoUnitario: function(p) { if(db) db.ref('store/products/' + p.id).set(p); },
        carregarDb: function() {
            var self = this;
            if(!db) return;
            db.ref('system/users').on('value', function(s) { self.usuarios = s.val() ? Object.values(s.val()) : []; });
            db.ref('store/products').on('value', function(s) { 
                self.produtos = s.val() ? Object.values(s.val()) : [];
                self.loadingInicial = false; 
            });
            db.ref('system/config').on('value', function(s) { if(s.val()) self.config = s.val(); });
        }
    },
    mounted: function() {
        this.carregarDb();
        var session = localStorage.getItem('artigiano_session');
        if (session) {
            try {
                this.usuarioLogado = JSON.parse(session);
                this.sessaoAtiva = true;
            } catch(e) { localStorage.removeItem('artigiano_session'); }
        }
    }
});
app.mount('#app');
