const firebaseConfig = { apiKey: "AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4", authDomain: "artigiano-app.firebaseapp.com", databaseURL: "https://artigiano-app-default-rtdb.firebaseio.com", projectId: "artigiano-app", storageBucket: "artigiano-app.firebasestorage.app", messagingSenderId: "212218495726", appId: "1:212218495726:web:dd6fec7a4a8c7ad572a9ff" };

let db; try { firebase.initializeApp(firebaseConfig); db = firebase.database(); } catch (e) { console.error(e); }

const { createApp } = Vue

const app = createApp({
    data() {
        return {
            loadingInicial: true, temaEscuro: false, mostrandoTermos: false,
            mostrandoAjuda: false, tituloAjuda: '', textoAjuda: '',
            loginUser: '', loginPass: '', sessaoAtiva: false, usuarioLogado: null, msgAuth: '', isError: false, loadingAuth: false,
            novoUserAdmin: { nome: '', cargo: 'Pizzaiolo', user: '', pass: '' }, editandoUsuarioId: null,
            feriados: [], novoFeriado: { data: '', nome: '' }, usuarios: [], config: { destinos: [], rota: ['Geral'] }, produtos: [], historico: [],
            moduloAtivo: null, termoBusca: '', mostrandoAdmin: false, mostrandoConfig: false, mostrandoPreview: false, mostrandoHistorico: false,
            // NOVO PRODUTO COM TIPO DE CONVERSÃO
            novoProd: { nome: '', categoria: 'geral', local: 'Estoque Seco', unQ: 'Un', unC: 'Cx', fator: 1, meta: 0, destinoId: '', tipoConversao: 'dividir' },
            novoDestino: { nome: '', telefone: '', msgPersonalizada: '' }, novoLocal: '', salvarParaSegunda: false
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
        locaisDoModulo() { const r = this.config.rota || ['Geral']; return r.filter(l => this.produtosFiltrados.some(p => p.local === l)); },
        produtosDoLocal() { return (local) => this.produtosFiltrados.filter(p => p.local === local); },
        itensParaPedir() { return this.produtosFiltrados.filter(p => !p.ignorar && this.statusItem(p) === 'buy'); },
        pedidosAgrupados() {
            const grupos = {};
            this.itensParaPedir.forEach(p => {
                const calc = this.calculaFalta(p);
                const dId = p.destinoId || 'geral';
                if (!grupos[dId]) grupos[dId] = [];
                // LÓGICA DO ALERTA DE HISTÓRICO
                let obs = "";
                if(this.analisarHistorico(p)) obs = " (⚠️ Acabou rápido!)";
                grupos[dId].push({ texto: `- ${calc.qtd} ${p.unC} ${p.nome}${obs}` });
            });
            return grupos;
        }
    },
    methods: {
        // --- CÁLCULO INTELIGENTE V49 ---
        calculaFalta(p) {
            if (!p.contagem && p.contagem !== 0 && !p.temAberto) return { qtd: 0 };
            
            // 1. Calcula Estoque Real na Unidade de COMPRA
            let estoqueReal = 0;
            const contagemPura = parseFloat(p.contagem || 0);
            
            // Adiciona 0.5 se tiver item aberto
            const contagemTotal = p.temAberto ? contagemPura + 0.5 : contagemPura;

            if (p.tipoConversao === 'multiplicar') {
                // Ex: Calabresa. Conto 3 Peças. Fator 0.5kg. Estoque = 1.5kg
                estoqueReal = contagemTotal * (p.fator || 1);
            } else {
                // Ex: Presunto. Conto 10 Un. Fator 20 (Cx). Estoque = 0.5 Cx
                // Padrão 'dividir'
                estoqueReal = contagemTotal / (p.fator || 1);
            }

            // 2. Aplica Meta (+20% se feriado)
            let metaAjustada = parseFloat(p.meta);
            if (this.isSemanaFeriado) metaAjustada = metaAjustada * 1.2;

            // 3. Define Compra
            const falta = metaAjustada - estoqueReal;
            return { qtd: Math.max(0, Math.ceil(falta * 10) / 10) }; // Arredonda 1 casa decimal (ex: 2.5 Kg)
        },

        // --- HISTÓRICO INTELIGENTE ---
        analisarHistorico(p) {
            // Procura o último pedido deste item nos últimos 5 dias
            const cincoDiasAtras = new Date();
            cincoDiasAtras.setDate(cincoDiasAtras.getDate() - 5);
            
            // Procura nos históricos recentes se o item estava lá
            const pedidoRecente = this.historico.find(h => {
                const dataH = new Date(h.data.split('/').reverse().join('-')); // Converte DD/MM/YYYY p/ Date
                return dataH >= cincoDiasAtras && h.itens.includes(p.nome);
            });

            // Se pediu recentemente E agora está pedindo de novo (estoque baixo), alerta!
            return !!pedidoRecente;
        },

        toggleAberto(p) { p.temAberto = !p.temAberto; this.salvarProdutoUnitario(p); },

        // --- ZAP FORMATADO V49 ---
        enviarZap(destId, itens, isSegunda) {
            const dest = this.config.destinos.find(d => d.id == destId);
            const tel = dest ? dest.telefone : '';
            let saudacao = dest && dest.msgPersonalizada ? dest.msgPersonalizada : "Olá, pedido:";
            let titulo = isSegunda ? "*PARA SEGUNDA-FEIRA*\n" : "";
            
            // CABEÇALHO LIMPO
            let msg = `${titulo}${saudacao}\n\n*Pedido de hoje:*\n----------------\n`;
            itens.forEach(i => { msg += i.texto + '\n'; });
            
            // HISTÓRICO
            let txtH = (isSegunda ? "[2ª] " : "") + itens.map(i => i.texto.replace('- ','')).join(', ');
            const h = { id: this.gerarId(), data: new Date().toLocaleDateString(), hora: new Date().toLocaleTimeString(), usuario: this.usuarioLogado.nome, destino: dest ? dest.nome : 'Geral', itens: txtH };
            this.salvarHistoricoUnitario(h);
            
            window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');
        },

        // --- IMPORTAR CONTATO ---
        async importarContatoDoCelular() {
            if ('contacts' in navigator && 'ContactsManager' in window) {
                try {
                    const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: false });
                    if (contacts[0]) {
                        this.novoDestino.nome = contacts[0].name[0];
                        let tel = contacts[0].tel[0].replace(/\D/g,'');
                        if(tel.length >= 10 && tel.length <= 11) tel = '55' + tel;
                        this.novoDestino.telefone = tel;
                    }
                } catch (ex) { alert("Erro ao importar."); }
            } else { alert("Função não suportada neste navegador."); }
        },

        // --- PADRÃO ---
        gerarId() { return 'id_' + Math.random().toString(36).substr(2, 9); },
        alternarTema() { this.temaEscuro = !this.temaEscuro; localStorage.setItem('artigiano_theme', this.temaEscuro ? 'dark' : 'light'); },
        verificarTermos() { if (!localStorage.getItem('artigiano_tos_accepted')) this.mostrandoTermos = true; },
        aceitarTermos() { localStorage.setItem('artigiano_tos_accepted', 'true'); this.mostrandoTermos = false; },
        abrirAjuda() { this.tituloAjuda = "Ajuda"; this.textoAjuda = "Configure seus produtos com o Tipo de Conversão correto.\nUse o botão '+0.5' para itens abertos."; this.mostrandoAjuda = true; },

        fazerLogin() {
            this.loadingAuth = true; this.msgAuth = '';
            setTimeout(() => {
                const li = this.loginUser.trim().toLowerCase(); const pi = this.loginPass.trim();
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

        // SYNC
        salvarMeuPerfil() { this.salvarUsuarioUnitario(this.usuarioLogado); localStorage.setItem('artigiano_session', JSON.stringify(this.usuarioLogado)); alert("Salvo!"); },
        adicionarFeriado() { if(!this.novoFeriado.data) return; const novo = { id: this.gerarId(), ...this.novoFeriado }; if(db) db.ref('system/feriados/' + novo.id).set(novo); this.novoFeriado = { data: '', nome: '' }; },
        removerFeriado(id) { if(db) db.ref('system/feriados/' + id).remove(); },
        salvarUsuarioUnitario(u) { if(db) db.ref('system/users/' + u.id).set(u); },
        salvarProdutoUnitario(p) { if(db) db.ref('store/products/' + p.id).set(p); },
        salvarHistoricoUnitario(h) { if(db) db.ref('store/history/' + h.id).set(h); },
        adicionarUsuarioAdmin() { if (!this.novoUserAdmin.nome) return; const novo = { id: this.gerarId(), ...this.novoUserAdmin, aprovado: true, permissoes: { admin: false, hortifruti: true, geral: true, bebidas: true, limpeza: true } }; this.salvarUsuarioUnitario(novo); this.novoUserAdmin = { nome: '', user: '', pass: '', cargo: 'Pizzaiolo' }; alert("Criado!"); },
        removerUsuario(id) { if(confirm("Remover?")) db.ref('system/users/' + id).remove(); },
        abrirModulo(m) { this.moduloAtivo = m; this.termoBusca = ''; },
        podeAcessar(perm) { return this.usuarioLogado.permissoes.admin || this.usuarioLogado.permissoes[perm]; },
        statusItem(p) { if(p.ignorar) return 'ignored'; if(p.contagem==='' && !p.temAberto) return 'pending'; return this.calculaFalta(p).qtd > 0 ? 'buy' : 'ok'; },
        toggleIgnorar(p) { p.ignorar = !p.ignorar; if(p.ignorar) p.contagem=''; this.salvarProdutoUnitario(p); },
        adicionarProduto() { const p = { id: this.gerarId(), ...this.novoProd, contagem: '', ignorar: false, temAberto: false }; this.salvarProdutoUnitario(p); this.novoProd.nome = ''; },
        
        salvarConfig() { if(db) db.ref('system/config').set(this.config); },
        adicionarDestino() { if(this.novoDestino.nome) { if(!this.config.destinos) this.config.destinos=[]; this.config.destinos.push({id: this.gerarId(), ...this.novoDestino}); this.salvarConfig(); this.novoDestino={nome:'', telefone:'', msgPersonalizada:''}; } },
        removerDestino(idx) { this.config.destinos.splice(idx,1); this.salvarConfig(); },
        getNomeDestino(id) { const d = this.config.destinos ? this.config.destinos.find(x => x.id === id) : null; return d ? d.nome : 'Geral'; },
        adicionarLocal() { if(this.novoLocal) { if(!this.config.rota) this.config.rota=[]; this.config.rota.push(this.novoLocal); this.novoLocal=''; this.salvarConfig(); } },
        removerLocal(idx) { if(confirm("Remover?")) { this.config.rota.splice(idx,1); this.salvarConfig(); } },
        moverRota(idx, dir) { if(dir===-1 && idx>0) [this.config.rota[idx],this.config.rota[idx-1]]=[this.config.rota[idx-1],this.config.rota[idx]]; else if(dir===1 && idx<this.config.rota.length-1) [this.config.rota[idx],this.config.rota[idx+1]]=[this.config.rota[idx+1],this.config.rota[idx]]; this.salvarConfig(); },
        resetarTudo() { if(confirm("RESET?")) { db.ref('/').remove(); location.reload(); } },

        carregarDb() {
            if(db) {
                db.ref('system/users').on('value', s => { this.usuarios = s.val() ? Object.values(s.val()) : []; this.verificarSessao(); });
                db.ref('store/products').on('value', s => { this.produtos = s.val() ? Object.values(s.val()) : []; });
                db.ref('store/history').on('value', s => { const h = s.val() ? Object.values(s.val()) : []; this.historico = h.sort((a,b) => b.id.localeCompare(a.id)); });
                db.ref('system/feriados').on('value', s => { this.feriados = s.val() ? Object.values(s.val()) : []; if(this.feriados.length===0) { const l=[{id:'1',data:'2026-12-10',nome:'Aniv. Londrina'},{id:'2',data:'2026-06-15',nome:'Padroeiro'},{id:'3',data:'2026-12-25',nome:'Natal'},{id:'4',data:'2026-01-01',nome:'Ano Novo'}]; l.forEach(f=>db.ref('system/feriados/'+f.id).set(f)); } });
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
