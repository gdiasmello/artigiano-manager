var firebaseConfig = {
    apiKey: 'AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4',
    databaseURL: 'https://artigiano-app-default-rtdb.firebaseio.com'
};

firebase.initializeApp(firebaseConfig);
var db = firebase.database();

var app = Vue.createApp({
    data: function() {
        return {
            authenticated: false,
            currentTab: 'home',
            userSelected: '',
            pinInput: '',
            loginError: false,
            searchQuery: '',
            
            usuarios: [
                { id: 1, nome: 'Gabriel', cargo: 'ADM', pin: '1821' },
                { id: 2, nome: 'Gerente', cargo: 'Operacional', pin: '2024' }
            ],

            fornecedores: ['Sacolão', 'Atacadão', 'Distribuidora Roma'],

            estoque: [
                { id: 1, nome: 'Farinha de Trigo', fornecedor: 'Atacadão', meta: 20, contato: '5511999999999', locais: { geladeira: 0, freezer: 0 } },
                { id: 2, nome: 'Tomate Pelati', fornecedor: 'Sacolão', meta: 12, contato: '5511888888888', locais: { geladeira: 0, freezer: 0 } }
            ]
        };
    },
    computed: {
        filteredInsumos: function() {
            var self = this;
            if (!this.searchQuery) return this.estoque;
            return this.estoque.filter(function(item) {
                return item.nome.toLowerCase().indexOf(self.searchQuery.toLowerCase()) > -1;
            });
        }
    },
    methods: {
        login: function() {
            var self = this;
            if (this.userSelected && this.pinInput === this.userSelected.pin) {
                this.authenticated = true;
                if (navigator.vibrate) navigator.vibrate(40);
            } else {
                this.loginError = true;
                if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
                setTimeout(function() { 
                    self.loginError = false; 
                    self.pinInput = '';
                }, 500);
            }
        },
        adicionarItem: function() {
            this.estoque.push({
                id: Date.now(),
                nome: 'Novo Insumo',
                fornecedor: 'Atacadão',
                meta: 0,
                contato: '',
                locais: { geladeira: 0, freezer: 0 }
            });
        },
        gerarListaWhatsApp: function() {
            var self = this;
            var mensagens = {};

            // Lógica: Se o que tem na loja é menor que a meta, pede a diferença
            this.estoque.forEach(function(item) {
                var total = parseFloat(item.locais.geladeira) + parseFloat(item.locais.freezer);
                if (total < item.meta && item.contato) {
                    var qtdPedir = item.meta - total;
                    if (!mensagens[item.contato]) {
                        mensagens[item.contato] = "Ciao! Pedido Artigiano:\n";
                    }
                    mensagens[item.contato] += "* " + item.nome + ": " + qtdPedir + " un\n";
                }
            });

            // Dispara um WhatsApp por vez (ou mostra lista)
            for (var contato in mensagens) {
                var texto = encodeURIComponent(mensagens[contato]);
                window.open("https://api.whatsapp.com/send?phone=" + contato + "&text=" + texto);
            }
            
            if (navigator.vibrate) navigator.vibrate(100);
        }
    }
}).mount('#app');
