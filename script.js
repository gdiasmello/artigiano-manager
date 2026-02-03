// CONFIGURAÇÃO DO SEU FIREBASE
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "artigiano-cloud.firebaseapp.com",
    databaseURL: "https://artigiano-cloud-default-rtdb.firebaseio.com",
    projectId: "artigiano-cloud",
    storageBucket: "artigiano-cloud.appspot.com",
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
            setorAtivo: 'Geral',
            menuAberto: null,
            buscaProd: '',

            // DADOS CLOUD
            equipe: [],
            estoque: [],
            fornecedores: [],
            rota: [],
            config: { versao: 5.0 }
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
        totalFaltantes() { return this.estoque.filter(i => this.calcularFalta(i) > 0).length; },
        fornecedoresComPedido() {
            const ids = [...new Set(this.estoque.filter(i => this.calcularFalta(i) > 0).map(i => i.destinoId))];
            return this.fornecedores.filter(f => ids.includes(f.id));
        },
        sugestoes() {
            if (!this.buscaProd) return [];
            return this.estoque.filter(p => p.nome.toLowerCase().includes(this.buscaProd.toLowerCase())).slice(0, 5);
        }
    },
    methods: {
        // SONS
        playClick() { document.getElementById('snd-click').play(); },
        playSuccess() { document.getElementById('snd-success').play(); },

        // FIREBASE & AUTO-LIMPEZA
        fetchData() {
            db.ref('artigiano_v5').on('value', (snap) => {
                const d = snap.val();
                if (d) {
                    this.equipe = d.equipe || [];
                    this.estoque = d.estoque || [];
                    this.fornecedores = d.fornecedores || [];
                    this.rota = d.rota || ['Geladeira', 'Cozinha', 'Gelo', 'Limpeza'];
                    
                    // Se não houver ADM, cria o Gabriel
                    if (this.equipe.length === 0) {
                        this.equipe = [{ id: 1821, nome: 'GABRIEL', pin: '1821', cargo: 'ADM', modulos: ['Sacolão', 'Limpeza', 'Gelo', 'Geral'] }];
                        this.saveData();
                    }
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
                rota: this.rota,
                config: this.config
            }).then(() => { this.loading = false; });
        },

        // LOGIN MANUAL
        login() {
            this.playClick();
            const nomeProc = this.loginNome.trim().toUpperCase();
            const u = this.equipe.find(x => x.nome.toUpperCase() === nomeProc && x.pin === this.pinInput);
            
            if (u) {
                this.userSelected = u;
                this.authenticated = true;
                this.playSuccess();
            } else {
                this.loginError = true;
                setTimeout(() => { this.loginError = false; this.pinInput = ''; }, 600);
            }
        },

        // CÁLCULO CEIL (Sempre para cima)
        calcularFalta(i) {
            const falta = (parseFloat(i.meta) || 0) - (parseFloat(i.contagem) || 0);
            return falta > 0 ? Math.ceil(falta / (i.fator || 1)) : 0;
        },

        // NAVEGAÇÃO
        irPara(tab) { this.playClick(); this.currentTab = tab; },
        abrirSetor(setor) { 
            this.playClick(); 
            this.setorAtivo = setor; 
            this.currentTab = 'contagem'; 
        },
        toggleMenu(m) { this.playClick(); this.menuAberto = this.menuAberto === m ? null : m; },

        // PRODUTOS
        copiarDados(s) {
            this.novoProd = { ...s, id: null, contagem: 0 };
            this.buscaProd = '';
            this.playSuccess();
        },
        adicionarProduto() {
            if (this.novoProd.nome && this.novoProd.destinoId) {
                this.estoque.push({ ...this.novoProd, id: Date.now(), contagem: 0 });
                this.saveData();
                this.playSuccess();
                alert("Salvo no Catálogo!");
            }
        },

        // WHATSAPP LIMPO
        getItensPorFornecedor(fid) { return this.estoque.filter(i => i.destinoId === fid && this.calcularFalta(i) > 0); },
        enviarWhatsApp(f) {
            this.playClick();
            const itens = this.getItensPorFornecedor(f.id);
            const lista = itens.map(i => `- ${this.calcularFalta(i)} ${i.unC} de ${i.nome}`).join('\n');
            const msg = `${f.saudacao}\n\n${lista}`;
            window.open(`https://api.whatsapp.com/send?phone=${f.zap}&text=${encodeURIComponent(msg)}`);
        },

        // MANUTENÇÃO
        limparCacheManual() {
            localStorage.clear();
            sessionStorage.clear();
            location.reload(true);
        },
        resetSistema() {
            if(confirm("ISSO VAI APAGAR TUDO NO SERVIDOR. TEM CERTEZA?")) {
                db.ref('artigiano_v5').remove();
                this.limparCacheManual();
            }
        },
        logout() { this.authenticated = false; this.pinInput = ''; this.loginNome = ''; }
    },
    mounted() {
        // Limpeza de cache automática se a versão mudar
        const v = localStorage.getItem('artigiano_version');
        if (v != 5.0) {
            localStorage.clear();
            localStorage.setItem('artigiano_version', 5.0);
        }
        this.fetchData();
    }
}).mount('#app');
