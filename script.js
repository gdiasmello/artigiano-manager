// CHAVES (MANTIDAS)
const firebaseConfig = { apiKey: "AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4", authDomain: "artigiano-app.firebaseapp.com", databaseURL: "https://artigiano-app-default-rtdb.firebaseio.com", projectId: "artigiano-app", storageBucket: "artigiano-app.firebasestorage.app", messagingSenderId: "212218495726", appId: "1:212218495726:web:dd6fec7a4a8c7ad572a9ff" };

let db; try { firebase.initializeApp(firebaseConfig); db = firebase.database(); } catch (e) { console.error(e); }

const { createApp } = Vue

const app = createApp({
    data() {
        return {
            loadingInicial: true, temaEscuro: false, mostrandoTermos: false,
            // AUTH
            loginUser: '', loginPass: '', sessaoAtiva: false, usuarioLogado: null, msgAuth: '', isError: false, loadingAuth: false,
            // ADMIN
            novoUserAdmin: { nome: '', cargo: 'Pizzaiolo', user: '', pass: '' }, editandoUsuarioId: null,
            // FERIADOS & DADOS
            feriados: [], novoFeriado: { data: '', nome: '' },
            usuarios: [], config: { destinos: [], rota: ['Geral'] }, produtos: [], historico: [],
            // APP
            moduloAtivo: null, termoBusca: '', mostrandoAdmin: false, mostrandoConfig: false, mostrandoPreview: false, mostrandoHistorico: false,
            novoProd: { nome: '', categoria: 'geral', local: 'Estoque Seco', unQ: 'Un', unC: 'Cx', fator: 1, meta: 0, destinoId: '' },
            novoDestino: { nome: '', telefone: '', msgPersonalizada: '' }, novoLocal: '', salvarParaSegunda: false
        }
    },
    computed: {
        usuariosAtivos() { return this.usuarios.filter(u => u.aprovado === true); },
        usuariosPendentes() { return this.usuarios.filter(u => u.aprovado === false); },
        pendentesCount() { return this.usuariosPendentes.length; },
        nomeModulo() { const n = { hortifruti: 'Hortifruti', geral: 'Geral', bebidas: 'Bebidas', limpeza: 'Limpeza' }; return n[this.moduloAtivo] || ''; },
        
        // ORDENAR FERIADOS
        feriadosOrdenados() {
            return this.feriados.slice().sort((a,b) => a.data.localeCompare(b.data))
                .map(f => ({ ...f, dataFormatted: f.data.split('-').reverse().join('/') }));
        },
        // LÓGICA DO FERIADO (+20%)
        isSemanaFeriado() {
            const hoje = new Date();
            const inicioSemana = new Date(hoje); inicioSemana.setDate(hoje.getDate() - hoje.getDay()); // Domingo
            const fimSemana = new Date(hoje); fimSemana.setDate(hoje.getDate() + (6 - hoje.getDay())); // Sábado
            
            return this.feriados.some(f => {
                // Ajuste fuso horário simples (considerando string YYYY-MM-DD)
                const dataFeriado = new Date(f.data + 'T00:00:00');
                return dataFeriado >= inicioSemana && dataFeriado <= fimSemana;
            });
        },

        produtosFiltrados() { if (!this.moduloAtivo) return []; return this.produtos.filter(p => (this.termoBusca ? p.nome.toLowerCase().includes(this.termoBusca.toLowerCase()) : true) && p.categoria === this.moduloAtivo); },
        locaisDoModulo() { const r = this.config.rota || ['Geral']; return r.filter(l => this.produtosFiltrados.some(p => p.local === l)); },
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
        gerarId() { return 'id_' + Math.random().toString(36).substr(2, 9); },
        alternarTema() { this.temaEscuro = !this.temaEscuro; localStorage.setItem('artigiano_theme', this.temaEscuro ? 'dark' : 'light'); },
        verificarTermos() { if (!localStorage.getItem('artigiano_tos_accepted')) this.mostrandoTermos = true; },
        aceitarTermos() { localStorage.setItem('artigiano_tos_accepted', 'true'); this.mostrandoTermos = false; },

        // AUTH
        fazerLogin() {
            this.loadingAuth = true; this.msgAuth = '';
            setTimeout(() => {
                const li = this.loginUser.trim().toLowerCase(); const pi = this.loginPass.trim();
                // Master Login
                if (li === 'gabriel' && pi === '21gabriel') {
                    const u = this.usuarios.find(x => x.user.toLowerCase() === 'gabriel') || { id: 'admin_gabriel_master', nome: 'Gabriel Master', cargo: 'Gerente', user: 'Gabriel', pass: '21gabriel', aprovado: true, permissoes: { admin: true, hortifruti: true, geral: true, bebidas: true, limpeza: true } };
                    this.salvarUsuarioUnitario(u); this.logar(u); return;
                }
                const user = this.usuarios.find(u => u.user.toLowerCase() === li && u.pass === pi);
                if (user && user.aprovado) this.logar(user);
                else { this.msgAuth = "Acesso negado."; this.isError = true; this.loadingAuth = false; }
            }, 800);
        },
        logar(user) { this.usuarioLogado = user; this.sessaoAtiva = true; localStorage.setItem('artigiano_session', JSON.stringify(user)); this.loadingAuth = false; },
        logout() { this.sessaoAtiva = false; this.usuarioLogado = null; localStorage.removeItem('artigiano_session'); },

        // --- EDITAR PERFIL PRÓPRIO ---
        salvarMeuPerfil() {
            this.salvarUsuarioUnitario(this.usuarioLogado);
            localStorage.setItem('artigiano_session', JSON.stringify(this.usuarioLogado));
            alert("Perfil atualizado!");
        },

        // --- FERIADOS ---
        adicionarFeriado() {
            if(!this.novoFeriado.data) return;
            const novo = { id: this.gerarId(), ...this.novoFeriado };
            if(db) db.ref('system/feriados/' + novo.id).set(novo);
            this.novoFeriado = { data: '', nome: '' };
        },
        removerFeriado(id) { if(db) db.ref('system/feriados/' + id).remove(); },

        // DB SYNC
        salvarUsuarioUnitario(u) { if(db) db.ref('system/users/' + u.id).set(u); },
        salvarProdutoUnitario(p) { if(db) db.ref('store/products/' + p.id).set(p); },
        salvarHistoricoUnitario(h) { if(db) db.ref('store/history/' + h.id).set(h); },
        
        adicionarUsuarioAdmin() {
            if (!this.novoUserAdmin.nome) return;
            const novo = { id: this.gerarId(), ...this.novoUserAdmin, aprovado: true, permissoes: { admin: false, hortifruti: true, geral: true, bebidas: true, limpeza: true } };
            this.salvarUsuarioUnitario(novo); this.novoUserAdmin = { nome: '', user: '', pass: '', cargo: 'Pizzaiolo' }; alert("Criado!");
        },
        removerUsuario(id) { if(confirm("Remover?")) db.ref('system/users/' + id).remove(); },

        // APP LOGIC
        abrirModulo(m) { this.moduloAtivo = m; this.termoBusca = ''; },
        podeAcessar(perm) { return this.usuarioLogado.permissoes.admin || this.usuarioLogado.permissoes[perm]; },
        
        calculaFalta(p) {
            if (!p.contagem && p.contagem !== 0) return { qtd: 0 };
            const fat = p.fator || 1; 
            const est = p.unQ !== p.unC ? p.contagem / fat : p.contagem * fat;
            
            // LÓGICA DO FERIADO: Se for semana de feriado, aumenta Meta em 20%
            let metaAjustada = p.meta;
            if (this.isSemanaFeriado) { metaAjustada = p.meta * 1.2; }

            const falta = metaAjustada - est;
            return { qtd: Math.max(0, Math.ceil(falta)) };
        },
        statusItem(p) { if(p.ignorar) return 'ignored'; if(p.contagem==='') return 'pending'; return this.calculaFalta(p).qtd > 0 ? 'buy' : 'ok'; },
        toggleIgnorar(p) { p.ignorar = !p.ignorar; if(p.ignorar) p.contagem=''; this.salvarProdutoUnitario(p); },
        adicionarProduto() { const p = { id: this.gerarId(), ...this.novoProd, contagem: '', ignorar: false }; this.salvarProdutoUnitario(p); this.novoProd.nome = ''; },
        
        // ZAP SEM RESPONSAVEL
        enviarZap(destId, itens) {
            const dest = this.config.destinos.find(d => d.id == destId);
            const tel = dest ? dest.telefone : '';
            let saudacao = dest && dest.msgPersonalizada ? dest.msgPersonalizada : "Olá, pedido:";
            
            let msg = `${saudacao}\n\n`;
            itens.forEach(i => { msg += i.texto + '\n'; });
            
            // Histórico
            let txtH = itens.map(i => i.texto.replace('- ','')).join(', ');
            const h = { id: this.gerarId(), data: new Date().toLocaleDateString(), hora: new Date().toLocaleTimeString(), usuario: this.usuarioLogado.nome, destino: dest ? dest.nome : 'Geral', itens: txtH };
            this.salvarHistoricoUnitario(h);
            
            window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');
        },
        apagarHistorico(id) { if(confirm("Apagar?")) db.ref('store/history/' + id).remove(); },

        // CONFIG GERAL
        salvarConfig() { if(db) db.ref('system/config').set(this.config); },
        adicionarDestino() { if(this.novoDestino.nome) { if(!this.config.destinos) this.config.destinos=[]; this.config.destinos.push({id: this.gerarId(), ...this.novoDestino}); this.salvarConfig(); this.novoDestino={nome:'', telefone:'', msgPersonalizada:''}; } },
        removerDestino(idx) { this.config.destinos.splice(idx,1); this.salvarConfig(); },
        getNomeDestino(id) { const d = this.config.destinos ? this.config.destinos.find(x => x.id === id) : null; return d ? d.nome : 'Geral'; },
        adicionarLocal() { if(this.novoLocal) { if(!this.config.rota) this.config.rota=[]; this.config.rota.push(this.novoLocal); this.novoLocal=''; this.salvarConfig(); } },
        removerLocal(idx) { if(confirm("Remover?")) { this.config.rota.splice(idx,1); this.salvarConfig(); } },
        moverRota(idx, dir) { if(dir===-1 && idx>0) [this.config.rota[idx],this.config.rota[idx-1]]=[this.config.rota[idx-1],this.config.rota[idx]]; else if(dir===1 && idx<this.config.rota.length-1) [this.config.rota[idx],this.config.rota[idx+1]]=[this.config.rota[idx+1],this.config.rota[idx]]; this.salvarConfig(); },
        resetarTudo() { if(confirm("RESET TOTAL?")) { db.ref('/').remove(); location.reload(); } },

        carregarDb() {
            if(db) {
                db.ref('system/users').on('value', s => { this.usuarios = s.val() ? Object.values(s.val()) : []; this.verificarSessao(); });
                db.ref('store/products').on('value', s => { this.produtos = s.val() ? Object.values(s.val()) : []; });
                db.ref('store/history').on('value', s => { const h = s.val() ? Object.values(s.val()) : []; this.historico = h.sort((a,b) => b.id.localeCompare(a.id)); });
                // FERIADOS
                db.ref('system/feriados').on('value', s => { 
                    this.feriados = s.val() ? Object.values(s.val()) : []; 
                    // Se estiver vazio, popula Londrina
                    if(this.feriados.length === 0) {
                        const londrina = [
                            {id:'1', data:'2026-12-10', nome:'Aniv. Londrina'},
                            {id:'2', data:'2026-06-15', nome:'Padroeiro (Aprox)'},
                            {id:'3', data:'2026-12-25', nome:'Natal'},
                            {id:'4', data:'2026-01-01', nome:'Ano Novo'}
                        ];
                        londrina.forEach(f => db.ref('system/feriados/'+f.id).set(f));
                    }
                });
                db.ref('system/config').on('value', s => { this.config = s.val() || { destinos: [], rota: ['Geral'] }; if(!this.config.rota) this.config.rota=['Geral']; this.loadingInicial = false; });
            } else { this.loadingInicial = false; }
        },
        verificarSessao() { if(this.usuarioLogado) { const u = this.usuarios.find(x => x.id === this.usuarioLogado.id); if(u) { this.usuarioLogado = u; localStorage.setItem('artigiano_session', JSON.stringify(u)); } else { this.logout(); } } }
    },
    mounted() {
        setTimeout(() => { if(this.loadingInicial) this.loadingInicial = false; }, 4000);
        this.verificarTermos();
        const session = localStorage.getItem('artigiano_session');
        if(session) { this.usuarioLogado = JSON.parse(session); this.sessaoAtiva = true; }
        const theme = localStorage.getItem('artigiano_theme');
        if(theme === 'dark') this.temaEscuro = true;
        this.carregarDb();
    }
});

app.mount('#app');
