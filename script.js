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
            loginUser: '', loginPass: '', msgAuth: '', isError: false, loadingAuth: false,
            abaAtual: 'estoque', filtroCat: 'Geral', sobraMassa: 0, fichaTecnica: null,
            mostrandoHistorico: false, mostrandoAjuda: false, mostrandoTermos: false,
            offline: !navigator.onLine, historicoAuditoria: [],
            itens: [], feriados: [], usuarios: [], categorias: ['Hortifruti', 'Geral', 'Bebidas', 'Limpeza'],
            config: { destinos: [], metas: { semana: 40, fds: 60 }, rota: ['Geral'] }
        }
    },
    computed: {
        itensFiltrados() { return this.itens.filter(i => i.categoria === this.filtroCat); }
    },
    methods: {
        // --- AUDITORIA ---
        registrarAuditoria(acao, detalhe) {
            if (!this.usuarioLogado) return;
            db.ref('auditoria').push({
                data: new Date().toLocaleString('pt-BR'),
                usuario: this.usuarioLogado.nome,
                acao: acao, detalhe: detalhe,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
        },

        // --- PDF ---
        gerarPDFProducao() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            doc.setFillColor(196, 30, 58); doc.rect(0, 0, 210, 30, 'F');
            doc.setTextColor(255, 255, 255); doc.setFontSize(20);
            doc.text("ARTIGIANO - FICHA TÉCNICA", 14, 20);
            doc.setTextColor(0, 0, 0); doc.setFontSize(10);
            doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')} | Resp: ${this.usuarioLogado.nome}`, 14, 40);
            
            const rows = [
                ["Farinha", `${this.fichaTecnica.farinha}g`], ["Água", `${this.fichaTecnica.agua}ml`],
                ["Gelo", `${this.fichaTecnica.gelo}g`], ["Levain", `${this.fichaTecnica.levain}g`], ["Sal", `${this.fichaTecnica.sal}g`]
            ];
            doc.autoTable({ startY: 45, head: [['Ingrediente', 'Qtd']], body: rows, headStyles: { fillColor: [196, 30, 58] } });
            doc.save(`Artigiano_Producao_${new Date().getTime()}.pdf`);
            this.registrarAuditoria("PDF", "Gerou relatório de produção");
        },

        // --- CÁLCULOS ORIGINAIS ---
        calcularProducao() {
            const hoje = new Date();
            const dia = hoje.getDay();
            const eFeriado = this.feriados.some(f => f.data === hoje.toISOString().split('T')[0]);
            let meta = (dia === 0 || dia >= 5 || eFeriado) ? this.config.metas.fds : this.config.metas.semana;
            let bolas = Math.max(0, meta - this.sobraMassa);
            
            // Suas constantes exatas
            this.fichaTecnica = {
                farinha: Math.round(bolas * 105.8), agua: Math.round(bolas * 56.4),
                gelo: Math.round(bolas * 10), levain: Math.round(bolas * 21.1), sal: Math.round(bolas * 3.1)
            };
        },

        fazerLogin() {
            this.loadingAuth = true;
            const u = this.usuarios.find(x => x.user === this.loginUser && x.pass === this.loginPass);
            if(u) {
                this.usuarioLogado = u; this.sessaoAtiva = true;
                localStorage.setItem('artigiano_session', JSON.stringify(u));
                this.registrarAuditoria("Login", "Acesso ao sistema");
            } else { this.msgAuth = "Usuário ou senha inválidos"; this.isError = true; }
            this.loadingAuth = false;
        },

        logout() {
            this.registrarAuditoria("Logout", "Saiu do sistema");
            this.sessaoAtiva = false; localStorage.removeItem('artigiano_session');
        },

        toggleFalta(item) {
            item.falta = !item.falta;
            db.ref(`itens/${item.id}`).update({ falta: item.falta });
            this.registrarAuditoria("Estoque", `${item.nome} -> ${item.falta ? 'Falta' : 'Ok'}`);
        },

        carregarDados() {
            db.ref('itens').on('value', s => { 
                const d = s.val(); 
                this.itens = d ? Object.keys(d).map(k => ({id: k, ...d[k]})) : []; 
            });
            db.ref('usuarios').on('value', s => this.usuarios = Object.values(s.val() || {}));
            db.ref('config').on('value', s => this.config = s.val() || this.config);
            db.ref('feriados').on('value', s => this.feriados = Object.values(s.val() || {}));
            db.ref('auditoria').limitToLast(50).on('value', s => {
                this.historicoAuditoria = s.val() ? Object.values(s.val()).reverse() : [];
            });
            this.loadingInicial = false;
        },

        alternarTema() {
            this.temaEscuro = !this.temaEscuro;
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('artigiano_theme', this.temaEscuro ? 'dark' : 'light');
        }
    },
    mounted() {
        this.carregarDados();
        const s = localStorage.getItem('artigiano_session');
        if(s) { this.usuarioLogado = JSON.parse(s); this.sessaoAtiva = true; }
        if(localStorage.getItem('artigiano_theme') === 'dark') this.alternarTema();
        
        window.addEventListener('online', () => this.offline = false);
        window.addEventListener('offline', () => this.offline = true);
        if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
    }
}).mount('#app');
