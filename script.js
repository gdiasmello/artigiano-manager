var firebaseConfig = {
    apiKey: 'AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4',
    databaseURL: 'https://artigiano-app-default-rtdb.firebaseio.com'
};

firebase.initializeApp(firebaseConfig);
var db = firebase.database();

var app = Vue.createApp({
    data: function() {
        return {
            loading: true,
            showForcedEnter: false,
            authenticated: false,
            pinInput: '',
            loginError: false,
            modalTermos: false,
            setores: { adm: false },
            fornecedores: ['Sacolão Central', 'Atacadão'],
            estoque: [
                { id: 1, nome: 'Massa Pizza', unidade: 'un', fatorConversao: 1, fornecedor: 'Atacadão', locais: { geladeira: 0, freezer: 0 } },
                { id: 2, nome: 'Tomate', unidade: 'kg', fatorConversao: 1.5, fornecedor: 'Sacolão Central', locais: { geladeira: 0, freezer: 0 } }
            ]
        };
    },
    computed: {
        dataAtualFormatada: function() {
            return new Date().toLocaleDateString('pt-BR');
        },
        metaHoje: function() {
            var hoje = new Date();
            var dia = hoje.getDay(); // 5 = Sexta
            // Lógica de Metas solicitada
            if (dia === 5) return "300% (Triplicada Sexta)";
            return "150% (Padrão/Feriado)";
        }
    },
    mounted: function() {
        var self = this;
        setTimeout(function() { self.showForcedEnter = true; }, 6000);
        setTimeout(function() { self.loading = false; }, 1500);
        
        var rascunho = localStorage.getItem('artigiano_draft');
        if (rascunho) this.estoque = JSON.parse(rascunho);
    },
    methods: {
        login: function() {
            var self = this;
            if (this.pinInput === '1821') { // PIN ADM
                this.authenticated = true;
                if (navigator.vibrate) navigator.vibrate(30);
            } else {
                this.loginError = true;
                if (navigator.vibrate) navigator.vibrate([50, 40, 50]);
                setTimeout(function() { 
                    self.loginError = false; 
                    self.pinInput = '';
                }, 500);
            }
        },
        toggleSetor: function(n) { this.setores[n] = !this.setores[n]; },
        somarUnidades: function(item) {
            return (parseFloat(item.locais.geladeira) || 0) + (parseFloat(item.locais.freezer) || 0);
        },
        calcularCompra: function(item) {
            // Lógica de Fator de Conversão
            var total = this.somarUnidades(item);
            return (total * item.fatorConversao).toFixed(2) + ' ' + item.unidade;
        },
        salvarFirebase: function() {
            var self = this;
            db.ref('contagens/' + Date.now()).set(this.estoque, function(err) {
                if (!err) {
                    if (navigator.vibrate) navigator.vibrate(40);
                    localStorage.setItem('artigiano_draft', JSON.stringify(self.estoque));
                    alert('Sincronizado com Firebase!');
                }
            });
        },
        abrirTermos: function() { this.modalTermos = true; },
        removerItem: function(item) {
            if (confirm('Tem certeza? Esta ação não pode ser desfeita')) {
                var idx = this.estoque.indexOf(item);
                this.estoque.splice(idx, 1);
            }
        }
    }
}).mount('#app');
