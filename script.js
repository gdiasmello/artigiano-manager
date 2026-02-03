const app = Vue.createApp({
    data() {
        return {
            auth: false,
            tab: 'home',
            subTab: 'itens',
            lembrar: false,
            loginForm: { nome: '', pin: '' },
            userSelected: null,
            loginError: false,
            setorAtivo: '',
            
            estoque: [],
            equipe: [],
            fornecedores: [],
            
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
            const n = this.loginForm.nome.toUpperCase();
            const p = this.loginForm.pin;

            if (n === 'GABRIEL' && p === '1821') {
                this.userSelected = { nome: 'GABRIEL', cargo: 'ADM', modulos: ['Sacolão', 'Limpeza', 'Gelo', 'Geral'] };
                this.auth = true;
                this.playSuccess();
                if (this.lembrar) localStorage.setItem('pm_remember', n);
                this.saveHibrido();
            } else {
                this.loginError = true;
                this.vibrate(500);
                setTimeout(() => this.loginError = false, 500);
            }
        },

        getMetaFinal(i) {
            let meta = parseFloat(i.meta) || 0;
            const f = this.fornecedores.find(x => x.id === i.destinoId);
            if (this.sextaFeira && f && f.nome.toUpperCase().includes('SACOLÃO')) return meta * 3;
            return meta;
        },

        calcFalta(i) {
            const meta = this.getMetaFinal(i);
            const falta = meta - (parseFloat(i.contagem) || 0);
            return falta > 0 ? Math.ceil(falta / (i.fator || 1)) : 0;
        },

        podeVer(bloco) { return this.isAdmin || (this.userSelected.modulos && this.userSelected.modulos.includes(bloco)); },

        abrirSetor(s) {
            this.playClick();
            this.setorAtivo = s;
            this.tab = 'contagem';
        },

        enviarZap(f) {
            this.playSuccess();
            const itens = this.estoque.filter(i => i.destinoId === f.id && this.calcFalta(i) > 0);
            let txt = `*PEDIDO PIZZERIA MASTER*\n*FORN:* ${f.nome}\n\n`;
            itens.forEach(i => { txt += `✅ ${this.calcFalta(i)}${i.unC} - ${i.nome}\n`; });
            window.open(`https://api.whatsapp.com/send?phone=${f.zap}&text=${encodeURIComponent(txt)}`);
        },

        saveHibrido() {
            const data = { estoque: this.estoque, equipe: this.equipe, fornecedores: this.fornecedores };
            localStorage.setItem('pizzeria_master_data', JSON.stringify(data));
        },

        loadHibrido() {
            const local = localStorage.getItem('pizzeria_master_data');
            if (local) {
                const p = JSON.parse(local);
                this.estoque = p.estoque; this.equipe = p.equipe; this.fornecedores = p.fornecedores;
            } else {
                // Mock inicial
                this.fornecedores = [{id: 1, nome: 'SACOLÃO CENTRAL', zap: '554399999999'}];
                this.estoque = [{id: 10, nome: 'TOMATE', destinoId: 1, local: 'Geladeira', unQ: 'KG', unC: 'CX', fator: 20, meta: 20, contagem: 0}];
                this.equipe = [{id: 100, nome: 'MAYARA', cargo: 'COLABORADOR', pin: '1234', modulos: ['Sacolão']}];
            }
        },
        logout() { this.auth = false; localStorage.removeItem('pm_remember'); }
    },
    mounted() {
        this.loadHibrido();
        const r = localStorage.getItem('pm_remember');
        if (r) { this.loginForm.nome = r; this.lembrar = true; }
    }
}).mount('#app');
