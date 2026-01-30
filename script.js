const { createApp } = Vue

const app = createApp({
    data() {
        return {
            mostrandoConfig: false, mostrandoPreview: false, mostrandoHistorico: false,
            temaEscuro: false, termoBusca: '', observacaoExtra: '',
            
            // DADOS
            config: { 
                nomeEmpresa: 'Artigiano', 
                rota: ['Geladeira', 'Estoque Seco', 'Freezer'],
                destinos: [], // [{id:1, nome:'Sacolão', triplicarSexta: true}]
                feriados: []
            },
            produtos: [],
            historico: [],
            
            // TEMPS
            novoProd: { nome: '', setor: '', unQ: '', unC: '', fator: 1, meta: 0, destinoId: '' },
            novoDestino: { nome: '', telefone: '', msgPersonalizada: '', triplicarSexta: false },
            novoFeriado: { nome: '', dia: '', mes: '' },
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
        
        // --- DATA E HORA ---
        diaDaSemana() { return new Date().getDay(); }, // 0=Dom, 1=Seg, 5=Sex
        diaDaSemanaExtenso() {
            const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
            return dias[this.diaDaSemana];
        },
        
        // --- INTELIGÊNCIA DE CALENDÁRIO ---
        feriadoAtivo() {
            if(!this.config.feriados) return null;
            const hoje = new Date();
            const limite = new Date();
            limite.setDate(hoje.getDate() + 3); 
            return this.config.feriados.find(f => {
                const dataFeriado = new Date(hoje.getFullYear(), f.mes - 1, f.dia);
                return dataFeriado >= hoje && dataFeriado <= limite;
            });
        },

        pedidosPorDestino() {
            const grupos = {};
            this.produtos.forEach(p => {
                const calculo = this.calculaFalta(p);
                if (!p.ignorar && p.contagem !== '' && calculo.qtd > 0) {
                    const dId = p.destinoId || 'geral';
                    if (!grupos[dId]) grupos[dId] = [];
                    
                    let linha = `- ${calculo.qtd} ${p.unC || 'un'} de ${p.nome}`;
                    if(p.obs) linha += ` (${p.obs})`;
                    if(calculo.fatorMultiplicador > 1) linha += ` (Aumentado x${calculo.fatorMultiplicador})`;
                    
                    grupos[dId].push({ texto: linha, produto: p });
                }
            });
            return grupos;
        },
        
        dadosExportacao() { return JSON.stringify({ produtos: this.produtos, config: this.config }); }
    },
    methods: {
        // --- CORE: CÁLCULO INTELIGENTE V17 ---
        calculaFalta(p) {
            if (p.ignorar || p.contagem === '') return { qtd: 0, fatorMultiplicador: 1 };
            
            // 1. Definição do Fator de Conversão
            const fatorConversao = (p.fator && !isNaN(p.fator) && p.fator > 0) ? Number(p.fator) : 1;
            
            // 2. Converter Contagem para Unidade de Compra
            let estoqueEmCompra = 0;
            const contagem = Number(p.contagem) || 0;
            
            if (p.unQ && p.unC && p.unQ !== p.unC && fatorConversao > 1) {
                 // Ex: Conto em Unidade, Peço em Caixa (Vem 20). Tenho 10 un -> 0.5 cx.
                 estoqueEmCompra = contagem / fatorConversao;
            } else {
                 estoqueEmCompra = contagem * fatorConversao;
            }

            // 3. Definir a META DO DIA (Aqui entra a inteligência)
            let metaDoDia = Number(p.meta) || 0;
            let fatorMultiplicador = 1;

            // Regra A: Sexta-Feira no Sacolão (ou destino marcado)
            if (this.diaDaSemana === 5 && p.destinoId) { // 5 = Sexta
                const destino = this.config.destinos.find(d => d.id === p.destinoId);
                if (destino && destino.triplicarSexta) {
                    metaDoDia = metaDoDia * 3;
                    fatorMultiplicador = 3;
                }
            }

            // Regra B: Feriado Próximo (+50%)
            if (this.feriadoAtivo) {
                metaDoDia = metaDoDia * 1.5;
                fatorMultiplicador = (fatorMultiplicador === 1) ? 1.5 : 3.5; // Aproximação
            }

            // 4. Cálculo Final e Arredondamento
            let falta = metaDoDia - estoqueEmCompra;
            
            if (falta <= 0) return { qtd: 0, fatorMultiplicador };
            
            // ARREDONDAMENTO PARA CIMA (Ceil)
            return { qtd: Math.ceil(falta), fatorMultiplicador }; 
        },

        // --- DESTINOS ---
        getNomeDestino(id) {
            if(id === 'geral' || !Array.isArray(this.config.destinos)) return 'Geral';
            const d = this.config.destinos.find(x => x.id === id);
            return d ? d.nome : 'Geral';
        },
        adicionarDestino() {
            if(this.novoDestino.nome) {
                if(!Array.isArray(this.config.destinos)) this.config.destinos = [];
                this.config.destinos.push({ 
                    id: Date.now(), 
                    nome: this.novoDestino.nome, 
                    telefone: this.novoDestino.telefone,
                    msgPersonalizada: this.novoDestino.msgPersonalizada,
                    triplicarSexta: this.novoDestino.triplicarSexta // Salva a regra
                });
                this.novoDestino = { nome: '', telefone: '', msgPersonalizada: '', triplicarSexta: false };
                this.salvar();
            }
        },
        removerDestino(idx) {
            if(confirm("Remover destino?")) {
                this.config.destinos.splice(idx, 1);
                this.salvar();
            }
        },

        // --- FERIADOS ---
        adicionarFeriado() {
            if(this.novoFeriado.nome) {
                if(!Array.isArray(this.config.feriados)) this.config.feriados = [];
                this.config.feriados.push({ ...this.novoFeriado });
                this.novoFeriado = { nome: '', dia: '', mes: '' };
                this.salvar();
            }
        },
        removerFeriado(idx) {
            this.config.feriados.splice(idx, 1);
            this.salvar();
        },

        // --- PRODUTOS ---
        adicionarProduto() { 
            if(!this.novoProd.nome || !this.novoProd.setor) return alert('Preencha Nome e Local');
            this.produtos.push({ id: Date.now(), ...this.novoProd, contagem: '', ignorar: false, obs: '' }); 
            const ultSetor = this.novoProd.setor;
            const ultDest = this.novoProd.destinoId;
            this.novoProd={nome:'', setor: ultSetor, unQ:'', unC:'', fator:1, meta:0, destinoId: ultDest}; 
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
                this.novoProd={nome:'', setor: '', unQ:'', unC:'', fator:1, meta:0, destinoId: ''}; 
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
        enviarWhatsApp(destinoId, itens) {
            const nomeDest = this.getNomeDestino(destinoId);
            let telDest = '';
            let msgHeader = `*PEDIDO ${this.config.nomeEmpresa}*\n`;

            if (this.config.destinos) {
                const d = this.config.destinos.find(x => x.id == destinoId);
                if (d) {
                    telDest = d.telefone;
                    if(d.msgPersonalizada) msgHeader = `${d.msgPersonalizada}\n`;
                }
            }
            
            let msg = msgHeader;
            msg += `Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
            msg += `----------------\n`;
            itens.forEach(i => msg += i.texto + '\n');
            if(this.observacaoExtra) msg += `\nOBS: ${this.observacaoExtra}`;

            this.historico.unshift({
                data: new Date().toLocaleString('pt-BR'),
                destino: nomeDest,
                resumo: `${itens.length} itens.`
            });
            if(this.historico.length > 50) this.historico.pop();
            this.salvar();

            window.open(`https://wa.me/${telDest}?text=${encodeURIComponent(msg)}`, '_blank');
        },
        apagarHistorico(index) {
            if(confirm("Apagar?")) {
                this.historico.splice(index, 1);
                this.salvar();
            }
        },

        // --- UX/SISTEMA ---
        resetarTudo() {
            if(confirm("ATENÇÃO: Apagar tudo e começar do zero?")) {
                localStorage.clear();
                window.location.reload();
            }
        },
        toggleIgnorar(p) { p.ignorar = !p.ignorar; if(p.ignorar) { p.contagem = ''; p.obs = ''; } this.salvar(); },
        focarInput(id) { setTimeout(() => { const el = document.getElementById('input-'+id); if(el) el.focus(); }, 100); },
        abrirPreview() { this.mostrandoPreview = true; },
        toggleConfig() { this.mostrandoConfig = !this.mostrandoConfig; this.editandoId = null; },
        toggleHistorico() { this.mostrandoHistorico = !this.mostrandoHistorico; },
        alternarTema() { this.temaEscuro = !this.temaEscuro; localStorage.setItem('artigiano_tema', this.temaEscuro); },
        moverRota(index, direcao) {
            const novaRota = [...this.config.rota];
            if (direcao === -1 && index > 0) [novaRota[index], novaRota[index - 1]] = [novaRota[index - 1], novaRota[index]];
            else if (direcao === 1 && index < novaRota.length - 1) [novaRota[index], novaRota[index + 1]] = [novaRota[index + 1], novaRota[index]];
            this.config.rota = novaRota;
            this.salvar();
        },
        adicionarLocal() { if(this.novoLocal && !this.config.rota.includes(this.novoLocal)){ this.config.rota.push(this.novoLocal); this.novoLocal=''; this.salvar(); } },

        // --- PERSISTÊNCIA ---
        salvar() { 
            try { localStorage.setItem('artigiano_v17_smart', JSON.stringify({ produtos: this.produtos, config: this.config, historico: this.historico })); } catch(e) {}
        },
        carregar() {
            try {
                let s = localStorage.getItem('artigiano_v17_smart');
                // Tenta migrar dados antigos
                if (!s) s = localStorage.getItem('artigiano_v16') || localStorage.getItem('artigiano_v15_nolock');

                if (s) {
                    const d = JSON.parse(s);
                    this.produtos = Array.isArray(d.produtos) ? d.produtos : [];
                    this.historico = Array.isArray(d.historico) ? d.historico : [];
                    
                    const cfg = d.config || {};
                    this.config = {
                        nomeEmpresa: cfg.nomeEmpresa || 'Artigiano',
                        rota: (Array.isArray(cfg.rota) && cfg.rota.length > 0) ? cfg.rota : ['Geral'],
                        destinos: Array.isArray(cfg.destinos || cfg.fornecedores) ? (cfg.destinos || cfg.fornecedores) : [],
                        feriados: Array.isArray(cfg.feriados) ? cfg.feriados : []
                    };
                }
                this.temaEscuro = localStorage.getItem('artigiano_tema') === 'true';
            } catch(e) { console.error("Erro reset:", e); }
        },
        importarDados() { 
            try { 
                localStorage.setItem('artigiano_v17_smart', document.querySelector('textarea').value); 
                this.carregar(); alert('Importado!'); this.mostrandoConfig = false; 
            } catch(e){ alert('Erro.'); } 
        }
    },
    mounted() { this.carregar(); }
});

app.config.errorHandler = (err) => { console.error("Erro Vue:", err); };
app.mount('#app');