const firebaseConfig = { apiKey: "AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4", authDomain: "artigiano-app.firebaseapp.com", databaseURL: "https://artigiano-app-default-rtdb.firebaseio.com", projectId: "artigiano-app", storageBucket: "artigiano-app.firebasestorage.app", messagingSenderId: "212218495726", appId: "1:212218495726:web:dd6fec7a4a8c7ad572a9ff" };

let db; try { firebase.initializeApp(firebaseConfig); db = firebase.database(); } catch (e) { console.error(e); }

const { createApp } = Vue

const app = createApp({
    data: function() {
        return {
            loadingInicial: true, temaEscuro: false, mostrandoTermos: false, mostrandoAjuda: false, tituloAjuda: '', textoAjuda: '',
            loginUser: '', loginPass: '', sessaoAtiva: false, usuarioLogado: null, msgAuth: '', isError: false, loadingAuth: false,
            // Permissoes completas
            novoUserAdmin: { nome: '', cargo: '', user: '', pass: '', permissoes: { admin: false, hortifruti: false, geral: false, bebidas: false, limpeza: false, producao: false, verHistorico: false, editarItens: false } }, 
            editandoUsuarioId: null,
            editandoProdutoId: null,
            
            feriados: [], novoFeriado: { data: '', nome: '' }, usuarios: [], 
            config: { destinos: [], rota: ['Freezer', 'Geladeira'], cores: { hortifruti: '#10B981', geral: '#3B82F6', bebidas: '#EF4444', limpeza: '#8B5CF6' } },
            produtos: [], historico: [], historicoMassa: [], 
            moduloAtivo: null, termoBusca: '', mostrandoAdmin: false, mostrandoConfig: false, mostrandoPreview: false, mostrandoHistorico: false,
            novoProd: { nome: '', descricao: '', categoria: 'geral', locaisSelecionados: [], unQ: 'Un', unC: 'Cx', fator: 1, meta: 0, destinoId: '', tipoConversao: 'dividir', somenteNome: false },
            novoDestino: { nome: '', telefone: '', msgPersonalizada: '' }, novoLocal: '',
            novoItemExtra: '', itensExtras: [],
            sobraMassa: '', mostrarLotes: false, mostrarHistoricoMassa: false, modoReceita: 'calc', loteSelecionado: '',
            lotesPadrao: [{qtd:15,far:'2kg',agua:'1.247g',lev:'90g',sal:'60g'},{qtd:30,far:'4kg',agua:'2.494g',lev:'180g',sal:'120g'},{qtd:45,far:'6kg',agua:'3.742g',lev:'270g',sal:'180g'},{qtd:60,far:'8kg',agua:'4.989g',lev:'360g',sal:'240g'},{qtd:75,far:'10kg',agua:'6.237g',lev:'450g',sal:'300g'},{qtd:90,far:'12kg',agua:'7.484g',lev:'540g',sal:'360g'},{qtd:110,far:'14kg',agua:'8.732g',lev:'630g',sal:'420g'}]
        }
    },
    computed: {
        nomeDiaSemana: function() { const dias = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']; return dias[new Date().getDay()]; },
        metaDia: function() { const d = new Date().getDay(); let base = (d===0||d===5||d===6) ? 100 : 60; if(this.isSemanaFeriado) base = Math.round(base * 1.2); return base; },
        qtdProduzir: function() { const sobra = this.sobraMassa || 0; return Math.max(0, this.metaDia - sobra); },
        receitaCalculada: function() { const q = this.qtdProduzir; const r = { farinha: 133.3, aguaLiq: 58.2, gelo: 24.9, levain: 6, sal: 4 }; return { farinha: Math.round(q*r.farinha), aguaLiq: Math.round(q*r.aguaLiq), gelo: Math.round(q*r.gelo), aguaTotal: Math.round(q*(r.aguaLiq+r.gelo)), levain: Math.round(q*r.levain), sal: Math.round(q*r.sal) }; },
        receitaExibida: function() { 
            var self = this;
            if (this.modoReceita === 'lote' && this.loteSelecionado) { 
                var l = this.lotesPadrao.find(function(x){ return x.qtd === self.loteSelecionado; }); 
                if(l) return { far: l.far, aguaTotal: l.agua, agua: 'Ver tabela', gelo: 'Ver tabela', lev: l.lev, sal: l.sal }; 
            } 
            var c = this.receitaCalculada; return { far: this.formatGramas(c.farinha), aguaTotal: this.formatGramas(c.aguaTotal), agua: this.formatGramas(c.aguaLiq), gelo: this.formatGramas(c.gelo), lev: this.formatGramas(c.levain), sal: this.formatGramas(c.sal) }; 
        },
        usuariosAtivos: function() { return this.usuarios.filter(function(u){ return u.aprovado === true; }); },
        usuariosPendentes: function() { return this.usuarios.filter(function(u){ return u.aprovado === false; }); },
        pendentesCount: function() { return this.usuariosPendentes.length; },
        nomeModulo: function() { const n = { hortifruti:'Hortifruti', geral:'Geral', bebidas:'Bebidas', limpeza:'Limpeza', producao:'Produção de Massas' }; return n[this.moduloAtivo] || ''; },
        feriadosOrdenados: function() { return this.feriados.slice().sort(function(a,b){ return a.data.localeCompare(b.data); }).map(function(f){ return { id: f.id, data: f.data, nome: f.nome, dataFormatted: f.data.split('-').reverse().join('/') }; }); },
        isSemanaFeriado: function() { 
            var h = new Date(); var i = new Date(h); i.setDate(h.getDate()-h.getDay()); var f = new Date(h); f.setDate(h.getDate()+(6-h.getDay())); 
            return this.feriados.some(function(fer){ var d = new Date(fer.data+'T00:00:00'); return d>=i && d<=f; }); 
        },
        produtosFiltrados: function() { 
            var self = this;
            if(!this.moduloAtivo) return []; 
            return this.produtos.filter(function(p){ 
                return (self.termoBusca ? p.nome.toLowerCase().includes(self.termoBusca.toLowerCase()) : true) && p.categoria === self.moduloAtivo; 
            }); 
        },
        locaisDoModulo: function() { 
            var self = this;
            var r = this.config.rota || ['Geral']; 
            return r.filter(function(l){ return self.produtosFiltrados.some(function(p){ return p.locais && p.locais.includes(l); }); }); 
        },
        produtosDoLocal: function() { 
            var self = this;
            return function(local) { return self.produtosFiltrados.filter(function(p){ return p.locais && p.locais.includes(local); }); }; 
        },
        itensParaPedir: function() { 
            var self = this;
            return this.produtosFiltrados.filter(function(p){ return !p.ignorar && self.statusItem(p) === 'buy'; }); 
        },
        contagemCarrinho: function() { return this.itensParaPedir.length; },
        
        sugestoesProdutos: function() {
            if (!this.produtos || !this.novoProd || !this.novoProd.nome) return [];
            if (this.novoProd.nome.length < 2 || this.editandoProdutoId) return [];
            var t = this.novoProd.nome.toLowerCase();
            return this.produtos.filter(function(p){ return p.nome && p.nome.toLowerCase().includes(t); }).slice(0, 5); 
        },

        pedidosAgrupados: function() {
            var grupos = {}; var processados = new Set();
            var self = this;
            this.itensParaPedir.forEach(function(p) {
                if(processados.has(p.id)) return; processados.add(p.id);
                var calc = self.calculaFalta(p); 
                var dId = p.destinoId ? p.destinoId : '';
                if (!dId) {
                    if (p.categoria === 'hortifruti') dId = 'Hortifruti';
                    else if (p.categoria === 'bebidas') dId = 'Bebidas';
                    else dId = 'Geral'; 
                }
                if (!grupos[dId]) grupos[dId] = [];
                var textoItem = "";
                
                if (p.somenteNome) textoItem = "- " + p.nome;
                else textoItem = "- " + calc.qtd + " " + p.unC + " " + p.nome;
                
                if (p.descricao) textoItem += " (" + p.descricao + ")";
                if(self.analisarHistorico(p)) textoItem += " (⚠️ Cobrar pedido anterior: Chegou?)";
                grupos[dId].push({ texto: textoItem, id: p.id });
            });
            return grupos;
        }
    },
    methods: {
        podeAcessar: function(perm) { 
            if (!this.usuarioLogado || !this.usuarioLogado.permissoes) return false;
            return this.usuarioLogado.permissoes.admin || this.usuarioLogado.permissoes[perm]; 
        },
        adicionarExtra: function() { if(this.novoItemExtra) { this.itensExtras.push(this.novoItemExtra); this.novoItemExtra = ''; } },
        removerExtra: function(idx) { this.itensExtras.splice(idx, 1); },
        alternarTema: function() { this.temaEscuro = !this.temaEscuro; localStorage.setItem('artigiano_theme', this.temaEscuro ? 'dark' : 'light'); if(this.temaEscuro) document.body.classList.add('dark-mode'); else document.body.classList.remove('dark-mode'); },
        formatGramas: function(g) { if(g >= 1000) return (g/1000).toFixed(2).replace('.', ',') + ' kg'; return g + ' g'; },
        getCorCategoria: function(cat) { return this.config.cores ? (this.config.cores[cat] || '#ccc') : '#ccc'; },
        sugestaoDia: function(mod) { const dia = new Date().getDay(); if(dia === 1) return mod === 'geral' || mod === 'limpeza'; return mod === 'hortifruti'; },
        getContagemTotal: function(p) { if(!p.contagem || typeof p.contagem !== 'object') return 0; let total = 0; Object.values(p.contagem).forEach(function(val){ total += (parseFloat(val) || 0); }); if(p.temAberto) total += 0.5; return total; },
        calculaFalta: function(p) { let total = this.getContagemTotal(p); if (total === 0 && !p.temAberto) return { qtd: 0 }; let estoqueReal = 0; if (p.tipoConversao === 'multiplicar') estoqueReal = total * (p.fator || 1); else estoqueReal = total / (p.fator || 1); let metaAjustada = parseFloat(p.meta); if (this.isSemanaFeriado) metaAjustada = metaAjustada * 1.2; const falta = metaAjustada - estoqueReal; return { qtd: Math.max(0, Math.ceil(falta * 10) / 10) }; },
        statusItem: function(p) { if(p.ignorar) return 'ignored'; if(this.getContagemTotal(p) === 0 && !p.temAberto) return 'pending'; return this.calculaFalta(p).qtd > 0 ? 'buy' : 'ok'; },
        toggleAberto: function(p) { p.temAberto = !p.temAberto; this.salvarProdutoUnitario(p); },
        toggleIgnorar: function(p) { p.ignorar = !p.ignorar; if(p.ignorar) p.contagem={}; this.salvarProdutoUnitario(p); },
        
        enviarZap: function(destId, itens, isSegunda) { 
            var dest = this.config.destinos.find(function(d){ return d.id == destId; });
            var tel = dest ? dest.telefone : ''; 
            var nomeDestino = dest ? dest.nome : destId; 
            var saudacao = dest && dest.msgPersonalizada ? dest.msgPersonalizada : "Olá, segue pedido:"; 
            var titulo = isSegunda ? "*PARA SEGUNDA-FEIRA*\n" : ""; 
            
            var msg = titulo + saudacao + "\n\n*Pedido (" + nomeDestino + "):*\n----------------\n"; 
            itens.forEach(function(i){ msg += i.texto + '\n'; }); 
            
            if (nomeDestino === 'Geral' && this.itensExtras.length > 0) {
                this.itensExtras.forEach(function(e){ msg += "- " + e + "\n"; });
            }

            var h = { id: this.gerarId(), data: new Date().toLocaleDateString(), hora: new Date().toLocaleTimeString().slice(0,5), usuario: this.usuarioLogado.nome, destino: nomeDestino, itens: (isSegunda ? "[2ª] " : "") + itens.map(function(i){ return i.texto.replace('- ',''); }).join(', ') }; 
            this.salvarHistoricoUnitario(h); 
            
            if (isSegunda) { alert("Salvo no Rascunho!"); return; }
            window.open("https://wa.me/" + tel + "?text=" + encodeURIComponent(msg), '_blank'); 
            
            var self = this;
            itens.forEach(function(i){ 
                var prod = self.produtos.find(function(p){ return p.id === i.id; }); 
                if(prod) { prod.contagem = {}; prod.temAberto = false; self.salvarProdutoUnitario(prod); } 
            });
            if(nomeDestino === 'Geral') this.itensExtras = [];
            this.mostrandoPreview = false; 
        },

        registrarProducao: function() { const qtd = this.modoReceita === 'calc' ? this.qtdProduzir : this.loteSelecionado; const h = { id: this.gerarId(), data: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString().slice(0,5), qtd: qtd, user: this.usuarioLogado.nome }; if(db) db.ref('store/dough_history/' + h.id).set(h); alert("Produção Registrada!"); },
        
        importarContatoDoCelular: async function() { if ('contacts' in navigator) { try { const c = await navigator.contacts.select(['name', 'tel'], {multiple:false}); if(c[0]) { this.novoDestino.nome = c[0].name[0]; this.novoDestino.telefone = c[0].tel[0].replace(/\D/g,''); } } catch(e){} } else alert("Navegador não suporta."); },
        
        aplicarPermissoesPadrao: function() { 
            if (this.novoUserAdmin.cargo === 'Gerente') this.novoUserAdmin.permissoes = { admin: true, hortifruti: true, geral: true, bebidas: true, limpeza: true, producao: true, verHistorico: true, editarItens: true }; 
            else if (this.novoUserAdmin.cargo === 'Pizzaiolo') this.novoUserAdmin.permissoes = { admin: false, hortifruti: true, geral: true, bebidas: false, limpeza: false, producao: true, verHistorico: false, editarItens: false }; 
            else this.novoUserAdmin.permissoes = { admin: false, hortifruti: false, geral: false, bebidas: true, limpeza: true, producao: false, verHistorico: false, editarItens: false }; 
        },
        adicionarUsuarioAdmin: function() { if (!this.novoUserAdmin.nome) return alert("Nome?"); const novo = { id: this.gerarId(), ...this.novoUserAdmin, aprovado: true }; this.salvarUsuarioUnitario(novo); this.novoUserAdmin = { nome: '', cargo: '', user: '', pass: '', permissoes: { admin: false, hortifruti: false, geral: false, bebidas: false, limpeza: false, producao: false, verHistorico: false, editarItens: false } }; alert("Criado!"); },
        prepararEdicao: function(u) { this.novoUserAdmin = JSON.parse(JSON.stringify(u)); this.editandoUsuarioId = u.id; },
        salvarEdicaoUsuario: function() { if(this.editandoUsuarioId) { this.salvarUsuarioUnitario(this.novoUserAdmin); this.cancelarEdicaoUsuario(); } },
        cancelarEdicaoUsuario: function() { this.editandoUsuarioId = null; this.novoUserAdmin = { nome: '', cargo: '', user: '', pass: '', permissoes: { admin: false, hortifruti: false, geral: false, bebidas: false, limpeza: false, producao: false, verHistorico: false, editarItens: false } }; },
        
        carregarParaEdicao: function(p) { this.prepararEdicaoProduto(p); },
        prepararEdicaoProduto: function(p) { this.novoProd = JSON.parse(JSON.stringify(p)); if(!this.novoProd.locaisSelecionados) this.novoProd.locaisSelecionados = p.locais || []; this.editandoProdutoId = p.id; this.mostrandoConfig = true; },
        cancelarEdicaoProduto: function() { this.editandoProdutoId = null; this.novoProd = { nome: '', descricao: '', categoria: 'geral', locaisSelecionados: [], unQ: 'Un', unC: 'Cx', fator: 1, meta: 0, destinoId: '', tipoConversao: 'dividir', somenteNome: false }; },
        salvarEdicaoProduto: function() { if(!this.novoProd.nome) return alert("Nome?"); const p = { ...this.novoProd, id: this.editandoProdutoId, locais: this.novoProd.locaisSelecionados }; delete p.locaisSelecionados; this.salvarProdutoUnitario(p); alert("Atualizado!"); this.cancelarEdicaoProduto(); this.mostrandoConfig = false; },
        adicionarProduto: function() { if(!this.novoProd.nome) return alert("Nome?"); if(this.novoProd.locaisSelecionados.length === 0) return alert("Locais?"); const p = { id: this.gerarId(), ...this.novoProd, locais: this.novoProd.locaisSelecionados, contagem: {}, ignorar: false, temAberto: false }; delete p.locaisSelecionados; this.salvarProdutoUnitario(p); alert("Salvo!"); this.novoProd.nome = ''; this.novoProd.locaisSelecionados = []; },
        excluirProduto: function(id) { if(confirm("Excluir item permanentemente?")) { db.ref('store/products/' + id).remove(); this.cancelarEdicaoProduto(); this.mostrandoConfig = false; } },

        migrarProduto: function(p) { let mudou=false; if(p.local&&!p.locais){p.locais=[p.local];mudou=true;} if(typeof p.contagem!=='object'&&p.locais&&p.locais.length>0){const val=p.contagem;p.contagem={};if(val!==''&&val!==undefined)p.contagem[p.locais[0]]=val;mudou=true;} return mudou?p:null; },
        gerarId: function() { return 'id_' + Math.random().toString(36).substr(2, 9); },
        verificarTermos: function() { if (!localStorage.getItem('artigiano_tos_accepted')) this.mostrandoTermos = true; },
        aceitarTermos: function() { localStorage.setItem('artigiano_tos_accepted', 'true'); this.mostrandoTermos = false; },
        abrirAjuda: function() { if(this.moduloAtivo==='producao'){this.tituloAjuda="Produção";this.textoAjuda="Calculadora automática.";}else{this.tituloAjuda = "Ajuda"; this.textoAjuda = "Use 'Importar Agenda'.\nClique no carrinho para finalizar.";} this.mostrandoAjuda = true; },
        fazerLogin: function() { 
            this.loadingAuth = true; this.msgAuth = ''; 
            var self = this;
            setTimeout(function() { 
                const li = self.loginUser.trim().toLowerCase(); const pi = self.loginPass.trim(); 
                if (li === 'gabriel' && pi === '21gabriel') { 
                    const u = self.usuarios.find(function(x){ return x.user.toLowerCase() === 'gabriel'; }) || { id: 'admin_gabriel_master', nome: 'Gabriel Master', cargo: 'Gerente', user: 'Gabriel', pass: '21gabriel', aprovado: true, permissoes: { admin: true, hortifruti: true, geral: true, bebidas: true, limpeza: true, producao: true, verHistorico: true, editarItens: true } }; 
                    self.salvarUsuarioUnitario(u); self.logar(u); return; 
                } 
                const user = self.usuarios.find(function(u){ return u.user.toLowerCase() === li && u.pass === pi; }); 
                if (user && user.aprovado) self.logar(user); 
                else { self.msgAuth = "Acesso negado."; self.isError = true; self.loadingAuth = false; } 
            }, 800); 
        },
        logar: function(user) { this.usuarioLogado = user; this.sessaoAtiva = true; localStorage.setItem('artigiano_session', JSON.stringify(user)); this.loadingAuth = false; },
        logout: function() { this.sessaoAtiva = false; this.usuarioLogado = null; localStorage.removeItem('artigiano_session'); },
        salvarMeuPerfil: function() { this.salvarUsuarioUnitario(this.usuarioLogado); localStorage.setItem('artigiano_session', JSON.stringify(this.usuarioLogado)); alert("Salvo!"); },
        adicionarFeriado: function() { if(!this.novoFeriado.data) return; const novo = { id: this.gerarId(), ...this.novoFeriado }; if(db) db.ref('system/feriados/' + novo.id).set(novo); this.novoFeriado = { data: '', nome: '' }; },
        removerFeriado: function(id) { if(db) db.ref('system/feriados/' + id).remove(); },
        salvarUsuarioUnitario: function(u) { if(db) db.ref('system/users/' + u.id).set(u); },
        salvarProdutoUnitario: function(p) { if(db) db.ref('store/products/' + p.id).set(p); },
        salvarHistoricoUnitario: function(h) { if(db) db.ref('store/history/' + h.id).set(h); },
        salvarConfig: function() { if(db) db.ref('system/config').set(this.config); },
        removerUsuario: function(id) { if(confirm("Remover?")) db.ref('system/users/' + id).remove(); },
        abrirModulo: function(m) { this.moduloAtivo = m; this.termoBusca = ''; },
        analisarHistorico: function(p) { 
            var d = new Date(); d.setDate(d.getDate()-5); 
            var rec = this.historico.find(function(h){ 
                return new Date(h.data.split('/').reverse().join('-')) >= d && h.itens.includes(p.nome); 
            }); 
            return !!rec; 
        },
        apagarHistorico: function(id) { if(confirm("Apagar?")) db.ref('store/history/' + id).remove(); },
        adicionarDestino: function() { if(this.novoDestino.nome) { if(!this.config.destinos) this.config.destinos=[]; this.config.destinos.push({id: this.gerarId(), ...this.novoDestino}); this.salvarConfig(); this.novoDestino={nome:'', telefone:'', msgPersonalizada:''}; } },
        removerDestino: function(idx) { this.config.destinos.splice(idx,1); this.salvarConfig(); },
        getNomeDestino: function(id) { 