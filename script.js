const firebaseConfig = { apiKey: "AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4", authDomain: "artigiano-app.firebaseapp.com", databaseURL: "https://artigiano-app-default-rtdb.firebaseio.com", projectId: "artigiano-app", storageBucket: "artigiano-app.firebasestorage.app", messagingSenderId: "212218495726", appId: "1:212218495726:web:dd6fec7a4a8c7ad572a9ff" };

let db; try { firebase.initializeApp(firebaseConfig); db = firebase.database(); } catch (e) { console.error(e); }

const { createApp } = Vue

const app = createApp({
    data() {
        return {
            loadingInicial: true, temaEscuro: false, mostrandoTermos: false, mostrandoAjuda: false, tituloAjuda: '', textoAjuda: '',
            loginUser: '', loginPass: '', sessaoAtiva: false, usuarioLogado: null, msgAuth: '', isError: false, loadingAuth: false,
            novoUserAdmin: { nome: '', cargo: '', user: '', pass: '', permissoes: { admin: false, hortifruti: false, geral: false, bebidas: false, limpeza: false, producao: false } }, editandoUsuarioId: null,
            feriados: [], novoFeriado: { data: '', nome: '' }, usuarios: [], 
            config: { destinos: [], rota: ['Freezer', 'Geladeira'], cores: { hortifruti: '#10B981', geral: '#3B82F6', bebidas: '#EF4444', limpeza: '#8B5CF6' } },
            produtos: [], historico: [], historicoMassa: [], 
            moduloAtivo: null, termoBusca: '', mostrandoAdmin: false, mostrandoConfig: false, mostrandoPreview: false, mostrandoHistorico: false,
            novoProd: { nome: '', categoria: 'geral', locaisSelecionados: [], unQ: 'Un', unC: 'Cx', fator: 1, meta: 0, destinoId: '', tipoConversao: 'dividir', somenteNome: false },
            novoDestino: { nome: '', telefone: '', msgPersonalizada: '' }, novoLocal: '',
            novoItemExtra: '', itensExtras: [],
            sobraMassa: '', mostrarLotes: false, mostrarHistoricoMassa: false, modoReceita: 'calc', loteSelecionado: '',
            lotesPadrao: [{qtd:15,far:'2kg',agua:'1.247g',lev:'90g',sal:'60g'},{qtd:30,far:'4kg',agua:'2.494g',lev:'180g',sal:'120g'},{qtd:45,far:'6kg',agua:'3.742g',lev:'270g',sal:'180g'},{qtd:60,far:'8kg',agua:'4.989g',lev:'360g',sal:'240g'},{qtd:75,far:'10kg',agua:'6.237g',lev:'450g',sal:'300g'},{qtd:90,far:'12kg',agua:'7.484g',lev:'540g',sal:'360g'},{qtd:110,far:'14kg',agua:'8.732g',lev:'630g',sal:'420g'}]
        }
    },
    computed: {
        nomeDiaSemana() { const dias = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']; return dias[new Date().getDay()]; },
        metaDia() { const d = new Date().getDay(); let base = (d===0||d===5||d===6) ? 100 : 60; if(this.isSemanaFeriado) base = Math.round(base * 1.2); return base; },
        qtdProduzir() { const sobra = this.sobraMassa || 0; return Math.max(0, this.metaDia - sobra); },
        receitaCalculada() {
            const q = this.qtdProduzir; const r = { farinha: 133.3, aguaLiq: 58.2, gelo: 24.9, levain: 6, sal: 4 };
            return { farinha: Math.round(q*r.farinha), aguaLiq: Math.round(q*r.aguaLiq), gelo: Math.round(q*r.gelo), aguaTotal: Math.round(q*(r.aguaLiq+r.gelo)), levain: Math.round(q*r.levain), sal: Math.round(q*r.sal) };
        },
        receitaExibida() {
            if (this.modoReceita === 'lote' && this.loteSelecionado) {
                const l = this.lotesPadrao.find(x => x.qtd === this.loteSelecionado); if(l) return { far: l.far, aguaTotal: l.agua, agua: 'Ver tabela', gelo: 'Ver tabela', lev: l.lev, sal: l.sal };
            }
            const c = this.receitaCalculada;
            return { far: this.formatGramas(c.farinha), aguaTotal: this.formatGramas(c.aguaTotal), agua: this.formatGramas(c.aguaLiq), gelo: this.formatGramas(c.gelo), lev: this.formatGramas(c.levain), sal: this.formatGramas(c.sal) };
        },
        usuariosAtivos() { return this.usuarios.filter(u => u.aprovado === true); },
        usuariosPendentes() { return this.usuarios.filter(u => u.aprovado === false); },
        pendentesCount() { return this.usuariosPendentes.length; },
        nomeModulo() { const n = { hortifruti:'Hortifruti', geral:'Geral', bebidas:'Bebidas', limpeza:'Limpeza', producao:'Produção de Massas' }; return n[this.moduloAtivo] || ''; },
        feriadosOrdenados() { return this.feriados.slice().sort((a,b) => a.data.localeCompare(b.data)).map(f => ({ ...f, dataFormatted: f.data.split('-').reverse().join('/') })); },
        isSemanaFeriado() { const h = new Date(); const i = new Date(h); i.setDate(h.getDate()-h.getDay()); const f = new Date(h); f.setDate(h.getDate()+(6-h.getDay())); return this.feriados.some(fer => { const d = new Date(fer.data+'T00:00:00'); return d>=i && d<=f; }); },
        produtosFiltrados() { if(!this.moduloAtivo) return []; return this.produtos.filter(p => (this.termoBusca ? p.nome.toLowerCase().includes(this.termoBusca.toLowerCase()) : true) && p.categoria === this.moduloAtivo); },
        locaisDoModulo() { const r = this.config.rota || ['Geral']; return r.filter(l => this.produtosFiltrados.some(p => p.locais && p.locais.includes(l))); },
        produtosDoLocal() { return (local) => this.produtosFiltrados.filter(p => p.locais && p.locais.includes(local)); },
        itensParaPedir() { return this.produtosFiltrados.filter(p => !p.ignorar && this.statusItem(p) === 'buy'); },
        contagemCarrinho() { return this.itensParaPedir.length; },
        pedidosAgrupados() {
            const grupos = {}; const processados = new Set();
            this.itensParaPedir.forEach(p => {
                if(processados.has(p.id)) return; processados.add(p.id);
                const calc = this.calculaFalta(p); 
                // LOGICA DE SEPARAÇÃO: Se não tem destino, agrupa por categoria
                let dId = p.destinoId ? p.destinoId : '';
                if (!dId) {
                    if (p.categoria === 'hortifruti') dId = 'Hortifruti';
                    else if (p.categoria === 'bebidas') dId = 'Bebidas';
                    else dId = 'Geral'; // Geral e Limpeza juntos
                }
                if (!grupos[dId]) grupos[dId] = [];
                let textoItem = "";
                if (p.somenteNome) textoItem = `- ${p.nome}`;
                else textoItem = `- ${calc.qtd} ${p.unC} ${p.nome}`;
                if(this.analisarHistorico(p)) textoItem += " (⚠️ Acabou rápido!)";
                grupos[dId].push({ texto: textoItem, id: p.id });
            });
            return grupos;
        }
    },
    methods: {
        adicionarExtra() { if(this.novoItemExtra) { this.itensExtras.push(this.novoItemExtra); this.novoItemExtra = ''; } },
        removerExtra(idx) { this.itensExtras.splice(idx, 1); },
        alternarTema() { this.temaEscuro = !this.temaEscuro; localStorage.setItem('artigiano_theme', this.temaEscuro ? 'dark' : 'light'); if(this.temaEscuro) document.body.classList.add('dark-mode'); else document.body.classList.remove('dark-mode'); },
        formatGramas(g) { if(g >= 1000) return (g/1000).toFixed(2).replace('.', ',') + ' kg'; return g + ' g'; },
        getCorCategoria(cat) { return this.config.cores ? (this.config.cores[cat] || '#ccc') : '#ccc'; },
        sugestaoDia(mod) { const dia = new Date().getDay(); if(dia === 1) return mod === 'geral' || mod === 'limpeza'; return mod === 'hortifruti'; },
        getContagemTotal(p) { if(!p.contagem || typeof p.contagem !== 'object') return 0; let total = 0; Object.values(p.contagem).forEach(val => total += (parseFloat(val) || 0)); if(p.temAberto) total += 0.5; return total; },
        calculaFalta(p) { let total = this.getContagemTotal(p); if (total === 0 && !p.temAberto) return { qtd: 0 }; let estoqueReal = 0; if (p.tipoConversao === 'multiplicar') estoqueReal = total * (p.fator || 1); else estoqueReal = total / (p.fator || 1); let metaAjustada = parseFloat(p.meta); if (this.isSemanaFeriado) metaAjustada = metaAjustada * 1.2; const falta = metaAjustada - estoqueReal; return { qtd: Math.max(0, Math.ceil(falta * 10) / 10) }; },
        statusItem(p) { if(p.ignorar) return 'ignored'; if(this.getContagemTotal(p) === 0 && !p.temAberto) return 'pending'; return this.calculaFalta(p).qtd > 0 ? 'buy' : 'ok'; },
        toggleAberto(p) { p.temAberto = !p.temAberto; this.salvarProdutoUnitario(p); },
        toggleIgnorar(p) { p.ignorar = !p.ignorar; if(p.ignorar) p.contagem={}; this.salvarProdutoUnitario(p); },
        
        enviarZap(destId, itens, isSegunda) { 
            let dest = this.config.destinos.find(d => d.id == destId);
            const tel = dest ? dest.telefone : ''; 
            let nomeDestino = dest ? dest.nome : destId; // Usa o nome do grupo se não for destino cadastrado
            let saudacao = dest && dest.msgPersonalizada ? dest.msgPersonalizada : "Olá, segue pedido:"; 
            let titulo = isSegunda ? "*PARA SEGUNDA-FEIRA*\n" : ""; 
            
            let msg = `${titulo}${saudacao}\n\n*Pedido (${nomeDestino}):*\n----------------\n`; 
            itens.forEach(i => { msg += i.texto + '\n'; }); 
            
            // Adiciona Extras se for Geral
            if (nomeDestino === 'Geral' && this.itensExtras.length > 0) {
                // Adiciona direto na lista sem cabeçalho "Algo mais"
                this.itensExtras.forEach(e => msg += `- ${e}\n`);
            }

            const h = { id: this.gerarId(), data: new Date().toLocaleDateString(), hora: new Date().toLocaleTimeString(), usuario: this.usuarioLogado.nome, destino: nomeDestino, itens: (isSegunda ? "[2ª] " : "") + itens.map(i=>i.texto.replace('- ','')).join(', ') }; 
            this.salvarHistoricoUnitario(h); 
            
            // SE FOR GUARDAR P/ SEGUNDA: Apenas salva historico, NÃO abre zap, NÃO limpa
            if (isSegunda) {
                alert("Salvo no Rascunho para Segunda!");
                return;
            }

            // SE FOR ENVIAR AGORA: Abre Zap e LIMPA
            window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank'); 
            
            // Limpa os itens enviados
            itens.forEach(i => {
                const prod = this.produtos.find(p => p.id === i.id);
                if(prod) { prod.contagem = {}; prod.temAberto = false; this.salvarProdutoUnitario(prod); }
            });
            if(nomeDestino === 'Geral') this.itensExtras = []; // Limpa extras se enviou Geral
            this.mostrandoPreview = false; // Fecha modal
        },

        registrarProducao() { const qtd = this.modoReceita === 'calc' ? this.qtdProduzir : this.loteSelecionado; const h = { id: this.gerarId(), data: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString().slice(0,5), qtd: qtd, user: this.usuarioLogado.nome }; if(db) db.ref('store/dough_history/' + h.id).set(h); alert("Produção Registrada!"); },
        async importarContatoDoCelular() { if ('contacts' in navigator) { try { const c = await navigator.contacts.select(['name', 'tel'], {multiple:false}); if(c[0]) { this.novoDestino.nome = c[0].name[0]; this.novoDestino.telefone = c[0].tel[0].replace(/\D/g,''); } } catch(e){} } else alert("Navegador não suporta."); },
        aplicarPermissoesPadrao() { if (this.novoUserAdmin.cargo === 'Gerente') this.novoUserAdmin.permissoes = { admin: true, hortifruti: true, geral: true, bebidas: true, limpeza: true, producao: true }; else if (this.novoUserAdmin.cargo === 'Pizzaiolo') this.novoUserAdmin.permissoes = { admin: false, hortifruti: true, geral: true, bebidas: false, limpeza: false, producao: true }; else this.novoUserAdmin.permissoes = { admin: false, hortifruti: false, geral: false, bebidas: true, limpeza: true, producao: false }; },
        adicionarUsuarioAdmin() { if (!this.novoUserAdmin.nome) return alert("Nome?"); const novo = { id: this.gerarId(), ...this.novoUserAdmin, aprovado: true }; this.salvarUsuarioUnitario(novo); this.novoUserAdmin = { nome: '', cargo: '', user: '', pass: '', permissoes: { admin: false, hortifruti: false, geral: false, bebidas: false, limpeza: false, producao: false } }; alert("Criado!"); },
        prepararEdicao(u) { this.novoUserAdmin = JSON.parse(JSON.stringify(u)); this.editandoUsuarioId = u.id; },
        salvarEdicaoUsuario() { if(this.editandoUsuarioId) { this.salvarUsuarioUnitario(this.novoUserAdmin); this.cancelarEdicaoUsuario(); } },
        cancelarEdicaoUsuario() { this.editandoUsuarioId = null; this.novoUserAdmin = { nome: '', cargo: '', user: '', pass: '', permissoes: { admin: false, hortifruti: false, geral: false, bebidas: false, limpeza: false, producao: false } }; },
        adicionarProduto() { if(!this.novoProd.nome) return alert("Nome?"); if(this.novoProd.locaisSelecionados.length === 0) return alert("Locais?"); const p = { id: this.gerarId(), ...this.novoProd, locais: this.novoProd.locaisSelecionados, contagem: {}, ignorar: false, temAberto: false }; delete p.locaisSelecionados; this.salvarProdutoUnitario(p); alert("Salvo!"); this.novoProd.nome = ''; this.novoProd.locaisSelecionados = []; },
        migrarProduto(p) { let mudou=false; if(p.local&&!p.locais){p.locais=[p.local];mudou=true;} if(typeof p.contagem!=='object'&&p.locais&&p.locais.length>0){const val=p.contagem;p.contagem={};if(val!==''&&val!==undefined)p.contagem[p.locais[0]]=val;mudou=true;} return mudou?p:null; },
        gerarId() { return 'id_' + Math.random().toString(36).substr(2, 9); },
        verificarTermos() { if (!localStorage.getItem('artigiano_tos_accepted')) this.mostrandoTermos = true; },
        aceitarTermos() { localStorage.setItem('artigiano_tos_accepted', 'true'); this.mostrandoTermos = false; },
        abrirAjuda() { if(this.moduloAtivo==='producao'){this.tituloAjuda="Produção";this.textoAjuda="Calculadora automática.";}else{this.tituloAjuda = "Ajuda"; this.textoAjuda = "Use 'Importar Agenda'.\nClique no carrinho para finalizar.";} this.mostrandoAjuda = true; },
        fazerLogin() { this.loadingAuth = true; this.msgAuth = ''; setTimeout(() => { const li = this.loginUser.trim().toLowerCase(); const pi = this.loginPass.trim(); if (li === 'gabriel' && pi === '21gabriel') { const u = this.usuarios.find(x => x.user.toLowerCase() === 'gabriel') || { id: 'admin_gabriel_master', nome: 'Gabriel Master', cargo: 'Gerente', user: 'Gabriel', pass: '21gabriel', aprovado: true, permissoes: { admin: true, hortifruti: true, geral: true, bebidas: true, limpeza: true, producao: true } }; this.salvarUsuarioUnitario(u); this.logar(u); return; } const user = this.usuarios.find(u => u.user.toLowerCase() === li && u.pass === pi); if (user && user.aprovado) this.logar(user); else { this.msgAuth = "Acesso negado."; this.isError = true; this.loadingAuth = false; } }, 800); },
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
        getNomeDestino(id) { const d = this.config.destinos ? this.config.destinos.find(x => x.id === id) : null; return d ? d.nome : id; },
        adicionarLocal() { if(this.novoLocal) { if(!this.config.rota) this.config.rota=[]; this.config.rota.push(this.novoLocal); this.novoLocal=''; this.salvarConfig(); } },
        removerLocal(idx) { if(confirm("Remover?")) { this.config.rota.splice(idx,1); this.salvarConfig(); } },
        resetarTudo() { if(confirm("RESET?")) { db.ref('/').remove(); location.reload(); } },
        carregarDb() { if(db) { 
            db.ref('system/users').on('value', s => { this.usuarios = s.val() ? Object.values(s.val()) : []; this.verificarSessao(); }); 
            db.ref('store/products').on('value', s => { const raw = s.val() ? Object.values(s.val()) : []; this.produtos = raw.map(p => { const migrado = this.migrarProduto(p); if(migrado) this.salvarProdutoUnitario(migrado); return migrado || p; }); }); 
            db.ref('store/history').on('value', s => { const h = s.val() ? Object.values(s.val()) : []; this.historico = h.sort((a,b) => b.id.localeCompare(a.id)); }); 
            db.ref('store/dough_history').on('value', s => { const h = s.val() ? Object.values(s.val()) : []; this.historicoMassa = h.sort((a,b) => b.id.localeCompare(a.id)); });
            db.ref('system/feriados').on('value', s => { this.feriados = s.val() ? Object.values(s.val()) : []; if(this.feriados.length===0) { const l=[{id:'1',data:'2026-12-10',nome:'Aniv. Londrina'},{id:'2',data:'2026-06-15',nome:'Padroeiro'},{id:'3',data:'2026-12-25',nome:'Natal'},{id:'4',data:'2026-01-01',nome:'Ano Novo'}]; l.forEach(f=>db.ref('system/feriados/'+f.id).set(f)); } }); 
            db.ref('system/config').on('value', s => { this.config = s.val() || { destinos: [], rota: ['Geral'] }; if(!this.config.cores) this.config.cores = { hortifruti: '#10B981', geral: '#3B82F6', bebidas: '#EF4444', limpeza: '#8B5CF6' }; if(!this.config.rota) this.config.rota=['Geral']; this.loadingInicial = false; }); 
        } else { this.loadingInicial = false; } },
        verificarSessao() { if(this.usuarioLogado) { const u = this.usuarios.find(x => x.id === this.usuarioLogado.id); if(u) { this.usuarioLogado = u; localStorage.setItem('artigiano_session', JSON.stringify(u)); } else { this.logout(); } } }
    },
    mounted() { setTimeout(() => { if(this.loadingInicial) this.loadingInicial = false; }, 5000); this.verificarTermos(); const session = localStorage.getItem('artigiano_session'); if(session) { this.usuarioLogado = JSON.parse(session); this.sessaoAtiva = true; const th = localStorage.getItem('artigiano_theme'); if(th==='dark') { this.temaEscuro=true; document.body.classList.add('dark-mode'); } } this.carregarDb(); }
});

app.mount('#app');
