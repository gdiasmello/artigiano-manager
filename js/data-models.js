export const initialData = {
    versionNum: '1.8.0',
    versionName: 'Gestão Premium',
    atualizandoApp: true,
    sessaoAtiva: false,
    usuarioLogado: null,
    telaAtiva: null,
    
    cargosDisponiveis: ['pizzaiolo', 'atendente', 'gerente'],
    nomesBlocos: ['Sacolão', 'Insumos', 'Produção', 'Histórico'],
    permissoesGlobais: {
        pizzaiolo: { blocos: ['Sacolão', 'Insumos'] },
        atendente: { blocos: ['Sacolão'] },
        gerente: { blocos: ['Sacolão', 'Insumos', 'Produção', 'Histórico'] }
    },
    
    locaisEstoque: ["Estoque seco", "Geladeira forno", "Freezer cong.", "Freezer Bufulas", "Cozinha freela", "Quartinho"],
    localAtual: "Estoque seco",
    catalogoDNA: [],
    contagemAtiva: {},
    usuarios: [],
    loginUser: '', loginPass: '', loginErro: false, msgAuth: '',
    configAberto: false, mostrandoNovoUsuario: false,
    notificacao: { ativa: false, texto: '', tipo: '', icone: '' },
    novoUser: { nome: '', user: '', pass: '', cargo: 'pizzaiolo' }
};
