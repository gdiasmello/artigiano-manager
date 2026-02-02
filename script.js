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
            sessaoAtiva: false, moduloAtivo: null,
            loginUser: '', loginPass: '',
            itens: [], usuarios: [], feriados: [],
            config: { destinos: [], rota: ['Freezer', 'Geladeira'] },
            diaSemana: new Date().getDay()
        };
    },
    computed: {
        itensFiltrados: function() {
            var self = this;
            return this.itens.filter(function(i) { return i.categoria === self.moduloAtivo; });
        },
        metaAjustada: function() {
            // Lógica de +20% em feriados
            var hoje = new Date().toISOString().split('T')[0];
            var eFeriado = this.feriados.some(function(f) { return f.data === hoje; });
            return eFeriado ? 1.2 : 1.0;
        }
    },
    methods: {
        registrarAuditoria: function(acao) {
            db.ref('system/auditoria').push({
                data: new Date().toLocaleString(),
                usuario: this.loginUser,
                acao: acao
            });
        },
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
            db.ref('system/config').on('value', function(s) { if(s.val()) self.config = s.val(); });
            db.ref('system/users').on('value', function(s) {
                var u = []; s.forEach(function(c){ u.push(c.val()); });
                self.usuarios = u;
            });
            db.ref('system/feriados').on('value', function(s) {
                var f = []; s.forEach(function(c){ f.push(c.val()); });
                self.feriados = f;
            });
        },
        fazerLogin: function() {
            var self = this;
            var u = self.usuarios.find(function(x){ return x.user === self.loginUser && x.pass === self.loginPass; });
            if(u) { 
                self.sessaoAtiva = true; 
                this.registrarAuditoria("Acesso ao sistema");
            } else { alert("Utilizador ou senha incorretos!"); }
        },
        salvarContagem: function(id, local, valor) {
            db.ref('store/products/' + id + '/contagem/' + local).set(valor);
        },
        enviarZap: function(destino) {
            var self = this;
            var texto = "*PEDIDO ARTIGIANO - " + this.moduloAtivo.toUpperCase() + "*\n";
            texto += "📅 " + new Date().toLocaleDateString() + "\n\n";
            var encontrou = false;

            this.itensFiltrados.forEach(function(item) {
                var estoque = 0;
                for (var l in item.contagem) { estoque += parseFloat(item.contagem[l] || 0); }
                
                var metaReal = item.meta * self.metaAjustada;
                if (estoque < metaReal) {
                    var falta = (metaReal - estoque).toFixed(1);
                    texto += "👉 *" + item.nome + "*: " + falta + " " + item.unC + "\n";
                    encontrou = true;
                }
            });

            if (!encontrou) return alert("Stock completo!");
            
            this.registrarAuditoria("Pedido enviado: " + destino.nome);
            window.open("https://api.whatsapp.com/send?phone=" + destino.numero + "&text=" + encodeURIComponent(texto));
        },
        logout: function() { location.reload(); }
    },
    mounted: function() {
        this.carregarDados();
    }
});
app.mount('#app');