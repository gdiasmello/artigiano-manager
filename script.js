const firebaseConfig = { 
    apiKey: "AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4", 
    authDomain: "artigiano-app.firebaseapp.com", 
    databaseURL: "https://artigiano-app-default-rtdb.firebaseio.com", 
    projectId: "artigiano-app", 
    storageBucket: "artigiano-app.firebasestorage.app", 
    messagingSenderId: "212218495726", 
    appId: "1:212218495726:web:dd6fec7a4a8c7ad572a9ff" 
};

let db; try { firebase.initializeApp(firebaseConfig); db = firebase.database(); db.ref().keepSynced(true); } catch (e) { console.error(e); }

const { createApp } = Vue

createApp({
    data() {
        return {
            loadingInicial: true, temaEscuro: false, sessaoAtiva: false, usuarioLogado: null,
            moduloAtivo: null, sobraMassa: 0, itens: [], feriados: [], usuarios: [],
            config: { destinos: [], rota: ['Freezer', 'Geladeira'], metas: { semana: 40, fds: 60 } },
            mostrandoHistorico: false, historicoAuditoria: [], offline: !navigator.onLine,
            loginUser: '', loginPass: '', msgAuth: '', loadingAuth: false, isError: false
            // ... adicione aqui as outras variáveis do seu data() original
        }
    },
    computed: {
        qtdProduzir() {
            const dia = new Date().getDay();
            const meta = (dia === 0 || dia >= 5) ? this.config.metas.fds : this.config.metas.semana;
            return Math.max(0, meta - this.sobraMassa);
        },
        receitaExibida() {
            const q = this.qtdProduzir;
            return {
                far: Math.round(q * 105.8), aguaTotal: Math.round(q * 56.4),
                lev: Math.round(q * 21.1), sal: Math.round(q * 3.1)
            }
        }
    },
    methods: {
        registrarAuditoria(acao, detalhe) {
            if (!this.usuarioLogado) return;
            db.ref('auditoria').push({
                data: new Date().toLocaleString('pt-BR'),
                usuario: this.usuarioLogado.nome,
                acao: acao, detalhe: detalhe,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
        },

        gerarPDFProducao() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            doc.setFontSize(18); doc.text("ARTIGIANO - PRODUÇÃO", 14, 20);
            doc.setFontSize(10); doc.text(`Data: ${new Date().toLocaleDateString()}`, 14, 30);
            
            const rows = [
                ["Farinha", this.receitaExibida.far + "g"],
                ["Água", this.receitaExibida.aguaTotal + "ml"],
                ["Levain", this.receitaExibida.lev + "g"],
                ["Sal", this.receitaExibida.sal + "g"]
            ];
            doc.autoTable({ startY: 35, head: [['Item', 'Qtd']], body: rows });
            doc.save("Producao_Artigiano.pdf");
            this.registrarAuditoria("PDF", "Gerou ficha de produção");
        },

        fazerLogin() {
            this.loadingAuth = true;
            // Sua lógica de buscar no db.ref('usuarios')
            const u = this.usuarios.find(x => x.user === this.loginUser && x.pass === this.loginPass);
            if(u) {
                this.usuarioLogado = u; this.sessaoAtiva = true;
                localStorage.setItem('artigiano_session', JSON.stringify(u));
                this.registrarAuditoria("Login", "Entrou no app");
            } else { this.msgAuth = "Erro"; this.isError = true; }
            this.loadingAuth = false;
        },

        registrarProducao() {
            const reg = { data: new Date().toLocaleString(), qtd: this.qtdProduzir, user: this.usuarioLogado.nome };
            db.ref('historicoMassa').push(reg);
            this.registrarAuditoria("Produção", `Registrou ${this.qtdProduzir} bolas`);
            alert("Salvo!");
        },

        carregarDados() {
            db.ref('itens').on('value', s => this.itens = s.val() || []);
            db.ref('usuarios').on('value', s => this.usuarios = Object.values(s.val() || {}));
            db.ref('auditoria').limitToLast(50).on('value', s => {
                this.historicoAuditoria = s.val() ? Object.values(s.val()).reverse() : [];
            });
            this.loadingInicial = false;
        }
    },
    mounted() {
        this.carregarDados();
        window.addEventListener('online', () => this.offline = false);
        window.addEventListener('offline', () => this.offline = true);
        if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
    }
}).mount('#app');
