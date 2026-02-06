export const initialData = {
    versionNum: '1.8.0',
    versionName: 'Gestão Premium',
    
    atualizandoApp: false, 
    mostrarNovidades: false,
    sessaoAtiva: false, 
    telaAtiva: null,
    usuarioLogado: null, 
    
    loginUser: '', 
    loginPass: '', 
    msgAuth: '', 
    loginErro: false,
    
    localAtual: '', 
    contagemAtiva: {}, 
    mostrandoResumo: false, 
    textoWhatsApp: '',
    
    mostrandoHistorico: false, 
    mostrandoNovoUsuario: false, 
    mostrandoTermos: false,
    
    notificacao: { ativa: false, texto: '', tipo: '', icone: '' },
    novoUser: { nome: '', user: '', pass: '' },
    
    usuarios: [],
    catalogoDNA: [],
    historico: [],
    config: { rota: ['Geral'], destinos: {}, checklist: [] },
    
    locaisEstoque: ["Estoque seco", "Geladeira forno", "Freezer cong.", "Freezer Bufulas", "Cozinha freela", "Quartinho"]
};
