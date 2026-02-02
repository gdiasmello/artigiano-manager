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
            menuAberto: null,
            filtroCatalogo: '',
            novoLocalNome: '',

            // EQUIPA INICIAL
            equipe: [
                { id: 1, nome: 'Gabriel', pin: '1821', cargo: 'ADM' },
                { id: 2, nome: 'Mayara', pin: '2024', cargo: 'Gerente' }
            ],

            // FORNECEDORES INICIAIS
            fornecedores: [
                { id: 1, nome: 'Sacolão / Horti', zap: '554399999999', saudacao: 'Olá, pedido da Artigiano Pizzaria:', triplicaSexta: true },
                { id: 2, nome: 'Insumos Gerais', zap: '554388888888', saudacao: 'Bom dia, segue nossa lista:', triplicaSexta: false }
            ],

            // ROTA FÍSICA INICIAL
            rota: ['Geladeira 1', 'Geladeira 2', 'Freezer', 'Estoque Seco', 'Limpeza'],

            estoque: [],
            historico: [],
            config: { modoFeriado: false },

            // FORMULÁRIOS DE CADASTRO
            novoUser: { nome: '', pin: '' },
            novoForn: { nome: '', zap: '', saudacao: '', triplicaSexta: false },
            novoProd: { nome: '', local: '', destinoId: '', unQ: 'un', unC: 'cx', fator: 1, meta: 0, contagem: 0, obs: '' }
        }
    },
    computed: {
        dataAtual() { return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' }); },
        isAdmin() { return this.userSelected && (this.userSelected.cargo === 'ADM' || this.userSelected.cargo === 'Gerente'); },
        insumosFiltrados() {
            return this.estoque.filter(i => {
                const forn = this.getFornecedor(i.destinoId);
                if (this.setorAtivo === 'Sacolão') return forn && (forn.nome.includes('Sacolão') || forn.nome.includes('Horti'));
                if (this.setorAtivo === 'Limpeza') return i.local === 'Limpeza' || i.nome.toLowerCase().includes('limpeza');
                return true;
            }).sort((a, b) => this.rota.indexOf(a.local) - this.rota.indexOf(b.local));
        }
    },
    created() {
        const db = localStorage.getItem('pizzeria_master_db_v2');
        if (db) {
            const p = JSON.parse(db);
            this.estoque = p.estoque || [];
            this.historico = p.historico || [];
            this.fornecedores = p.fornecedores || this.fornecedores;
            this.rota = p.rota || this.rota;
            this.equipe = p.equipe || this.equipe;
            this.config = p.config || { modoFeriado: false };
        }
        if (localStorage.getItem('pizzeria_master_termos_aceitos')) this.termosAceitos = true;
    },
    methods: {
        save() {
            localStorage.setItem('pizzeria_master_db_v2', JSON.stringify({
                estoque: this.estoque,
                historico: this.historico,
                fornecedores: this.fornecedores,
                rota: this.rota,
                equipe: this.equipe,
                config: this.config
            }));
        },
        login() {
            if (this.userSelected && this.pinInput === this.userSelected.pin) {
                if (!this.termosAceitos) this.mostrarTermos = true;
                else this.authenticated = true;
            } else {
                this.loginError = true;
                if (navigator.vibrate) navigator.vibrate(200);
                setTimeout(() => { this.loginError = false; this.pinInput = ''; }, 600);
            }
        },
        aceitarTermos() {
            this.termosAceitos = true;
            localStorage.setItem('pizzeria_master_termos_aceitos', 'true');
            this.mostrarTermos = false;
            this.authenticated = true;
        },
        // INTELIGÊNCIA DE META
        getMetaAjustada(item) {
            let meta = parseFloat(item.meta);
            const forn = this.getFornecedor(item.destinoId);
            const hoje = new Date().getDay(); // 5 = Sexta
            if (hoje === 5 && forn && forn.triplicaSexta) meta *= 3;
            if (this.config.modoFeriado) meta *= 1.5;
            return meta;
        },
        calcularFalta(item) {
            const meta = this.getMetaAjustada(item);
            const falta = meta - (item.contagem || 0);
            return falta > 0 ? (falta / item.fator).toFixed(1) : 0;
        },
        statusEstoque(item) {
            return this.calcularFalta(item) > 0 ? 'PEDIR' : 'OK';
        },
        getFornecedor(id) { return this.fornecedores.find(f => f.id === id); },
        
        // CRUD EQUIPA
        adicionarFuncionario() {
            if (this.novoUser.nome && this.novoUser.pin) {
                this.equipe.push({ id: Date.now(), ...this.novoUser, cargo: 'Colaborador' });
                this.novoUser = { nome: '', pin: '' };
                this.save();
            }
        },
        removerFuncionario(id) {
            if (confirm("Remover este acesso?")) {
                this.equipe = this.equipe.filter(u => u.id !== id);
                this.save();
            }
        },

        // CRUD FORNECEDORES
        adicionarFornecedor() {
            if (this.novoForn.nome && this.novoForn.zap) {
                this.fornecedores.push({ id: Date.now(), ...this.novoForn });
                this.novoForn = { nome: '', zap: '', saudacao: '', triplicaSexta: false };
                this.save();
            }
        },
        removerFornecedor(id) {
            if (confirm("Remover fornecedor e todos os seus itens?")) {
                this.fornecedores = this.fornecedores.filter(f => f.id !== id);
                this.estoque = this.estoque.filter(i => i.destinoId !== id);
                this.save();
            }
        },

        // CRUD PRODUTOS
        adicionarProduto() {
            if (this.novoProd.nome && this.novoProd.destinoId) {
                this.estoque.push({ id: Date.now(), ...this.novoProd });
                this.novoProd = { nome: '', local: '', destinoId: '', unQ: 'un', unC: 'cx', fator: 1, meta: 0, contagem: 0, obs: '' };
                this.save();
                alert("Produto guardado!");
            }
        },
        removerProduto(id) {
            if (confirm("Excluir item do catálogo?")) {
                this.estoque = this.estoque.filter(i => i.id !== id);
                this.save();
            }
        },

        // ROTA
        moverRota(index, direcao) {
            const novaPos = index + direcao;
            if (novaPos < 0 || novaPos >= this.rota.length) return;
            const item = this.rota.splice(index, 1)[0];
            this.rota.splice(novaPos, 0, item);
            this.save();
        },
        adicionarLocal() {
            if (this.novoLocalNome && !this.rota.includes(this.novoLocalNome)) {
                this.rota.push(this.novoLocalNome);
                this.novoLocalNome = '';
                this.save();
            }
        },
        removerLocal(index) {
            if (confirm("Isto não apagará os produtos, apenas o local na rota.")) {
                this.rota.splice(index, 1);
                this.save();
            }
        },

        // ENVIO WHATSAPP
        enviarWhatsApp() {
            const pedidosPorFornecedor = {};
            this.insumosFiltrados.forEach(i => {
                const f = this.calcularFalta(i);
                if (f > 0) {
                    if (!pedidosPorFornecedor[i.destinoId]) pedidosPorFornecedor[i.destinoId] = [];
                    pedidosPorFornecedor[i.destinoId].push(`- ${f} ${i.unC} de ${i.nome}`);
                }
            });

            for (let id in pedidosPorFornecedor) {
                const forn = this.getFornecedor(parseInt(id));
                const texto = `${forn.saudacao}\n\n${pedidosPorFornecedor[id].join('\n')}\n\n_Enviado via Pizzeria Master_`;
                
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
        removerHistorico(idx) {
            if (confirm("Apagar este registo?")) {
                this.historico.splice(idx, 1);
                this.save();
            }
        },
        logout() { this.authenticated = false; this.pinInput = ''; }
    }
}).mount('#app');
