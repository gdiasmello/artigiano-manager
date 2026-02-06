export const initialData = {
    versionNum: '1.8.0',
    versionName: 'Gestão Premium',
    
    atualizandoApp: false, mostrarNovidades: false,
    sessaoAtiva: false, telaAtiva: null, configAberto: null,
    usuarioLogado: null, loginUser: '', loginPass: '', msgAuth: '', loginErro: false,
    localAtual: '', contagemAtiva: {}, obsPorItem: {}, 
    mostrandoResumo: false, textoWhatsApp: '', textoBase: '', itensExtras: '', numeroDestinoAtual: '',
    mostrandoHistorico: false, mostrarSucesso: false, mostrandoNovoUsuario: false, mostrandoTermos: false,
    notificacao: { ativa: false, texto: '', tipo: '', icone: '' },
    
    qtdGeloAtual: null,
    checklistItens: [],
    
    novoInsumo: { nome: '', un_contagem: '', un_pedido: '', tipo_calculo: 'direto', fator: 1, meta: 0, bloco: '', locais: [] },
    novoLocal: '', novaTarefa: '', qtdBolinhas: 0,
    
    novoUser: { nome: '', user: '', pass: '', cargo: '', permissoes: {} },
    cargosDefinidos: {
        pizzaiolo: { producao: true, insumos: true, gelo: true, limpeza: true, sacolao: false, checklist: false, bebidas: false, admin: false },
        atendente: { checklist: true, bebidas: true, limpeza: true, sacolao: true, producao: false, insumos: false, gelo: false, admin: false },
        gerente: { admin: true, sacolao: true, insumos: true, producao: true, gelo: true, checklist: true, bebidas: true, limpeza: true }
    },
    
    listaTodosBlocos: [
        { id: 'sacolao', nome: 'SACOLÃO', icon: 'fas fa-leaf', cor: 'green' },
        { id: 'insumos', nome: 'INSUMOS', icon: 'fas fa-box', cor: 'red' },
        { id: 'producao', nome: 'PRODUÇÃO', icon: 'fas fa-mortar-pestle', cor: 'gold' },
        { id: 'gelo', nome: 'GELO', icon: 'fas fa-cube', cor: 'ice' },
        { id: 'checklist', nome: 'CHECKLIST', icon: 'fas fa-clipboard-check', cor: 'temp' },
        { id: 'bebidas', nome: 'BEBIDAS', icon: 'fas fa-wine-bottle', cor: 'purple' },
        { id: 'limpeza', nome: 'LIMPEZA', icon: 'fas fa-hands-bubbles', cor: 'blue' }
    ],
    usuarios: [], catalogoDNA: [], config: { rota: ['Geral'], destinos: {}, checklist: [] }, historico: []
};