// --- SUA CHAVE (NÃO MEXER) ---
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
} catch (e) { console.error(e); }

const { createApp } = Vue

createApp({
    data() {
        return {
            conectado: false,
            // LOGIN
            usuarioLogado: null,
            pinDigitado: '',
            erroLogin: '',
            usuarios: [], 
            
            // APP
            modoSelecionado: null,
            mostrandoConfig: false, mostrandoPreview: false, mostrandoHistorico: false,
            termoBusca: '', observacaoExtra: '',
            
            // DADOS
            config: { nomeEmpresa: 'Artigiano', rota: ['Geral'], destinos: [], feriados: [], lembretes: [] },
            produtos: [],
            historico: [],
            
            // TEMPS
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
        // LOGIN & ADMIN
        addPin(n) { 
            if(this.pinDigitado.length < 4) {
                this.pinDigitado += n;
                if(this.pinDigitado.length === 4) this.tentarLogin();
            }
        },
        limparPin() { this.pinDigitado = this.pinDigitado.slice(0, -1); },
        tentarLogin() {
            const user = this.usuarios.find(u => u.pin == this.pinDigitado);
            if(user) {
                this.usuarioLogado = user;
                this.pinDigitado = '';
            } else {
                this.erroLogin = 'PIN Incorreto';
                setTimeout(() => { this.erroLogin = ''; this.pinDigitado = ''; }, 1000);
            }
        },
        criarPrimeiroAdmin() {
            // Se não tem ninguém, cria o Admin Supremo
            if(this.novoUsuarioNome && this.novoUsuarioPin) {
                const u = { nome: this.novoUsuarioNome, pin: this.novoUsuarioPin, admin: true };
                if(!this.usuarios) this.usuarios = [];
                this.usuarios.push(u);
                this.salvarUsuarios();
                this.usuarioLogado = u;
            }
        },
        logout() { this.usuarioLogado = null; this.modoSelecionado = null; this.pinDigitado = ''; },
        
        adicionarUsuario() {
            // Só Admin pode adicionar
            if(this.novoUsuarioNome && this.novoUsuarioPin) {
                if(!this.usuarios) this.usuarios = [];
                this.usuarios.push({ nome: this.novoUsuarioNome, pin: this.novoUsuarioPin, admin: false });
                this.novoUsuarioNome = ''; this.novoUsuarioPin = '';
                this.salvarUsuarios();
            }
        },
        removerUsuario(idx) { if(confirm('Remover?')) { this.usuarios.splice(idx, 1); this.salvarUsuarios(); } },
        salvarUsuarios() { if(db) db.ref('usuarios').set(this.usuarios); },

        // UX
        selecionarModo(m) { this.modoSelecionado = m; },
        toggleConfig() { this.mostrandoConfig = !this.mostrandoConfig; },
        toggleHistorico() { this.mostrandoHistorico = !this.mostrandoHistorico; },
        abrirPreview() { this.mostrandoPreview = true; },

        // SYNC
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
                        this.produtos = d.produtos || [];
                        this.config = d.config || { nomeEmpresa: 'Artigiano', rota: ['Geral'], destinos: [], feriados: [], lembretes: [] };
                        this.historico = d.historico || [];
                        this.usuarios = d.usuarios || [];
                        this.conectado = true;
                    } else { this.conectado = true; }
                });
            }
        },

        // CRUD
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
        
        adicionarProduto() {
            this.produtos.push({ id: Date.now(), ...this.novoProd, contagem: '', ignorar: false, obs: '' });
            this.novoProd={nome:'', setor: this.novoProd.setor, unQ:'', unC:'', fator:1, meta:0, destinoId: this.novoProd.destinoId};
            this.salvarGeral(); alert('Salvo!');
        },
        editarProduto(p) { this.novoProd = { ...p }; this.editandoId = p.id; this.mostrandoConfig = true; },
        salvarEdicao() {
            const idx = this.produtos.findIndex(p => p.id === this.editandoId);
            if(idx !== -1) {
                this.produtos[idx] = { ...this.produtos[idx], ...this.novoProd };
                this.editandoId = null; this.novoProd={nome:'', setor: '', unQ:'', unC:'', fator:1, meta:0};
                this.salvarGeral(); alert('Atualizado!');
            }
        },
        cancelarEdicao() { this.editandoId = null; this.novoProd={nome:'', setor: '', unQ:'', unC:'', fator:1, meta:0}; },
        toggleIgnorar(p) { p.ignorar = !p.ignorar; if(p.ignorar) { p.contagem = ''; p.obs = ''; } this.sincronizarAlteracao(); },
        focarInput(id) { setTimeout(() => { const el = document.getElementById('input-'+id); if(el) el.focus(); }, 100); },

        // AUX
        adicionarLembrete() {
            if(!this.config.lembretes) this.config.lembretes = [];
            this.config.lembretes.push({ ...this.novoLembrete });
            this.salvarGeral();
        },
        removerLembrete(idx) { this.config.lembretes.splice(idx, 1); this.salvarGeral(); },
        nomeDia(d) { const dias=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']; return dias[d]; },
        
        getNomeDestino(id) { const d = this.config.destinos.find(x => x.id === id); return d ? d.nome : 'Geral'; },
        adicionarDestino() { 
            if(this.novoDestino.nome) {
                this.config.destinos.push({ id: Date.now(), ...this.novoDestino });
                this.novoDestino = {nome:'', telefone:'', msgPersonalizada:'', triplicarSexta:false};
                this.salvarGeral();
            }
        },
        removerDestino(idx) { if(confirm('Remover?')) { this.config.destinos.splice(idx, 1); this.salvarGeral(); } },

        // ENVIO
        enviarWhatsApp(destId, itens) {
            const dest = this.config.destinos.find(d => d.id == destId);
            const nomeDest = dest ? dest.nome : 'Geral';
            const tel = dest ? dest.telefone : '';
            let msg = `*PEDIDO ${this.config.nomeEmpresa}*\nData: ${new Date().toLocaleDateString('pt-BR')}\nResp: ${this.usuarioLogado.nome}\n---\n`;
            let txtHist = "";
            itens.forEach(i => { msg += i.texto + '\n'; txtHist += i.texto.replace('- ', '') + '\n'; });
            if(this.observacaoExtra) { msg += `Obs: ${this.observacaoExtra}`; txtHist += `Obs: ${this.observacaoExtra}`; }
            
            this.historico.unshift({ 
                data: new Date().toLocaleDateString('pt-BR'), 
                hora: new Date().toLocaleTimeString(),
                usuario: this.usuarioLogado.nome,
                destino: nomeDest, 
                detalhes: txtHist 
            });
            if(this.historico.length > 50) this.historico.pop();
            this.salvarGeral();
            window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');
        },
        apagarHistorico(idx) { if(confirm('Apagar?')) { this.historico.splice(idx, 1); this.salvarGeral(); } },
        
        resetarTudo() { if(confirm('⚠️ Apagar TUDO do Banco?')) { if(db){ db.ref('/').remove(); } window.location.reload(); } },
    },
    mounted() { this.carregarDados(); }
});

app.mount('#app');
