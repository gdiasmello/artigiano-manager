const { createApp } = Vue

createApp({
    data() {
        return {
            mostrandoConfig: false, mostrandoPreview: false, mostrandoAssistente: false, mostrandoTermos: false, mostrandoSetup: false, mostrandoHistorico: false,
            mostrandoAjuda: false,
            temaEscuro: false, termoBusca: '', observacaoExtra: '', textoComando: '',
            mensagensChat: [{tipo:'bot', texto:'Olá! Sou a Arti 🤖. Digite "Novo Produto" ou "Buscar" para agilizar.'}],
            
            config: { telefone: '', nomeUsuario: '', nomeEmpresa: 'Artigiano', rota: ['Geladeira', 'Estoque Seco', 'Freezer'] },
            produtos: [],
            historico: [],
            
            // Temps
            novoProd: { nome: '', setor: '', unQ: '', unC: '', fator: 1, meta: 0 },
            editandoId: null, // Para saber se está criando ou editando
            novoLocal: '', 
            feriadosFixos: [{nome:'Natal', dia:25, mes:12}, {nome:'Ano Novo', dia:1, mes:1}]
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
        feriadoProximo() {
            const h = new Date();
            return this.feriadosFixos.find(f => f.dia === h.getDate() && f.mes === h.getMonth()+1);
        },
        
        // --- TEXTO WHATSAPP (MUDANÇA V13: SEM LOCAIS) ---
        textoPreview() {
            let texto = `*PEDIDO ${this.config.nomeEmpresa.toUpperCase()} - ${new Date().toLocaleDateString('pt-BR')}*\n----------------\n`;
            let temItem = false;
            
            // Cria uma lista única sem separação por local
            const itensParaPedir = [];
            
            this.rotaOrdenada.forEach(local => {
                const prods = this.produtos.filter(p => p.setor === local && !p.ignorar && p.contagem !== '' && this.calculaFalta(p) > 0);
                prods.forEach(p => {
                    let linha = `- ${this.calculaFalta(p)} ${p.unC} ${p.nome}`;
                    if(p.obs && p.obs.trim() !== '') linha += ` (${p.obs})`;
                    itensParaPedir.push(linha);
                });
            });

            if(itensParaPedir.length > 0) {
                texto += itensParaPedir.join('\n');
                temItem = true;
            }

            if(!temItem && this.observacaoExtra.trim() === '') return "Estoque completo! Nada para pedir.";
            return texto;
        },
        
        // --- SISTEMA DE AJUDA ---
        tituloAjuda() {
            if(this.mostrandoConfig) return "Configurações";
            if(this.mostrandoPreview) return "Enviar Pedido";
            if(this.mostrandoHistorico) return "Histórico";
            return "Tela Principal";
        },
        conteudoAjuda() {
            if(this.mostrandoConfig) return "Aqui você cadastra novos produtos, muda a ordem da rota (clicando nas setas) e define seu WhatsApp.";
            if(this.mostrandoPreview) return "Confira o resumo. Use o campo de observação para itens extras (ex: 'Trazer Copos'). Clique em Enviar Agora para abrir o WhatsApp.";
            if(this.mostrandoHistorico) return "Aqui ficam salvos os pedidos que você já enviou. Útil para lembrar o que foi pedido semana passada.";
            return "Role a tela e conte os itens seguindo sua rota.<br><br><b>Botão Bloqueio (🚫):</b> Use para ignorar um item que não precisa ser contado hoje.<br><b>Campo Contar:</b> Digite quanto tem no estoque.<br><b>Obs:</b> Adicione detalhes específicos do produto (ex: marca).";
        },

        dadosExportacao() { return JSON.stringify({ produtos: this.produtos, config: this.config, historico: this.historico }); }
    },
    methods: {
        // --- GESTÃO DE ESTADO E NAVEGAÇÃO ---
        toggleConfig() { this.mostrandoConfig = !this.mostrandoConfig; this.mostrandoAjuda = false; },
        toggleHistorico() { this.mostrandoHistorico = !this.mostrandoHistorico; this.mostrandoConfig = false; this.mostrandoAjuda = false; },
        toggleAjuda() { this.mostrandoAjuda = !this.mostrandoAjuda; },
        finalizarSetup() {
            if(!this.config.nomeUsuario) return alert('Por favor, diga seu nome!');
            if(!this.config.nomeEmpresa) this.config.nomeEmpresa = 'Artigiano';
            this.mostrandoSetup = false;
            this.salvar();
        },

        // --- PRODUTOS ---
        adicionarProduto() { 
            if(!this.novoProd.nome || !this.novoProd.setor) return alert('Preencha Nome e Local');
            
            // TRAVA DE DUPLICIDADE (V13)
            const jaExiste = this.produtos.some(p => p.nome.toLowerCase() === this.novoProd.nome.toLowerCase());
            if(jaExiste) return alert('Já existe um produto com este nome!');

            this.produtos.push({ id: Date.now(), ...this.novoProd, contagem: '', ignorar: false, obs: '' }); 
            const ultimoSetor = this.novoProd.setor;
            this.novoProd={nome:'', setor: ultimoSetor, unQ:'', unC:'', fator:1, meta:0}; 
            this.salvar(); 
            alert('Produto Salvo!'); 
        },
        // EDIÇÃO DE PRODUTO (V13)
        editarProduto(p) {
            this.novoProd = { ...p }; // Copia dados para o form
            this.editandoId = p.id;
            this.mostrandoConfig = true;
        },
        salvarEdicao() {
            const index = this.produtos.findIndex(p => p.id === this.editandoId);
            if(index !== -1) {
                this.produtos[index] = { ...this.produtos[index], ...this.novoProd };
                this.novoProd={nome:'', setor: this.produtos[index].setor, unQ:'', unC:'', fator:1, meta:0}; 
                this.editandoId = null;
                this.salvar();
                alert('Produto Atualizado!');
            }
        },
        cancelarEdicao() {
            this.editandoId = null;
            this.novoProd={nome:'', setor: '', unQ:'', unC:'', fator:1, meta:0}; 
        },

        // --- ENVIO & HISTÓRICO ---
        enviarWhatsApp() { 
            let msgFinal = this.textoPreview;
            if(this.observacaoExtra.trim() !== '') msgFinal += `\n📝 *OBS GERAL:*\n${this.observacaoExtra}\n`;
            
            // SALVA NO HISTÓRICO (V13)
            this.historico.unshift({
                data: new Date().toLocaleString('pt-BR'),
                resumo: msgFinal.replace(/\*/g, '') // Remove asteriscos para ficar limpo no app
            });
            // Mantém apenas os últimos 20 pedidos
            if(this.historico.length > 20) this.historico.pop();

            window.open(`https://wa.me/${this.config.telefone}?text=${encodeURIComponent(msgFinal)}`, '_blank'); 
            
            this.observacaoExtra = ''; 
            this.produtos.forEach(p => p.obs = '');
            this.salvar();
        },
        apagarHistorico(index) {
            if(confirm('Apagar este registro do histórico?')) {
                this.historico.splice(index, 1);
                this.salvar();
            }
        },

        // --- UTILITÁRIOS ---
        calculaFalta(p) {
            if (p.ignorar || p.contagem === '') return 0;
            const falta = p.meta - (p.contagem * p.fator);
            return falta > 0 ? parseFloat(falta.toFixed(2)) : 0;
        },
        toggleIgnorar(p) { 
            p.ignorar = !p.ignorar; 
            if(p.ignorar) { p.contagem = ''; p.obs = ''; } 
            this.salvar(); 
        },
        focarInput(id) { setTimeout(() => document.getElementById('input-'+id).focus(), 100); },
        abrirPreview() { this.mostrandoPreview = true; },
        toggleConfig() { this.mostrandoConfig = !this.mostrandoConfig; this.editandoId = null; }, // Reseta edição ao fechar/abrir
        alternarTema() { this.temaEscuro = !this.temaEscuro; localStorage.setItem('artigiano_tema', this.temaEscuro); },
        moverRota(index, direcao) {
            const novaRota = [...this.config.rota];
            if (direcao === -1 && index > 0) [novaRota[index], novaRota[index - 1]] = [novaRota[index - 1], novaRota[index]];
            else if (direcao === 1 && index < novaRota.length - 1) [novaRota[index], novaRota[index + 1]] = [novaRota[index + 1], novaRota[index]];
            this.config.rota = novaRota;
            this.salvar();
        },
        adicionarLocal() { if(this.novoLocal && !this.config.rota.includes(this.novoLocal)){ this.config.rota.push(this.novoLocal); this.novoLocal=''; this.salvar(); } },
        
        // --- ASSISTENTE ---
        toggleAssistente() { this.mostrandoAssistente = !this.mostrandoAssistente; },
        enviarComando(txt) { this.textoComando = txt; this.processarComando(); },
        processarComando() {
            const cmd = this.textoComando.toLowerCase().trim();
            if(!cmd) return;
            this.mensagensChat.push({tipo:'user', texto: this.textoComando});
            this.textoComando = '';
            setTimeout(() => {
                if(cmd.startsWith('cadastrar') || cmd.startsWith('adicionar') || cmd.startsWith('novo')) {
                    this.mostrandoAssistente = false; this.mostrandoConfig = true;
                    this.mensagensChat.push({tipo:'bot', texto: `Configurações abertas.`});
                }
                else if(cmd.includes('ver') || cmd.includes('pedido')) {
                    this.mostrandoAssistente = false; this.mostrandoPreview = true;
                    this.mensagensChat.push({tipo:'bot', texto: 'Exibindo resumo.'});
                }
                else if(cmd.includes('limpar')) {
                    if(confirm("Zerar tudo?")) {
                        this.produtos.forEach(p => { p.contagem = ''; p.ignorar = false; });
                        this.salvar();
                        this.mensagensChat.push({tipo:'bot', texto: 'Zerado.'});
                    }
                } else {
                    this.mensagensChat.push({tipo:'bot', texto: 'Não entendi.'});
                }
                setTimeout(() => { const chat = document.getElementById('chatBody'); if(chat) chat.scrollTop = chat.scrollHeight; }, 100);
            }, 400);
        },

        // --- PERSISTÊNCIA ---
        salvar() { localStorage.setItem('artigiano_v13', JSON.stringify({ produtos: this.produtos, config: this.config, historico: this.historico })); },
        carregar() {
            const s = localStorage.getItem('artigiano_v13');
            if (s) {
                const d = JSON.parse(s);
                this.produtos = d.produtos || [];
                this.historico = d.historico || [];
                // Garante compatibilidade
                this.config = { ...{ telefone: '', nomeUsuario: '', nomeEmpresa: 'Artigiano', rota: ['Geladeira', 'Estoque'] }, ...d.config };
            }
            if (!this.config.nomeUsuario) this.mostrandoSetup = true;
            this.temaEscuro = localStorage.getItem('artigiano_tema') === 'true';
        },
        importarDados() { 
            try { 
                localStorage.setItem('artigiano_v13', document.querySelector('textarea').value); 
                this.carregar(); 
                alert('Importado!'); 
                this.mostrandoConfig = false;
            } catch(e){ alert('Erro no código.'); } 
        }
    },
    mounted() { this.carregar(); }
}).mount('#app')