var app = Vue.createApp({
    data: function() {
        return {
            logado: false,
            usuario: '',
            senha: '',
            abaAtual: 'producao',
            // ... outros dados (produtos, etc)
        };
    },
    methods: {
        fazerLogin: function() {
            // Lógica simples para teste ou integração Firebase Auth futura
            if (this.usuario !== '' && this.senha !== '') {
                this.logado = true;
                if (window.navigator.vibrate) window.navigator.vibrate(100);
            } else {
                alert("Preencha os campos!");
            }
        },
        // ... outros métodos
    }
});
app.mount('#app');