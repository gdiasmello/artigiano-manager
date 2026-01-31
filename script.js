const firebaseConfig = { apiKey: "AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4", authDomain: "artigiano-app.firebaseapp.com", databaseURL: "https://artigiano-app-default-rtdb.firebaseio.com", projectId: "artigiano-app", storageBucket: "artigiano-app.firebasestorage.app", messagingSenderId: "212218495726", appId: "1:212218495726:web:dd6fec7a4a8c7ad572a9ff" };

let db; try { firebase.initializeApp(firebaseConfig); db = firebase.database(); } catch (e) { console.error(e); }

const { createApp } = Vue

const app = createApp({
    data() {
        return {
            loadingInicial: true, temaEscuro: false, mostrandoTermos: false, mostrandoAjuda: false, tituloAjuda: '', textoAjuda: '',
            loginUser: '', loginPass: '', sessaoAtiva: false, usuarioLogado: null, msgAuth: '', isError: false, loadingAuth: false,
            // ADMIN
            novoUserAdmin: { 
                nome: '', cargo: '', user: '', pass: '', 
                permissoes: { admin: false, hortifruti: false, geral: false, bebidas: false, limpeza: false } // PERMISSÕES EXPLÍCITAS
            }, 
            editandoUsuarioId: null,
            // DADOS
            feriados: [], novoFeriado: { data: '', nome: '' }, usuarios: [], 
            config: { destinos: [], rota: ['Freezer', 'Geladeira'], cores: { hortifruti: '#10B981', geral: '#3B82F6', bebidas: '#EF4444', limpeza: '#8B5CF6' } },
            produtos: [], historico: [],
            moduloAtivo: null, termoBusca: '', mostrandoAdmin: false, mostrandoConfig: false, mostrandoPreview: false, mostrandoHistorico: false,
            novoProd: { nome: '', categoria: 'geral', locaisSelecionados: [], unQ: 'Un', unC: 'Cx', fator: 1, meta: 0, destinoId: '', tipoConversao: 'dividir' },
            novoDestino: { nome: '', telefone: '', msgPersonalizada: '' }, novoLocal: ''
        }
    },
    computed: {
        usuariosAtivos() { return this.usuarios.filter(u => u.aprovado === true); },
        usuariosPendentes() { return this.usuarios.filter(u => u.aprovado === false); },
        pendentesCount() { return this.usuariosPendentes.length; },
        nomeModulo() { const n = { hortifruti: 'Hortifruti', geral: 'Geral', bebidas: 'Bebidas', limpeza: 'Limpeza' }; return n[this.moduloAtivo] || ''; },
        feriadosOrdenados() { return this.feriados.slice().sort((a,b) => a.data.localeCompare(b.data)).map(f => ({ ...f, dataFormatted: f.data.split('-').reverse().join('/') })); },
        isSemanaFeriado() {
            const hoje = new Date(); const i = new Date(hoje); i.setDate(hoje.getDate() - hoje.getDay()); const f = new Date(hoje); f.setDate(hoje.getDate() + (6 - hoje.getDay()));
            return this.feriados.some(fer => { const d = new Date(fer.data + 'T00:00:00'); return d >= i && d <= f; });
        },
        produtosFiltrados() { if (!this.moduloAtivo) return []; return this.produtos.filter(p => (this.termoBusca ? p.nome.toLowerCase().includes(this.termoBusca.toLowerCase()) : true) && p.categoria === this.moduloAtivo); },
        locaisDoModulo() { const r = this.config.rota || ['Geral']; return r.filter(local => this.produtosFiltrados.some(p => p.locais && p.locais.includes(local))); },
        produtosDoLocal() { return (local) => this.produtosFiltrados.filter(p => p.locais && p.locais.includes(local)); },
        itensParaPedir() { return this.produtosFiltrados.filter(p => !p.ignorar && this.statusItem(p) === 'buy'); },
        pedidosAgrupados() {
            const grupos = {}; const processados = new Set();
            this.itensParaPedir.forEach(p => {
                if(processados.has(p.id)) return;
                processados.add(p.id);
                const calc = this.calculaFalta(p);
                const dId = p.destinoId || 'geral';
                if (!grupos[dId]) grupos[dId] = [];
                let obs = this.analisarHistorico(p) ? " (⚠️ Acabou rápido!)" : "";
                grupos[dId].push({ texto: `- ${calc.qtd} ${p.unC} ${p.nome}${obs}` });
            });
            return grupos;
        }
    },
    methods: {
        getCorCategoria(cat) { return this.config.cores ? (this.config.cores[cat] || '#ccc') : '#ccc'; },
        sugestaoDia(mod) { const dia = new Date().getDay(); if(dia === 1) return mod === 'geral' || mod === 'limpeza'; return mod === 'hortifruti'; },

        // --- CÁLCULO MESTRE V53 ---
        getContagemTotal(p) {
            if(!p.contagem || typeof p.contagem !== 'object') return 0;
            let total = 0; Object.values(p.contagem).forEach(val => total += (parseFloat(val) || 0));
            if(p.temAberto) total += 0.5; return total;
        },
        calculaFalta(p) {
            let total = this.getContagemTotal(p);
            if (total === 0 && !p.temAberto) return { qtd: 0 }; 
            let estoqueReal = 0;
            if (p.tipoConversao === 'multiplicar') estoqueReal = total * (p.fator || 1); else estoqueReal = total / (p.fator || 1);
            let metaAjustada = parseFloat(p.meta); if (this.isSemanaFeriado) metaAjustada = metaAjustada * 1.2;
            const falta = metaAjustada - estoqueReal;
            return { qtd: Math.max(0, Math.ceil(falta * 10) / 10) };
        },
        statusItem(p) { if(p.ignorar) return 'ignored'; if(this.getContagemTotal(p) === 0 && !p.temAberto) return 'pending'; return this.calculaFalta(p).qtd > 0 ? 'buy' : 'ok'; },
        toggleAberto(p) { p.temAberto = !p.temAberto; this.salvarProdutoUnitario(p); },
        toggleIgnorar(p) { p.ignorar = !p.ignorar; if(p.ignorar) p.contagem={}; this.salvarProdutoUnitario(p); },

        enviarZap(destId, itens, isSegunda) {
            const dest = this.config.destinos.find(d => d.id == destId);
            const tel = dest ? dest.telefone : '';
            let saudacao = dest && dest.msgPersonalizada ? dest.msgPersonalizada : "Olá, pedido:";
            let titulo = isSegunda ? "*PARA SEGUNDA-FEIRA*\n" : "";
            let msg = `${titulo}${saudacao}\n\n*Pedido de hoje:*\n----------------\n`;
            itens.forEach(i => { msg += i.texto + '\n'; });
            const h = { id: this.gerarId(), data: new Date().toLocaleDateString(), hora: new Date().toLocaleTimeString(), usuario: this.usuarioLogado.nome, destino: dest ? dest.nome : 'Geral', itens: (isSegunda ? "[2ª] " : "") + itens.map(i=>i.texto.replace('- ','')).join(', ') };
            this.salvarHistoricoUnitario(h);
            window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');
        },

        async importarContatoDoCelular() { if ('contacts' in navigator) { try { const c = await navigator.contacts.select(['name', 'tel'], {multiple:false}); if(c[0]) { this.novoDestino.nome = c[0].name[0]; this.novoDestino.telefone = c[0].tel[0].replace(/\D/g,''); } } catch(e){} } else alert("Navegador não suporta."); },

        // --- ADMIN PERMISSÕES ---
        aplicarPermissoesPadrao() {
            // DEFINE OS PADRÕES, MAS USUÁRIO PODE MUDAR DEPOIS
            if (this.novoUserAdmin.cargo === 'Gerente') {
                this.novoUserAdmin.permissoes = { admin: true, hortifruti: true, geral: true, bebidas: true, limpeza: true };
            } else if (this.novoUserAdmin.cargo === 'Pizzaiolo') {
                this.novoUserAdmin.permissoes = { admin: false, hortifruti: true, geral: true, bebidas: false, limpeza: false };
            } else {
                this.novoUserAdmin.permissoes = { admin: false, hortifruti: false, geral: false, bebidas: true, limpeza: true };
            }
        },
        adicionarUsuarioAdmin() {
            if (!this.novoUserAdmin.nome) return alert("Nome?");
            const novo = { id: this.gerarId(), ...this.novoUserAdmin, aprovado: true };
            this.salvarUsuarioUnitario(novo); 
            this.novoUserAdmin = { nome: '', cargo: '', user: '', pass: '', permissoes: { admin: false, hortifruti: false, geral: false, bebidas: false, limpeza: false } }; 
            alert("Criado!");
        },
        prepararEdicao(u) {
            // Clona o objeto para edição segura
            this.novoUserAdmin = JSON.parse(JSON.stringify(u));
            this.editandoUsuarioId = u.id;
        },
        salvarEdicaoUsuario() {
            if(this.editandoUsuarioId) {
                this.salvarUsuarioUnitario(this.novoUserAdmin);
                this.cancelarEdicaoUsuario();
            }
        },
        cancelarEdicaoUsuario() { 
            this.editandoUsuarioId = null; 
            this.novoUserAdmin = { nome: '', cargo: '', user: '', pass: '', permissoes: { admin: false, hortifruti: false, geral: false, bebidas: false, limpeza: false } }; 
        },

        // --- PADRÕES ---
        adicionarProduto() {
            if(!this.novoProd.nome) return alert("Nome?");
            if(this.novoProd.locaisSelecionados.length === 0) return alert("Locais?");
            const p = { id: this.gerarId(), ...this.novoProd, locais: this.novoProd.locaisSelecionados, contagem: {}, ignorar: false, temAberto: false };
            delete p.locaisSelecionados;
            this.salvarProdutoUnitario(p); alert("Salvo!"); this.novoProd.nome = ''; this.novoProd.locaisSelecionados = [];
        },
        migrarProduto(p) { let mudou=false; if(p.local&&!p.locais){p.locais=[p.local];mudou=true;} if(typeof p.contagem!=='object'&&p.locais&&p.locais.length>0){const val=p.contagem;p.contagem={};if(val!==''&&val!==undefined)p.contagem[p.locais[0]]=val;mudou=true;} return mudou?p:null; },
        gerarId() { return 'id_' + Math.random().toString(36).substr(2, 9); },
        alternarTema() { this.temaEscuro = !this.temaEscuro; localStorage.setItem('artigiano_theme', this.temaEscuro ? 'dark' : 'light'); },
        verificarTermos() { if (!localStorage.getItem('artigiano_tos_accepted')) this.mostrandoTermos = true; },
        aceitarTermos() { localStorage.setItem('artigiano_tos_accepted', 'true'); this.mostrandoTermos = false; },
        abrirAjuda() { this.tituloAjuda = "Ajuda"; this.textoAjuda = "Para destravar a lista, tente rolar com 2 dedos ou recarregar.\nUse '+0.5' para itens abertos."; this.mostrandoAjuda = true; },
        fazerLogin() { this.loadingAuth = true; this.msgAuth = ''; setTimeout(() => { const li = this.loginUser.trim().toLowerCase(); const pi = this.loginPass.trim(); if (li === 'gabriel' && pi === '21gabriel') { const u = this.usuarios.find(x => x.user.toLowerCase() === 'gabriel') || { id: 'admin_gabriel_master', nome: 'Gabriel Master', cargo: 'Gerente', user: 'Gabriel', pass: '21gabriel', aprovado: true, permissoes: { admin: true, hortifruti: true, geral: true, bebidas: true, limpeza: true } }; this.salvarUsuarioUnitario(u); this.logar(u); return; } const user = this.usuarios.find(u => u.user.toLowerCase() === li && u.pass === pi); if (user && user.aprovado) this.logar(user); else { this.msgAuth = "Acesso negado."; this.isError = true; this.loadingAuth = false; } }, 800); },
        logar(user) { this.usuarioLogado = user; this.sessaoAtiva = true; localStorage.setItem('artigiano_session', JSON.stringify(user)); this.loadingAuth = false; },
        logout() { this.sessaoAtiva = false; this.usuarioLogado = null; localStorage.removeItem('artigiano_session'); },
        salvarMeuPerfil() { this.salvarUsuarioUnitario(this.usuarioLogado); localStorage.setItem('artigiano_session', JSON.stringify(this.usuarioLogado)); alert("Salvo!"); },
        adicionarFeriado() { if(!this.novoFeriado.data) return; const novo = { id: this.gerarId(), ...this.novoFeriado }; if(db) db.ref('system/feriados/' + novo.id).set(novo); this.novoFeriado = { data: '', nome: '' }; },
        removerFeriado(id) { if(db) db.ref('system/feriados/' + id).remove(); },
        salvarUsuarioUnitario(u) { if(db) db.ref('system/users/' + u.id).set(u); },
        salvarProdutoUnitario(p) { if(db) db.ref('store/products/' + p.id).set(p); },
        salvarHistoricoUnitario(h) { if(db) db.ref('store/history/' + h.id).set(h); },
        salvarConfig() { if(db) db.ref('system/config').set(this.config); },
        removerUsuario(id) { if(confirm("Remover?")) db.ref('system/users/' + id).remove(); },
        abrirModulo(m) { this.moduloAtivo = m; this.termoBusca = ''; },
        podeAcessar(perm) { return this.usuarioLogado.permissoes.admin || this.usuarioLogado.permissoes[perm]; },
        analisarHistorico(p) { const d = new Date(); d.setDate(d.getDate()-5); const rec = this.historico.find(h => new Date(h.data.split('/').reverse().join('-')) >= d && h.itens.includes(p.nome)); return !!rec; },
        apagarHistorico(id) { if(confirm("Apagar?")) db.ref('store/history/' + id).remove(); },
        adicionarDestino() { if(this.novoDestino.nome) { if(!this.config.destinos) this.config.destinos=[]; this.config.destinos.push({id: this.gerarId(), ...this.novoDestino}); this.salvarConfig(); this.novoDestino={nome:'', telefone:'', msgPersonalizada:''}; } },
        removerDestino(idx) { this.config.destinos.splice(idx,1); this.salvarConfig(); },
        getNomeDestino(id) { const d = this.config.destinos ? this.config.destinos.find(x => x.id === id) : null; return d ? d.nome : 'Geral'; },
        adicionarLocal() { if(this.novoLocal) { if(!this.config.rota) this.config.rota=[]; this.config.rota.push(this.novoLocal); this.novoLocal=''; this.salvarConfig(); } },
        removerLocal(idx) { if(confirm("Remover?")) { this.config.rota.splice(idx,1); this.salvarConfig(); } },
        moverRota(idx, dir) { if(dir===-1 && idx>0) [this.config.rota[idx],this.config.rota[idx-1]]=[this.config.rota[idx-1],this.config.rota[idx]]; else if(dir===1 && idx<this.config.rota.length-1) [this.config.rota[idx],this.config.rota[idx+1]]=[this.config.rota[idx+1],this.config.rota[idx]]; this.salvarConfig(); },
        resetarTudo() { if(confirm("RESET?")) { db.ref('/').remove(); location.reload(); } },
        carregarDb() { if(db) { db.ref('system/users').on('value', s => { this.usuarios = s.val() ? Object.values(s.val()) : []; this.verificarSessao(); }); db.ref('store/products').on('value', s => { const raw = s.val() ? Object.values(s.val()) : []; this.produtos = raw.map(p => { const migrado = this.migrarProduto(p); if(migrado) this.salvarProdutoUnitario(migrado); return migrado || p; }); }); db.ref('store/history').on('value', s => { const h = s.val() ? Object.values(s.val()) : []; this.historico = h.sort((a,b) => b.id.localeCompare(a.id)); }); db.ref('system/feriados').on('value', s => { this.feriados = s.val() ? Object.values(s.val()) : []; if(this.feriados.length===0) { const l=[{id:'1',data:'2026-12-10',nome:'Aniv. Londrina'},{id:'2',data:'2026-06-15',nome:'Padroeiro'},{id:'3',data:'2026-12-25',nome:'Natal'},{id:'4',data:'2026-01-01',nome:'Ano Novo'}]; l.forEach(f=>db.ref('system/feriados/'+f.id).set(f)); } }); db.ref('system/config').on('value', s => { this.config = s.val() || { destinos: [], rota: ['Geral'] }; if(!this.config.cores) this.config.cores = { hortifruti: '#10B981', geral: '#3B82F6', bebidas: '#EF4444', limpeza: '#8B5CF6' }; if(!this.config.rota) this.config.rota=['Geral']; this.loadingInicial = false; }); } else { this.loadingInicial = false; } },
        verificarSessao() { if(this.usuarioLogado) { const u = this.usuarios.find(x => x.id === this.usuarioLogado.id); if(u) { this.usuarioLogado = u; localStorage.setItem('artigiano_session', JSON.stringify(u)); } else { this.logout(); } } }
    },
    mounted() { setTimeout(() => { if(this.loadingInicial) this.loadingInicial = false; }, 4000); this.verificarTermos(); const session = localStorage.getItem('artigiano_session'); if(session) { this.usuarioLogado = JSON.parse(session); this.sessaoAtiva = true; } const theme = localStorage.getItem('artigiano_theme'); if(theme === 'dark') this.temaEscuro = true; this.carregarDb(); }
});

app.mount('#app');
