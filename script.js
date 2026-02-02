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
try { firebase.initializeApp(firebaseConfig); db = firebase.database(); } catch(e) { console.error(e); }

var app = Vue.createApp({
    data: function() {
        return {
            sessaoAtiva: false, moduloAtivo: null, temaEscuro: false,
            loginUser: '', loginPass: '', usuarioLogado: null,
            itens: [], usuarios: [], loteSelecionado: 45,
            config: { destinos: [], rota: ['Geral'] }
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
                s.forEach(function(c) { var item = c.val(); item.id = c.key; list.push(item); });
                self.itens = list;
            });
            db.ref('system/users').on('value', function(s) {
                var u = []; s.forEach(function(c){ u.push(c.val()); });
                self.usuarios = u;
            });
            db.ref('system/config').on('value', function(s) { if(s.val()) self.config = s.val(); });
        },
        fazerLogin: function() {
            var self = this;
            var u = this.usuarios.find(function(x){ return x.user === self.loginUser && x.pass === self.loginPass; });
            if(u) { 
                self.sessaoAtiva = true; 
                self.usuarioLogado = u; 
                localStorage.setItem('artigiano_session', JSON.stringify(u));
            } else { alert("Acesso negado!"); }
        },
        salvarContagem: function(id, local, valor) {
            db.ref('store/products/' + id + '/contagem/' + local).set(valor);
        },
        enviarZap: function(destino) {
            var self = this;
            var texto = "*PEDIDO ARTIGIANO*\n\n";
            this.itensFiltrados.forEach(function(i) {
                var est = 0;
                for (var l in i.contagem) { est += parseFloat(i.contagem[l] || 0); }
                if (est < i.meta) {
                    texto += "✅ " + i.nome + ": " + (i.meta - est) + " " + i.unC + "\n";
                }
            });
            // Auditoria resgatada do original
            db.ref('system/auditoria').push({ data: new Date().toLocaleString(), user: self.usuarioLogado.nome, acao: "Pedido: " + destino.nome });
            window.open("https://api.whatsapp.com/send?phone=" + destino.numero + "&text=" + encodeURIComponent(texto));
        },
        alternarTema: function() { this.temaEscuro = !this.temaEscuro; },
        logout: function() { localStorage.removeItem('artigiano_session'); location.reload(); }
    },
    mounted: function() {
        this.carregarDados();
        var session = localStorage.getItem('artigiano_session');
        if(session) { this.usuarioLogado = JSON.parse(session); this.sessaoAtiva = true; }
    }
});
app.mount('#app');