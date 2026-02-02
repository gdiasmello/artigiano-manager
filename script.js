// CONFIGURAÇÕES FIREBASE
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "artigiano-manager.firebaseapp.com",
    databaseURL: "https://artigiano-manager-default-rtdb.firebaseio.com",
    projectId: "artigiano-manager",
    storageBucket: "artigiano-manager.appspot.com",
    appId: "SEU_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const app = Vue.createApp({
    data() {
        return {
            loading: true,
            authenticated: false,
            loginNome: '',
            pinInput: '',
            userSelected: null,
            loginError: false,
            currentTab: 'home',
            setorAtivo: 'Ver Tudo',
            menuAberto: null,
            buscaCatalogo: '',

            // SONS
            sounds: {
                click: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
                success: new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'),
                error: new Audio('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3')
            },

            // DADOS CLOUD
            equipe: [],
            estoque: [],
            fornecedores: [],
            rota: [],
            config: {}
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
        totalItensNoCarrinho() { return this.estoque.filter(i => this.calcularFalta(i) > 0).length; },
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
        tocarSom(tipo) {
            this.sounds[tipo].currentTime = 0;
            this.sounds[tipo].play().catch(() => {});
        },

        // FIREBASE SYNC
        fetchData() {
            db.ref('artigiano_v5').on('value', (snap) => {
                const d = snap.val();
                if (d) {
                    this.equipe = d.equipe || [{ id: 1821, nome: 'GABRIEL', pin: '1821', cargo: 'ADM', modulos: ['Sacolão', 'Limpeza', 'Gelo', 'Geral'] }];
                    this.estoque = d.estoque || [];
                    this.fornecedores = d.fornecedores || [{id:1, nome: 'Sacolão', zap: '5543...', saudacao: 'Olá, segue pedido:'}];
                    this.rota = d.rota || ['Geladeira 1', 'Freezer', 'Limpeza', 'Gelo'];
                }
                this.loading = false;
            });
        },
        saveData() {
            this.loading = true;
            db.ref('artigiano_v5').set({
                equipe: this.equipe,
                estoque: this.estoque,
                fornecedores: this.fornecedores,
                rota: this.rota
            });
        },

        // LOGIN MELHORADO
        login() {
            const user = this.equipe.find(u => u.nome.toUpperCase() === this.loginNome.toUpperCase());
            if (user && this.pinInput === user.pin) {
                this.userSelected = user;
                this.authenticated = true;
                this.tocarSom('success');
            } else {
                this.loginError = true;
                this.tocarSom('error');
                setTimeout(() => { this.loginError = false; this.pinInput = ''; }, 600);
            }
        },

        // LIMPEZA DE CACHE
        limparTudoEResetar() {
            if (confirm("Isso apagará todos os dados salvos neste navegador e reiniciará o app. Continuar?")) {
                localStorage.clear();
                sessionStorage.clear();
                alert("Cache limpo! A página será reiniciada.");
                location.reload();
            }
        },

        // NAVEGAÇÃO COM SOM
        irPara(aba) {
            this.tocarSom('click');
            this.currentTab = aba;
        },
        abrirSetor(setor) {
            this.setorAtivo = setor;
            this.irPara('insumos');
        },

        // LÓGICA DE ARREDONDAMENTO
        calcularFalta(item) {
            const meta = parseFloat(item.meta) || 0;
            const estoque = parseFloat(item.contagem) || 0;
            const faltaUnid = meta - estoque;
            return faltaUnid > 0 ? Math.ceil(faltaUnid / (item.fator || 1)) : 0;
        },

        // WHATSAPP
        getPedidosPorFornecedor(fornId) {
            return this.estoque.filter(i => i.destinoId === fornId && this.calcularFalta(i) > 0);
        },
        dispararWhatsApp(forn) {
            this.tocarSom('success');
            const itens = this.getPedidosPorFornecedor(forn.id);
            const lista = itens.map(i => `- ${this.calcularFalta(i)} ${i.unC} de ${i.nome}`).join('\n');
            const texto = `${forn.saudacao}\n\n${lista}`;
            window.open(`https://api.whatsapp.com/send?phone=${forn.zap}&text=${encodeURIComponent(texto)}`);
        },

        // GESTÃO
        carregarProduto(p) {
            this.novoProd = { ...p, id: null };
            this.buscaCatalogo = '';
            this.tocarSom('click');
        },
        adicionarProduto() {
            if (this.novoProd.nome && this.novoProd.destinoId) {
                this.estoque.push({ ...this.novoProd, id: Date.now(), contagem: 0 });
                this.saveData();
                this.tocarSom('success');
                alert("Produto salvo!");
            }
        },
        mudarCargo(u, c) { u.cargo = c; this.saveData(); },
        logout() { this.authenticated = false; this.pinInput = ''; this.loginNome = ''; }
    },
    mounted() { this.fetchData(); }
}).mount('#app');
