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
    console.error(e); 
}

// Usando var em vez de const para garantir abertura em WebViews antigos
var app = Vue.createApp({
    data: function() {
        return {
            loadingInicial: true,
            temaEscuro: false,
            mostrandoTermos: false,
            mostrandoAjuda: false,
            loginUser: '',
            loginPass: '',
            sessaoAtiva: false,
            usuarioLogado: null,
            msgAuth: '',
            isError: false,
            loadingAuth: false,
            usuarios: [],
            feriados: [],
            itens: [],
            config: { destinos: [], rota: ['Freezer', 'Geladeira'], cores: {} }
        };
    },
    methods: {
        carregarDados: function() {
            var self = this;
            // Carrega usuários
            db.ref('system/users').on('value', function(snapshot) {
                var data = snapshot.val();
                if (data) {
                    var lista = [];
                    for (var key in data) {
                        var user = data[key];
                        user.id = key;
                        lista.push(user);
                    }
                    self.usuarios = lista;
                }
                // Libera a tela de carregamento
                self.loadingInicial = false;
            });

            // Carrega configurações
            db.ref('system/config').on('value', function(snapshot) {
                if (snapshot.val()) {
                    self.config = snapshot.val();
                }
            });
        },
        fazerLogin: function() {
            var self = this;
            self.loadingAuth = true;
            var usuarioEncontrado = null;
            
            for (var i = 0; i < self.usuarios.length; i++) {
                var u = self.usuarios[i];
                if (u.user === self.loginUser && u.pass === self.loginPass) {
                    usuarioEncontrado = u;
                    break;
                }
            }

            if (usuarioEncontrado) {
                self.usuarioLogado = usuarioEncontrado;
                self.sessaoAtiva = true;
                localStorage.setItem('artigiano_session', JSON.stringify(usuarioEncontrado));
                self.loadingAuth = false;
            } else {
                self.msgAuth = "Usuário ou senha incorretos";
                self.isError = true;
                self.loadingAuth = false;
            }
        },
        alternarTema: function() {
            this.temaEscuro = !this.temaEscuro;
            if (this.temaEscuro) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('artigiano_theme', 'dark');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('artigiano_theme', 'light');
            }
        }
    },
    mounted: function() {
        var self = this;
        
        // Recupera Sessão
        var session = localStorage.getItem('artigiano_session');
        if (session) {
            this.usuarioLogado = JSON.parse(session);
            this.sessaoAtiva = true;
        }

        // Recupera Tema
        var theme = localStorage.getItem('artigiano_theme');
        if (theme === 'dark') {
            this.temaEscuro = true;
            document.body.classList.add('dark-mode');
        }

        // Inicia carregamento
        this.carregarDados();

        // Watchdog de segurança
        setTimeout(function() {
            if (self.loadingInicial) {
                self.loadingInicial = false;
            }
        }, 5000);
    }
});

app.mount('#app');
