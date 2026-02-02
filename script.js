const app = Vue.createApp({
    data() {
        return {
            authenticated: false,
            termosAceitos: false,
            mostrarTermos: false,
            userSelected: '',
            pinInput: '',
            loginError: false,
            currentTab: 'home',
            setorAtivo: 'Ver Tudo',
            equipe: [
                { id: 1, nome: 'Gabriel', pin: '1821', cargo: 'ADM' },
                { id: 2, nome: 'Mayara', pin: '2024', cargo: 'Gerente' }
            ],
            estoque: [],
            historico: [],
            config: { modoFeriado: false },
            novoInsumo: { nome: '', unC: '', meta: 0, fornecedor: '', contagem: 0 }
        }
    },
    computed: {
        dataAtual() { return new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'short' }); },
        isAdmin() { return this.userSelected && this.userSelected.cargo === 'ADM'; },
        insumosFiltrados() {
            return this.estoque.filter(i => {
                if (this.setorAtivo === 'Sacolão') return i.fornecedor.toLowerCase().includes('sacol');
                if (this.setorAtivo === 'Limpeza') return i.nome.toLowerCase().includes('limpeza') || i.fornecedor.toLowerCase().includes('limpeza');
                return true;
            });
        }
    },
    created() {
        const localData = localStorage.getItem('pizzeria_master_db');
        if (localData) {
            const parsed = JSON.parse(localData);
            this.estoque = parsed.estoque || [];
            this.historico = parsed.historico || [];
            this.config = parsed.config || { modoFeriado: false };
        }
        if (localStorage.getItem('pizzeria_master_termos')) this.termosAceitos = true;
    },
    methods: {
        save() {
            localStorage.setItem('pizzeria_master_db', JSON.stringify({
                estoque: this.estoque,
                historico: this.historico,
                config: this.config
            }));
        },
        login() {
            if (this.userSelected && this.pinInput === this.userSelected.pin) {
                if (!this.termosAceitos) this.mostrarTermos = true;
                else this.authenticated = true;
            } else {
                this.loginError = true;
                setTimeout(() => { this.loginError = false; this.pinInput = ''; }, 600);
            }
        },
        aceitarTermos() {
            this.termosAceitos = true;
            localStorage.setItem('pizzeria_master_termos', 'true');
            this.mostrarTermos = false;
            this.authenticated = true;
        },
        adicionarProduto() {
            if (this.novoInsumo.nome && this.novoInsumo.meta) {
                this.estoque.push({ ...this.novoInsumo, id: Date.now() });
                this.novoInsumo = { nome: '', unC: '', meta: 0, fornecedor: '', contagem: 0 };
                this.save();
                alert('Produto adicionado!');
            }
        },
        getMetaAjustada(item) {
            let meta = parseFloat(item.meta);
            const hoje = new Date().getDay();
            if (hoje === 5 && item.fornecedor.toLowerCase().includes('sacol')) meta *= 3;
            if (this.config.modoFeriado) meta *= 1.5;
            return meta;
        },
        calcularFalta(item) {
            const meta = this.getMetaAjustada(item);
            const falta = meta - item.contagem;
            return falta > 0 ? falta.toFixed(1) : 0;
        },
        statusEstoque(item) {
            return item.contagem < this.getMetaAjustada(item) ? 'PEDIR' : 'OK';
        },
        enviarPedido() {
            let msg = "*PEDIDO - PIZZERIA MASTER*\n\n";
            this.insumosFiltrados.forEach(i => {
                const f = this.calcularFalta(i);
                if (f > 0) msg += `- ${f} ${i.unC} de ${i.nome}\n`;
            });
            
            this.historico.unshift({ data: new Date().toLocaleString(), fornecedor: this.setorAtivo, conteudo: msg });
            if (this.historico.length > 50) this.historico.pop();
            this.save();

            const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
            window.open(url, '_blank');
        },
        logout() { this.authenticated = false; this.currentTab = 'home'; }
    }
}).mount('#app');
