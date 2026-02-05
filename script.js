const firebaseConfig = {
  apiKey: "AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4",
  authDomain: "artigiano-app.firebaseapp.com",
  databaseURL: "https://artigiano-app-default-rtdb.firebaseio.com",
  projectId: "artigiano-app",
  storageBucket: "artigiano-app.firebasestorage.app",
  messagingSenderId: "212218495726",
  appId: "1:212218495726:web:dd6fec7a4a8c7ad572a9ff"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const { createApp } = Vue;

createApp({
    data() {
        return {
            version: '1.6.1', atualizandoApp: false, mostrarNovidades: false,
            sessaoAtiva: false, telaAtiva: null, configAberto: null,
            usuarioLogado: null, loginUser: '', loginPass: '', msgAuth: '', loginErro: false,
            localAtual: '', contagemAtiva: {}, obsPorItem: {}, 
            mostrandoResumo: false, textoWhatsApp: '', textoBase: '', itensExtras: '', numeroDestinoAtual: '',
            mostrandoHistorico: false, mostrarSucesso: false, mostrandoNovoUsuario: false, mostrandoTermos: false,
            notificacao: { ativa: false, texto: '', tipo: '', icone: '' },
            
            qtdGeloAtual: null,
            checklistItens: [],
            
            novoInsumo: { nome: '', un_contagem: '', un_pedido: '', tipo_calculo: 'direto', fator: 1, meta: 0, bloco: '', locais: [] },
            novoLocal: '', novaTarefa: '', qtdBolinhas: 0,
            novoUser: { nome: '', user: '', pass: '' },
            
            listaTodosBlocos: [
                { id: 'sacolao', nome: 'SACOLÃO', icon: 'fas fa-leaf', cor: 'green' },
                { id: 'insumos', nome: 'INSUMOS', icon: 'fas fa-box', cor: 'red' },
                { id: 'producao', nome: 'PRODUÇÃO', icon: 'fas fa-mortar-pestle', cor: 'gold' },
                { id: 'gelo', nome: 'GELO', icon: 'fas fa-cube', cor: 'ice' },
                { id: 'checklist', nome: 'CHECKLIST', icon: 'fas fa-clipboard-check', cor: 'temp' },
                { id: 'bebidas', nome: 'BEBIDAS', icon: 'fas fa-wine-bottle', cor: 'purple' },
                { id: 'limpeza', nome: 'LIMPEZA', icon: 'fas fa-hands-bubbles', cor: 'blue' }
            ],
            usuarios: [], catalogoDNA: [], config: { rota: ['Geral'], destinos: {}, checklist: [] }, historico: []
        }
    },
    computed: {
        blocosPermitidos() {
            if (!this.usuarioLogado) return [];
            return this.listaTodosBlocos.filter(b => this.usuarioLogado.permissoes && this.usuarioLogado.permissoes[b.id]);
        },
        tituloTela() {
            if (this.telaAtiva === 'config') return 'AJUSTES';
            const bloco = this.listaTodosBlocos.find(b => b.id === this.telaAtiva);
            return bloco ? bloco.nome : 'PIZZA MASTER';
        },
        itensDoLocalAtivo() {
            if (!this.telaAtiva || ['config','producao','gelo','checklist'].includes(this.telaAtiva)) return [];
            return this.catalogoDNA.filter(item => {
                if (this.telaAtiva === 'sacolao' && item.bloco !== 'sacolao') return false;
                if (this.telaAtiva !== 'sacolao' && item.bloco === 'sacolao') return false;
                const pertenceLocal = item.locais && item.locais.includes(this.localAtual);
                const legado = (!item.locais || item.locais.length === 0) && this.localAtual === this.config.rota[0];
                return item.bloco === this.telaAtiva && (pertenceLocal || legado);
            });
        },
        receita() {
            const farinha = Math.ceil(this.qtdBolinhas * 133);
            const totalAgua = Math.ceil(farinha * 0.70);
            return { farinha, sal: Math.ceil(this.qtdBolinhas * 4), levain: Math.ceil(farinha * 0.06), agua: Math.ceil(totalAgua * 0.70), gelo: Math.ceil(totalAgua * 0.30) };
        }
    },
    methods: {
        vibrar() { if (navigator.vibrate) navigator.vibrate(50); },
        exibirSucesso() { this.mostrarSucesso = true; this.vibrar(); setTimeout(() => this.mostrarSucesso = false, 1500); },
        toggleConfig(id) { this.configAberto = this.configAberto === id ? null : id; },
        
        efetuarLogin() {
            this.loginErro = false; const u = this.loginUser.trim().toLowerCase(); const p = String(this.loginPass).trim();
            if (u === 'gabriel' && p === '1821') {
                this.entrar({ id: 'master', nome: 'Gabriel', user: 'gabriel', pass: '1821', permissoes: { admin: true, sacolao: true, insumos: true, producao: true, gelo: true, checklist: true, bebidas: true, limpeza: true } }); 
                return;
            }
            const user = this.usuarios.find(x => x.user.toLowerCase() === u && String(x.pass) === p);
            if (user) this.entrar(user);
            else { this.loginErro = true; this.msgAuth = "PIN INVÁLIDO"; if(navigator.vibrate) navigator.vibrate(200); setTimeout(() => this.loginErro = false, 500); }
        },
        entrar(user) { this.usuarioLogado = user; this.sessaoAtiva = true; localStorage.setItem('artigiano_session_v1', JSON.stringify(user)); this.verificarVersao(); },
        logout() { localStorage.removeItem('artigiano_session_v1'); location.reload(); },
        
        verificarVersao() {
            const last = localStorage.getItem('artigiano_version');
            if (last !== this.version) { this.atualizandoApp = true; setTimeout(() => { this.atualizandoApp = false; this.mostrarNovidades = true; localStorage.setItem('artigiano_version', this.version); }, 3000); }
        },
        fecharNovidades() { this.mostrarNovidades = false; },

        abrirBloco(id) {
            this.telaAtiva = id; 
            if (!this.config.rota || this.config.rota.length === 0) { this.config.rota = ['Geral']; db.ref('config/rota').set(['Geral']); }
            this.localAtual = this.config.rota[0];
            this.config.rota.forEach(l => { 
                if(!this.contagemAtiva[l]) this.contagemAtiva[l] = {}; 
                if(!this.obsPorItem[l]) this.obsPorItem[l] = {};
            });
            if (id === 'gelo') this.qtdGeloAtual = null;
            if (id === 'checklist') this.checklistItens = (this.config.checklist || ['Ligar Forno']).map(t => ({ texto: t, feito: false }));
        },
        voltarInicio() { this.telaAtiva = null; },

        enviarPedidoGelo() {
            if (this.qtdGeloAtual === null) return;
            const falta = 8 - this.qtdGeloAtual; if (falta <= 0) { alert("Estoque cheio!"); return; }
            const texto = `*PEDIDO GELO*\nEstoque: ${this.qtdGeloAtual}\n*PEDIR: ${falta} SACOS*\nObrigado!`;
            const dest = this.config.destinos['gelo'];
            if(!dest) { alert("Configure telefone!"); return; }
            window.open(`https://api.whatsapp.com/send?phone=${dest}&text=${encodeURIComponent(texto)}`, '_blank');
            db.ref('historico').push({ data: new Date().toLocaleString(), usuario: this.usuarioLogado.nome, itens: "Gelo: " + falta });
            this.telaAtiva = null; this.exibirSucesso();
        },

        salvarChecklist() {
            const feitos = this.checklistItens.filter(i => i.feito).length;
            const texto = `*CHECKLIST*\n${feitos}/${this.checklistItens.length} itens OK.\nPor: ${this.usuarioLogado.nome}`;
            db.ref('historico').push({ data: new Date().toLocaleString(), usuario: this.usuarioLogado.nome, itens: texto });
            this.exibirSucesso(); this.telaAtiva = null;
        },
        adicionarChecklist() { if(this.novaTarefa) { if(!this.config.checklist) this.config.checklist = []; this.config.checklist.push(this.novaTarefa); db.ref('config/checklist').set(this.config.checklist); this.novaTarefa = ''; } },
        removerChecklist(i) { this.config.checklist.splice(i, 1); db.ref('config/checklist').set(this.config.checklist); },

        gerarResumo() {
            const hora = new Date().getHours();
            const saudacao = hora < 12 ? 'Bom dia' : (hora < 18 ? 'Boa tarde' : 'Boa noite');
            this.textoBase = `*${saudacao}! Segue lista (${this.telaAtiva.toUpperCase()}):*\n\n`; 
            let estoqueTotal = {}; let obsTotal = {};
            this.config.rota.forEach(l => {
                for(let item in this.contagemAtiva[l]) {
                    estoqueTotal[item] = (estoqueTotal[item] || 0) + this.contagemAtiva[l][item];
                    if (this.obsPorItem[l] && this.obsPorItem[l][item]) obsTotal[item] = (obsTotal[item] ? obsTotal[item] + ', ' : '') + this.obsPorItem[l][item];
                }
            });
            let corpoPedido = ''; let temItens = false;
            for(let itemNome in estoqueTotal) { 
                const dna = this.catalogoDNA.find(d => d.nome === itemNome);
                if(dna && dna.bloco === this.telaAtiva) {
                    const estoque = estoqueTotal[itemNome]; const meta = dna.meta || 0;
                    if (meta > estoque) {
                        const falta = meta - estoque;
                        let qtdFinal = 0, unFinal = '';
                        if (dna.tipo_calculo === 'cx') { qtdFinal = Math.ceil(falta / (dna.fator || 1)); unFinal = 'Cx'; } 
                        else if (dna.tipo_calculo === 'kg') { qtdFinal = (falta * (dna.fator || 1)).toFixed(1).replace('.0', ''); unFinal = 'Kg'; } 
                        else { qtdFinal = falta; unFinal = dna.un_contagem; }
                        if (qtdFinal > 0) {
                            corpoPedido += `• ${qtdFinal} ${unFinal} ${itemNome}`;
                            if (obsTotal[itemNome]) corpoPedido += ` _(${obsTotal[itemNome]})_`;
                            corpoPedido += `\n`; temItens = true;
                        }
                    }
                }
            }
            if (!temItens && !this.itensExtras) { if(!confirm("Nada para pedir. Continuar?")) return; }
            this.textoBase += corpoPedido; this.itensExtras = ''; this.atualizarTextoFinal();
            this.numeroDestinoAtual = this.config.destinos[this.telaAtiva] || '';
            this.mostrandoResumo = true;
        },
        atualizarTextoFinal() {
            let final = this.textoBase;
            if (this.itensExtras.trim()) final += `\n*EXTRAS:*\n${this.itensExtras}\n`;
            final += `\nObrigado! 🍕`; this.textoWhatsApp = final;
        },
        enviarWhatsApp() {
            if(!this.numeroDestinoAtual) { alert("Sem telefone!"); return; }
            window.open(`https://api.whatsapp.com/send?phone=${this.numeroDestinoAtual}&text=${encodeURIComponent(this.textoWhatsApp)}`, '_blank');
            db.ref('historico').push({ data: new Date().toLocaleString(), usuario: this.usuarioLogado.nome, itens: this.textoWhatsApp });
            this.telaAtiva = null; this.mostrandoResumo = false; this.exibirSucesso();
        },
        finalizarProducao() {
            const texto = `*PRODUÇÃO DE MASSA*\nQuant: ${this.qtdBolinhas} un\nPor: ${this.usuarioLogado.nome}`;
            db.ref('historico').push({ data: new Date().toLocaleString(), usuario: this.usuarioLogado.nome, itens: texto });
            this.qtdBolinhas = 0; this.telaAtiva = null; this.exibirSucesso();
        },

        adicionarAoDNA() { 
            if(!this.novoInsumo.bloco) { alert("Selecione o setor!"); return; }
            if(!this.novoInsumo.locais || this.novoInsumo.locais.length === 0) { alert("Selecione o local!"); return; }
            db.ref('catalogoDNA').push(this.novoInsumo); 
            this.novoInsumo = { nome: '', un_contagem: '', un_pedido: '', conversao: 1, bloco: '', meta: 0, fator: 1, tipo_calculo: 'direto', locais: [] }; 
            this.exibirSucesso(); 
        },
        removerDoDNA(id) { if(confirm("Excluir?")) db.ref('catalogoDNA').child(id).remove(); },
        adicionarLocal() { this.config.rota.push(this.novoLocal); db.ref('config/rota').set(this.config.rota); this.novoLocal = ''; this.exibirSucesso(); },
        removerLocal(i) { this.config.rota.splice(i, 1); db.ref('config/rota').set(this.config.rota); },
        salvarDestinos() { db.ref('config/destinos').set(this.config.destinos); this.exibirSucesso(); },
        atualizarUsuario(u) { db.ref('usuarios').child(u.id).update(u); this.exibirSucesso(); },
        removerUsuario(id) { if(confirm("Remover?")) db.ref('usuarios').child(id).remove(); },
        criarUsuario() {
            if(!this.novoUser.user || !this.novoUser.pass) return;
            const u = { ...this.novoUser, permissoes: { sacolao: true, insumos: true, producao: false, admin: false } };
            db.ref('usuarios').push(u); this.mostrandoNovoUsuario = false; this.novoUser = { nome: '', user: '', pass: '' };
            this.exibirSucesso();
        },
        
        sincronizar() {
            db.ref('usuarios').on('value', s => { const d=s.val(); this.usuarios = d ? Object.keys(d).map(k=>({...d[k], id:k})) : []; });
            db.ref('catalogoDNA').on('value', s => { const d=s.val(); this.catalogoDNA = d ? Object.keys(d).map(k=>({...d[k], id:k})) : []; });
            db.ref('config').on('value', s => { const d=s.val() || {}; this.config.rota = d.rota || ['Geral']; this.config.destinos = d.destinos || {}; this.config.checklist = d.checklist || []; });
            db.ref('historico').limitToLast(50).on('value', s => { const d=s.val(); this.historico = d ? Object.values(d).reverse() : []; });
        }
    },
    mounted() { 
        this.sincronizar(); 
        const s = localStorage.getItem('artigiano_session_v1'); 
        if(s) { this.usuarioLogado = JSON.parse(s); this.sessaoAtiva = true; this.verificarVersao(); }
    }
}).mount('#app');
