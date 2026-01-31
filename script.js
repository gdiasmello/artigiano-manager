// FIREBASE CONFIG
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
            // ADMIN ADD/EDIT
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
            // FORMS
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
        
        // --- AUTH ---
        fazerLogin() {
            this.loadingAuth = true; this.msgAuth = '';
            setTimeout(() => {
                // MESTRE GABRIEL
                if (this.loginUser === 'Gabriel' && this.loginPass === '21gabriel') {
                    let adminUser = this.usuarios.find(u => u.user === 'Gabriel');
                    if (!adminUser) {
                        adminUser = {
                            id: Date.now(), nome: 'Gabriel', cargo: 'Gerente', email: 'admin@artigiano.com',
                            user: 'Gabriel', pass: '21gabriel', aprovado: true,
                            permissoes: { admin: true, hortifruti: true, geral: true, bebidas: true, limpeza: true }
                        };
                        this.salvarUnicoUsuario(adminUser);
                    }
                    this.logar(adminUser); return;
                }
                const user = this.usuarios.find(u => u.user === this.loginUser && u.pass === this.loginPass);
                if (user) {
                    if (user.aprovado) this.logar(user);
                    else { this.msgAuth = "Aguardando aprovação."; this.isError = true; this.loadingAuth = false; }
                } else { this.msgAuth = "Dados incorretos."; this.isError = true; this.loadingAuth = false; }
            }, 800);
        },
        logar(user) {
            this.usuarioLogado = user; 
            this.sessaoAtiva = true;
            localStorage.setItem('artigiano_session', JSON.stringify(user)); 
            this.loadingAuth = false;
        },
        solicitarCadastro() {
            if (!this.novoCadastro.nome || !this.novoCadastro.user || !this.novoCadastro.pass) { this.msgAuth = "Preencha tudo."; this.isError = true; return; }
            const novoUser = {
                id: Date.now(), ...this.novoCadastro, aprovado: false,
                permissoes: { admin: false, hortifruti: true, geral: true, bebidas: false, limpeza: true }
            };
            this.salvarUnicoUsuario(novoUser);
            this.msgAuth = "Enviado! Aguarde aprovação."; this.isError = false; this.authMode = 'login';
            this.novoCadastro = { nome: '', nascimento: '', email: '', user: '', pass: '', cargo: 'Pizzaiolo' };
        },
        
        // --- ADMIN USERS (V39 - Com Edição e Sincronia) ---
        adicionarUsuarioAdmin() {
            if (!this.novoUserAdmin.nome || !this.novoUserAdmin.user) return alert("Preencha Nome e Usuário");
            const novo = {
                id: Date.now(), ...this.novoUserAdmin, aprovado: true,
                permissoes: { admin: false, hortifruti: true, geral: true, bebidas: true, limpeza: true }
            };
            this.salvarUnicoUsuario(novo); // FORÇA SYNC
            this.novoUserAdmin = { nome: '', cargo: 'Pizzaiolo', user: '', pass: '' };
            alert("Usuário adicionado!");
        },
        prepararEdicao(u) {
            this.novoUserAdmin = { ...u }; // Copia dados
            this.editandoUsuarioId = u.id;
        },
        salvarEdicaoUsuario() {
            const idx = this.usuarios.findIndex(u => u.id === this.editandoUsuarioId);
            if (idx !== -1) {
                const userAtualizado = { ...this.usuarios[idx], ...this.novoUserAdmin };
                // Atualiza local e Firebase
                this.usuarios[idx] = userAtualizado;
                if(db) db.ref('usuarios').set(this.usuarios); // Atualiza lista inteira para garantir consistência
                
                this.cancelarEdicaoUsuario();
                alert("Alterações salvas!");
            }
        },
        cancelarEdicaoUsuario() {
            this.editandoUsuarioId = null;
            this.novoUserAdmin = { nome: '', cargo: 'Pizzaiolo', user: '', pass: '' };
        },
        
        // MÉTODO DE SEGURANÇA PARA SALVAR USUÁRIO SEM PERDER DADOS
        salvarUnicoUsuario(user) {
            if(db) {
                db.ref('usuarios').once('value', snap => {
                    let lista = snap.val() || [];
                    if (!Array.isArray(lista)) lista = Object.values(lista);
                    // Se for edição/update
                    const existe = lista.findIndex(u => u.id === user.id);
                    if (existe !== -1) lista[existe] = user;
                    else lista.push(user);
                    
                    db.ref('usuarios').set(lista);
                });
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
            const u = this.usuarios.find(x => x.id === id);
            if(u) { u.aprovado = true; this.salvarUnicoUsuario(u); }
        },
        removerUsuario(id) {
            if(confirm("Remover usuário?")) {
                const lista = this.usuarios.filter(x => x.id !== id);
                if(db) db.ref('usuarios').set(lista);
            }
        },
        atualizarPermissao(user) { if(db) db.ref('usuarios').set(this.usuarios); },
        salvarProduto(p) { if(db) db.ref('produtos').set(this.produtos); },
        
        // ... (Calcula Falta e Status Item Iguais V38) ...
        calculaFalta(p) { if (!p.contagem && p.contagem !== 0) return { qtd: 0 }; const fator = p.fator || 1; const estoqueCompra = p.unQ !== p.unC ? p.contagem / fator : p.contagem * fator; const falta = p.meta - estoqueCompra; return { qtd: Math.ceil(falta) }; },
        statusItem(p) { if (p.ignorar) return 'ignored'; if (p.contagem === '' || p.contagem === undefined) return 'pending'; return this.calculaFalta(p).qtd > 0 ? 'buy' : 'ok'; },
        toggleIgnorar(p) { p.ignorar = !p.ignorar; if(p.ignorar) p.contagem = ''; this.salvarProduto(p); },

        adicionarProduto() {
            if(!this.novoProd.nome) return alert("Nome obrigatório");
            this.produtos.push({ id: Date.now(), ...this.novoProd, contagem: '', ignorar: false });
            if(db) db.ref('produtos').set(this.produtos);
            alert("Produto salvo!"); this.novoProd.nome = '';
        },
        
        enviarZap(destId, itens) {
            const dest = this.config.destinos.find(d => d.id == destId);
            const tel = dest ? dest.telefone : '';
            let msg = this.salvarParaSegunda ? "*LISTA DE SEGUNDA-FEIRA*\n" : "*PEDIDO ARTIGIANO*\n";
            msg += `Resp: ${this.usuarioLogado.nome} | Data: ${new Date().toLocaleDateString()}\n---\n`;
            let txtHist = "";
            itens.forEach(i => { msg += i.texto + '\n'; txtHist += i.texto.replace('- ', '') + ', '; });
            const novoHist = { data: new Date().toLocaleDateString(), hora: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}), usuario: this.usuarioLogado.nome, destino: dest ? dest.nome : 'Geral', itens: txtHist };
            this.historico.unshift(novoHist);
            if(this.historico.length > 50) this.historico.pop();
            this.salvarGeral();
            window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');
        },
        apagarHistorico(idx) { if(confirm("Apagar?")) { this.historico.splice(idx, 1); this.salvarGeral(); } },
        adicionarDestino() { if(this.novoDestino.nome) { if(!this.config.destinos) this.config.destinos = []; this.config.destinos.push({ id: Date.now(), ...this.novoDestino }); this.salvarGeral(); this.novoDestino = { nome: '', telefone: '', msg: '' }; } },
        removerDestino(idx) { this.config.destinos.splice(idx, 1); this.salvarGeral(); },
        getNomeDestino(id) { const d = this.config.destinos ? this.config.destinos.find(x => x.id === id) : null; return d ? d.nome : 'Geral'; },
        adicionarLocal() { if(this.novoLocal) { if(!this.config.rota) this.config.rota=[]; this.config.rota.push(this.novoLocal); this.novoLocal=''; this.salvarGeral(); } },
        removerLocal(idx) { if(confirm("Remover local?")) { this.config.rota.splice(idx, 1); this.salvarGeral(); } },
        moverRota(idx, dir) { if(dir===-1 && idx>0) [this.config.rota[idx],this.config.rota[idx-1]]=[this.config.rota[idx-1],this.config.rota[idx]]; else if(dir===1 && idx<this.config.rota.length-1) [this.config.rota[idx],this.config.rota[idx+1]]=[this.config.rota[idx+1],this.config.rota[idx]]; this.salvarGeral(); },
        
        salvarGeral() { if(db) db.ref('/').update({ config: this.config, historico: this.historico }); },
        
        carregarDb() {
            if(db) {
                db.ref('/').on('value', snap => {
                    const d = snap.val();
                    if(d) {
                        // CONVERTE SEMPRE PARA ARRAY PARA EVITAR BUGS
                        this.usuarios = d.usuarios ? (Array.isArray(d.usuarios) ? d.usuarios : Object.values(d.usuarios)) : [];
                        this.produtos = d.produtos ? (Array.isArray(d.produtos) ? d.produtos : Object.values(d.produtos)) : [];
                        this.config = d.config || { destinos: [], rota: ['Geral'] };
                        this.historico = d.historico || [];
                        if(!this.config.rota) this.config.rota = ['Geral'];

                        if(this.usuarioLogado) {
                            // ATUALIZAÇÃO EM TEMPO REAL DO STATUS
                            const u = this.usuarios.find(x => x.id === this.usuarioLogado.id);
                            if(u) { 
                                this.usuarioLogado = u; 
                                localStorage.setItem('artigiano_session', JSON.stringify(u)); 
                            } else {
                                this.logout(); // Se foi excluído por outro admin
                            }
                        }
                    }
                    this.loadingInicial = false;
                });
            } else { this.loadingInicial = false; }
        },
        resetarTudo() { if(confirm("Isso apaga TUDO. Certeza?")) { if(db) db.ref('/').remove(); localStorage.clear(); window.location.reload(); } }
    },
    mounted() {
        // CORREÇÃO DO LOADING
        setTimeout(() => { if(this.loadingInicial) this.loadingInicial = false; }, 3000);
        
        const session = localStorage.getItem('artigiano_session');
        if(session) { this.usuarioLogado = JSON.parse(session); this.sessaoAtiva = true; }
        const theme = localStorage.getItem('artigiano_theme');
        if(theme === 'dark') this.temaEscuro = true;
        this.carregarDb();
    }
});

app.mount('#app');