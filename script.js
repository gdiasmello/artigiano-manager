const { createApp } = Vue

const app = createApp({
    data() {
        return {
            // UI
            mostrandoConfig: false, mostrandoPreview: false, mostrandoHistorico: false,
            temaEscuro: false, termoBusca: '', observacaoExtra: '',
            
            // DADOS (Valores Padrão)
            config: { 
                nomeEmpresa: 'Artigiano', 
                telefone: '',
                rota: ['Geladeira', 'Estoque Seco', 'Freezer'],
                fornecedores: []
            },
            produtos: [],
            historico: [],
            
            // TEMPS
            novoProd: { nome: '', setor: '', unQ: '', unC: '', fator: 1, meta: 0, fornecedorId: '' },
            novoFornecedor: { nome: '', telefone: '' },
            editandoId: null,
            novoLocal: ''
        }
    },
    computed: {
        rotaExibicao() { 
            const rotas = (this.config && Array.isArray(this.config.rota)) ? this.config.rota : ['Geral'];
            const setoresUsados = [...new Set(this.produtos.map(p => p.setor))];
            const orfaos = setoresUsados.filter(s => !rotas.includes(s));
            return [...rotas, ...orfaos];
        },
        produtosVisiveisPorLocal() {
            const grupos = {};
            const termo = this.termoBusca ? this.termoBusca.toLowerCase() : '';
            this.produtos.forEach(p => {
                if(termo && !p.nome.toLowerCase().includes(termo)) return;
                const setor = p.setor || 'Geral';
                if(!grupos[setor]) grupos[setor] = [];
                grupos[setor].push(p);
            });
            return grupos;
        },
        itensContados() { return this.produtos.filter(p => p.contagem !== '' || p.ignorar).length; },
        percentualConcluido() { return this.produtos.length === 0 ? 0 : (this.itensContados / this.produtos.length) * 100; },
        
        pedidosPorFornecedor() {
            const grupos = {};
            this.produtos.forEach(p => {
                const qtdFalta = this.calculaFalta(p);
                if (!p.ignorar && p.contagem !== '' && qtdFalta > 0) {
                    const fId = p.fornecedorId || 'geral';
                    if (!grupos[fId]) grupos[fId] = [];
                    
                    let linha = `- ${qtdFalta} ${p.unC || 'un'} de ${p.nome}`;
                    if(p.obs) linha += ` (${p.obs})`;
                    
                    grupos[fId].push({ texto: linha, produto: p });
                }
            });
            return grupos;
        },
        
        dadosExportacao() { return JSON.stringify({ produtos: this.produtos, config: this.config }); }
    },
    methods: {
        // --- UX ---
        toggleConfig() { this.mostrandoConfig = !this.mostrandoConfig; },
        toggleHistorico() { this.mostrandoHistorico = !this.mostrandoHistorico; },
        abrirPreview() { this.mostrandoPreview = true; },
        alternarTema() { this.temaEscuro = !this.temaEscuro; localStorage.setItem('artigiano_tema', this.temaEscuro); },
        
        resetarTudo() {
            if(confirm("ATENÇÃO: Isso vai apagar todos os produtos e configurações para corrigir erros. Continuar?")) {
                localStorage.clear();
                window.location.reload();
            }
        },

        // --- FORNECEDORES ---
        getNomeFornecedor(id) {
            if(id === 'geral' || !this.config.fornecedores) return 'Geral';
            const f = this.config.fornecedores.find(x => x.id === id);
            return f ? f.nome : 'Geral';
        },
        getTelefoneFornecedor(id) {
            if(!this.config.fornecedores) return '';
            const f = this.config.fornecedores.find(x => x.id === id);
            return f ? f.telefone : '';
        },
        adicionarFornecedor() {
            if(this.novoFornecedor.nome) {
                if(!Array.isArray(this.config.fornecedores)) this.config.fornecedores = [];
                this.config.fornecedores.push({ id: Date.now(), nome: this.novoFornecedor.nome, telefone: this.novoFornecedor.telefone });
                this.novoFornecedor = { nome: '', telefone: '' };
                this.salvar();
            }
        },
        removerFornecedor(idx) {
            if(confirm("Remover fornecedor?")) {
                this.config.fornecedores.splice(idx, 1);
                this.salvar();
            }
        },

        // --- CORE ---
        calculaFalta(p) {
            if (p.ignorar || p.contagem === '') return 0;
            const fator = (p.fator && !isNaN(p.fator) && p.fator > 0) ? Number(p.fator) : 1;
            let estoqueConvertido = 0;
            const contagem = Number(p.contagem) || 0;
            
            if (p.unQ && p.unC && p.unQ !== p.unC && fator > 1) {
                 estoqueConvertido = contagem / fator;
            } else {
                 estoqueConvertido = contagem * fator;
            }
            const falta = (Number(p.meta) || 0) - estoqueConvertido;
            return falta > 0 ? parseFloat(falta.toFixed(2)) : 0;
        },
        
        adicionarProduto() { 
            if(!this.novoProd.nome || !this.novoProd.setor) return alert('Preencha Nome e Local');
            this.produtos.push({ id: Date.now(), ...this.novoProd, contagem: '', ignorar: false, obs: '' }); 
            const ultSetor = this.novoProd.setor;
            const ultForn = this.novoProd.fornecedorId;
            this.novoProd={nome:'', setor: ultSetor, unQ:'', unC:'', fator:1, meta:0, fornecedorId: ultForn}; 
            this.salvar(); 
            alert('Salvo!'); 
        },
        editarProduto(p) {
            this.novoProd = { ...p };
            this.editandoId = p.id;
            this.mostrandoConfig = true;
        },
        salvarEdicao() {
            const index = this.produtos.findIndex(p => p.id === this.editandoId);
            if(index !== -1) {
                this.produtos[index] = { ...this.produtos[index], ...this.novoProd };
                this.novoProd={nome:'', setor: '', unQ:'', unC:'', fator:1, meta:0, fornecedorId: ''}; 
                this.editandoId = null;
                this.salvar();
                alert('Atualizado!');
            }
        },
        cancelarEdicao() {
            this.editandoId = null;
            this.novoProd={nome:'', setor: '', unQ:'', unC:'', fator:1, meta:0}; 
        },
        
        // --- WHATSAPP ---
        enviarWhatsApp(fornecedorId, itens) {
            const nomeForn = this.getNomeFornecedor(fornecedorId);
            const telForn = this.getTelefoneFornecedor(fornecedorId);
            
            let msg = `*PEDIDO ${this.config.nomeEmpresa} (${nomeForn})*\n`;
            msg += `Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
            msg += `----------------\n`;
            itens.forEach(i => msg += i.texto + '\n');
            if(this.observacaoExtra) msg += `\nOBS: ${this.observacaoExtra}`;

            this.historico.unshift({
                data: new Date().toLocaleString('pt-BR'),
                fornecedor: nomeForn,
                resumo: `${itens.length} itens.`
            });
            if(this.historico.length > 50) this.historico.pop();
            this.salvar();

            const numeroFinal = telForn || this.config.telefone || ''; 
            window.open(`https://wa.me/${numeroFinal}?text=${encodeURIComponent(msg)}`, '_blank');
        },
        apagarHistorico(index) {
            if(confirm("Apagar?")) {
                this.historico.splice(index, 1);
                this.salvar();
            }
        },

        // --- UX ---
        toggleIgnorar(p) { p.ignorar = !p.ignorar; if(p.ignorar) { p.contagem = ''; p.obs = ''; } this.salvar(); },
        focarInput(id) { setTimeout(() => { const el = document.getElementById('input-'+id); if(el) el.focus(); }, 100); },
        moverRota(index, direcao) {
            const novaRota = [...this.config.rota];
            if (direcao === -1 && index > 0) [novaRota[index], novaRota[index - 1]] = [novaRota[index - 1], novaRota[index]];
            else if (direcao === 1 && index < novaRota.length - 1) [novaRota[index], novaRota[index + 1]] = [novaRota[index + 1], novaRota[index]];
            this.config.rota = novaRota;
            this.salvar();
        },
        adicionarLocal() { if(this.novoLocal && !this.config.rota.includes(this.novoLocal)){ this.config.rota.push(this.novoLocal); this.novoLocal=''; this.salvar(); } },

        // --- PERSISTÊNCIA SEGURA ---
        salvar() { 
            try {
                localStorage.setItem('artigiano_v15_nolock', JSON.stringify({ produtos: this.produtos, config: this.config, historico: this.historico })); 
            } catch(e) { console.error("Erro ao salvar", e); }
        },
        carregar() {
            try {
                // Tenta carregar a versão sem login
                let s = localStorage.getItem('artigiano_v15_nolock');
                
                // Se não tem, tenta as antigas
                if (!s) s = localStorage.getItem('artigiano_v14_fix') || localStorage.getItem('artigiano_v14') || localStorage.getItem('artigiano_v13');

                if (s) {
                    const d = JSON.parse(s);
                    this.produtos = Array.isArray(d.produtos) ? d.produtos : [];
                    this.historico = Array.isArray(d.historico) ? d.historico : [];
                    const cfg = d.config || {};
                    
                    this.config = {
                        nomeEmpresa: cfg.nomeEmpresa || 'Artigiano',
                        telefone: cfg.telefone || '',
                        rota: (Array.isArray(cfg.rota) && cfg.rota.length > 0) ? cfg.rota : ['Geral'],
                        fornecedores: Array.isArray(cfg.fornecedores) ? cfg.fornecedores : []
                    };
                }
                this.temaEscuro = localStorage.getItem('artigiano_tema') === 'true';
            } catch(e) {
                console.error("Erro ao carregar, resetando...", e);
            }
        },
        importarDados() { 
            try { 
                localStorage.setItem('artigiano_v15_nolock', document.querySelector('textarea').value); 
                this.carregar(); 
                alert('Importado!'); this.mostrandoConfig = false; 
            } catch(e){ alert('Erro.'); } 
        }
    },
    mounted() { this.carregar(); }
});

app.config.errorHandler = (err) => {
    console.error("Erro Vue:", err);
    // Recuperação silenciosa para não travar
};

app.mount('#app');