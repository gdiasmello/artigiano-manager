/* =============================================
   PIZZERIA MASTER - MOTOR DE GESTÃO (v1.0)
   Engenheiro Responsável: Gabriel Dias
   ============================================= */

// 1. Configuração do Firebase
var firebaseConfig = {
    apiKey: 'AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4',
    databaseURL: 'https://artigiano-app-default-rtdb.firebaseio.com'
};
firebase.initializeApp(firebaseConfig);
var db = firebase.database();

// 2. Inicialização da App Vue.js
var app = Vue.createApp({
    data: function() {
        return {
            // Estado de Acesso
            authenticated: false,
            userSelected: '',
            pinInput: '',
            loginError: false,
            currentTab: 'home',
            
            // Filtros e Pesquisa
            searchQuery: '',
            setorAtivo: 'Ver Tudo',
            
            // Submenus das Configurações
            sub: { equipe: false, catalogo: false, fornecedores: false, rota: false },

            // Dados da Equipa (Utilizadores)
            equipe: [
                { id: 1, nome: 'Gabriel (ADM)', cargo: 'ADM', pin: '1821', permissoes: ['insumos', 'historico', 'config'] },
                { id: 2, nome: 'Mayara', cargo: 'Gerente', pin: '2024', permissoes: ['insumos', 'historico'] },
                { id: 3, nome: 'Operador', cargo: 'Colaborador', pin: '0000', permissoes: ['insumos'] }
            ],

            // Base de Dados de Insumos (Catálogo Técnico)
            estoque: [
                { id: 101, nome: 'Farinha de Trigo 00', local: 'Estoque Seco', fornecedor: 'Atacadão', contato: '5543999999999', unQ: 'un', unC: 'kg', fator: 1, meta: 20, contagem: 0, obs: '', ignorar: false },
                { id: 102, nome: 'Tomate Pelati', local: 'Estoque Seco', fornecedor: 'Sacolão', contato: '5543888888888', unQ: 'un', unC: 'cx', fator: 12, meta: 5, contagem: 0, obs: '', ignorar: false },
                { id: 103, nome: 'Mussarela', local: 'Geladeira', fornecedor: 'Laticínios', contato: '5543777777777', unQ: 'un', unC: 'peça', fator: 1, meta: 10, contagem: 0, obs: '', ignorar: false }
            ],

            // Histórico (Máximo 50 itens)
            historico: [],
            
            // Configurações Globais
            config: {
                modoFeriado: false,
                rotaFisica: ['Geladeira', 'Freezer', 'Estoque Seco']
            }
        };
    },

    computed: {
        // Data formatada para o cabeçalho
        dataAtual: function() {
            return new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
        },

        // Identifica se o utilizador logado é Administrador
        isAdmin: function() {
            return this.userSelected && (this.userSelected.cargo === 'ADM' || this.userSelected.cargo === 'Gerente');
        },

        // Filtra a lista de insumos com base no setor e na busca
        insumosFiltrados: function() {
            var self = this;
            return this.estoque.filter(function(item) {
                var matchesSearch = item.nome.toLowerCase().indexOf(self.searchQuery.toLowerCase()) > -1;
                var matchesSetor = true;
                
                if (self.setorAtivo === 'Sacolão') {
                    matchesSetor = item.fornecedor.toLowerCase().includes('sacol') || item.fornecedor.toLowerCase().includes('horti');
                } else if (self.setorAtivo === 'Geral') {
                    matchesSetor = !item.fornecedor.toLowerCase().includes('sacol') && !item.fornecedor.toLowerCase().includes('horti');
                }
                
                return matchesSearch && matchesSetor;
            });
        },

        // Barra de progresso da contagem
        progresso: function() {
            var total = this.insumosFiltrados.length;
            if (total === 0) return 0;
            var contados = this.insumosFiltrados.filter(function(i) { return i.contagem > 0 || i.ignorar; }).length;
            return (contados / total) * 100;
        }
    },

    methods: {
        // Sistema de Login
        login: function() {
            var self = this;
            if (this.userSelected && this.pinInput === this.userSelected.pin) {
                this.authenticated = true;
                if (navigator.vibrate) navigator.vibrate(40);
            } else {
                this.loginError = true;
                if (navigator.vibrate) navigator.vibrate([50, 40, 50]);
                setTimeout(function() { self.loginError = false; self.pinInput = ''; }, 600);
            }
        },

        logout: function() {
            this.authenticated = false;
            this.currentTab = 'home';
            this.pinInput = '';
        },

        // Lógica de Permissões
        podeVer: function(modulo) {
            return this.userSelected && this.userSelected.permissoes.indexOf(modulo) > -1;
        },

        // Regra de Meta Dinâmica (Sexta e Feriado)
        getMetaAjustada: function(item) {
            var meta = parseFloat(item.meta) || 0;
            var hoje = new Date();
            
            // Regra: Triplica na Sexta para Sacolão
            if (hoje.getDay() === 5 && (item.fornecedor.toLowerCase().includes('sacol') || item.fornecedor.toLowerCase().includes('horti'))) {
                meta = meta * 3;
            }
            
            // Regra: Feriado (+50%)
            if (this.config.modoFeriado) {
                meta = meta * 1.5;
            }
            
            return meta;
        },

        // Motor de Cálculo de Necessidade (Com Conversão)
        calcularFalta: function(item) {
            if (item.ignorar) return 0;
            
            var contado = parseFloat(item.contagem) || 0;
            var meta = this.getMetaAjustada(item);
            var falta = meta - contado;
            
            if (falta <= 0) return 0;

            // Regra de Conversão: unQ != unC e fator > 1 divide, senão multiplica
            var fator = parseFloat(item.fator) || 1;
            if (item.unQ !== item.unC && fator > 1) {
                return (falta / fator).toFixed(1);
            } else {
                return (falta * fator).toFixed(1);
            }
        },

        // Estado Visual do Card (Vermelho/Verde)
        statusEstoque: function(item) {
            if (item.ignorar) return 'OK';
            return parseFloat(item.contagem) < this.getMetaAjustada(item) ? 'PEDIR' : 'OK';
        },

        // Envio de Pedidos e Agrupamento
        gerarPedido: function(modo) {
            var self = this;
            var pedidosPorFornecedor = {};
            var hojeStr = new Date().toLocaleString();

            this.estoque.forEach(function(item) {
                var qtdFalta = self.calcularFalta(item);
                if (qtdFalta > 0 && !item.ignorar) {
                    if (!pedidosPorFornecedor[item.fornecedor]) {
                        pedidosPorFornecedor[item.fornecedor] = {
                            zap: item.contato,
                            corpo: "🇮🇹 *PIZZERIA MASTER - PEDIDO*\n📅 " + hojeStr + "\n\n"
                        };
                    }
                    var obs = item.obs ? " _(" + item.obs + ")_" : "";
                    pedidosPorFornecedor[item.fornecedor].corpo += "- " + qtdFalta + " " + item.unC + " de " + item.nome + obs + "\n";
                }
            });

            // Executar Envio e Guardar no Histórico
            for (var f in pedidosPorFornecedor) {
                var p = pedidosPorFornecedor[f];
                
                // Adicionar ao Histórico (Máximo 50)
                this.historico.unshift({
                    data: hojeStr,
                    fornecedor: f,
                    conteudo: p.corpo,
                    rascunho: (modo === 'rascunho')
                });
                if (this.historico.length > 50) this.historico.pop();

                // Se for WhatsApp, abre a API
                if (modo === 'whatsapp') {
                    window.open("https://api.whatsapp.com/send?phone=" + p.zap + "&text=" + encodeURIComponent(p.corpo));
                }
            }
            
            alert(modo === 'whatsapp' ? 'Pedidos enviados para o WhatsApp!' : 'Guardado para Segunda!');
            if (navigator.vibrate) navigator.vibrate(100);
        },

        // Gestão de Configurações
        toggleSub: function(chave) {
            this.sub[chave] = !this.sub[chave];
        },

        removerHistorico: function(index) {
            if (confirm('Tem certeza que deseja apagar este registo?')) {
                this.historico.splice(index, 1);
            }
        }
    }
}).mount('#app');
