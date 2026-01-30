const { createApp } = Vue

createApp({
    data() {
        return {
            // UI
            mostrandoConfig: false, mostrandoPreview: false, mostrandoAssistente: false, mostrandoHistorico: false,
            temaEscuro: false, termoBusca: '', observacaoExtra: '', textoComando: '',
            mensagensChat: [{tipo:'bot', texto:'Olá! Sou a Arti 🤖. Digite "Novo" ou "Buscar" para agilizar.'}],
            
            // USUÁRIO LOGADO
            usuarioAtual: null,
            
            // DADOS
            config: { 
                nomeEmpresa: 'Artigiano', 
                rota: ['Geladeira', 'Estoque Seco', 'Freezer'],
                usuariosLista: ['Pizzaiolo 1', 'Pizzaiolo 2'], // Lista de quem usa
                fornecedores: [
                    { id: 1, nome: 'Turra', telefone: '' },
                    { id: 2, nome: 'Sacolão', telefone: '' },
                    { id: 3, nome: 'Sandro (Gelo)', telefone: '' }
                ]
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
            const rotaDefinida = this.config.rota;
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
        
        // SEPARAÇÃO INTELIGENTE DE PEDIDOS
        pedidosPorFornecedor() {
            const grupos = {};
            
            this.produtos.forEach(p => {
                const qtdFalta = this.calculaFalta(p);
                if (!p.ignorar && p.contagem !== '' && qtdFalta > 0) {
                    // Se não tiver fornecedor, vai para "Geral"
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
        // --- LOGIN E USUÁRIOS ---
        fazerLogin(u) {
            this.usuarioAtual = u;
        },
        adicionarUsuario() {
            if(this.novoUsuarioNome) {
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
            if(id === 'geral') return 'Fornecedor Geral (Sem cadastro)';
            const f = this.config.fornecedores.find(x => x.id === id);
            return f ? f.nome : 'Desconhecido';
        },
        getTelefoneFornecedor(id) {
            const f = this.config.fornecedores.find(x => x.id === id);
            return f ? f.telefone : '';
        },
        adicionarFornecedor() {
            if(this.novoFornecedor.nome) {
                this.config.fornecedores.push({ 
                    id: Date.now(), 
                    nome: this.novoFornecedor.nome, 
                    telefone: this.novoFornecedor.telefone 
                });
                this.novoFornecedor = { nome: '', telefone: '' };
                this.salvar();
            }
        },
        removerFornecedor(idx) {
            if(confirm("Remover fornecedor? Produtos vinculados ficarão 'Geral'.")) {
                this.config.fornecedores.splice(idx, 1);
                this.salvar();
            }
        },

        // --- LÓGICA DE CÁLCULO E CONVERSÃO (RICOTA) ---
        calculaFalta(p) {
            if (p.ignorar || p.contagem === '') return 0;
            // Exemplo: Ricota. UnQ = Unidade. UnC = Caixa. Fator = 6 (Vem 6 na caixa).
            // Tenho 2 unidades.
            // Estoque Real em Unidade de Compra = 2 / 6 = 0.33 caixas.
            // Meta = 1 caixa.
            // Falta = 1 - 0.33 = 0.67 caixas.
            // Se Fator for 1 (padrão), conta normal.
            
            const fator = p.fator && p.fator > 0 ? p.fator : 1;
            
            // Se UnQ for diferente de UnC, assumimos que Fator é divisor (Qtd na caixa)
            // Caso contrário, é multiplicador (Peso). Vamos simplificar:
            // Assumimos que o Fator converte CONTAGEM para COMPRA.
            // Se Fator > 1 e nomes diferentes (Un x Cx), geralmente dividimos (ex: 6 un numa cx).
            
            let estoqueConvertido = 0;
            
            // Lógica Simplificada Artigiano:
            // Se eu conto UNIDADE e compro CAIXA, e o fator é 6:
            // Quantas caixas eu tenho? Contagem / 6.
            
            if (p.unQ.toLowerCase().startsWith('un') && p.unC.toLowerCase().startsWith('cx')) {
                 estoqueConvertido = p.contagem / fator;
            } else {
                 // Lógica padrão (Multiplicação, ex: 2 fardos * 10kg = 20kg)
                 // Se o usuário configurou Fator como "quantos vem na caixa", ele quer dividir.
                 // Vamos usar a regra: Se Fator > 1 e Unidades Diferentes, divide.
                 if(p.unQ !== p.unC && fator > 1) {
                     estoqueConvertido = p.contagem / fator;
                 } else {
                     estoqueConvertido = p.contagem * fator;
                 }
            }

            const falta = p.meta - estoqueConvertido;
            return falta > 0 ? parseFloat(falta.toFixed(2)) : 0;
        },

        // --- CRUD PRODUTOS ---
        adicionarProduto() { 
            if(!this.novoProd.nome || !this.novoProd.setor) return alert('Preencha Nome e Local');
            const jaExiste = this.produtos.some(p => p.nome.toLowerCase() === this.novoProd.nome.toLowerCase());
            if(jaExiste) return alert('Já existe esse produto!');

            this.produtos.push({ id: Date.now(), ...this.novoProd, contagem: '', ignorar: false, obs: '' }); 
            // Mantém setor e fornecedor para agilizar
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

        // --- ENVIO WHATSAPP ESPECÍFICO ---
        enviarWhatsApp(fornecedorId, itens) {
            const nomeForn = this.getNomeFornecedor(fornecedorId);
            const telForn = this.getTelefoneFornecedor(fornecedorId);
            
            let msg = `*PEDIDO ${this.config.nomeEmpresa.toUpperCase()} (${nomeForn})*\n`;
            msg += `📅 ${new Date().toLocaleDateString('pt-BR')} - Por: ${this.usuarioAtual}\n`;
            msg += `----------------\n`;
            
            itens.forEach(i => msg += i.texto + '\n');
            
            if(this.observacaoExtra) msg += `\n📝 *OBS:* ${this.observacaoExtra}`;

            // Salva histórico
            this.historico.unshift({
                data: new Date().toLocaleString('pt-BR'),
                usuario: this.usuarioAtual,
                fornecedor: nomeForn,
                resumo: `${itens.length} itens pedidos.`
            });
            if(this.historico.length > 50) this.historico.pop();
            this.salvar();

            const numeroFinal = telForn || this.config.telefone || ''; // Tenta específico, senão geral
            window.open(`https://wa.me/${numeroFinal}?text=${encodeURIComponent(msg)}`, '_blank');
        },

        // --- PADRÕES ---
        toggleIgnorar(p) { p.ignorar = !p.ignorar; if(p.ignorar) { p.contagem = ''; p.obs = ''; } this.salvar(); },
        focarInput(id) { setTimeout(() => document.getElementById('input-'+id).focus(), 100); },
        abrirPreview() { this.mostrandoPreview = true; },
        toggleConfig() { this.mostrandoConfig = !this.mostrandoConfig; this.editandoId = null; },
        toggleHistorico() { this.mostrandoHistorico = !this.mostrandoHistorico; },
        toggleAssistente() { this.mostrandoAssistente = !this.mostrandoAssistente; },
        
        // --- ASSISTENTE COMANDOS ---
        enviarComando(txt) { this.textoComando = txt; this.processarComando(); },
        processarComando() {
            const cmd = this.textoComando.toLowerCase().trim();
            if(!cmd) return;
            this.mensagensChat.push({tipo:'user', texto: this.textoComando});
            this.textoComando = '';
            setTimeout(() => {
                if(cmd.includes('cadastrar') || cmd.includes('novo')) {
                    this.mostrandoAssistente = false; this.mostrandoConfig = true;
                    this.mensagensChat.push({tipo:'bot', texto: `Configurações abertas.`});
                } else if(cmd.includes('limpar')) {
                    if(confirm("Zerar contagens?")) {
                        this.produtos.forEach(p => { p.contagem = ''; p.ignorar = false; });
                        this.salvar();
                        this.mensagensChat.push({tipo:'bot', texto: 'Zerado.'});
                    }
                } else {
                    this.mensagensChat.push({tipo:'bot', texto: 'Tente "Novo" ou "Limpar".'});
                }
                setTimeout(() => { const chat = document.getElementById('chatBody'); if(chat) chat.scrollTop = chat.scrollHeight; }, 100);
            }, 400);
        },

        moverRota(index, direcao) {
            const novaRota = [...this.config.rota];
            if (direcao === -1 && index > 0) [novaRota[index], novaRota[index - 1]] = [novaRota[index - 1], novaRota[index]];
            else if (direcao === 1 && index < novaRota.length - 1) [novaRota[index], novaRota[index + 1]] = [novaRota[index + 1], novaRota[index]];
            this.config.rota = novaRota;
            this.salvar();
        },
        adicionarLocal() { if(this.novoLocal && !this.config.rota.includes(this.novoLocal)){ this.config.rota.push(this.novoLocal); this.novoLocal=''; this.salvar(); } },
        
        salvar() { localStorage.setItem('artigiano_v14', JSON.stringify({ produtos: this.produtos, config: this.config, historico: this.historico })); },
        carregar() {
            const s = localStorage.getItem('artigiano_v14');
            if (s) {
                const d = JSON.parse(s);
                this.produtos = d.produtos || [];
                this.historico = d.historico || [];
                // Merge de configurações novas para quem já usa
                this.config = { 
                    ...{ telefone: '', nomeEmpresa: 'Artigiano', rota: [], usuariosLista: ['Pizzaiolo'], fornecedores: [] }, 
                    ...d.config 
                };
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