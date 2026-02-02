var firebaseConfig = { 
    apiKey: "AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4", 
    authDomain: "artigiano-app.firebaseapp.com", 
    databaseURL: "https://artigiano-app-default-rtdb.firebaseio.com", 
    projectId: "artigiano-app", 
    storageBucket: "artigiano-app.firebasestorage.app", 
    messagingSenderId: "212218495726", 
    appId: "1:212218495726:web:dd6fec7a4a8c7ad572a9ff" 
};

var db; 
try { 
    firebase.initializeApp(firebaseConfig); 
    db = firebase.database(); 
} catch (e) { 
    console.error("Erro Firebase:", e); 
}

var app = Vue.createApp({
    data: function() {
        return {
            loadingInicial: true,
            temaEscuro: false,
            sessaoAtiva: false,
            usuarioLogado: null,
            loginUser: '',
            loginPass: '',
            feriados: [],
            usuarios: [],
            config: { destinos: [], rota: ['Freezer', 'Geladeira'] }
            // Mantenha suas outras variáveis aqui exatamente como no original
        };
    },
    methods: {
        carregarDados: function() {
            var self = this;
            // O segredo está aqui: usamos 'function' e 'self' para não quebrar no Xiaomi
            db.ref('system/users').on('value', function(snapshot) {
                var data = snapshot.val();
                if (data) {
                    self.usuarios = Object.values(data);
                }
                // Desliga a pizza girando assim que os usuários carregam
                self.loadingInicial = false; 
            }, function(error) {
                console.error("Erro ao carregar:", error);
                self.loadingInicial = false;
            });
        },
        fazerLogin: function() {
            var self = this;
            var user = self.usuarios.find(function(u) {
                return u.user === self.loginUser && u.pass === self.loginPass;
            });
            if (user) {
                self.usuarioLogado = user;
                self.sessaoAtiva = true;
                localStorage.setItem('artigiano_session', JSON.stringify(user));
            } else {
                alert("Usuário ou senha incorretos");
            }
        }
    },
    mounted: function() {
        var self = this;
        // Watchdog: Se em 4 segundos a pizza ainda girar, força a entrada
        setTimeout(function() {
            if (self.loadingInicial) {
                console.warn("Entrada forçada via Watchdog");
                self.loadingInicial = false;
            }
        }, 4000);

        this.carregarDados();

        var session = localStorage.getItem('artigiano_session');
        if (session) {
            this.usuarioLogado = JSON.parse(session);
            this.sessaoAtiva = true;
        }
    }
});

app.mount('#app');
