var firebaseConfig = { apiKey: "AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4", authDomain: "artigiano-app.firebaseapp.com", databaseURL: "https://artigiano-app-default-rtdb.firebaseio.com", projectId: "artigiano-app", storageBucket: "artigiano-app.firebasestorage.app", messagingSenderId: "212218495726", appId: "1:212218495726:web:dd6fec7a4a8c7ad572a9ff" };

var db; try { firebase.initializeApp(firebaseConfig); db = firebase.database(); db.ref().keepSynced(true); } catch (e) { console.error(e); }

Vue.createApp({
    data: function() {
        return {
            loadingInicial: true, temaEscuro: false, sessaoAtiva: false, usuarioLogado: null,
            moduloAtivo: null, sobraMassa: 0, itens: [], feriados: [], usuarios: [],
            config: { destinos: [], rota: ['Freezer', 'Geladeira'], metas: { semana: 60, fds: 100 } },
            mostrandoHistorico: false, offline: !navigator.onLine, historicoAuditoria: [],
            loginUser: '', loginPass: '', msgAuth: '', loadingAuth: false, isError: false,
            // Outras variáveis originais...
        }
    },
    computed: {
        metaDia: function() {
            var d = new Date().getDay();
            var hojeISO = new Date().toISOString().split('T')[0];
            var eFeriado = this.feriados.some(function(f) { return f.data === hojeISO; });
            var metaBase = (d === 0 || d >= 5 || eFeriado) ? 100 : 60;
            return metaBase; // Aplique aqui o cálculo de +20% se for semana de feriado conforme sua regra
        },
        qtdProduzir: function() { return Math.max(0, this.metaDia - this.sobraMassa); },
        receitaExibida: function() {
            var q = this.qtdProduzir;
            return {
                far: Math.round(q * 133.3), agua: Math.round(q * 58.2),
                gelo: Math.round(q * 24.9), lev: Math.round(q * 6), sal: Math.round(q * 4)
            };
        }
    },
    methods: {
        registrarAuditoria: function(acao, detalhe) {
            if (!this.usuarioLogado) return;
            db.ref('system/auditoria').push({
                data: new Date().toLocaleString('pt-BR'),
                usuario: this.usuarioLogado.nome,
                acao: acao, detalhe: detalhe,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
        },
        gerarPDFProducao: function() {
            var doc = new jspdf.jsPDF();
            var self = this;
            doc.setFillColor(196, 30, 58); doc.rect(0, 0, 210, 30, 'F');
            doc.setTextColor(255, 255, 255); doc.setFontSize(18);
            doc.text("ARTIGIANO - FICHA TÉCNICA", 14, 20);
            
            var rows = [
                ["Farinha", self.receitaExibida.far + "g"],
                ["Água Líquida", self.receitaExibida.agua + "g"],
                ["Gelo", self.receitaExibida.gelo + "g"],
                ["Levain", self.receitaExibida.lev + "g"],
                ["Sal", self.receitaExibida.sal + "g"]
            ];
            doc.autoTable({ startY: 40, head: [['Ingrediente', 'Qtd']], body: rows, headStyles: {fillColor:[196,30,58]} });
            doc.save("Producao_Artigiano.pdf");
            this.registrarAuditoria("Relatório", "Gerou PDF de Produção");
        },
        fazerLogin: function() {
            var self = this;
            var u = self.usuarios.find(function(x) { return x.user === self.loginUser && x.pass === self.loginPass; });
            if(u) {
                self.usuarioLogado = u; self.sessaoAtiva = true;
                localStorage.setItem('artigiano_session', JSON.stringify(u));
                self.registrarAuditoria("Login", "Acessou o sistema");
            } else { self.msgAuth = "Incorreto"; self.isError = true; }
        },
        carregarDados: function() {
            var self = this;
            db.ref('system/users').on('value', function(s) { self.usuarios = Object.values(s.val() || {}); });
            db.ref('system/auditoria').limitToLast(50).on('value', function(s) {
                var logs = s.val() ? Object.values(s.val()) : [];
                self.historicoAuditoria = logs.reverse();
            });
            self.loadingInicial = false;
        }
    },
    mounted: function() {
        this.carregarDados();
        var self = this;
        window.addEventListener('online', function() { self.offline = false; });
        window.addEventListener('offline', function() { self.offline = true; });
        if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }
    }
}).mount('#app');
