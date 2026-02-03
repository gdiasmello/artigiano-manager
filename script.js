const app = Vue.createApp({
    data() {
        return {
            auth: false, tab: 'home', lembrar: false,
            loginForm: { nome: '', pin: '' },
            userSelected: null, loginError: false, setorAtivo: '',
            estoque: [], equipe: [], fornecedores: [],
            rota: ['GELADEIRA', 'FREEZER', 'ESTOQUE SECO'],
            config: { feriado: false },
            sextaFeira: new Date().getDay() === 5
        }
    },
    computed: {
        dataAtual() { return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' }); },
        saudacao() { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; },
        isAdmin() { return this.userSelected?.cargo === 'ADM'; },
        blocosDisponiveis() {
            const todos = [
                { nome: 'Sacolão', emoji: '🍎', cor: '#008C45' },
                { nome: 'Limpeza', emoji: '🧼', cor: '#007AFF' },
                { nome: 'Gelo', emoji: '🧊', cor: '#5AC8FA' },
                { nome: 'Geral', emoji: '📦', cor: '#8E8E93' }
            ];
            return this.isAdmin ? todos : todos.filter(b => this.userSelected.modulos.includes(b.nome));
        },
        insumosOrdenados() {
            let filtrados = this.estoque.filter(i => {
                const f = this.fornecedores.find(x => x.id === i.destinoId);
                if (this.setorAtivo === 'Sacolão') return f?.nome.includes('SACOLÃO');
                return i.local === this.setorAtivo || this.setorAtivo === 'Geral';
            });
            return filtrados.sort((a, b) => this.rota.indexOf(a.local) - this.rota.indexOf(b.local));
        },
        fornecedoresComPedido() {
            const ids = [...new Set(this.estoque.filter(i => this.calcFalta(i) > 0).map(i => i.destinoId))];
            return this.fornecedores.filter(f => ids.includes(f.id));
        }
    },
    methods: {
        playClick() { document.getElementById('snd-click').play().catch(()=>{}); },
        playSuccess() { document.getElementById('snd-success').play().catch(()=>{}); },
        handleLogin() {
            const n = this.loginForm.nome.toUpperCase();
            if (n === 'GABRIEL' && this.loginForm.pin === '1821') {
                this.userSelected = { nome: 'GABRIEL', cargo: 'ADM' };
                this.auth = true; this.playSuccess();
                if (this.lembrar) localStorage.setItem('pm_rem', n);
                this.saveHibrido();
            } else { this.loginError = true; setTimeout(() => this.loginError = false, 500); }
        },
        getMetaFinal(i) {
            let m = parseFloat(i.meta) || 0;
            if (this.config.feriado) m *= 1.5;
            const f = this.fornecedores.find(x => x.id === i.destinoId);
            if (this.sextaFeira && f?.regraSexta) m *= 3;
            return Math.ceil(m);
        },
        calcFalta(i) {
            const f = this.getMetaFinal(i) - (parseFloat(i.contagem) || 0);
            return f > 0 ? Math.ceil(f / (i.fator || 1)) : 0;
        },
        abrirSetor(s) { this.playClick(); this.setorAtivo = s; this.tab = 'contagem'; },
        moverRota(idx, dir) {
            const nIdx = idx + dir;
            if (nIdx >= 0 && nIdx < this.rota.length) {
                [this.rota[idx], this.rota[nIdx]] = [this.rota[nIdx], this.rota[idx]];
                this.saveHibrido();
            }
        },
        enviarZap(f) {
            const itens = this.estoque.filter(i => i.destinoId === f.id && this.calcFalta(i) > 0);
            let txt = `*PEDIDO PIZZERIA MASTER*\n\n`;
            itens.forEach(i => txt += `✅ ${this.calcFalta(i)}${i.unC} - ${i.nome}\n`);
            window.open(`https://api.whatsapp.com/send?phone=${f.zap}&text=${encodeURIComponent(txt)}`);
        },
        saveHibrido() { localStorage.setItem('pm_data', JSON.stringify({ e: this.estoque, f: this.fornecedores, r: this.rota, c: this.config })); },
        loadHibrido() {
            const d = JSON.parse(localStorage.getItem('pm_data'));
            if (d) { this.estoque = d.e; this.fornecedores = d.f; this.rota = d.r; this.config = d.c; }
            else {
                this.fornecedores = [{id: 1, nome: 'SACOLÃO CENTRAL', zap: '554399999999', regraSexta: true}];
                this.estoque = [{id: 10, nome: 'TOMATE', destinoId: 1, local: 'GELADEIRA', unQ: 'KG', unC: 'CX', fator: 20, meta: 20, contagem: 0}];
            }
        },
        logout() { this.auth = false; localStorage.removeItem('pm_rem'); }
    },
    mounted() {
        this.loadHibrido();
        const r = localStorage.getItem('pm_rem');
        if (r) { this.loginForm.nome = r; this.lembrar = true; }
    }
}).mount('#app');
