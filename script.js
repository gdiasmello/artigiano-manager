const { createApp } = Vue

createApp({
    data() {
        return {
            // UI
            mostrandoConfig: false, mostrandoPreview: false, mostrandoAssistente: false, mostrandoHistorico: false,
            temaEscuro: false, termoBusca: '', observacaoExtra: '', textoComando: '',
            mensagensChat: [{tipo:'bot', texto:'Olá! Sou a Arti 🤖. Digite "Novo" ou "Buscar".'}],
            
            // USUÁRIO
            usuarioAtual: null,
            
            // DADOS
            config: { 
                nomeEmpresa: 'Artigiano', 
                rota: ['Geladeira', 'Estoque Seco', 'Freezer'],
                usuariosLista: ['Pizzaiolo'], // Garante que sempre tenha 1
                fornecedores: []
            },
            produtos: [],
            historico: [],
            
            // TEMPS
            novoProd: { nome: '', setor: '', unQ: '', unC: '', fator: 1, meta: 0, fornecedorId: '' },
            novoFornecedor: { nome: '', telefone: '' },
            novoUsuarioNome: '',
            editandoId: null,
            novoLocal: ''
        }
    },
    computed: {
        rotaExibicao() { return this.rotaOrdenada; },
        rotaOrdenada() {
            const setoresUsados = [...new Set(this.produtos.map(p => p.setor))];
            const rotaDefinida = this.config.rota || [];
            const orfaos = setoresUsados.filter(s => !rotaDefinida.includes(s));
            return [...rotaDefinida, ...orfaos];
        },
        produtosVisiveisPorLocal() {
            const grupos = {};
            const termo = this.termoBusca.toLowerCase();
            this.produtos.forEach(p => {
                if(termo.length > 0 && !p.nome.toLowerCase().includes(termo)) return;
                if(!grupos[p.setor]) grupos[p.setor] = [];
                grupos[p.setor].push(p);
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
                    let linha = `- ${qtdFalta} ${p.unC} de ${p.nome}`;
                    if(p.obs && p.obs.trim() !== '') linha += ` (${p.obs})`;
                    grupos[fId].push({ texto: linha, produto: p });
                }
            });
            return grupos;
        },
        
        dadosExportacao() { return JSON.stringify({ produtos: this.produtos, config: this.config, historico: this.historico }); }
    },
    methods: {
        // --- LOGIN ---
        fazerLogin(u) { this.usuarioAtual = u; },
        adicionarUsuario() {
            if(this.novoUsuarioNome) {
                if(!this.config.usuariosLista) this.config.usuariosLista = [];
                this.config.usuariosLista.push(this.novoUsuarioNome);
                this.novoUsuarioNome = '';
                this.salvar();
            }
        },
        removerUsuario(idx) {
            this.config.usuariosLista.splice(idx, 1);
            this.salvar();
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
                if(!this.config.fornecedores) this.config.fornecedores = [];
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
            const fator = p.fator && p.fator > 0 ? p.fator : 1;
            let estoqueConvertido = 0;
            
            // Lógica inteligente: Se Unidade contada != Unidade compra e fator > 1, divide (ex: 6 un na caixa)
            if (p.unQ && p.unC && p.unQ !== p.unC && fator > 1) {
                 estoqueConvertido = p.contagem / fator;
            } else {
                 estoqueConvertido = p.contagem * fator;
            }
            const falta = p.meta - estoqueConvertido;
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
            
            let msg = `*PEDIDO ${this.config.nomeEmpresa.toUpperCase()} (${nomeForn})*\n`;
            msg += `📅 ${new Date().toLocaleDateString('pt-BR')} - Por: ${this.usuarioAtual}\n`;
            msg += `----------------\n`;
            itens.forEach(i => msg += i.texto + '\n');
            if(this.observacaoExtra) msg += `\n📝 *OBS:* ${this.observacaoExtra}`;

            this.historico.unshift({
                data: new Date().toLocaleString('pt-BR'),
                usuario: this.usuarioAtual,
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
        focarInput(id) { setTimeout(() => document.getElementById('input-'+id).focus(), 100); },
        abrirPreview() { this.mostrandoPreview = true; },
        toggleConfig() { this.mostrandoConfig = !this.mostrandoConfig; this.editandoId = null; },
        toggleHistorico() { this.mostrandoHistorico = !this.mostrandoHistorico; },
        toggleAssistente() { this.mostrandoAssistente = !this.mostrandoAssistente; },
        alternarTema() { this.temaEscuro = !this.temaEscuro; localStorage.setItem('artigiano_tema', this.temaEscuro); },
        
        moverRota(index, direcao) {
            const novaRota = [...this.config.rota];
            if (direcao === -1 && index > 0) [novaRota[index], novaRota[index - 1]] = [novaRota[index - 1], novaRota[index]];
            else if (direcao === 1 && index < novaRota.length - 1) [novaRota[index], novaRota[index + 1]] = [novaRota[index + 1], novaRota[index]];
            this.config.rota = novaRota;
            this.salvar();
        },
        adicionarLocal() { if(this.novoLocal && !this.config.rota.includes(this.novoLocal)){ this.config.rota.push(this.novoLocal); this.novoLocal=''; this.salvar(); } },
        
        // --- SYSTEM ---
        enviarComando(txt) { this.textoComando = txt; this.processarComando(); },
        processarComando() {
            const cmd = this.textoComando.toLowerCase();
            this.mensagensChat.push({tipo:'user', texto: this.textoComando});
            this.textoComando = '';
            setTimeout(() => {
                if(cmd.includes('novo') || cmd.includes('cadastrar')) {
                    this.mostrandoAssistente = false; this.mostrandoConfig = true;
                    this.mensagensChat.push({tipo:'bot', texto: 'Configurações abertas.'});
                } else if(cmd.includes('limpar')) {
                    if(confirm("Zerar?")) {
                        this.produtos.forEach(p => { p.contagem = ''; p.ignorar = false; });
                        this.salvar();
                        this.mensagensChat.push({tipo:'bot', texto: 'Zerado.'});
                    }
                } else { this.mensagensChat.push({tipo:'bot', texto: 'Não entendi.'}); }
            }, 300);
        },

        salvar() { 
            // Salva com a chave V14
            localStorage.setItem('artigiano_v14', JSON.stringify({ produtos: this.produtos, config: this.config, historico: this.historico })); 
        },
        carregar() {
            // Tenta carregar V14
            let s = localStorage.getItem('artigiano_v14');
            
            // Se não tiver V14, tenta carregar V13 ou V12 (MIGRAÇÃO)
            if (!s) s = localStorage.getItem('artigiano_v13') || localStorage.getItem('artigiano_v12');

            if (s) {
                try {
                    const d = JSON.parse(s);
                    this.produtos = d.produtos || [];
                    this.historico = d.historico || [];
                    
                    // --- CORREÇÃO DE CRASH (AQUI ESTÁ O SEGREDO) ---
                    // Garante que o objeto config exista e tenha os arrays novos
                    const cfg = d.config || {};
                    this.config = {
                        nomeEmpresa: cfg.nomeEmpresa || 'Artigiano',
                        telefone: cfg.telefone || '',
                        rota: cfg.rota || ['Estoque'],
                        // Se não existir lista de usuários ou fornecedores no salvo, cria vazio
                        usuariosLista: (cfg.usuariosLista && cfg.usuariosLista.length > 0) ? cfg.usuariosLista : ['Pizzaiolo'],
                        fornecedores: cfg.fornecedores || []
                    };
                } catch(e) {
                    console.error("Erro ao migrar dados", e);
                    // Se der erro fatal, reseta para evitar tela branca
                    this.produtos = [];
                }
            }
            this.temaEscuro = localStorage.getItem('artigiano_tema') === 'true';
        },
        importarDados() { 
            try { 
                localStorage.setItem('artigiano_v14', document.querySelector('textarea').value); 
                this.carregar(); 
                alert('Importado!'); this.mostrandoConfig = false; 
            } catch(e){ alert('Erro.'); } 
        }
    },
    mounted() { this.carregar(); }
}).mount('#app')