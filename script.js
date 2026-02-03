const app = Vue.createApp({
    data() {
        return {
            tab: 'home',
            auth: false,
            loading: false,
            loginForm: { nome: '', pin: '' },
            userSelected: null,
            setorAtivo: 'Geral',
            
            // DADOS TÉCNICOS
            equipe: [],
            estoque: [],
            fornecedores: [],
            config: { feriadoAtivo: false },
            
            // AUXILIARES
            sextaFeira: new Date().getDay() === 5,
            feriadoProximo: false // Gatilho manual ou via banco
        }
    },
    computed: {
        dataHoje() {
            return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
        },
        saudacao() {
            const hora = new Date().getHours();
            if (hora < 12) return "Bom dia, Gabriel";
            if (hora < 18) return "Boa tarde, Gabriel";
            return "Boa noite, Gabriel";
        },
        insumosFiltrados() {
            return this.estoque.filter(i => {
                const f = this.fornecedores.find(x => x.id === i.destinoId);
                if (this.setorAtivo === 'Sacolão') return f && f.nome.toUpperCase().includes('SACOLÃO');
                if (this.setorAtivo === 'Limpeza') return i.local === 'Limpeza' || i.nome.toUpperCase().includes('LIMPEZA');
                if (this.setorAtivo === 'Gelo') return i.local === 'Gelo' || i.nome.toUpperCase().includes('GELO');
                return true;
            });
        },
        faltasTotal() {
            return this.estoque.filter(i => this.calcFalta(i) > 0).length;
        },
        fornecedoresComPedido() {
            const ids = [...new Set(this.estoque.filter(i => this.calcFalta(i) > 0).map(i => i.destinoId))];
            return this.fornecedores.filter(f => ids.includes(f.id));
        }
    },
    methods: {
        // UX & HAPTICS
        vibrate(ms) {
            if (navigator.vibrate) navigator.vibrate(ms);
        },
        irPara(tab) {
            this.vibrate(5);
            this.tab = tab;
        },
        
        // LOGIN
        handleLogin() {
            const n = this.loginForm.nome.toUpperCase();
            const p = this.loginForm.pin;

            // Login de Emergência ADM
            if (n === 'GABRIEL' && p === '1821') {
                this.userSelected = { nome: 'GABRIEL', cargo: 'ADM' };
                this.auth = true;
                this.vibrate([30, 50, 30]);
                return;
            }
            
            // Busca na equipe carregada
            const u = this.equipe.find(x => x.nome.toUpperCase() === n && x.pin === p);
            if (u) {
                this.userSelected = u;
                this.auth = true;
                this.vibrate([30, 50, 30]);
            } else {
                this.vibrate(500);
                alert("Acesso Negado.");
            }
        },

        // REGRAS DE NEGÓCIO (A ALMA DO APP)
        getMetaFinal(i) {
            let meta = parseFloat(i.meta) || 0;
            const forn = this.fornecedores.find(f => f.id === i.destinoId);

            // Regra de Sexta (Triplica Sacolão)
            if (this.sextaFeira && forn && forn.nome.toUpperCase().includes('SACOLÃO')) {
                meta *= 3;
            }

            // Regra de Feriado (50% geral)
            if (this.config.feriadoAtivo) {
                meta *= 1.5;
            }

            return meta;
        },

        calcFalta(i) {
            const meta = this.getMetaFinal(i);
            const atual = parseFloat(i.contagem) || 0;
            const faltaUnid = meta - atual;

            if (faltaUnid <= 0) return 0;
            
            // Arredondamento para Cima (Padrão Elite)
            return Math.ceil(faltaUnid / (i.fator || 1));
        },

        // GESTÃO DE DADOS
        abrirSetor(setor) {
            this.setorAtivo = setor;
            this.irPara('contagem');
        },

        saveLocal() {
            this.vibrate(10);
            const backup = {
                estoque: this.estoque,
                equipe: this.equipe,
                fornecedores: this.fornecedores,
                config: this.config
            };
            localStorage.setItem('artigiano_v100', JSON.stringify(backup));
            
            // Sincronização em background se houver Firebase (Exemplo)
            // db.ref('sync').set(backup);
        },

        loadLocal() {
            const data = localStorage.getItem('artigiano_v100');
            if (data) {
                const p = JSON.parse(data);
                this.estoque = p.estoque || [];
                this.equipe = p.equipe || [];
                this.fornecedores = p.fornecedores || [];
                this.config = p.config || { feriadoAtivo: false };
            } else {
                // Mock inicial para teste se estiver vazio
                this.fornecedores = [{id: 1, nome: 'Sacolão Central', zap: '554399999999', saudacao: 'Bom dia! Segue pedido:'}];
                this.estoque = [{id: 101, nome: 'Tomate', destinoId: 1, local: 'Cesta 1', unQ: 'kg', unC: 'cx', fator: 20, meta: 40, contagem: 0}];
            }
        },

        exportBackup() {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.estoque));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "artigiano_backup.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        },

        getItensPorForn(fid) {
            return this.estoque.filter(i => i.destinoId === fid && this.calcFalta(i) > 0);
        },

        enviarWhatsApp(f) {
            const itens = this.getItensPorForn(f.id);
            const lista = itens.map(i => `- ${this.calcFalta(i)} ${i.unC} de ${i.nome}`).join('\n');
            const dataMsg = new Date().toLocaleDateString();
            const texto = `*ARTIGIANO - PEDIDO ${dataMsg}*\n\n${f.saudacao}\n\n${lista}\n\n_Gerado por Artigiano Elite v1.0.0_`;
            
            this.vibrate([100, 50, 100]);
            window.open(`https://api.whatsapp.com/send?phone=${f.zap}&text=${encodeURIComponent(texto)}`);
        },

        logout() {
            this.auth = false;
            this.loginForm = { nome: '', pin: '' };
        }
    },
    mounted() {
        this.loadLocal();
    }
}).mount('#app');
