import { db } from './firebase-config.js';

export const estoqueMethods = {
    abrirOperacao(tipo) {
        this.telaAtiva = tipo;
        this.localAtual = tipo === 'sacolao' ? 'Sacolão' : 'Estoque seco';
        this.contagemAtiva = {};
        window.scrollTo(0,0);
    },

    get itensFiltrados() {
        if (!this.telaAtiva) return [];
        return this.catalogoDNA.filter(item => {
            if (this.telaAtiva === 'sacolao') return item.local === 'Sacolão';
            return item.local === this.localAtual;
        });
    },

    revisarPedido() {
        let resumo = `*PEDIDO ARTIGIANO - ${new Date().toLocaleDateString()}*\n`;
        resumo += `Responsável: ${this.usuarioLogado.nome}\n\n`;
        
        let temItens = false;
        for (const [id, qtd] of Object.entries(this.contagemAtiva)) {
            if (qtd > 0) {
                const item = this.catalogoDNA.find(i => i.id === id);
                resumo += `• ${item.nome}: *${qtd}* ${item.un_contagem}\n`;
                temItens = true;
            }
        }

        if (!temItens) {
            this.mostrarNotificacao('Preencha pelo menos um item!', 'error');
            return;
        }

        this.textoWhatsApp = resumo;
        this.mostrandoResumo = true;
    },

    enviarWhatsApp() {
        const dataH = new Date().toLocaleString();
        
        // Salva no histórico do Firebase antes de enviar
        db.ref('historico').push({
            data: dataH,
            usuario: this.usuarioLogado.nome,
            itens: this.textoWhatsApp
        });

        const msg = encodeURIComponent(this.textoWhatsApp);
        window.open(`https://wa.me/5543991212450?text=${msg}`);
        this.mostrandoResumo = false;
        this.telaAtiva = null;
    }
};
