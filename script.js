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
            sessaoAtiva: false, usuarioLogado: null, temaEscuro: false,
            loginUser: '', loginPass: '', msgAuth: '', loadingAuth: false,
            moduloAtivo: null, termoBusca: '', produtos: [], usuarios: [], 
            config: { destinos: [], rota: ['Geral'], cores: { hortifruti: '#10B981', geral: '#3B82F6', bebidas: '#EF4444', limpeza: '#8B5CF6' } },
            feriados: [], historico: [], sobraMassa: 0
        }
    },
    computed: {
        nomeModulo: function() {
            var n = { hortifruti: 'Hortifruti', geral: 'Geral', bebidas: 'Bebidas', limpeza: 'Limpeza', producao: 'Massas' };
            return n[this.moduloAtivo] || '';
        },
        locaisDoModulo: function() {
            var self = this;
            var r = this.config.rota || ['Geral'];
            return r.filter(function(l) {
                return self.produtos.some(function(p) { return p.categoria === self.moduloAtivo && p.locais && p.locais.indexOf(l) !== -1; });
            });
        },
        itensParaPedir: function() {
            var self = this;
            return this.produtos.filter(function(p) { return !p.ignorar && self.calculaFalta(p).qtd > 0; });
        },
        contagemCarrinho: function() { return this.itensParaPedir.length; }
    },
    methods: {
        produtosDoLocal: function(local) {
            var self = this;
            return this.produtos.filter(function(p) {
                var matchesBusca = self.termoBusca ? p.nome.toLowerCase().indexOf(self.termoBusca.toLowerCase()) !== -1 : true;
                return p.categoria === self.moduloAtivo && p.locais && p.locais.indexOf(local) !== -1 && matchesBusca;
            });
        },
        calculaFalta: function(p) {
            var total = 0;
            if(p.contagem) {
                Object.values(p.contagem).forEach(function(v) { total += (parseFloat(v) || 0); });
            }
            if(p.temAberto) total += 0.5;
            
            var estoqueReal = (p.tipoConversao === 'multiplicar') ? total * (p.fator || 1) : total / (p.fator || 1);
            var metaFinal = parseFloat(p.meta || 0);
            if(this.isSemanaFeriado) metaFinal *= 1.2;
            
            var falta = metaFinal - estoqueReal;
            return { qtd: falta > 0 ? Math.ceil(falta * 10) / 10 : 0 };
        },
        enviarZap: function(destId, itens) {
            var self = this;
            var d = this.config.destinos.find(function(x) { return x.id == destId; });
            var texto = "*PEDIDO ARTIGIANO*\n\n";
            itens.forEach(function(i) { texto += i.texto + "\n"; });
            
            window.open("https://wa.me/" + (d ? d.telefone : "") + "?text=" + encodeURIComponent(texto));
            
            // Limpa contagens após enviar
            itens.forEach(function(i) {
                var p = self.produtos.find(function(x) { return x.id === i.id; });
                if(p) { p.contagem = {}; p.temAberto = false; self.salvarProdutoUnitario(p); }
            });
        },
        fazerLogin: function() {
            var self = this;
            if(this.loginUser.toLowerCase() === 'gabriel' && this.loginPass === '21gabriel') {
                var master = { nome: 'Gabriel', cargo: 'Gerente', permissoes: { admin: true, hortifruti: true, geral: true, bebidas: true, limpeza: true, producao: true, verHistorico: true } };
                this.logar(master); return;
            }
            var user = this.usuarios.find(function(u) { return u.user === self.loginUser && u.pass === self.loginPass; });
            if(user) this.logar(user); else alert("Usuário não encontrado!");
        },
        logar: function(u) { this.usuarioLogado = u; this.sessaoAtiva = true; localStorage.setItem('artigiano_session', JSON.stringify(u)); },
        carregarDb: function() {
            var self = this;
            if(!db) return;
            db.ref('store/products').on('value', function(s) { 
                self.produtos = s.val() ? Object.values(s.val()) : []; 
                document.getElementById('loading-screen').style.display = 'none';
                document.getElementById('app').style.display = 'block';
            });
            db.ref('system/users').on('value', function(s) { self.usuarios = s.val() ? Object.values(s.val()) : []; });
            db.ref('system/config').on('value', function(s) { if(s.val()) self.config = s.val(); });
        }
    },
    mounted: function() { this.carregarDb(); }
});
app.mount('#app');
