const app = Vue.createApp({
    data() {
        return {
            authenticated: false,
            userSelected: '',
            pinInput: '',
            loginError: false,
            currentTab: 'home',
            setorAtivo: 'Ver Tudo',
            menuAberto: null,
            backupCode: '',

            // DADOS DO SISTEMA
            equipe: [],
            estoque: [],
            historico: [],
            fornecedores: [],
            rota: ['Geladeira 1', 'Geladeira 2', 'Freezer', 'Estoque', 'Limpeza'],
            config: { modoFeriado: false },

            // FORMS
            novoUser: { nome: '', pin: '', cargo: 'Colaborador', modulos: ['Geral'] },
            novoForn: { nome: '', zap: '', saudacao: '', triplicaSexta: false },
            novoProd: { nome: '', local: '', destinoId: '', unQ: 'un', unC: 'cx', fator: 1, meta: 0, contagem: 0 }
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
            });
        }
    },
    methods: {
        // PERMISSÃO DE VISUALIZAÇÃO
        podeVer(bloco) {
            if (this.userSelected.cargo === 'ADM') return true;
            return this.userSelected.modulos && this.userSelected.modulos.includes(bloco);
        },

        // PERSISTÊNCIA & BACKUP
        save() {
            const data = {
                equipe: this.equipe,
                estoque: this.estoque,
                historico: this.historico,
                fornecedores: this.fornecedores,
                rota: this.rota,
                config: this.config
            };
            const stringData = JSON.stringify(data);
            localStorage.setItem('artigiano_db_v3', stringData);
            this.backupCode = btoa(unescape(encodeURIComponent(stringData))); // Gera código de backup
        },
        load() {
            const db = localStorage.getItem('artigiano_db_v3');
            if (db) {
                const p = JSON.parse(db);
                this.equipe = p.equipe || [{ id: 1821, nome: 'Gabriel', pin: '1821', cargo: 'ADM', modulos: ['Sacolão', 'Limpeza', 'Geral', 'Histórico'] }];
                this.estoque = p.estoque || [];
                this.historico = p.historico || [];
                this.fornecedores = p.fornecedores || [];
                this.rota = p.rota || ['Geladeira 1', 'Geladeira 2', 'Freezer', 'Estoque', 'Limpeza'];
                this.config = p.config || { modoFeriado: false };
                this.save(); // Atualiza o backupCode
            } else {
                // Caso seja a primeira vez abrindo o app
                this.equipe = [{ id: 1821, nome: 'Gabriel', pin: '1821', cargo: 'ADM', modulos: ['Sacolão', 'Limpeza', 'Geral', 'Histórico'] }];
                this.save();
            }
        },
        importarDados() {
            const code = prompt("Cole aqui o código de backup do outro navegador:");
            if (code) {
                try {
                    const decoded = decodeURIComponent(escape(atob(code)));
                    localStorage.setItem('artigiano_db_v3', decoded);
                    location.reload();
                } catch(e) { alert("Código de backup inválido."); }
            }
        },

        // WHATSAPP TÉCNICO
        enviarWhatsApp() {
            const pedidos = {};
            this.insumosFiltrados.forEach(i => {
                const f = this.calcularFalta(i);
                if (f > 0) {
                    if (!pedidos[i.destinoId]) pedidos[i.destinoId] = [];
                    pedidos[i.destinoId].push(`- ${f} ${i.unC} de ${i.nome}`);
                }
            });

            for (let id in pedidos) {
                const forn = this.getFornecedor(parseInt(id));
                const texto = `${forn.saudacao}\n\n${pedidos[id].join('\n')}`;
                
                this.historico.unshift({ data: new Date().toLocaleString(), fornecedor: forn.nome, conteudo: texto });
                if (this.historico.length > 50) this.historico.pop();
                
                this.save();
                window.open(`https://api.whatsapp.com/send?phone=${forn.zap}&text=${encodeURIComponent(texto)}`);
            }
        },

        // CÁLCULOS
        getMetaAjustada(item) {
            let meta = parseFloat(item.meta);
            const forn = this.getFornecedor(item.destinoId);
            if (new Date().getDay() === 5 && forn?.triplicaSexta) meta *= 3;
            if (this.config.modoFeriado) meta *= 1.5;
            return meta;
        },
        calcularFalta(item) {
            const meta = this.getMetaAjustada(item);
            const falta = meta - (item.contagem || 0);
            return falta > 0 ? (falta / (item.fator || 1)).toFixed(1) : 0;
        },
        statusEstoque(item) { return this.calcularFalta(item) > 0 ? 'PEDIR' : 'OK'; },
        getFornecedor(id) { return this.fornecedores.find(f => f.id === id); },

        // GESTÃO
        mudarCargo(u, cargo) { u.cargo = cargo; this.save(); },
        adicionarFuncionario() {
            if (this.novoUser.nome) {
                this.equipe.push({ id: Date.now(), ...this.novoUser });
                this.novoUser = { nome: '', pin: '', cargo: 'Colaborador', modulos: ['Geral'] };
                this.save();
            }
        },
        removerFuncionario(id) { this.equipe = this.equipe.filter(u => u.id !== id); this.save(); },
        adicionarProduto() {
            if (this.novoProd.nome && this.novoProd.destinoId) {
                this.estoque.push({ id: Date.now(), ...this.novoProd });
                this.novoProd = { nome: '', local: '', destinoId: '', unQ: 'un', unC: 'cx', fator: 1, meta: 0, contagem: 0 };
                this.save();
                alert("Salvo!");
            }
        },
        adicionarFornecedor() {
            if(this.novoForn.nome && this.novoForn.zap) {
                this.fornecedores.push({ id: Date.now(), ...this.novoForn });
                this.novoForn = { nome: '', zap: '', saudacao: '', triplicaSexta: false };
                this.save();
            }
        },

        login() {
            if (this.userSelected && this.pinInput === this.userSelected.pin) {
                this.authenticated = true;
            } else {
                this.loginError = true;
                setTimeout(() => { this.loginError = false; this.pinInput = ''; }, 600);
            }
        },
        logout() { this.authenticated = false; this.pinInput = ''; }
    },
    mounted() { this.load(); }
}).mount('#app');
