// --- SUA CHAVE FIREBASE (NÃO MEXER) ---
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
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        console.log("🔥 Firebase Conectado V28");
    }
} catch (e) { console.error("Erro Firebase:", e); }

const { createApp } = Vue

createApp({
    data() {
        return {
            conectado: false,
            // LOGIN & SESSÃO
            usuarioLogado: null,
            pinDigitado: '',
            erroLogin: '',
            usuarios: [], 
            
            // NAVEGAÇÃO & UI
            modoSelecionado: null,
            mostrandoConfig: false, mostrandoPreview: false, mostrandoHistorico: false,
            termoBusca: '', observacaoExtra: '',
            
            // DADOS PRINCIPAIS
            config: { nomeEmpresa: 'Artigiano', rota: ['Geral'], destinos: [], feriados: [], lembretes: [] },
            produtos: [],
            historico: [],
            
            // FORMULÁRIOS (Inputs temporários)
            novoProd: { nome: '', setor: '', unQ: '', unC: '', fator: 1, meta: 0, destinoId: '' },
            novoDestino: { nome: '', telefone: '', msgPersonalizada: '', triplicarSexta: false },
            novoUsuarioNome: '', novoUsuarioPin: '',
            novoLembrete: { dia: 5, texto: '' },
            editandoId: null
        }
    },
    computed: {
        semUsuarios() { return !this.usuarios || this.usuarios.length === 0; },
        dataHoje() { return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }); },
        
        // FILTROS DA LISTA
        produtosFiltrados() {
            let lista = this.produtos.filter(p => {
                if(this.termoBusca && !p.nome.toLowerCase().includes(this.termoBusca.toLowerCase())) return false;
                return true;
            });
            if (this.modoSelecionado === 'sacolao') {
                return lista.filter(p => {
                    const nome = this.getNomeDestino(p.destinoId).toLowerCase();
                    return nome.includes('sacol') || nome.includes('horti') || nome.includes('fruta') || nome.includes('legume');
                });
            } else if (this.modoSelecionado === 'geral') {
                return lista.filter(p => {
                    const nome = this.getNomeDestino(p.destinoId).toLowerCase();
                    return !(nome.includes('sacol') || nome.includes('horti') || nome.includes('fruta'));
                });
            }
            return lista;
        },
        rotaExibicao() { 
            const rotas = (this.config.rota && this.config.rota.length) ? this.config.rota : ['Geral'];
            const setoresUsados = [...new Set(this.produtosFiltrados.map(p => p.setor))];
            const orfaos = setoresUsados.filter(s => !rotas.includes(s));
            return [...rotas, ...orfaos];
        },
        produtosDoLocal() { return (local) => this.produtosFiltrados.filter(p => p.setor === local); },
        itensContados() { return this.produtosFiltrados.filter(p => p.contagem !== '' || p.ignorar).length; },
        
        // INTEELIGÊNCIA DE DATAS
        diaDaSemana() { return new Date().getDay(); },
        feriadoAtivo() {
            if(!this.config.feriados) return null;
            const hoje = new Date(); const limite = new Date(); limite.setDate(hoje.getDate()+3);
            return this.config.feriados.find(f => {
                const d = new Date(hoje.getFullYear(), f.mes-1, f.dia);
                return d >= hoje && d <= limite;
            });
        },
        lembreteDoDia() {
            if(!this.config.lembretes) return null;
            return this.config.lembretes.find(l => l.dia == this.diaDaSemana);
        },
        
        // PREPARAÇÃO DO PEDIDO
        pedidosPorDestino() {
            const grupos = {};
            this.produtosFiltrados.forEach(p => {
                const calc = this.calculaFalta(p);
                if (!p.ignorar && p.contagem !== '' && calc.qtd > 0) {
                    const id = p.destinoId || 'geral';
                    if (!grupos[id]) grupos[id] = [];
                    let txt = `- ${calc.qtd} ${p.unC} ${p.nome}`;
                    if(p.obs) txt += ` (${p.obs})`;
                    if(calc.fatorMultiplicador > 1) txt += ` (x${calc.fatorMultiplicador})`;
                    grupos[id].push({ texto: txt });
                }
            });
            return grupos;
        }
    },
    methods: {
        // --- LOGIN & SESSÃO (CORRIGIDO NA V28) ---
        addPin(n) { 
            if(this.pinDigitado.length < 4) {
                this.pinDigitado += n;
                if(this.pinDigitado.length === 4) this.tentarLogin();
            }
        },
        limparPin() { this.pinDigitado = this.pinDigitado.slice(0, -1); },
        
        tentarLogin() {
            // Backdoor se banco vazio: Admin 1234
            if (this.semUsuarios && this.pinDigitado === '1234') {
                this.salvarSessao({ nome: 'Admin Temp', admin: true, pin:'1234' });
                return;
            }
            const user = this.usuarios.find(u => u.pin == this.pinDigitado);
            if(user) {
                this.salvarSessao(user); // SALVA O LOGIN!
            } else {
                this.erroLogin = 'PIN Incorreto';
                setTimeout(() => { this.erroLogin = ''; this.pinDigitado = ''; }, 1500);
            }
        },
        
        salvarSessao(user) {
            this.usuarioLogado = user;
            localStorage.setItem('artigiano_user', JSON.stringify(user)); // Persistência
            this.pinDigitado = '';
            this.erroLogin = '';
        },
        
        logout() {
            if(confirm('Sair do sistema?')) {
                this.usuarioLogado = null;
                localStorage.removeItem('artigiano_user'); // Limpa persistência
                this.modoSelecionado = null;
                this.pinDigitado = '';
                // Reseta dados locais para forçar recarga limpa no próximo login
                this.produtos = []; this.config = {}; this.historico = [];
                this.carregarDados();
            }
        },

        criarPrimeiroAdmin() {
            if(this.novoUsuarioNome && this.novoUsuarioPin.length === 4) {
                const u = { nome: this.novoUsuarioNome, pin: this.novoUsuarioPin, admin: true };
                if(!this.usuarios) this.usuarios = [];
                this.usuarios.push(u);
                this.salvarUsuarios();
                this.salvarSessao(u);
                this.novoUsuarioNome = ''; this.novoUsuarioPin = '';
            } else { alert('Preencha nome e PIN de 4 dígitos.'); }
        },

        // --- GERENCIAMENTO (CRUD) ---
        adicionarUsuario() {
            if(this.novoUsuarioNome && this.novoUsuarioPin.length === 4) {
                if(!this.usuarios) this.usuarios = [];
                // Novos usuários nunca são admin por padrão
                this.usuarios.push({ nome: this.novoUsuarioNome, pin: this.novoUsuarioPin, admin: false });
                this.novoUsuarioNome = ''; this.novoUsuarioPin = '';
                this.salvarUsuarios();
            } else { alert('Nome e PIN (4 dígitos) obrigatórios.'); }
        },
        removerUsuario(idx) { if(confirm('Remover este usuário?')) { this.usuarios.splice(idx, 1); this.salvarUsuarios(); } },
        salvarUsuarios() { if(db) db.ref('usuarios').set(this.usuarios); },

        adicionarProduto() {
            if(!this.novoProd.nome) return alert('Nome obrigatório');
            this.produtos.push({ id: Date.now(), ...this.novoProd, contagem: '', ignorar: false, obs: '' });
            this.novoProd={nome:'', setor: this.novoProd.setor, unQ:'', unC:'', fator:1, meta:0, destinoId: this.novoProd.destinoId};
            this.salvarGeral();
            alert('Produto salvo!');
        },
        // NOVO: Remover produto na lista de configurações
        removerProduto(idx) { if(confirm('Excluir este produto permanentemente?')) { this.produtos.splice(idx, 1); this.salvarGeral(); } },

        editarProduto(p) { this.novoProd = { ...p }; this.editandoId = p.id; this.mostrandoConfig = true; },
        
        adicionarDestino() { 
            if(this.novoDestino.nome) {
                this.config.destinos.push({ id: Date.now(), ...this.novoDestino });
                this.novoDestino = {nome:'', telefone:'', msgPersonalizada:''};
                this.salvarGeral();
            }
        },
        removerDestino(idx) { if(confirm('Remover destino?')) { this.config.destinos.splice(idx, 1); this.salvarGeral(); } },

        adicionarLembrete() {
            if(this.novoLembrete.texto) {
                this.config.lembretes.push({ ...this.novoLembrete });
                this.novoLembrete.texto = '';
                this.salvarGeral();
            }
        },
        removerLembrete(idx) { this.config.lembretes.splice(idx, 1); this.salvarGeral(); },

        // --- UX & NAVEGAÇÃO ---
        selecionarModo(m) { this.modoSelecionado = m; window.scrollTo(0,0); },
        toggleConfig() { this.mostrandoConfig = !this.mostrandoConfig; },
        toggleHistorico() { this.mostrandoHistorico = !this.mostrandoHistorico; },
        abrirPreview() { this.mostrandoPreview = true; },

        // --- SYNC FIREBASE ---
        sincronizarAlteracao() { if(db && this.conectado) db.ref('produtos').set(this.produtos); },
        salvarGeral() {
            if(db && this.conectado) {
                db.ref('/').update({ config: this.config, produtos: this.produtos, historico: this.historico, lembretes: this.config.lembretes });
            }
        },
        carregarDados() {
            if(db) {
                db.ref('/').on('value', (snapshot) => {
                    const d = snapshot.val();
                    if(d) {
                        // Se já estava logado, mantém os dados locais de contagem se o banco não tiver mudado drasticamente
                        if(!this.produtos.length || confirm("Novos dados do servidor. Atualizar?")) {
                             this.produtos = d.produtos || [];
                        }
                        this.config = d.config || { nomeEmpresa: 'Artigiano', rota: ['Geral'], destinos: [], feriados: [], lembretes: [] };
                        this.historico = d.historico || [];
                        this.usuarios = d.usuarios || [];
                        this.conectado = true;
                        
                        // Se o usuário logado não existe mais no banco (foi excluído), desloga
                        if(this.usuarioLogado && !this.usuarios.find(u => u.pin === this.usuarioLogado.pin)) {
                            this.logout();
                        }
                    } else { 
                        this.conectado = true; // Banco vazio, mas conectado
                        this.usuarios = [];
                    }
                }, (error) => {
                    console.error("Erro Conexão:", error);
                    this.conectado = false;
                    alert("Erro de conexão com o banco.");
                });
            }
        },

        // --- LÓGICA DE NEGÓCIO ---
        calculaFalta(p) {
            if (p.ignorar || p.contagem === '') return { qtd: 0, fatorMultiplicador: 1 };
            const fator = (p.fator && p.fator > 0) ? Number(p.fator) : 1;
            const contagem = Number(p.contagem) || 0;
            let estqCompra = (p.unQ !== p.unC && fator > 1) ? contagem / fator : contagem * fator;
            let meta = Number(p.meta) || 0;
            let mult = 1;
            if (this.diaDaSemana === 5 && p.destinoId) {
                const dest = this.config.destinos.find(d => d.id === p.destinoId);
                if (dest && dest.triplicarSexta) { meta *= 3; mult = 3; }
            }
            if (this.feriadoAtivo) { meta *= 1.5; mult = (mult===1)?1.5:3.5; }
            let falta = meta - estqCompra;
            return { qtd: falta > 0 ? Math.ceil(falta) : 0, fatorMultiplicador: mult };
        },
        toggleIgnorar(p) { p.ignorar = !p.ignorar; if(p.ignorar) { p.contagem = ''; p.obs = ''; } this.sincronizarAlteracao(); },
        
        // --- ENVIO ---
        enviarWhatsApp(destId, itens) {
            const dest = this.config.destinos.find(d => d.id == destId);
            const nomeDest = dest ? dest.nome : 'Geral';
            const tel = dest ? dest.telefone : '';
            let msg = `*PEDIDO ${this.config.nomeEmpresa}*\nData: ${new Date().toLocaleDateString('pt-BR')}\nResp: ${this.usuarioLogado.nome}\n---\n`;
            let txtHist = "";
            itens.forEach(i => { msg += i.texto + '\n'; txtHist += i.texto.replace('- ', '') + '\n'; });
            if(this.observacaoExtra) { msg += `\nObs Geral: ${this.observacaoExtra}`; txtHist += `\nObs Geral: ${this.observacaoExtra}`; }
            
            this.historico.unshift({ 
                data: new Date().toLocaleDateString('pt-BR'), 
                hora: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                usuario: this.usuarioLogado.nome,
                destino: nomeDest, 
                detalhes: txtHist 
            });
            if(this.historico.length > 60) this.historico.pop();
            this.salvarGeral();
            window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');
        },
        apagarHistorico(idx) { if(confirm('Apagar registro do histórico?')) { this.historico.splice(idx, 1); this.salvarGeral(); } },
        
        // --- AUX ---
        getNomeDestino(id) { const d = this.config.destinos.find(x => x.id === id); return d ? d.nome : 'Geral'; },
        nomeDia(d) { const dias=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']; return dias[d]; },
        resetarTudo() { 
            if(confirm('ATENÇÃO: Isso apagará TODOS os dados (produtos, usuários, histórico) do banco. Continuar?')) { 
                if(db){ db.ref('/').remove(); } 
                localStorage.clear();
                window.location.reload(); 
            } 
        },
    },
    mounted() {
        // Tenta recuperar sessão salva
        const session = localStorage.getItem('artigiano_user');
        if(session) {
            try { this.usuarioLogado = JSON.parse(session); } catch(e) { localStorage.removeItem('artigiano_user'); }
        }
        this.carregarDados();
    }
});

app.mount('#app');
