var app = Vue.createApp({
    data: function() {
        return {
            usuario: '',
            senha: ''
        };
    },
    methods: {
        fazerLogin: function() {
            if (this.usuario === "admin" && this.senha === "123") { // Exemplo simples
                alert("Login realizado!");
                // Aqui você redireciona para a tela de estoque
            } else {
                alert("Usuário ou senha incorretos.");
            }
        }
    }
});
app.mount('#app');