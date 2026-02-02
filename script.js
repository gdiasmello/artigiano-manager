var firebaseConfig = { 
    apiKey: "AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4", 
    authDomain: "artigiano-app.firebaseapp.com", 
    databaseURL: "https://artigiano-app-default-rtdb.firebaseio.com", 
    projectId: "artigiano-app" 
};

var db; try { firebase.initializeApp(firebaseConfig); db = firebase.database(); } catch (e) { console.error(e); }

var { createApp } = Vue;

var app = createApp({
    data: function() {
        return {
            loadingInicial: true, sessaoAtiva: false, 
            usuarioLogado: null, loginUser: '', loginPass: '',
            moduloAtivo: null, produtos: [], 
            mostrandoPreview: false, mostrandoConfig: false,
            config: { destinos: [] }
        }
    },
    computed: {
        nomeModulo: function() {
            var n = { hortifruti: 'Hortifruti', geral: 'Geral', bebidas: 'Bebidas', limpeza: 'Limpeza' };
            return n[this.moduloAtivo] || '';
        },
        produtosFiltrados: function() {
            var self = this;
            return this.produtos.filter(function(p) { return p.categoria === self.moduloAtivo; });
        },
        itensParaPedir: function() {
            var self = this;
            return this.produtos.filter(function(p) { return self.calculaFalta(p) > 0; });
        },
        contagemCarrinho: function() { return this.itensParaPedir.length; },
        pedidosAgrupados: function() {
            var grupos = {};
            var self = this;
            this.itensParaPedir.forEach(function(p) {
                var dId = p.destinoNome || 'Geral';
                if (!grupos[dId]) grupos[dId] = [];
                grupos[dId].push({ texto: "- " + self.calculaFalta(p) + " " + p.unC + " " + p.nome, id: p.id });
            });
            return grupos;
        }
    },
    methods: {
        calculaFalta: function(p) {
            var estoque = parseFloat(p.contagemTotal || 0);
            var meta = parseFloat(p.meta || 0);
            var fator = parseFloat(p.fator || 1);
            // Estoque real em caixas/kg
            var estoqueReal = (p.tipoConversao === 'multiplicar') ? estoque * fator : estoque / fator;
            var falta = meta - estoqueReal;
            return falta > 0 ? Math.ceil(falta * 10) / 10 : 0;
        },
        abrirModulo: function(m) { this.moduloAtivo = m; },
        salvarProduto: function(p) { if(db) db.ref('store/products/' + p.id).update({ contagemTotal: p.contagemTotal }); },
        enviarZap: function(fornecedor, itens) {
            var texto = "*PEDIDO ARTIGIANO - " + fornecedor.toUpperCase() + "*\n\n";
            itens.forEach(function(i) { texto += i.texto + "\n"; });
            window.open("https://wa.me/?text=" + encodeURIComponent(texto));
        },
        fazerLogin: function() {
            if(this.loginUser.toLowerCase() === 'gabriel' && this.loginPass === '21gabriel') {
                this.logar({ nome: 'Gabriel', cargo: 'Gerente' });
            } else { alert("Login incorreto."); }
        },
        logar: function(u) { this.usuarioLogado = u; this.sessaoAtiva = true; },
        carregarDb: function() {
            var self = this;
            if(!db) return;
            db.ref('store/products').on('value', function(s) { 
                self.produtos = s.val() ? Object.values(s.val()) : []; 
                self.loadingInicial = false; 
            });
        }
    },
    mounted: function() { this.carregarDb(); }
});
app.mount('#app');
