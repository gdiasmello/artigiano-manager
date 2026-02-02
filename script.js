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
            sub: { equipe: false, catalogo: false, fornecedores: false },
            
            equipe: [
                { nome: 'Gabriel', cargo: 'ADM', pin: '1821', permissoes: ['insumos', 'historico', 'config'] },
                { nome: 'Mayara', cargo: 'Gerente', pin: '2024', permissoes: ['insumos', 'historico'] }
            ],

            estoque: [
                { id: 1, nome: 'Farinha 00', meta: 20, fator: 1, fornecedor: 'Atacadão', contato: '5543999999999', locais: { geladeira: 0, freezer: 0 } },
                { id: 2, nome: 'Tomate Pelati', meta: 10, fator: 2.5, fornecedor: 'Sacolão', contato: '5543888888888', locais: { geladeira: 0, freezer: 0 } }
            ],

            historico: []
        };
    },
    computed: {
        isAdmin: function() { return this.userSelected && (this.userSelected.cargo === 'ADM' || this.userSelected.cargo === 'Gerente'); },
        dataAtual: function() { return new Date().toLocaleString('pt-BR'); },
        filteredInsumos: function() {
            var self = this;
            return this.estoque.filter(function(i) { return i.nome.toLowerCase().indexOf(self.searchQuery.toLowerCase()) > -1; });
        }
    },
    methods: {
        login: function() {
            var self = this;
            if (this.userSelected && this.pinInput === this.userSelected.pin) {
                this.authenticated = true;
                if (navigator.vibrate) navigator.vibrate(30);
            } else {
                this.loginError = true;
                if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
                setTimeout(function() { self.loginError = false; self.pinInput = ''; }, 500);
            }
        },
        logout: function() { this.authenticated = false; this.currentTab = 'home'; },
        toggleSub: function(k) { this.sub[k] = !this.sub[k]; },
        podeVer: function(mod) { return this.userSelected && this.userSelected.permissoes.indexOf(mod) > -1; },
        
        gerarPedido: function(tipo) {
            var self = this;
            var pedidosPorFornecedor = {};
            
            this.estoque.forEach(function(item) {
                var total = (parseFloat(item.locais.geladeira) || 0) + (parseFloat(item.locais.freezer) || 0);
                if (total < item.meta) {
                    var falta = (item.meta - total) * item.fator;
                    if (!pedidosPorFornecedor[item.fornecedor]) {
                        pedidosPorFornecedor[item.fornecedor] = { zap: item.contato, texto: "Ciao! Pedido Artigiano:\n" };
                    }
                    pedidosPorFornecedor[item.fornecedor].texto += "* " + item.nome + ": " + falta.toFixed(1) + "\n";
                }
            });

            for (var f in pedidosPorFornecedor) {
                var p = pedidosPorFornecedor[f];
                // Salvar no Histórico (Máximo 50)
                this.historico.unshift({
                    data: self.dataAtual,
                    fornecedor: f,
                    conteudo: p.texto,
                    rascunho: (tipo === 'rascunho')
                });
                if (this.historico.length > 50) this.historico.pop();

                if (tipo === 'whatsapp') {
                    window.open("https://api.whatsapp.com/send?phone=" + p.zap + "&text=" + encodeURIComponent(p.texto));
                }
            }
            if (navigator.vibrate) navigator.vibrate(50);
            alert(tipo === 'rascunho' ? 'Salvo para segunda!' : 'Pedidos enviados!');
        },

        removerHistorico: function(idx) {
            if (confirm('Apagar registro?')) this.historico.splice(idx, 1);
        }
    }
}).mount('#app');
