const { createApp } = Vue

createApp({
    data() {
        return {
            // Estados das Modais
            mostrandoConfig: false, mostrandoPreview: false, mostrandoAssistente: false, mostrandoTermos: false, mostrandoSetup: false,
            
            // UI
            temaEscuro: false, termoBusca: '', observacaoExtra: '', textoComando: '',
            mensagensChat: [{tipo:'bot', texto:'Olá! Sou a Arti 🤖. Digite "Cadastrar [Nome]" ou "Buscar [Nome]" para agilizar.'}],
            
            // Dados Principais (Agora com nome da empresa e usuário)
            config: { telefone: '', nomeUsuario: '', nomeEmpresa: 'Artigiano', rota: ['Geladeira', 'Estoque Seco', 'Freezer'] },
            produtos: [],
            
            // Temps
            novoProd: { nome: '', setor: '', unQ: '', unC: '', fator: 1, meta: 0 },
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
        textoPreview() {
            let texto = `*PEDIDO ${this.config.nomeEmpresa.toUpperCase()} - ${new Date().toLocaleDateString('pt-BR')}*\n----------------\n`;
            let temItem = false;
            this.rotaOrdenada.forEach(local => {
                const prodsDoLocal = this.produtos.filter(p => p.setor === local && !p.ignorar && p.contagem !== '' && this.calculaFalta(p) > 0);
                if(prodsDoLocal.length > 0) {
                    texto += `\n📍 *${local.toUpperCase()}*\n`;
                    prodsDoLocal.forEach(p => {
                        texto += `- ${this.calculaFalta(p)} ${p.unC} ${p.nome}`;
                        if(p.obs && p.obs.trim() !== '') texto += ` (Obs: ${p.obs})`;
                        texto += `\n`;
                        temItem = true;
                    });
                }
            });
            if(!temItem && this.observacaoExtra.trim() === '') return "Estoque completo! Nada para pedir.";
            return texto;
        },
        dadosExportacao() { return JSON.stringify({ produtos: this.produtos, config: this.config }); }
    },
    methods: {
        // --- SETUP INICIAL ---
        finalizarSetup() {
            if(!this.config.nomeUsuario) return alert('Por favor, diga seu nome!');
            if(!this.config.nomeEmpresa) this.config.nomeEmpresa = 'Artigiano';
            this.mostrandoSetup = false;
            this.salvar();
        },

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
                    const nomeItem = cmd.replace(/cadastrar|adicionar|novo/g, '').trim();
                    this.novoProd.nome = nomeItem.charAt(0).toUpperCase() + nomeItem.slice(1);
                    this.mostrandoAssistente = false;
                    this.mostrandoConfig = true;
                    this.mensagensChat.push({tipo:'bot', texto: `Abrindo configurações para: ${this.novoProd.nome}`});
                }
                else if(cmd.startsWith('buscar') || cmd.startsWith('procurar')) {
                    const termo = cmd.replace(/buscar|procurar/g, '').trim();
                    this.termoBusca = termo;
                    this.mostrandoAssistente = false;
                    this.mensagensChat.push({tipo:'bot', texto: `Filtrando por "${termo}"`});
                }
                else if(cmd.includes('limpar') || cmd.includes('zerar')) {
                        if(confirm("Zerar contagens de hoje?")) {
                            this.produtos.forEach(p => { p.contagem = ''; p.ignorar = false; p.obs = ''; });
                            this.salvar();
                            this.mensagensChat.push({tipo:'bot', texto: 'Contagens zeradas.'});
                            this.mostrandoAssistente = false;
                        } else {
                            this.mensagensChat.push({tipo:'bot', texto: 'Cancelado.'});
                        }
                }
                else if(cmd.includes('config') || cmd.includes('zap')) {
                    this.mostrandoAssistente = false;
                    this.mostrandoConfig = true;
                    this.mensagensChat.push({tipo:'bot', texto: 'Configurações abertas.'});
                }
                else if(cmd.includes('ver') || cmd.includes('pedido') || cmd.includes('finalizar')) {
                    this.mostrandoAssistente = false;
                    this.mostrandoPreview = true;
                    this.mensagensChat.push({tipo:'bot', texto: 'Mostrando resumo.'});
                }
                else {
                    this.mensagensChat.push({tipo:'bot', texto: 'Não entendi. Tente "Cadastrar [item]" ou "Buscar [item]".'});
                }
                setTimeout(() => { const chat = document.getElementById('chatBody'); if(chat) chat.scrollTop = chat.scrollHeight; }, 100);
            }, 400);
        },

        // --- APP LOGIC ---
        abrirTermos() { this.mostrandoConfig = false; this.mostrandoTermos = true; },
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
        focarInput(id) { 
            setTimeout(() => document.getElementById('input-'+id).focus(), 100); 
        },
        abrirPreview() { this.mostrandoPreview = true; },
        toggleConfig() { this.mostrandoConfig = !this.mostrandoConfig; },
        alternarTema() { 
            this.temaEscuro = !this.temaEscuro; 
            localStorage.setItem('artigiano_tema', this.temaEscuro); 
        },
        moverRota(index, direcao) {
            const novaRota = [...this.config.rota];
            if (direcao === -1 && index > 0) [novaRota[index], novaRota[index - 1]] = [novaRota[index - 1], novaRota[index]];
            else if (direcao === 1 && index < novaRota.length - 1) [novaRota[index], novaRota[index + 1]] = [novaRota[index + 1], novaRota[index]];
            this.config.rota = novaRota;
            this.salvar();
        },
        adicionarLocal() { 
            if(this.novoLocal && !this.config.rota.includes(this.novoLocal)){ 
                this.config.rota.push(this.novoLocal); 
                this.novoLocal=''; 
                this.salvar(); 
            } 
        },
        adicionarProduto() { 
            if(!this.novoProd.nome || !this.novoProd.setor) return alert('Preencha Nome e Local');
            this.produtos.push({ id: Date.now(), ...this.novoProd, contagem: '', ignorar: false, obs: '' }); 
            const ultimoSetor = this.novoProd.setor;
            this.novoProd={nome:'', setor: ultimoSetor, unQ:'', unC:'', fator:1, meta:0}; 
            this.salvar(); 
            alert('Produto Salvo!'); 
        },
        enviarWhatsApp() { 
            let msgFinal = this.textoPreview;
            if(this.observacaoExtra.trim() !== '') msgFinal += `\n📝 *OBS GERAL:*\n${this.observacaoExtra}\n`;
            window.open(`https://wa.me/${this.config.telefone}?text=${encodeURIComponent(msgFinal)}`, '_blank'); 
            this.observacaoExtra = ''; 
            this.produtos.forEach(p => p.obs = '');
            this.salvar();
        },
        salvar() { localStorage.setItem('artigiano_v12', JSON.stringify({ produtos: this.produtos, config: this.config })); },
        carregar() {
            const s = localStorage.getItem('artigiano_v12');
            if (s) {
                const d = JSON.parse(s);
                this.produtos = d.produtos || [];
                // Garante compatibilidade e valores padrão
                this.config = { ...{ telefone: '', nomeUsuario: '', nomeEmpresa: 'Artigiano', rota: ['Geladeira', 'Estoque'] }, ...d.config };
            }
            // Se não tiver usuário, força setup
            if (!this.config.nomeUsuario) this.mostrandoSetup = true;
            
            this.temaEscuro = localStorage.getItem('artigiano_tema') === 'true';
        },
        importarDados() { 
            try { 
                localStorage.setItem('artigiano_v12', document.querySelector('textarea').value); 
                this.carregar(); 
                alert('Dados importados com sucesso!'); 
                this.mostrandoConfig = false;
            } catch(e){ alert('Erro no código de importação.'); } 
        }
    },
    mounted() { this.carregar(); }
}).mount('#app')