var firebaseConfig = { 
    apiKey: "AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4", 
    authDomain: "artigiano-app.firebaseapp.com", 
    databaseURL: "https://artigiano-app-default-rtdb.firebaseio.com", 
    projectId: "artigiano-app", 
    storageBucket: "artigiano-app.firebasestorage.app", 
    messagingSenderId: "212218495726", 
    appId: "1:212218495726:web:dd6fec7a4a8c7ad572a9ff" 
};

var db;
try { firebase.initializeApp(firebaseConfig); db = firebase.database(); db.ref().keepSynced(true); } catch(e) { console.error(e); }

Vue.createApp({
    data: function() {
        return {
            loadingInicial: true, sessaoAtiva: false, usuarioLogado: null,
            loginUser: '', loginPass: '', msgAuth: '', moduloAtivo: null,
            sobraMassa: 0, offline: !navigator.onLine, mostrandoHistorico: false,
            usuarios: [], feriados: [], logs: [], config: { metas: { semana: 60, fds: 100 } }
        };
    },
    computed: {
        semanaFeriado: function() {
            var self = this; var hoje = new Date();
            return this.feriados.some(function(f) {
                var df = new Date(f.data);
                var diff = (df - hoje) / (1000 * 60 * 60 * 24);
                return diff >= 0 && diff <= 7;
            });
        },
        metaDia: function() {
            var d = new Date().getDay();
            var base = (d === 0 || d >= 5) ? 100 : 60;
            return this.semanaFeriado ? Math.round(base * 1.2) : base;
        },
        qtdProduzir: function() { return Math.max(0, this.metaDia - this.sobraMassa); },
        receitaExibida: function() {
            var q = this.qtdProduzir;
            var aguaTotal = q * 83.1;
            return {
                far: (q * 133.3).toFixed(0),
                aguaLiq: (aguaTotal * 0.7).toFixed(0),
                gelo: (aguaTotal * 0.3).toFixed(0),
                lev: (q * 6).toFixed(0),
                sal: (q * 4).toFixed(0)
            };
        }
    },
    methods: {
        registrarAuditoria: function(acao) {
            if(!this.usuarioLogado) return;
            db.ref('system/auditoria').push({
                data: new Date().toLocaleString(),
                usuario: this.usuarioLogado.nome,
                acao: acao
            });
        },
        fazerLogin: function() {
            var self = this;
            var user = self.usuarios.find(function(u) { return u.user === self.loginUser && u.pass === self.loginPass; });
            if(user) {
                self.usuarioLogado = user; self.sessaoAtiva = true;
                localStorage.setItem('artigiano_session', JSON.stringify(user));
                self.registrarAuditoria("Login realizado");
            } else { self.msgAuth = "Erro de acesso"; }
        },
        logout: function() { 
            localStorage.removeItem('artigiano_session');
            location.reload();
        },
        gerarPDF: function() {
            var doc = new jspdf.jsPDF(); var self = this;
            doc.text("Artigiano V60.6 - Ficha de Massa", 14, 20);
            var data = [
                ["Farinha", self.receitaExibida.far+"g"],
                ["Agua Liq (70%)", self.receitaExibida.aguaLiq+"g"],
                ["Gelo (30%)", self.receitaExibida.gelo+"g"],
                ["Levain", self.receitaExibida.lev+"g"],
                ["Sal", self.receitaExibida.sal+"g"]
            ];
            doc.autoTable({ startY: 30, head: [['Item', 'Qtd']], body: data });
            doc.save("Producao.pdf");
            this.registrarAuditoria("PDF gerado");
        },
        registrarMassa: function() {
            db.ref('store/dough_history').push({
                data: new Date().toLocaleString(),
                qtd: this.qtdProduzir,
                usuario: this.usuarioLogado.nome
            });
            this.registrarAuditoria("Massa registrada: " + this.qtdProduzir + "un");
            alert("Massa salva!");
        }
    },
    mounted: function() {
        var self = this;
        db.ref('system/users').on('value', function(s) { self.usuarios = Object.values(s.val() || {}); });
        db.ref('system/feriados').on('value', function(s) { self.feriados = Object.values(s.val() || {}); });
        db.ref('system/auditoria').limitToLast(20).on('value', function(s) {
            var arr = []; s.forEach(function(c) { arr.push(c.val()); });
            self.logs = arr.reverse();
        });
        
        var session = localStorage.getItem('artigiano_session');
        if(session) { this.usuarioLogado = JSON.parse(session); this.sessaoAtiva = true; }
        
        setTimeout(function() { self.loadingInicial = false; }, 2000);
        window.addEventListener('online', function() { self.offline = false; });
        window.addEventListener('offline', function() { self.offline = true; });
    }
}).mount('#app');