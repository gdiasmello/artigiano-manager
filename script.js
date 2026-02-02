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
            
            // Submenus de Configuração (Accordion)
            menuAberto: null, 

            // Dados de Equipa e Permissões
            equipe: [
                { id: 1, nome: 'Gabriel', pin: '1821', cargo: 'ADM', permissoes: { historico: true, editar: true, fornecedores: true, modulos: ['Massas', 'Sacolão', 'Limpeza', 'Secos'] } }
            ],

            // Cadastro de Fornecedores (Destinos)
            fornecedores: [
                { id: 1, nome: 'Sacolão Central', zap: '5543999999999', saudacao: 'Olá, segue o pedido da Artigiano:', triplicaSexta: true }
            ],

            // Rota Física
            rota: ['Geladeira 1', 'Freezer', 'Estoque Seco', 'Limpeza'],

            // Catálogo de Produtos
            estoque: [],
            
            // Histórico (Máx 50)
            historico: [],

            // Configurações Globais
            config: { modoFeriado: false },

            // Formulários de Cadastro (Temporários)
            novoUser: { nome: '', pin: '', cargo: 'Colaborador' },
            novoProd: { nome: '', local: '', destinoId: '', unQ: 'un', unC: 'un', fator: 1, meta: 0, contagem: 0, obs: '' },
            novoForn: { nome: '', zap: '', saudacao: '', triplicaSexta: false }
        }
    },
    computed: {
        dataAtual() { return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' }); },
        isAdmin() { return this.userSelected && (this.userSelected.cargo === 'ADM' || this.userSelected.cargo === 'Gerente'); },
        
        insumosFiltrados() {
            return this.estoque.filter(i => {
                if (this.setorAtivo === 'Sacolão') return this.getFornecedor(i.destinoId)?.nome.includes('Sacolão');
                if (this.setorAtivo === 'Limpeza') return i.local === 'Limpeza';
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
            this.fornecedores = parsed.fornecedores || this.fornecedores;
            this.rota = parsed.rota || this.rota;
            this.equipe = parsed.equipe || this.equipe;
        }
        if (localStorage.getItem('pizzeria_master_termos')) this.termosAceitos = true;
    },
    methods: {
        save() {
            localStorage.setItem('pizzeria_master_db', JSON.stringify({
                estoque: this.estoque,
                historico: this.historico,
                fornecedores: this.fornecedores,
                rota: this.rota,
                equipe: this.equipe
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
        // Lógica de Meta Triplicada na Sexta e Feriado
        getMetaAjustada(item) {
            let meta = parseFloat(item.meta);
            const fornecedor = this.getFornecedor(item.destinoId);
            const hoje = new Date().getDay(); // 5 = Sexta
            
            if (hoje === 5 && fornecedor && fornecedor.triplicaSexta) meta *= 3;
            if (this.config.modoFeriado) meta *= 1.5;
            return meta;
        },
        calcularFalta(item) {
            const meta = this.getMetaAjustada(item);
            const falta = meta - item.contagem;
            if (falta <= 0) return 0;
            return (falta / item.fator).toFixed(1);
        },
        getFornecedor(id) { return this.fornecedores.find(f => f.id === id); },
        
        // Gestão de Rota (⬆️/⬇️)
        moverRota(index, direcao) {
            const novaPos = index + direcao;
            if (novaPos < 0 || novaPos >= this.rota.length) return;
            const item = this.rota.splice(index, 1)[0];
            this.rota.splice(novaPos, 0, item);
            this.save();
        },

        enviarWhatsApp() {
            // Agrupamento por Fornecedor
            const pedidos = {};
            this.insumosFiltrados.forEach(item => {
                const falta = this.calcularFalta(item);
                if (falta > 0) {
                    if (!pedidos[item.destinoId]) pedidos[item.destinoId] = [];
                    pedidos[item.destinoId].push(`- ${falta} ${item.unC} de ${item.nome} ${item.obs ? '('+item.obs+')' : ''}`);
                }
            });

            for (let id in pedidos) {
                const forn = this.getFornecedor(parseInt(id));
                const texto = `${forn.saudacao}\n\n${pedidos[id].join('\n')}`;
                
                // Gravar no Histórico (Máx 50)
                this.historico.unshift({
                    data: new Date().toLocaleString(),
                    fornecedor: forn.nome,
                    conteudo: texto
                });
                if (this.historico.length > 50) this.historico.pop();
                
                this.save();
                window.open(`https://api.whatsapp.com/send?phone=${forn.zap}&text=${encodeURIComponent(texto)}`);
            }
        },
        logout() { this.authenticated = false; this.currentTab = 'home'; }
    }
}).mount('#app');
