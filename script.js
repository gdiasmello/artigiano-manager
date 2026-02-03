const app = Vue.createApp({
    data() {
        return {
            auth: false,
            tab: 'home',
            loginForm: { nome: '', pin: '' },
            userSelected: null,
            loginError: false,
            setorAtivo: '',
            
            // BANCO DE DADOS
            equipe: [],
            estoque: [],
            fornecedores: [],
            
            // INTELIGÊNCIA
            sextaFeira: new Date().getDay() === 5
        }
    },
    computed: {
        isAdmin() { return this.userSelected && this.userSelected.cargo === 'ADM'; },
        dataAtual() { return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }); },
        saudacao() {
            const h = new Date().getHours();
            return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
        },
        insumosFiltrados() {
            return this.estoque.filter(i => {
                const f = this.fornecedores.find(x => x.id === i.destinoId);
                if (this.setorAtivo === 'Sacolão') return f && f.nome.toUpperCase().includes('SACOLÃO');
                if (this.setorAtivo === 'Limpeza') return i.local === 'Limpeza' || i.nome.toUpperCase().includes('LIMPEZA');
                if (this.setorAtivo === 'Gelo') return i.local === 'Gelo' || i.nome.toUpperCase().includes('GELO');
                return i.local === this.setorAtivo || this.setorAtivo === 'Geral';
            });
        },
        totalFaltantes() { return this.estoque.filter(i => this.calcFalta(i) > 0).length; },
        fornecedoresComPedido() {
            const ids = [...new Set(this.estoque.filter(i => this.calcFalta(i) > 0).map(i => i.destinoId))];
            return this.fornecedores.filter(f => ids.includes(f.id));
        }
    },
    methods: {
        playClick() { document.getElementById('snd-click').play().catch(()=>{}); },
        playSuccess() { document.getElementById('snd-success').play().catch(()=>{}); },
        vibrate(ms) { if (navigator.vibrate) navigator.vibrate(ms); },

        handleLogin() {
            this.playClick();
            const n = this.loginForm.nome.toUpperCase();
            const p = this.loginForm.pin;

            // MASTER LOGIN GABRIEL 1821
            if (n === 'GABRIEL' && p === '1821') {
                this.userSelected = { nome: 'GABRIEL', cargo: 'ADM', modulos: ['Sacolão', 'Limpeza', 'Gelo', 'Geral'] };
                this.auth = true;
                this.playSuccess();
                this.saveHibrido();
                return;
            }

            // BUSCA NA EQUIPE
            const u = this.equipe.find(x => x.nome.toUpperCase() === n && x.pin === p);
            if (u) {
                this.userSelected = u;
                this.auth = true;
                this.playSuccess();
            } else {
                this.loginError = true;
                this.vibrate(500);
                setTimeout(() => this.loginError = false, 500);
            }
        },

        calcFalta(i) {
            let meta = parseFloat(i.meta) || 0;
            const forn = this.fornecedores.find(f => f.id === i.destinoId);
            
            // Regra de Sexta (3x Sacolão)
            if (this.sextaFeira && forn && forn.nome.toUpperCase().includes('SACOLÃO')) {
                meta *= 3;
            }

            const falta = meta - (parseFloat(i.contagem) || 0);
            return falta > 0 ? Math.ceil(falta / (i.fator || 1)) : 0;
        },

        podeAcessar(modulo) {
            return this.userSelected && this.userSelected.modulos.includes(modulo);
        },

        abrirSetor(s) {
            this.playClick();
            this.setorAtivo = s;
            this.tab = 'contagem';
        },

        saveHibrido() {
            this.vibrate(10);
            const data = {
                estoque: this.estoque,
                equipe: this.equipe,
                fornecedores: this.fornecedores,
                user: this.userSelected
            };
            localStorage.setItem('artigiano_v110', JSON.stringify(data));
            // Aqui entraria o db.ref('artigiano').set(data) se o Firebase estivesse configurado
        },

        loadHibrido() {
            const local = localStorage.getItem('artigiano_v110');
            if (local) {
                const p = JSON.parse(local);
                this.estoque = p.estoque || [];
                this.equipe = p.equipe || [];
                this.fornecedores = p.fornecedores || [];
                if (p.user) { this.userSelected = p.user; this.auth = true; }
            } else {
                // Mock inicial para você não entrar no app vazio
                this.fornecedores = [{id: 1, nome: 'Sacolão Central', zap: '554399999999', saudacao: 'Olá, segue pedido:'}];
                this.estoque = [{id: 10, nome: 'Tomate', destinoId: 1, local: 'Geladeira', unQ: 'kg', unC: 'cx', fator: 20, meta: 20, contagem: 0}];
            }
        },

        getItensForn(fid) { return this.estoque.filter(i => i.destinoId === fid && this.calcFalta(i) > 0); },

        enviarZap(f) {
            this.playSuccess();
            const itens = this.getItensForn(f.id);
            const lista = itens.map(i => `- ${this.calcFalta(i)} ${i.unC} de ${i.nome}`).join('\n');
            const texto = `*PEDIDO ARTIGIANO*\n\n${f.saudacao}\n\n${lista}`;
            window.open(`https://api.whatsapp.com/send?phone=${f.zap}&text=${encodeURIComponent(texto)}`);
        },

        exportarBackup() {
            const blob = new Blob([JSON.stringify(this.estoque, null, 2)], {type: "application/json"});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = "backup_artigiano.json"; a.click();
        },

        limparTudo() { if(confirm("Apagar tudo?")) { localStorage.clear(); location.reload(); } },
        logout() { this.auth = false; localStorage.removeItem('artigiano_session'); }
    },
    mounted() {
        this.loadHibrido();
    }
}).mount('#app');
