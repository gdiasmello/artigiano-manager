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
            modalTermos: false,
            searchCat: '',
            sub: { equipa: false, fornecedores: false, catalogo: false, ajustes: false },
            
            equipe: [
                { id: 1, nome: 'Gabriel', cargo: 'ADM', pin: '1821', permissoes: ['insumos', 'historico', 'config'] },
                { id: 2, nome: 'Mayara', cargo: 'Gerente', pin: '2024', permissoes: ['insumos', 'historico'] }
            ],

            fornecedores: [
                { id: 1, nome: 'Sacolão Hortifruti', zap: '5543999999999', triplicaSexta: true },
                { id: 2, nome: 'Atacadão Alimentos', zap: '5543888888888', triplicaSexta: false }
            ],

            catalogo: [
                { id: 101, nome: 'Farinha de Trigo 00', meta: 30, fator: 1, unidade: 'kg', fornecedor: 'Atacadão Alimentos' },
                { id: 102, nome: 'Mussarela', meta: 10, fator: 3.5, unidade: 'peça', fornecedor: 'Sacolão Hortifruti' }
            ],

            config: {
                modoFeriado: false,
                rota: ['Freezer', 'Geladeira Massa', 'Estoque Seco']
            }
        };
    },
    computed: {
        dataAtual: function() { return new Date().toLocaleDateString('pt-BR'); },
        filteredCatalog: function() {
            var self = this;
            return this.catalogo.filter(function(i) {
                return i.nome.toLowerCase().indexOf(self.searchCat.toLowerCase()) > -1;
            });
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
                if (navigator.vibrate) navigator.vibrate([50, 40, 50]);
                setTimeout(function() { self.loginError = false; self.pinInput = ''; }, 500);
            }
        },
        logout: function() { this.authenticated = false; this.currentTab = 'home'; },
        toggleSub: function(k) { this.sub[k] = !this.sub[k]; },
        podeVer: function(mod) {
            return this.userSelected && this.userSelected.permissoes.indexOf(mod) > -1;
        },
        removerFuncionario: function(f) {
            if (confirm('Deseja remover ' + f.nome + '?')) {
                var idx = this.equipe.indexOf(f);
                this.equipe.splice(idx, 1);
            }
        },
        moverRota: function(idx, dir) {
            var novaPos = idx + dir;
            if (novaPos < 0 || novaPos >= this.config.rota.length) return;
            var item = this.config.rota.splice(idx, 1)[0];
            this.config.rota.splice(novaPos, 0, item);
        },
        novoProduto: function() {
            this.catalogo.push({ id: Date.now(), nome: 'Novo Item', meta: 0, fator: 1, unidade: 'un', fornecedor: '' });
        }
    }
}).mount('#app');
