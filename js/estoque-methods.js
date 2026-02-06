export const estoqueMethods = {
    abrirOperacao(tipo) {
        this.telaAtiva = tipo;
        // Lógica original: Se for sacolão, filtra direto. Se for insumo, abre no primeiro local.
        this.localAtual = tipo === 'sacolao' ? 'Sacolão' : 'Estoque seco';
        window.scrollTo(0,0);
    },

    // Filtro idêntico ao original
    get itensFiltrados() {
        if (!this.telaAtiva) return [];
        return this.catalogoDNA.filter(item => {
            if (this.telaAtiva === 'sacolao') return item.local === 'Sacolão';
            if (this.telaAtiva === 'insumos') return item.local === this.localAtual;
            return false;
        });
    },

    // Preparação do WhatsApp (Igual ao seu código)
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
            this.mostrarNotificacao('Nenhum item preenchido!', 'error', 'fas fa-exclamation');
            return;
        }

        const msg = encodeURIComponent(resumo);
        window.open(`https://wa.me/5543991212450?text=${msg}`); // Número de exemplo do seu código
    }
};
