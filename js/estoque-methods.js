import { db } from './firebase-config.js';

export const estoqueMethods = {
    // Prepara a tela para começar a contagem
    abrirOperacao(tipo) {
        this.telaAtiva = tipo;
        // Se for sacolão, já trava no local Sacolão, senão começa no Estoque Seco
        this.localAtual = tipo === 'sacolao' ? 'Sacolão' : 'Estoque seco';
        this.contagemAtiva = {}; 
        window.scrollTo(0,0);
    },

    // Lógica para revisar o que foi contado antes de mandar pro WhatsApp
    revisarPedido() {
        const itensContados = Object.keys(this.contagemAtiva).length;
        if (itensContados === 0) {
            this.mostrarNotificacao('Nada foi contado!', 'error', 'fas fa-times');
            return;
        }
        this.mostrarNotificacao('Gerando resumo do pedido...', 'success', 'fas fa-paper-plane');
        // Aqui chamaremos a função de montar o texto (que faremos no script principal)
    }
};
