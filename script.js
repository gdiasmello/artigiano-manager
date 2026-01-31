// CONFIGURAÇÃO FIREBASE (SUA CHAVE)
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
            authMode: 'login',
            loginUser: '', loginPass: '',
            sessaoAtiva: false,
            usuarioLogado: null,
            msgAuth: '', isError: false, loadingAuth: false,
            novoCadastro: { nome: '', nascimento: '', email: '', user: '', pass: '', cargo: 'Pizzaiolo' },
            usuarios: [],
            config: { destinos: [], rota: ['Freezer', 'Geladeira', 'Estoque Seco'] },
            produtos: [],
            moduloAtivo: null,
            termoBusca: '',
            mostrandoAdmin: false, mostrandoConfig: false, mostrandoPreview: false,
            novoProd: { nome: '', categoria: 'geral', local: 'Estoque Seco', unQ: 'Un', unC: 'Cx', fator: 1, meta: 0, destinoId: '' },
            novoDestino: { nome: '', telefone: '', msg: '' },
            novoLocal: '',
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
        locaisDoModulo() { 
            const rotaDefinida = this.config.rota || ['Geral'];
            return rotaDefinida.filter(local => this.produtosFiltrados.some(p => p.local === local));
        },
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
        fazerLogin() {
            this.loadingAuth = true; this.msgAuth = '';
            setTimeout(() => {
                if (this.loginUser === 'Gabriel' && this.loginPass === '21gabriel') {
                    let adminUser = this.usuarios.find(u => u.user === 'Gabriel');
                    if (!adminUser) {
                        adminUser = {
                            id: Date.now(), nome: 'Gabriel', cargo: 'Gerente', email: 'admin@artigiano.com',
                            user: 'Gabriel', pass: '21gabriel', aprovado: true,
                            permissoes: { admin: true, hortifruti: true, geral: true, bebidas: true, limpeza: true }
                        };
                        if(db) db.ref('usuarios').set([...this.usuarios, adminUser]);
                    }
                    this.logar(adminUser); return;
                }
                const user = this.usuarios.find(u => u.user === this.loginUser && u.pass === this.loginPass);
                if (user) {
                    if (user.aprovado) this.logar(user);
                    else { this.msgAuth = "Cadastro em análise."; this.isError = true; this.loadingAuth = false; }
                } else { this.msgAuth = "Dados inválidos."; this.isError = true; this.loadingAuth = false; }
            }, 800);
        },
        logar(user) {
            this.usuarioLogado = user; this.sessaoAtiva = true;
            localStorage.setItem('artigiano_session', JSON.stringify(user)); this.loadingAuth = false;
        },
        solicitarCadastro() {
            if (!this.novoCadastro.nome || !this.novoCadastro.user || !this.novoCadastro.pass) { this.msgAuth = "Preencha tudo."; this.isError = true; return; }
            const novoUser = {
                id: Date.now(), ...this.novoCadastro, aprovado: false,
                permissoes: { admin: false, hortifruti: true, geral: true, bebidas: false, limpeza: true }
            };
            if(db) db.ref('usuarios').set([...this.usuarios, novoUser]);
            this.msgAuth = "Enviado! Aguarde aprovação."; this.isError = false; this.authMode = 'login';
            this.novoCadastro = { nome: '', nascimento: '', email: '', user: '', pass: '', cargo: 'Pizzaiolo' };
        },
        logout() {
            this.sessaoAtiva = false; this.usuarioLogado = null;
            localStorage.removeItem('artigiano_session'); this.loginPass = '';
        },
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
        adicionarLocal() {
            if(this.novoLocal && !this.config.rota.includes(this.novoLocal)) {
                if(!this.config.rota) this.config.rota = [];
                this.config.rota.push(this.novoLocal); this.novoLocal = ''; this.salvarDb();
            }
        },
        removerLocal(idx) { if(confirm("Remover local?")) { this.config.rota.splice(idx, 1); this.salvarDb(); } },
        moverRota(index, direction) {
            if (direction === -1 && index > 0) {
                [this.config.rota[index], this.config.rota[index - 1]] = [this.config.rota[index - 1], this.config.rota[index]];
            } else if (direction === 1 && index < this.config.rota.length - 1) {
                [this.config.rota[index], this.config.rota[index + 1]] = [this.config.rota[index + 1], this.config.rota[index]];
            }
            this.salvarDb();
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
            if (p.contagem === '' || p.contagem === undefined) return 'pending';
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
                        this.usuarios = d.usuarios ? (Array.isArray(d.usuarios) ? d.usuarios : Object.values(d.usuarios)) : [];
                        this.produtos = d.produtos ? (Array.isArray(d.produtos) ? d.produtos : Object.values(d.produtos)) : [];
                        this.config = d.config || { destinos: [], rota: ['Geral'] };
                        if(!this.config.rota) this.config.rota = ['Geral'];
                        if(this.usuarioLogado) {
                            const u = this.usuarios.find(x => x.id === this.usuarioLogado.id);
                            if(u) this.usuarioLogado = u; else this.logout();
                        }
                    }
                });
            }
        },
        resetarTudo() { if(confirm("Isso apaga TUDO. Certeza?")) { if(db) db.ref('/').remove(); localStorage.clear(); window.location.reload(); } }
    },
    mounted() {
        const session = localStorage.getItem('artigiano_session');
        if(session) { this.usuarioLogado = JSON.parse(session); this.sessaoAtiva = true; }
        const theme = localStorage.getItem('artigiano_theme');
        if(theme === 'dark') this.temaEscuro = true;
        this.carregarDb();
    }
});

app.mount('#app');