var firebaseConfig = { 
    apiKey: "AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4", 
    authDomain: "artigiano-app.firebaseapp.com", 
    databaseURL: "https://artigiano-app-default-rtdb.firebaseio.com", 
    projectId: "artigiano-app", 
    storageBucket: "artigiano-app.firebasestorage.app", 
    messagingSenderId: "212218495726", 
    appId: "1:212218495726:web:dd6fec7a4a8c7ad572a9ff" 
};

var db;
try { firebase.initializeApp(firebaseConfig); db = firebase.database(); } catch (e) { console.error(e); }

var app = Vue.createApp({
    data: function() {
        return {
            loadingInicial: true, temaEscuro: false,
            loginUser: '', loginPass: '', sessaoAtiva: false, usuarioLogado: null,
            moduloAtivo: null, loteSelecionado: 45,
            itens: [], usuarios: [], 
            config: { destinos: [], rota: ['Freezer', 'Geladeira'] }
        };
    },
    computed: {
        itensFiltrados: function() {
            var self = this;
            return this.itens.filter(function(i) { return i.categoria === self.moduloAtivo; });
        }
    },
    methods: {
        carregarDados: function() {
            var self = this;
            db.ref('store/products').on('value', function(s) {
                var list = [];
                s.forEach(function(child) {
                    var item = child.val(); item.id = child.key;
                    list.push(item);
                });
                self.itens = list;
            });
            db.ref('system/users').on('value', function(s) {
                var u = []; s.forEach(function(c){ u.push(c.val()); });
                self.usuarios = u;
                self.loadingInicial = false;
            });
            db.ref('system/config').on('value', function(s) { if(s.val()) self.config = s.val(); });
        },
        fazerLogin: function() {
            var self = this;
            var user = this.usuarios.find(function(u) { return u.user === self.loginUser && u.pass === self.loginPass; });
            if (user) {
                this.usuarioLogado = user;
                this.sessaoAtiva = true;
                localStorage.setItem('artigiano_session', JSON.stringify(user));
            } else { alert("Acesso negado!"); }
        },
        salvarContagem: function(id, local, valor) {
            db.ref('store/products/' + id + '/contagem/' + local).set(valor);
        },
        enviarZap: function(destino) {
            var self = this;
            var texto = "*PEDIDO ARTIGIANO - " + this.moduloAtivo.toUpperCase() + "*\n\n";
            this.itensFiltrados.forEach(function(item) {
                var estoque = 0;
                for (var l in item.contagem) { estoque += parseFloat(item.contagem[l] || 0); }
                if (estoque < item.meta) {
                    texto += "• " + item.nome + ": " + (item.meta - estoque) + " " + item.unC + "\n";
                }
            });
            window.open("https://api.whatsapp.com/send?phone=" + destino.numero + "&text=" + encodeURIComponent(texto));
        },
        logout: function() { 
            localStorage.removeItem('artigiano_session');
            location.reload(); 
        }
    },
    mounted: function() {
        this.carregarDados();
        var session = localStorage.getItem('artigiano_session');
        if(session) { this.usuarioLogado = JSON.parse(session); this.sessaoAtiva = true; }
    }
});
app.mount('#app');