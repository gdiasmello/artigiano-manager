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
            loadingInicial: true, moduloAtivo: null, itens: [], sobraMassa: 0,
            config: { destinos: [], rota: ['Geral'] }
        };
    },
    computed: {
        itensFiltrados: function() {
            var self = this;
            return this.itens.filter(function(i) { return i.categoria === self.moduloAtivo; });
        },
        qtdProduzir: function() {
            var d = new Date().getDay();
            var meta = (d === 0 || d >= 5) ? 100 : 60;
            return Math.max(0, meta - this.sobraMassa);
        }
    },
    methods: {
        carregarDados: function() {
            var self = this;
            db.ref('store/products').on('value', function(s) {
                var list = [];
                s.forEach(function(child) {
                    var item = child.val();
                    item.id = child.key;
                    list.push(item);
                });
                self.itens = list;
                self.loadingInicial = false;
            });
            db.ref('system/config').on('value', function(s) {
                if(s.val()) self.config = s.val();
            });
        },
        salvarContagem: function(id, local, valor) {
            db.ref('store/products/' + id + '/contagem/' + local).set(valor);
        },
        enviarZap: function(destino) {
            var self = this;
            var texto = "*Pedido Artigiano - " + this.moduloAtivo.toUpperCase() + "*\n\n";
            this.itensFiltrados.forEach(function(item) {
                var estoque = 0;
                for (var loc in item.contagem) { estoque += parseFloat(item.contagem[loc] || 0); }
                if (estoque < item.meta) {
                    var falta = item.meta - estoque;
                    texto += "• " + item.nome + ": " + falta + " " + item.unC + "\n";
                }
            });
            window.open("https://api.whatsapp.com/send?phone=" + destino.numero + "&text=" + encodeURIComponent(texto));
        },
        exportarBackup: function() {
            db.ref().once('value', function(s) {
                var data = JSON.stringify(s.val(), null, 2);
                var blob = new Blob([data], {type: 'application/json'});
                var url = window.URL.createObjectURL(blob);
                var a = document.createElement('a'); a.href = url; a.download = 'backup.json'; a.click();
            });
        },
        logout: function() { location.reload(); }
    },
    mounted: function() {
        this.carregarDados();
        var self = this;
        setTimeout(function() { if(self.loadingInicial) self.loadingInicial = false; }, 4000);
    }
});
app.mount('#app');