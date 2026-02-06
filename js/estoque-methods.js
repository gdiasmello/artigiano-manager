import { db } from './firebase-config.js';

export const estoqueMethods = {
    // --- NAVEGAÇÃO E OPERAÇÃO ---
    abrirBloco(id) {
        this.telaAtiva = id; 
        if (!this.config.rota || this.config.rota.length === 0) { 
            this.config.rota = ['Geral']; 
            db.ref('config/rota').set(['Geral']); 
        }
        this.localAtual = this.config.rota[0];
        
        // Inicializa objetos de contagem para cada local da rota
        this.config.rota.forEach(l => { 
            if(!this.contagemAtiva[l]) this.contagemAtiva[l] = {}; 
            if(!this.obsPorItem[l]) this.obsPorItem[l] = {};
        });

        if (id === 'gelo') this.qtdGeloAtual = null;
        if (id === 'checklist') {
            this.checklistItens = (this.config.checklist || ['Ligar Forno', 'Verificar Gás'])
                .map(t => ({ texto: t, feito: false }));
        }
    },

    voltarInicio() { 
        this.telaAtiva = null; 
    },

    // --- LÓGICA DE PEDIDOS E WHATSAPP ---
    gerarResumo() {
        const hora = new Date().getHours();
        const saudacao = hora < 12 ? 'Bom dia' : (hora < 18 ? 'Boa tarde' : 'Boa noite');
        this.textoBase = `*${saudacao}! Segue lista (${this.telaAtiva.toUpperCase()}):*\n\n`; 
        
        let estoqueTotal = {}; 
        let obsTotal = {};

        // Soma as contagens de todos os locais da rota
        this.config.rota.forEach(l => {
            for(let item in this.contagemAtiva[l]) {
                estoqueTotal[item] = (estoqueTotal[item] || 0) + this.contagemAtiva[l][item];
                if (this.obsPorItem[l] && this.obsPorItem[l][item]) {
                    obsTotal[item] = (obsTotal[item] ? obsTotal[item] + ', ' : '') + this.obsPorItem[l][item];
                }
            }
        });

        let corpoPedido = ''; 
        let temItens = false;

        for(let itemNome in estoqueTotal) { 
            const dna = this.catalogoDNA.find(d => d.nome === itemNome);
            if(dna && dna.bloco === this.telaAtiva) {
                const estoque = estoqueTotal[itemNome]; 
                const meta = dna.meta || 0;

                if (meta > estoque) {
                    const falta = meta - estoque;
                    let qtdFinal = 0, unFinal = '';

                    // Lógica de cálculo conforme o tipo (Caixa, KG ou Direto)
                    if (dna.tipo_calculo === 'cx') { 
                        qtdFinal = Math.ceil(falta / (dna.fator || 1)); 
                        unFinal = 'Cx'; 
                    } 
                    else if (dna.tipo_calculo === 'kg') { 
                        qtdFinal = (falta * (dna.fator || 1)).toFixed(1).replace('.0', ''); 
                        unFinal = 'Kg'; 
                    } 
                    else { 
                        qtdFinal = falta; 
                        unFinal = dna.un_contagem; 
                    }

                    if (qtdFinal > 0) {
                        corpoPedido += `• ${qtdFinal} ${unFinal} ${itemNome}`;
                        if (obsTotal[itemNome]) corpoPedido += ` _(${obsTotal[itemNome]})_`;
                        corpoPedido += `\n`; 
                        temItens = true;
                    }
                }
            }
        }

        if (!temItens && !this.itensExtras) { 
            if(!confirm("Nada para pedir. Continuar?")) return; 
        }

        this.textoBase += corpoPedido; 
        this.itensExtras = ''; 
        this.atualizarTextoFinal();
        this.numeroDestinoAtual = this.config.destinos[this.telaAtiva] || '';
        this.mostrandoResumo = true;
    },

    atualizarTextoFinal() {
        let final = this.textoBase;
        if (this.itensExtras.trim()) final += `\n*EXTRAS:*\n${this.itensExtras}\n`;
        final += `\nObrigado! 🍕`; 
        this.textoWhatsApp = final;
    },

    enviarWhatsApp() {
        if(!this.numeroDestinoAtual) { alert("Sem telefone configurado!"); return; }
        
        // Salva no histórico
        db.ref('historico').push({ 
            data: new Date().toLocaleString(), 
            usuario: this.usuarioLogado.nome, 
            itens: this.textoWhatsApp 
        });

        window.open(`https://api.whatsapp.com/send?phone=${this.numeroDestinoAtual}&text=${encodeURIComponent(this.textoWhatsApp)}`, '_blank');
        this.telaAtiva = null; 
        this.mostrandoResumo = false; 
        this.exibirSucesso();
    },

    // --- MÓDULOS ESPECIAIS ---
    enviarPedidoGelo() {
        if (this.qtdGeloAtual === null) return;
        const falta = 8 - this.qtdGeloAtual; 
        if (falta <= 0) { alert("Estoque cheio!"); return; }
        
        const texto = `*PEDIDO GELO*\nEstoque: ${this.qtdGeloAtual}\n*PEDIR: ${falta} SACOS*\nObrigado!`;
        const dest = this.config.destinos['gelo'];
        
        if(!dest) { alert("Configure o telefone do gelo nos ajustes!"); return; }
        
        window.open(`https://api.whatsapp.com/send?phone=${dest}&text=${encodeURIComponent(texto)}`, '_blank');
        db.ref('historico').push({ data: new Date().toLocaleString(), usuario: this.usuarioLogado.nome, itens: "Gelo: " + falta });
        this.telaAtiva = null; 
        this.exibirSucesso();
    },

    salvarChecklist() {
        const feitos = this.checklistItens.filter(i => i.feito).length;
        const texto = `*CHECKLIST*\n${feitos}/${this.checklistItens.length} itens OK.\nPor: ${this.usuarioLogado.nome}`;
        db.ref('historico').push({ data: new Date().toLocaleString(), usuario: this.usuarioLogado.nome, itens: texto });
        this.exibirSucesso(); 
        this.telaAtiva = null;
    },

    finalizarProducao() {
        const texto = `*PRODUÇÃO DE MASSA*\nQuant: ${this.qtdBolinhas} un\nPor: ${this.usuarioLogado.nome}`;
        db.ref('historico').push({ data: new Date().toLocaleString(), usuario: this.usuarioLogado.nome, itens: texto });
        this.qtdBolinhas = 0; 
        this.telaAtiva = null; 
        this.exibirSucesso();
    },

    // --- GESTÃO DO DNA (PRODUTOS) E CONFIGURAÇÕES ---
    adicionarAoDNA() { 
        if(!this.novoInsumo.bloco) { alert("Selecione o setor!"); return; }
        if(!this.novoInsumo.locais || this.novoInsumo.locais.length === 0) { alert("Selecione pelo menos um local!"); return; }
        db.ref('catalogoDNA').push(this.novoInsumo); 
        this.novoInsumo = { nome: '', un_contagem: '', un_pedido: '', tipo_calculo: 'direto', fator: 1, meta: 0, bloco: '', locais: [] }; 
        this.exibirSucesso(); 
    },

    removerDoDNA(id) { if(confirm("Excluir item?")) db.ref('catalogoDNA').child(id).remove(); },
    adicionarLocal() { this.config.rota.push(this.novoLocal); db.ref('config/rota').set(this.config.rota); this.novoLocal = ''; this.exibirSucesso(); },
    removerLocal(i) { this.config.rota.splice(i, 1); db.ref('config/rota').set(this.config.rota); },
    salvarDestinos() { db.ref('config/destinos').set(this.config.destinos); this.exibirSucesso(); },
    adicionarChecklist() { if(this.novaTarefa) { if(!this.config.checklist) this.config.checklist = []; this.config.checklist.push(this.novaTarefa); db.ref('config/checklist').set(this.config.checklist); this.novaTarefa = ''; } },
    removerChecklist(i) { this.config.checklist.splice(i, 1); db.ref('config/checklist').set(this.config.checklist); },
    
    // --- GESTÃO DE USUÁRIOS NO FIREBASE ---
    atualizarUsuario(u) { db.ref('usuarios').child(u.id).update(u); this.exibirSucesso(); },
    removerUsuario(id) { if(confirm("Remover funcionário?")) db.ref('usuarios').child(id).remove(); },
    criarUsuario() {
        if(!this.novoUser.user || !this.novoUser.pass) return;
        db.ref('usuarios').push(this.novoUser);
        this.mostrandoNovoUsuario = false; 
        this.exibirSucesso();
    }
};