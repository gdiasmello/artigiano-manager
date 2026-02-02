const firebaseConfig = { apiKey: "AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4", authDomain: "artigiano-app.firebaseapp.com", databaseURL: "https://artigiano-app-default-rtdb.firebaseio.com", projectId: "artigiano-app", storageBucket: "artigiano-app.firebasestorage.app", messagingSenderId: "212218495726", appId: "1:212218495726:web:dd6fec7a4a8c7ad572a9ff" };

let db; try { firebase.initializeApp(firebaseConfig); db = firebase.database(); db.ref().keepSynced(true); } catch (e) { console.error(e); }

const { createApp } = Vue

createApp({
    data() {
        return {
            loadingInicial: true, temaEscuro: false, sessaoAtiva: false, usuarioLogado: null,
            moduloAtivo: null, sobraMassa: 0, itens: [], feriados: [], usuarios: [],
            config: { destinos: [], rota: ['Freezer', 'Geladeira'], metas: { semana: 40, fds: 60 } },
            mostrandoHistorico: false, offline: !navigator.onLine, historicoAuditoria: [],
            loginUser: '', loginPass: '', msgAuth: '', loadingAuth: false, isError: false
            // Mantenha todas as outras variáveis do seu data() original aqui
        }
    },
    computed: {
        // MANTENHA SUAS COMPUTED ORIGINAIS
        metaDia() { 
            const d = new Date().getDay(); 
            const eFeriado = this.feriados.some(f => f.data === new Date().toISOString().split('T')[0]);
            return (d === 0 || d >= 5 || eFeriado) ? this.config.metas.fds : this.config.metas.semana;
        },
        qtdProduzir() { return Math.max(0, this.metaDia - this.sobraMassa); },
        receitaExibida() {
            const q = this.qtdProduzir;
            return {
                far: Math.round(q * 105.8), aguaTotal: Math.round(q * 56.4),
                lev: Math.round(q * 21.1), sal: Math.round(q * 3.1)
            };
        }
    },
    methods: {
        // NOVO: REGISTRAR LOGS
        registrarAuditoria(acao, detalhe) {
            if (!this.usuarioLogado) return;
            db.ref('auditoria').push({
                data: new Date().toLocaleString('pt-BR'),
                usuario: this.usuarioLogado.nome,
                acao: acao, detalhe: detalhe,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
        },

        // NOVO: GERAR PDF
        gerarPDFProducao() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            doc.setFillColor(196, 30, 58); doc.rect(0, 0, 210, 30, 'F');
            doc.setTextColor(255, 255, 255); doc.setFontSize(18);
            doc.text("ARTIGIANO - FICHA DE PRODUÇÃO", 14, 20);
            doc.setTextColor(0, 0, 0); doc.setFontSize(10);
            doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')} | Resp: ${this.usuarioLogado.nome}`, 14, 40);
            
            const rows = [
                ["Farinha", this.receitaExibida.far + "g"],
                ["Água Total", this.receitaExibida.aguaTotal + "ml"],
                ["Levain", this.receitaExibida.lev + "g"],
                ["Sal", this.receitaExibida.sal + "g"]
            ];
            doc.autoTable({ startY: 45, head: [['Ingrediente', 'Quantidade']], body: rows, headStyles: {fillColor:[196,30,58]} });
            doc.save(`Producao_${new Date().getTime()}.pdf`);
            this.registrarAuditoria("Relatório", "Gerou PDF de Produção");
        },

        // MANTENHA SUAS FUNÇÕES ORIGINAIS E ADICIONE O REGISTRO DE AUDITORIA NELAS
        fazerLogin() {
            const u = this.usuarios.find(x => x.user === this.loginUser && x.pass === this.loginPass);
            if(u) {
                this.usuarioLogado = u; this.sessaoAtiva = true;
                localStorage.setItem('artigiano_session', JSON.stringify(u));
                this.registrarAuditoria("Acesso", "Fez login no sistema");
            } else { this.msgAuth = "Erro de login"; }
        },

        registrarProducao() {
            // Sua lógica original de salvar historicoMassa...
            this.registrarAuditoria("Massa", `Registrou produção de ${this.qtdProduzir} un`);
            alert("Produção salva!");
        },

        carregarDados() {
            // Suas referências do Firebase...
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
