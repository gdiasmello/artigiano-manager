// WATCHDOG - Captura erros antes do Vue carregar
window.onerror = function(msg, url, line) {
    var log = document.getElementById('error-log');
    if(log) log.innerText = "Erro: " + msg + " na linha " + line;
    document.getElementById('btn-force').style.display = "block";
};

// FIREBASE INIT
var firebaseConfig = {
    apiKey: "AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4",
    databaseURL: "https://artigiano-app-default-rtdb.firebaseio.com"
};
firebase.initializeApp(firebaseConfig);
var db = firebase.database();

// VUE APP
var app = Vue.createApp({
    data: function() {
        return {
            abaAtual: 'producao',
            metaMassa: 60,
            produtos: [],
            busca: '',
            dataHoje: new Date().toLocaleDateString('pt-BR')
        };
    },
    computed: {
        produtosFiltrados: function() {
            var self = this;
            return this.produtos.filter(function(p) {
                return p.nome.toLowerCase().indexOf(self.busca.toLowerCase()) > -1;
            });
        }
    },
    created: function() {
        this.carregarDados();
    },
    mounted: function() {
        // Remove o loader após carregar
        setTimeout(function() {
            var loader = document.getElementById('watchdog');
            if(loader) loader.style.display = 'none';
        }, 1200);
    },
    methods: {
        carregarDados: function() {
            var self = this;
            db.ref('produtos').on('value', function(snapshot) {
                var data = snapshot.val();
                var temp = [];
                for (var key in data) {
                    var item = data[key];
                    item.id = key;
                    temp.push(item);
                }
                self.produtos = temp;
            });
        },
        salvarEstoque: function(item) {
            db.ref('produtos/' + item.id).update({
                contagem: item.contagem,
                lastUpdate: firebase.database.ServerValue.TIMESTAMP
            });
            if (navigator.vibrate) navigator.vibrate(40);
        },
        enviarWhatsApp: function() {
            var mensagem = "*PEDIDO ARTIGIANO - " + this.dataHoje + "*\n\n";
            var itensFaltantes = this.produtos.filter(function(p) {
                return p.contagem < p.meta;
            });

            if(itensFaltantes.length === 0) {
                alert("Tudo em dia! Nada para pedir.");
                return;
            }

            itensFaltantes.forEach(function(p) {
                var qtd = p.meta - p.contagem;
                mensagem += "• *" + p.nome + "*: falta " + qtd + "\n";
            });

            var url = "https://api.whatsapp.com/send?text=" + encodeURIComponent(mensagem);
            window.open(url, '_blank');
        }
    }
});

app.mount('#app');