// Configuração Firebase
var firebaseConfig = {
    apiKey: 'AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4',
    databaseURL: 'https://artigiano-app-default-rtdb.firebaseio.com'
};

// Inicialização
firebase.initializeApp(firebaseConfig);
var db = firebase.database();

var app = Vue.createApp({
    data: function() {
        return {
            authenticated: false,
            pinInput: '',
            currentTab: 'Estoque',
            showWatchdog: false,
            showTerms: false,
            newHoliday: '',
            sections: {
                prod: false,
                feriado: false,
                rota: false
            },
            inventory: [],
            holidays: [],
            suppliers: []
        };
    },
    methods: {
        checkLogin: function() {
            if (this.pinInput === '1821') {
                this.authenticated = true;
                this.loadData();
                this.haptic();
            } else {
                alert('PIN Incorreto');
            }
        },

        forceEntry: function() {
            this.authenticated = true;
            this.loadData();
        },

        loadData: function() {
            var self = this;
            // Carregar Inventário
            db.ref('inventory').on('value', function(snapshot) {
                var data = snapshot.val();
                if (data) {
                    var list = [];
                    for (var key in data) {
                        var item = data[key];
                        item.id = key;
                        // Inicializar locais se não existirem
                        if (!item.locais) item.locais = { "Geladeira": 0, "Freezer": 0, "Prateleira": 0 };
                        list.push(item);
                    }
                    self.inventory = list;
                }
            });

            // Carregar Feriados
            db.ref('holidays').on('value', function(snapshot) {
                if (snapshot.val()) self.holidays = snapshot.val();
            });

            // Recuperar rascunho local
            var draft = localStorage.getItem('artigiano_draft');
            if (draft) {
                console.log('Rascunho recuperado');
            }
        },

        totalCount: function(item) {
            var sum = 0;
            for (var loc in item.locais) {
                sum += (parseFloat(item.locais[loc]) || 0);
            }
            return sum;
        },

        calculateMeta: function(item) {
            var metaBase = parseFloat(item.metaPadrao) || 0;
            var hoje = new Date();
            var diaSemana = hoje.getDay(); // 5 = Sexta
            
            // Lógica Sexta-feira (Sacolão x3)
            if (diaSemana === 5 && item.categoria === 'Sacolão') {
                metaBase = metaBase * 3;
            }

            // Lógica Feriado (+50%)
            var dataFormatada = hoje.toISOString().split('T')[0];
            if (this.holidays.indexOf(dataFormatada) !== -1) {
                metaBase = metaBase * 1.5;
            }

            return Math.ceil(metaBase);
        },

        toggleSection: function(sec) {
            this.sections[sec] = !this.sections[sec];
            this.haptic();
        },

        confirmCount: function(item) {
            var self = this;
            db.ref('inventory/' + item.id).update(item, function(error) {
                if (!error) {
                    self.haptic();
                    alert('Contagem de ' + item.nome + ' salva!');
                }
            });
        },

        removeItem: function(item) {
            if (confirm('Tem certeza? Esta ação não pode ser desfeita.')) {
                db.ref('inventory/' + item.id).remove();
            }
        },

        newItem: function() {
            var nome = prompt('Nome do Produto:');
            if (nome) {
                db.ref('inventory').push({
                    nome: nome,
                    fornecedor: 'Geral',
                    metaPadrao: 10,
                    unidadeContagem: 'Un',
                    unidadeCompra: 'Caixa',
                    fatorConversao: 1,
                    categoria: 'Geral',
                    locais: { "Geladeira": 0, "Freezer": 0 }
                });
            }
        },

        addHoliday: function() {
            if (this.newHoliday) {
                this.holidays.push(this.newHoliday);
                db.ref('holidays').set(this.holidays);
                this.newHoliday = '';
            }
        },

        formatDate: function(dateStr) {
            var d = dateStr.split('-');
            return d[2] + '/' + d[1];
        },

        autoSave: function() {
            localStorage.setItem('artigiano_draft', JSON.stringify(this.inventory));
        },

        haptic: function() {
            if (navigator.vibrate) {
                navigator.vibrate(40);
            }
        }
    },
    mounted: function() {
        var self = this;
        // Watchdog Timer
        setTimeout(function() {
            if (!self.authenticated) {
                self.showWatchdog = true;
            }
        }, 6000);
    }
}).mount('#app');