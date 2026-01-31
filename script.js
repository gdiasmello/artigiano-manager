// --- CONFIGURAÇÃO FIREBASE ---
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
            loadingInicial: true,
            temaEscuro: false,
            // AUTH
            authMode: 'login',
            loginUser: '', loginPass: '',
            sessaoAtiva: false,
            usuarioLogado: null,
            msgAuth: '', isError: false, loadingAuth: false,
            novoCadastro: { nome: '', nascimento: '', email: '', user: '', pass: '', cargo: 'Pizzaiolo' },
            novoUserAdmin: { nome: '', cargo: 'Pizzaiolo', user: '', pass: '' },
            editandoUsuarioId: null,
            // DADOS
            usuarios: [],
            config: { destinos: [], rota: ['Freezer', 'Geladeira', 'Estoque Seco'] },
            produtos: [],
            historico: [],
            // APP
            moduloAtivo: null,
            termoBusca: '',
            mostrandoAdmin: false, mostrandoConfig: false, mostrandoPreview: false, mostrandoHistorico: false,
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
        nomeModulo() { const n = { hortifruti: 'Hortifruti', geral: 'Geral', bebidas: 'Bebidas', limpeza: 'Limpeza' }; return n[this.moduloAtivo] || ''; },
        produtosFiltrados() {
            if (!this.moduloAtivo) return [];
            return this.produtos.filter(p => {
                const matchBusca = this.termoBusca ? p.nome.toLowerCase().includes(this.termoBusca.toLowerCase()) : true;
                return matchBusca && p.categoria === this.moduloAtivo;
            });
        },
        locaisDoModulo() { 
            const rota = this.config.rota || ['Geral'];
            return rota.filter(local => this.produtosFiltrados.some(p => p.local === local));
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
        // --- UTIL ---
        gerarId() { return 'id_' + Math.random().toString(36).substr(2, 9); },
        alternarTema() { this.temaEscuro = !this.temaEscuro; localStorage.setItem('artigiano_theme', this.temaEscuro ? 'dark' : 'light'); },

        // --- AUTH ---
        fazerLogin() {
            this.loadingAuth = true; this.msgAuth = '';
            setTimeout(() => {
                if (this.loginUser === 'Gabriel' && this.loginPass === '21gabriel') {
                    // Check Master
                    const masterId = 'admin_gabriel_master';
                    const admin = this.usuarios.find(u => u.id === masterId) || {
                        id: masterId, nome: 'Gabriel Master', cargo: 'Gerente', user: 'Gabriel', pass: '21gabriel', aprovado: true,
                        permissoes: { admin: true, hortifruti: true, geral: true, bebidas: true, limpeza: true }
                    };
                    this.salvarUsuarioUnitario(admin);
                    this.logar(admin);
                    return;
                }
                const user = this.usuarios.find(u => u.user === this.loginUser && u.pass === this.loginPass);
                if (user) {
                    if (user.aprovado) this.logar(user);
                    else { this.msgAuth = "Aguardando aprovação."; this.isError = true; this.loadingAuth = false; }
                } else { this.msgAuth = "Dados incorretos."; this.isError = true; this.loadingAuth = false; }
            }, 800);
        },
        logar(user) {
            this.usuarioLogado = user; this.sessaoAtiva = true;
            localStorage.setItem('artigiano_session', JSON.stringify(user)); this.loadingAuth = false;
        },
        solicitarCadastro() {
            if (!this.novoCadastro.nome || !this.novoCadastro.user) { this.msgAuth = "Preencha tudo."; this.isError = true; return; }
            const novo = {
                id: this.gerarId(), ...this.novoCadastro, aprovado: false,
                permissoes: { admin: false, hortifruti: true, geral: true, bebidas: false, limpeza: true }
            };
            this.salvarUsuarioUnitario(novo);
            this.msgAuth = "Enviado! Aguarde."; this.isError = false; this.authMode = 'login';
            this.novoCadastro = { nome: '', user: '', pass: '', cargo: 'Pizzaiolo' };
        },
        logout() {
            this.sessaoAtiva = false; this.usuarioLogado = null; localStorage.removeItem('artigiano_session');
        },

        // --- SYNC ATOMICO (A SOLUÇÃO) ---
        salvarUsuarioUnitario(u) { if(db) db.ref('system/users/' + u.id).set(u); },
        salvarProdutoUnitario(p) { if(db) db.ref('store/products/' + p.id).set(p); },
        salvarHistoricoUnitario(h) { if(db) db.ref('store/history/' + h.id).set(h); },
        
        // ADMIN USERS
        adicionarUsuarioAdmin() {
            if (!this.novoUserAdmin.nome) return alert("Preencha dados");
            const novo = {
                id: this.gerarId(), ...this.novoUserAdmin, aprovado: true,
                permissoes: { admin: false, hortifruti: true, geral: true, bebidas: true, limpeza: true }
            };
            this.salvarUsuarioUnitario(novo);
            this.novoUserAdmin = { nome: '', user: '', pass: '', cargo: 'Pizzaiolo' };
            alert("Criado!");
        },
        prepararEdicao(u) { this.novoUserAdmin = { ...u }; this.editandoUsuarioId = u.id; },
        salvarEdicaoUsuario() {
            if(this.editandoUsuarioId) {
                // Recupera o original para não perder campos que não estão no form
                const original = this.usuarios.find(u => u.id === this.editandoUsuarioId);
                const editado = { ...original, ...this.novoUserAdmin };
                this.salvarUsuarioUnitario(editado);
                this.cancelarEdicaoUsuario();
            }
        },
        cancelarEdicaoUsuario() { this.editandoUsuarioId = null; this.novoUserAdmin = { nome: '', user: '', pass: '', cargo: 'Pizzaiolo' }; },
        aprovarUsuario(u) { u.aprovado = true; this.salvarUsuarioUnitario(u); },
        removerUsuario(id) { if(confirm("Remover?")) db.ref('system/users/' + id).remove(); },
        atualizarPermissao(u) { this.salvarUsuarioUnitario(u); }, // Checkbox chama isso direto

        // APP LOGIC
        abrirModulo(m) { this.moduloAtivo = m; this.termoBusca = ''; },
        podeAcessar(perm) { return this.usuarioLogado.permissoes.admin || this.usuarioLogado.permissoes[perm]; },
        calculaFalta(p) {
            if (!p.contagem && p.contagem !== 0) return { qtd: 0 };
            const fat = p.fator || 1; const est = p.unQ !== p.unC ? p.contagem / fat : p.contagem * fat;
            return { qtd: Math.max(0, Math.ceil(p.meta - est)) };
        },
        statusItem(p) { if(p.ignorar) return 'ignored'; if(p.contagem==='') return 'pending'; return this.calculaFalta(p).qtd > 0 ? 'buy' : 'ok'; },
        toggleIgnorar(p) { p.ignorar = !p.ignorar; if(p.ignorar) p.contagem=''; this.salvarProdutoUnitario(p); },
        
        adicionarProduto() {
            if(!this.novoProd.nome) return alert("Nome?");
            const p = { id: this.gerarId(), ...this.novoProd, contagem: '', ignorar: false };
            this.salvarProdutoUnitario(p);
            alert("Salvo!"); this.novoProd.nome = '';
        },
        enviarZap(destId, itens) {
            const dest = this.config.destinos.find(d => d.id == destId);
            const tel = dest ? dest.telefone : '';
            let msg = this.salvarParaSegunda ? "*PARA SEGUNDA-FEIRA*\n" : "*PEDIDO ARTIGIANO*\n";
            msg += `Resp: ${this.usuarioLogado.nome} | Data: ${new Date().toLocaleDateString()}\n---\n`;
            let txtH = "";
            itens.forEach(i => { msg += i.texto + '\n'; txtH += i.texto.replace('- ','') + ', '; });
            
            const h = { id: this.gerarId(), data: new Date().toLocaleDateString(), hora: new Date().toLocaleTimeString(), usuario: this.usuarioLogado.nome, destino: dest ? dest.nome : 'Geral', itens: txtH };
            this.salvarHistoricoUnitario(h);
            window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');
        },
        apagarHistorico(id) { if(confirm("Apagar?")) db.ref('store/history/' + id).remove(); },

        // CONFIG (SALVA O BLOCO INTEIRO POIS É PEQUENO)
        salvarConfig() { if(db) db.ref('system/config').set(this.config); },
        adicionarDestino() { if(this.novoDestino.nome) { if(!this.config.destinos) this.config.destinos=[]; this.config.destinos.push({id: this.gerarId(), ...this.novoDestino}); this.salvarConfig(); this.novoDestino={nome:'', telefone:''}; } },
        removerDestino(idx) { this.config.destinos.splice(idx,1); this.salvarConfig(); },
        getNomeDestino(id) { const d = this.config.destinos ? this.config.destinos.find(x => x.id === id) : null; return d ? d.nome : 'Geral'; },
        adicionarLocal() { if(this.novoLocal) { if(!this.config.rota) this.config.rota=[]; this.config.rota.push(this.novoLocal); this.novoLocal=''; this.salvarConfig(); } },
        removerLocal(idx) { if(confirm("Remover local?")) { this.config.rota.splice(idx,1); this.salvarConfig(); } },
        moverRota(idx, dir) {
            if(dir===-1 && idx>0) [this.config.rota[idx],this.config.rota[idx-1]]=[this.config.rota[idx-1],this.config.rota[idx]];
            else if(dir===1 && idx<this.config.rota.length-1) [this.config.rota[idx],this.config.rota[idx+1]]=[this.config.rota[idx+1],this.config.rota[idx]];
            this.salvarConfig();
        },
        resetarTudo() { if(confirm("RESETAR TUDO?")) { db.ref('/').remove(); location.reload(); } },

        carregarDb() {
            if(db) {
                // LISTENERS SEPARADOS (PERFORMANCE + SEGURANÇA)
                db.ref('system/users').on('value', s => { this.usuarios = s.val() ? Object.values(s.val()) : []; this.verificarSessao(); });
                db.ref('store/products').on('value', s => { this.produtos = s.val() ? Object.values(s.val()) : []; });
                db.ref('store/history').on('value', s => { 
                    const h = s.val() ? Object.values(s.val()) : []; 
                    this.historico = h.sort((a,b) => b.id.localeCompare(a.id)); // Ordena por ID (tempo)
                });
                db.ref('system/config').on('value', s => { 
                    this.config = s.val() || { destinos: [], rota: ['Geral'] }; 
                    if(!this.config.rota) this.config.rota=['Geral'];
                    this.loadingInicial = false; 
                });
            } else { this.loadingInicial = false; }
        },
        verificarSessao() {
            if(this.usuarioLogado) {
                const u = this.usuarios.find(x => x.id === this.usuarioLogado.id);
                if(u) { this.usuarioLogado = u; localStorage.setItem('artigiano_session', JSON.stringify(u)); }
                else { this.logout(); }
            }
        }
    },
    mounted() {
        setTimeout(() => { if(this.loadingInicial) this.loadingInicial = false; }, 3000);
        const session = localStorage.getItem('artigiano_session');
        if(session) { this.usuarioLogado = JSON.parse(session); this.sessaoAtiva = true; }
        const theme = localStorage.getItem('artigiano_theme');
        if(theme === 'dark') this.temaEscuro = true;
        this.carregarDb();
    }
});

app.mount('#app');
