// --- CONFIGURAÇÃO FIREBASE (SUA CHAVE) ---
const firebaseConfig = {
    apiKey: "AIzaSyBL70gtkhjBvC9BiKvz5HBIvH07JfRhuo4", 
    authDomain: "artigiano-app.firebaseapp.com",
    databaseURL: "https://artigiano-app-default-rtdb.firebaseio.com",
    projectId: "artigiano-app",
    storageBucket: "artigiano-app.firebasestorage.app",
    messagingSenderId: "212218495726",
    appId: "1:212218495726:web:dd6fec7a4a8c7ad572a9ff"
};

let db;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
} catch (e) { console.error("Erro Firebase", e); }

const { createApp } = Vue

const app = createApp({
    data() {
        return {
            temaEscuro: false,
            // AUTH
            authMode: 'login',
            loginUser: '', loginPass: '',
            sessaoAtiva: false,
            usuarioLogado: null,
            msgAuth: '', isError: false,
            
            // CADASTRO
            novoCadastro: { nome: '', nascimento: '', email: '', user: '', pass: '', cargo: '' },
            
            // DADOS SISTEMA
            usuarios: [],
            config: { destinos: [] },
            produtos: [],
            
            // APP
            moduloAtivo: null,
            termoBusca: '',
            mostrandoAdmin: false, mostrandoConfig: false, mostrandoPreview: false,
            
            // FORMS
            novoProd: { nome: '', categoria: 'geral', local: 'Estoque Seco', unQ: 'Un', unC: 'Cx', fator: 1, meta: 0, destinoId: '' },
            novoDestino: { nome: '', telefone: '', msg: '' },
            salvarParaSegunda: false
        }
    },
    computed: {
        usuariosPendentes() { return this.usuarios.filter(u => u.aprovado === false); },
        usuariosAtivos() { return this.usuarios.filter(u => u.aprovado === true); },
        pendentesCount() { return this.usuariosPendentes.length; },
        nomeModulo() {
            const nomes = { hortifruti: 'Hortifruti & Feira', geral: 'Geral & Insumos', bebidas: 'Bebidas', limpeza: 'Limpeza' };
            return nomes[this.moduloAtivo] || '';
        },
        produtosFiltrados() {
            if (!this.moduloAtivo) return [];
            return this.produtos.filter(p => {
                const matchBusca = this.termoBusca ? p.nome.toLowerCase().includes(this.termoBusca.toLowerCase()) : true;
                const matchModulo = p.categoria === this.moduloAtivo;
                return matchBusca && matchModulo;
            });
        },
        locaisDoModulo() { return [...new Set(this.produtosFiltrados.map(p => p.local))].sort(); },
        produtosDoLocal() { return (local) => this.produtosFiltrados.filter(p => p.local === local); },
        itensParaPedir() { return this.produtosFiltrados.filter(p => !p.ignorar && this.statusItem(p) === 'buy'); },
        pedidosAgrupados() {
            const grupos = {};
            this.itensParaPedir.forEach(p => {
                const calc = this.calculaFalta(p);
                const dId = p.destinoId || 'geral';
                if (!grupos[dId]) grupos[dId] = [];
                grupos[dId].push({ texto: `- ${calc.qtd} ${p.unC} ${p.nome}` });
            });
            return grupos;
        }
    },
    methods: {
        alternarTema() {
            this.temaEscuro = !this.temaEscuro;
            localStorage.setItem('artigiano_theme', this.temaEscuro ? 'dark' : 'light');
        },
        // --- AUTH & LOGIN GABRIEL ---
        fazerLogin() {
            // LOGIN MESTRE GABRIEL (Cria usuário se não existir)
            if (this.loginUser === 'Gabriel' && this.loginPass === '21gabriel') {
                let adminUser = this.usuarios.find(u => u.user === 'Gabriel');
                if (!adminUser) {
                    adminUser = {
                        id: Date.now(), nome: 'Gabriel', cargo: 'Gerente', email: 'gabriel@artigiano.com',
                        user: 'Gabriel', pass: '21gabriel', aprovado: true,
                        permissoes: { admin: true, hortifruti: true, geral: true, bebidas: true, limpeza: true }
                    };
                    const novaLista = [...this.usuarios, adminUser];
                    if(db) db.ref('usuarios').set(novaLista);
                }
                this.usuarioLogado = adminUser;
                this.sessaoAtiva = true;
                localStorage.setItem('artigiano_session', JSON.stringify(adminUser));
                return;
            }

            const user = this.usuarios.find(u => u.user === this.loginUser && u.pass === this.loginPass);
            if (user) {
                if (user.aprovado) {
                    this.usuarioLogado = user;
                    this.sessaoAtiva = true;
                    localStorage.setItem('artigiano_session', JSON.stringify(user));
                } else {
                    this.msgAuth = "Aguardando aprovação do Admin."; this.isError = true;
                }
            } else {
                this.msgAuth = "Dados incorretos."; this.isError = true;
            }
        },
        solicitarCadastro() {
            if (!this.novoCadastro.nome || !this.novoCadastro.user || !this.novoCadastro.pass) {
                this.msgAuth = "Preencha tudo."; this.isError = true; return;
            }
            const novoUser = {
                id: Date.now(),
                ...this.novoCadastro,
                aprovado: false, // Requer aprovação
                permissoes: { admin: false, hortifruti: true, geral: true, bebidas: false, limpeza: true }
            };
            if(db) {
                const novaLista = [...this.usuarios, novoUser];
                db.ref('usuarios').set(novaLista);
                this.msgAuth = "Enviado! Aguarde aprovação.";
                this.isError = false; this.authMode = 'login';
                this.novoCadastro = { nome: '', nascimento: '', email: '', user: '', pass: '', cargo: '' };
            }
        },
        logout() {
            this.sessaoAtiva = false; this.usuarioLogado = null;
            localStorage.removeItem('artigiano_session'); this.loginPass = '';
        },

        // --- SISTEMA ---
        abrirModulo(mod) { this.moduloAtivo = mod; this.termoBusca = ''; },
        podeAcessar(perm) { return this.usuarioLogado.permissoes.admin || this.usuarioLogado.permissoes[perm]; },
        
        aprovarUsuario(id) {
            const index = this.usuarios.findIndex(u => u.id === id);
            if(index !== -1) { this.usuarios[index].aprovado = true; this.salvarDb(); }
        },
        removerUsuario(id) {
            if(confirm("Remover usuário?")) {
                const index = this.usuarios.findIndex(u => u.id === id);
                this.usuarios.splice(index, 1); this.salvarDb();
            }
        },

        calculaFalta(p) {
            if (!p.contagem && p.contagem !== 0) return { qtd: 0 };
            const fator = p.fator || 1;
            const estoqueCompra = p.unQ !== p.unC ? p.contagem / fator : p.contagem * fator;
            const falta = p.meta - estoqueCompra;
            return { qtd: Math.ceil(falta) };
        },
        statusItem(p) {
            if (p.ignorar) return 'ignored';
            if (p.contagem === '') return 'pending';
            return this.calculaFalta(p).qtd > 0 ? 'buy' : 'ok';
        },
        toggleIgnorar(p) { p.ignorar = !p.ignorar; if(p.ignorar) p.contagem = ''; this.salvarDb(); },
        
        adicionarProduto() {
            if(!this.novoProd.nome) return alert("Nome obrigatório");
            this.produtos.push({ id: Date.now(), ...this.novoProd, contagem: '', ignorar: false });
            this.salvarDb(); alert("Produto salvo!"); this.novoProd.nome = '';
        },
        
        enviarZap(destId, itens) {
            const dest = this.config.destinos.find(d => d.id == destId);
            const tel = dest ? dest.telefone : '';
            let msg = this.salvarParaSegunda ? "*LISTA DE SEGUNDA-FEIRA*\n" : "*PEDIDO ARTIGIANO*\n";
            msg += `Solicitante: ${this.usuarioLogado.nome}\n---\n`;
            itens.forEach(i => msg += i.texto + '\n');
            window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');
        },

        adicionarDestino() {
            if(this.novoDestino.nome) {
                if(!this.config.destinos) this.config.destinos = [];
                this.config.destinos.push({ id: Date.now(), ...this.novoDestino });
                this.salvarDb(); this.novoDestino = { nome: '', telefone: '', msg: '' };
            }
        },
        removerDestino(idx) { this.config.destinos.splice(idx, 1); this.salvarDb(); },
        getNomeDestino(id) { const d = this.config.destinos ? this.config.destinos.find(x => x.id === id) : null; return d ? d.nome : 'Geral'; },

        salvarDb() { if(db) db.ref('/').update({ usuarios: this.usuarios, produtos: this.produtos, config: this.config }); },
        carregarDb() {
            if(db) {
                db.ref('/').on('value', snap => {
                    const d = snap.val();
                    if(d) {
                        this.usuarios = d.usuarios || [];
                        this.produtos = d.produtos || [];
                        this.config = d.config || { destinos: [] };
                        if(this.usuarioLogado) {
                            const u = this.usuarios.find(x => x.id === this.usuarioLogado.id);
                            if(u) this.usuarioLogado = u; else this.logout();
                        }
                    }
                });
            }
        },
        resetarTudo() {
            if(confirm("ATENÇÃO: Isso apaga todo o banco de dados. Continuar?")) {
                if(db) db.ref('/').remove();
                localStorage.clear();
                window.location.reload();
            }
        }
    },
    mounted() {
        const session = localStorage.getItem('artigiano_session');
        if(session) { this.usuarioLogado = JSON.parse(session); this.sessaoAtiva = true; }
        const theme = localStorage.getItem('artigiano_theme');
        if(theme === 'dark') this.temaEscuro = true;
        this.carregarDb();
    }
});

createApp(app).mount('#app');