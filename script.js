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

        mostrarNotificacao(texto, tipo, icone) {
            this.notificacao = { ativa: true, texto, tipo, icone };
            setTimeout(() => { this.notificacao.ativa = false; }, 3000);
        },

        sincronizar() {
            // Monitora usuários
            db.ref('usuarios').on('value', s => {
                const d = s.val();
                this.usuarios = d ? Object.keys(d).map(k => ({ ...d[k], id: k })) : [];
            });

            // Monitora permissões de cargos
            db.ref('config/permissoesCargos').on('value', s => {
                if (s.val()) this.permissoesGlobais = s.val();
            });

            // Monitora Catálogo DNA
            db.ref('catalogoDNA').on('value', s => {
                const d = s.val();
                this.catalogoDNA = d ? Object.keys(d).map(k => ({ ...d[k], id: k })) : [];
                // Esconde a tela de carregamento após receber os dados
                setTimeout(() => { this.atualizandoApp = false; }, 1500);
            });

            // Monitora Histórico
            db.ref('historico').limitToLast(30).on('value', s => {
                const d = s.val();
                this.historico = d ? Object.values(d).reverse() : [];
            });
        }
    },
    mounted() {
        this.sincronizar();
        
        // Recupera sessão salva
        const sessao = localStorage.getItem('artigiano_session_v1');
        if (sessao) {
            this.usuarioLogado = JSON.parse(sessao);
            this.sessaoAtiva = true;
        }
    }
}).mount('#app');
