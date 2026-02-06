import { db } from './js/firebase-config.js';
import { initialData } from './js/data-models.js';
import { authMethods } from './js/auth-methods.js';
import { estoqueMethods } from './js/estoque-methods.js'; // Vamos criar este abaixo

const { createApp } = Vue;

createApp({
    data() { return { ...initialData }; },
    computed: {
        fullVersion() { return `v${this.versionNum} • ${this.versionName}`; },
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
        ...authMethods,
        ...estoqueMethods,
        
        vibrar() { if (navigator.vibrate) navigator.vibrate(50); },
        exibirSucesso() { this.mostrarSucesso = true; this.vibrar(); setTimeout(() => this.mostrarSucesso = false, 1500); },
        toggleConfig(id) { this.configAberto = this.configAberto === id ? null : id; },
        
        verificarVersao() {
            const last = localStorage.getItem('artigiano_version');
            if (last !== this.fullVersion) { 
                this.atualizandoApp = true; 
                setTimeout(() => { 
                    this.atualizandoApp = false; 
                    this.mostrarNovidades = true; 
                    localStorage.setItem('artigiano_version', this.fullVersion); 
                }, 3000); 
            }
        },
        fecharNovidades() { this.mostrarNovidades = false; },

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
        
        document.body.style.overscrollBehavior = 'none';
        window.history.pushState(null, null, window.location.href);
        window.onpopstate = () => {
            if(this.telaAtiva) { this.telaAtiva = null; window.history.pushState(null, null, window.location.href); }
        };
    }
}).mount('#app');