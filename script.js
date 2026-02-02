// COLE AQUI SUAS CREDENCIAIS DO FIREBASE
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "artigiano-master.firebaseapp.com",
    databaseURL: "https://artigiano-master-default-rtdb.firebaseio.com",
    projectId: "artigiano-master",
    storageBucket: "artigiano-master.appspot.com",
    appId: "SEU_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const app = Vue.createApp({
    data() {
        return {
            loading: true,
            authenticated: false,
            userSelected: '',
            pinInput: '',
            loginError: false,
            currentTab: 'home',
            setorAtivo: 'Ver Tudo',
            menuAberto: null,
            buscaCatalogo: '',
            novoLocalNome: '',

            // DADOS CLOUD
            equipe: [],
            estoque: [],
            fornecedores: [],
            rota: [],
            config: { modoFeriado: false },

            // FORMS
            novoUser: { nome: '', pin: '', cargo: 'Colaborador', modulos: ['Geral'] },
            novoForn: { nome: '', zap: '', saudacao: '', triplicaSexta: false },
            novoProd: { nome: '', local: '', destinoId: '', unQ: 'un', unC: 'cx', fator: 1, meta: 0, contagem: 0 }
        }
    },
    computed: {
        isAdmin() { return this.userSelected && (this.userSelected.cargo === 'ADM' || this.userSelected.cargo === 'Gerente'); },
        
        insumosFiltrados() {
            return this.estoque.filter(i => {
                const f = this.fornecedores.find(x => x.id === i.destinoId);
                if (this.setorAtivo === 'Sacolão') return f && f.nome.includes('Sacolão');
                if (this.setorAtivo === 'Limpeza') return i.local === 'Limpeza';
                if (this.setorAtivo === 'Gelo') return i.local === 'Gelo' || i.nome.includes('Gelo');
                return true;
            });
        },

        totalItensNoCarrinho() {
            return this.estoque.filter(i => this.calcularFalta(i) > 0).length;
        },

        fornecedoresComPedido() {
            const ids = [...new Set(this.estoque.filter(i => this.calcularFalta(i) > 0).map(i => i.destinoId))];
            return this.fornecedores.filter(f => ids.includes(f.id));
        },

        produtosSugeridos() {
            if (!this.buscaCatalogo) return [];
            return this.estoque.filter(p => p.nome.toLowerCase().includes(this.buscaCatalogo.toLowerCase()));
        }
    },
    methods: {
        // SINCRONIZAÇÃO EM TEMPO REAL (FIREBASE)
        fetchData() {
            db.ref('artigiano_v4').on('value', (snap) => {
                const d = snap.val();
                if (d) {
                    this.equipe = d.equipe || [{ id: 1821, nome: 'Gabriel', pin: '1821', cargo: 'ADM', modulos: ['Sacolão', 'Limpeza', 'Gelo', 'Geral'] }];
                    this.estoque = d.estoque || [];
                    this.fornecedores = d.fornecedores || [{ id: 1, nome: 'Sacolão', zap: '5543...', saudacao: 'Olá, segue pedido:' }];
                    this.rota = d.rota || ['Geladeira 1', 'Freezer', 'Limpeza', 'Gelo'];
                    this.config = d.config || { modoFeriado: false };
                }
                this.loading = false;
            });
        },
        saveData() {
            this.loading = true;
            db.ref('artigiano_v4').set({
                equipe: this.equipe,
                estoque: this.estoque,
                fornecedores: this.fornecedores,
                rota: this.rota,
                config: this.config
            });
        },

        // LÓGICA DE ARREDONDAMENTO (CEIL)
        calcularFalta(item) {
            const meta = parseFloat(item.meta) || 0;
            const estoqueAtual = parseFloat(item.contagem) || 0;
            const faltaUnidade = meta - estoqueAtual;

            if (faltaUnidade <= 0) return 0;

            // Arredonda SEMPRE para cima para não faltar produto
            // Ex: Falta 1.1 caixa -> Pede 2 caixas
            return Math.ceil(faltaUnidade / (item.fator || 1));
        },

        // ACESSOS
        podeVer(bloco) {
            if (this.userSelected.cargo === 'ADM') return true;
            return this.userSelected.modulos && this.userSelected.modulos.includes(bloco);
        },
        abrirSetor(setor) {
            this.setorAtivo = setor;
            this.currentTab = 'insumos';
        },

        // PRODUTOS
        carregarProduto(p) {
            this.novoProd = { ...p, id: null };
            this.buscaCatalogo = '';
        },
        adicionarProduto() {
            if (this.novoProd.nome && this.novoProd.destinoId) {
                this.estoque.push({ ...this.novoProd, id: Date.now(), contagem: 0 });
                this.saveData();
                alert("Cadastrado com sucesso!");
            }
        },
        adicionarLocal() {
            if (this.novoLocalNome && !this.rota.includes(this.novoLocalNome)) {
                this.rota.push(this.novoLocalNome);
                this.novoLocalNome = '';
                this.saveData();
            }
        },

        // WHATSAPP LIMPO (APENAS SAUDAÇÃO + LISTA)
        getPedidosPorFornecedor(fornId) {
            return this.estoque.filter(i => i.destinoId === fornId && this.calcularFalta(i) > 0);
        },
        dispararWhatsApp(forn) {
            const itens = this.getPedidosPorFornecedor(forn.id);
            const lista = itens.map(i => `- ${this.calcularFalta(i)} ${i.unC} de ${i.nome}`).join('\n');
            const texto = `${forn.saudacao}\n\n${lista}`;
            window.open(`https://api.whatsapp.com/send?phone=${forn.zap}&text=${encodeURIComponent(texto)}`);
        },

        login() {
            if (this.userSelected && this.pinInput === this.userSelected.pin) this.authenticated = true;
            else {
                this.loginError = true;
                setTimeout(() => { this.loginError = false; this.pinInput = ''; }, 600);
            }
        },
        logout() { this.authenticated = false; this.pinInput = ''; }
    },
    mounted() { this.fetchData(); }
}).mount('#app');
