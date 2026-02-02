const firebaseConfig = { 
    apiKey: "AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4", 
    authDomain: "artigiano-app.firebaseapp.com", 
    databaseURL: "https://artigiano-app-default-rtdb.firebaseio.com", 
    projectId: "artigiano-app", 
    storageBucket: "artigiano-app.firebasestorage.app", 
    messagingSenderId: "212218495726", 
    appId: "1:212218495726:web:dd6fec7a4a8c7ad572a9ff" 
};

let db; try { firebase.initializeApp(firebaseConfig); db = firebase.database(); } catch (e) { console.error(e); }

Vue.createApp({
    data() {
        return {
            sessaoAtiva: false, moduloAtivo: null, temaEscuro: false,
            loginUser: '', loginPass: '', usuarioLogado: null,
            itens: [], usuarios: [], feriados: [],
            config: { destinos: [], rota: ['Freezer', 'Geladeira'] }
        }
    },
    computed: {
        itensFiltrados() {
            const self = this;
            return this.itens.filter(i => i.categoria === self.moduloAtivo);
        }
    },
    methods: {
        carregarDados() {
            db.ref('store/products').on('value', s => {
                const list = [];
                s.forEach(c => { const item = c.val(); item.id = c.key; list.push(item); });
                this.itens = list;
            });
            db.ref('system/users').on('value', s => {
                const u = []; s.forEach(c => u.push(c.val()));
                this.usuarios = u;
            });
            db.ref('system/config').on('value', s => { if(s.val()) this.config = s.val(); });
        },
        fazerLogin() {
            const user = this.usuarios.find(u => u.user === this.loginUser && u.pass === this.loginPass);
            if(user) { this.sessaoAtiva = true; this.usuarioLogado = user; } else { alert("Acesso Negado!"); }
        },
        salvarContagem(id, local, valor) {
            db.ref(`store/products/${id}/contagem/${local}`).set(valor);
        },
        enviarZap(destino) {
            let texto = `*ARTIGIANO - PEDIDO ${this.moduloAtivo.toUpperCase()}*\n\n`;
            this.itensFiltrados.forEach(i => {
                let estoque = 0;
                for(let l in i.contagem) { estoque += parseFloat(i.contagem[l] || 0); }
                if(estoque < i.meta) {
                    texto += `• ${i.nome}: ${i.meta - estoque} ${i.unC}\n`;
                }
            });
            window.open(`https://api.whatsapp.com/send?phone=${destino.numero}&text=${encodeURIComponent(texto)}`);
        },
        logout() { location.reload(); }
    },
    mounted() { this.carregarDados(); }
}).mount('#app');