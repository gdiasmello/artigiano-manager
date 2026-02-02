const app = Vue.createApp({
    data() {
        return {
            authenticated: false,
            termosAceitos: false,
            mostrarTermos: false,
            userSelected: '',
            pinInput: '',
            loginError: false,
            currentTab: 'home',
            setorAtivo: 'Ver Tudo',
            equipe: [
                { id: 1, nome: 'Gabriel', pin: '1821', cargo: 'ADM' },
                { id: 2, nome: 'Mayara', pin: '2024', cargo: 'Gerente' }
            ],
            estoque: [],
            historico: [],
            config: { modoFeriado: false }
        }
    },
    computed: {
        dataAtual() { return new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'short' }); },
        isAdmin() { return this.userSelected && (this.userSelected.cargo === 'ADM' || this.userSelected.cargo === 'Gerente'); }
    },
    created() {
        // Carregar dados salvos
        const db = localStorage.getItem('pizzeria_master_db');
        if (db) {
            const parsed = JSON.parse(db);
            this.estoque = parsed.estoque || [];
            this.historico = parsed.historico || [];
            this.config = parsed.config || { modoFeriado: false };
        }
        // Verificar aceite de termos
        if (localStorage.getItem('pizzeria_master_termos')) {
            this.termosAceitos = true;
        }
    },
    watch: {
        estoque: { handler() { this.save(); }, deep: true },
        historico: { handler() { this.save(); }, deep: true },
        config: { handler() { this.save(); }, deep: true }
    },
    methods: {
        save() {
            localStorage.setItem('pizzeria_master_db', JSON.stringify({
                estoque: this.estoque,
                historico: this.historico,
                config: this.config
            }));
        },
        login() {
            if (this.userSelected && this.pinInput === this.userSelected.pin) {
                if (!this.termosAceitos) {
                    this.mostrarTermos = true;
                } else {
                    this.authenticated = true;
                }
            } else {
                this.loginError = true;
                if (navigator.vibrate) navigator.vibrate(200);
                setTimeout(() => { this.loginError = false; this.pinInput = ''; }, 600);
            }
        },
        aceitarTermos() {
            this.termosAceitos = true;
            localStorage.setItem('pizzeria_master_termos', 'true');
            this.mostrarTermos = false;
            this.authenticated = true;
        },
        logout() {
            this.authenticated = false;
            this.currentTab = 'home';
            this.pinInput = '';
        }
    }
}).mount('#app');
