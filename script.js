import { db } from './js/firebase-config.js';
import { initialData } from './js/data-models.js';
import { authMethods } from './js/auth-methods.js';
import { estoqueMethods } from './js/estoque-methods.js';

const { createApp } = Vue;

createApp({
    data() {
        return {
            ...initialData
        }
    },
    methods: {
        ...authMethods,
        ...estoqueMethods,

        mostrarNotificacao(texto, tipo = 'success') {
            this.notificacao = { 
                ativa: true, 
                texto, 
                tipo, 
                icone: tipo === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle' 
            };
            setTimeout(() => { this.notificacao.ativa = false; }, 3000);
        },

        exibirSucesso() {
            this.mostrarSucesso = true;
            setTimeout(() => { this.mostrarSucesso = false; }, 2000);
        },

        verificarVersao() {
            const v = localStorage.getItem('pizzamaster_version');
            if (v !== this.versionNum) {
                this.mostrarNovidades = true;
                localStorage.setItem('pizzamaster_version', this.versionNum);
            }
        },

        sincronizar() {
            db.ref('usuarios').on('value', s => { 
                const d = s.val(); 
                this.usuarios = d ? Object.keys(d).map(k => ({...d[k], id: k})) : []; 
            });
            db.ref('catalogoDNA').on('value', s => { 
                const d = s.val(); 
                this.catalogoDNA = d ? Object.keys(d).map(k => ({...d[k], id: k})) : []; 
            });
            db.ref('config').on('value', s => { 
                const d = s.val() || {}; 
                this.config.rota = d.rota || ['Geral']; 
                this.config.destinos = d.destinos || {}; 
                this.config.checklist = d.checklist || []; 
            });
            db.ref('historico').limitToLast(50).on('value', s => { 
                const d = s.val(); 
                this.historico = d ? Object.values(d).reverse() : []; 
            });
        }
    },
    mounted() { 
        this.sincronizar(); 
        const s = localStorage.getItem('artigiano_session_v1'); 
        if(s) { 
            this.usuarioLogado = JSON.parse(s); 
            this.sessaoAtiva = true; 
            this.verificarVersao(); 
        }
        
        document.body.style.overscrollBehavior = 'none';
        
        // Lógica do botão voltar (Original)
        window.history.pushState(null, null, window.location.href);
        window.onpopstate = () => {
            if(this.telaAtiva) {
                this.telaAtiva = null;
                window.history.pushState(null, null, window.location.href);
            }
        };
    }
}).mount('#app');
