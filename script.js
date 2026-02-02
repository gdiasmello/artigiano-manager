// Configuração do Firebase
var firebaseConfig = {
    apiKey: 'AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4',
    databaseURL: 'https://artigiano-app-default-rtdb.firebaseio.com'
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

var database = firebase.database();

// Vue Instance
var app = Vue.createApp({
    data: function() {
        return {
            loading: true,
            showForcedEnter: false,
            authenticated: false,
            pinInput: '',
            modalTermos: false,
            setores: {
                config: false,
                produtos: true
            },
            fornecedores: ['Sacolão Central', 'Atacadão', 'Distribuidora Roma'],
            estoque: [
                { id: 1, nome: 'Farinha 00', unidade: 'kg', fornecedor: 'Atacadão', locais: { geladeira: 0, freezer: 0 } },
                { id: 2, nome: 'Tomate Pelati', unidade: 'latas', fornecedor: 'Sacolão Central', locais: { geladeira: 0, freezer: 0 } }
            ]
        };
    },
    mounted: function() {
        var self = this;
        
        // Watchdog: Mostrar botão forçado após 6s
        setTimeout(function() {
            self.showForcedEnter = true;
        }, 6000);

        // Simular carregamento inicial
        setTimeout(function() {
            self.loading = false;
        }, 1500);

        // Tentar recuperar do LocalStorage
        var saved = localStorage.getItem('artigiano_draft');
        if (saved) {
            this.estoque = JSON.parse(saved);
        }
    },
    methods: {
        login: function() {
            if (this.pinInput === '1821') {
                this.authenticated = true;
                this.pinInput = '';
            } else {
                alert('PIN Incorreto');
            }
        },
        toggleSetor: function(nome) {
            this.setores[nome] = !this.setores[nome];
        },
        calcularSoma: function(item) {
            return (parseFloat(item.locais.geladeira) || 0) + (parseFloat(item.locais.freezer) || 0);
        },
        confirmarContagem: function() {
            // Feedback Háptico
            if (navigator.vibrate) {
                navigator.vibrate(40);
            }
            
            // Auto-Save
            localStorage.setItem('artigiano_draft', JSON.stringify(this.estoque));
            
            // Aqui enviaria para o Firebase
            console.log("Enviando dados para o Firebase...");
            alert("Contagem salva com sucesso!");
        },
        removerItem: function(item) {
            var confirmacao = confirm('Tem certeza? Esta ação não pode ser desfeita');
            if (confirmacao) {
                // Lógica de remoção
                var index = this.estoque.indexOf(item);
                this.estoque.splice(index, 1);
            }
        },
        abrirTermos: function() {
            this.modalTermos = true;
        }
    }
}).mount('#app');
