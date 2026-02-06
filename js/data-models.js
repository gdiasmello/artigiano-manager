export const initialData = {
    // Versão e Controle de App
    versionNum: '1.9.2',
    atualizandoApp: true,
    sessaoAtiva: false,
    usuarioLogado: null,
    telaAtiva: null,
    
    // Configurações de Gestão de Equipe (Nova Opção 2)
    cargosDisponiveis: ['pizzaiolo', 'atendente', 'gerente'],
    nomesBlocos: ['Sacolão', 'Insumos', 'Produção', 'Histórico'],
    permissoesGlobais: {
        pizzaiolo: { blocos: [] },
        atendente: { blocos: [] },
        gerente: { blocos: [] }
    },
    
    // Dados de Operação (Originais da sua versão 1.8.0)
    locaisEstoque: ["Estoque seco", "Geladeira forno", "Freezer cong.", "Freezer Bufulas", "Cozinha freela", "Quartinho"],
    localAtual: "Estoque seco",
    catalogoDNA: [],
    contagemAtiva: {},
    obsPorItem: {},
    
    // Histórico e Configurações de Rota
    historico: [],
    config: { 
        rota: ['Geral'], 
        destinos: {}, 
        checklist: [] 
    },
    
    // UI, Login e Modais
    loginUser: '', 
    loginPass: '', 
    loginErro: false, 
    msgAuth: '',
    configAberto: false, 
    mostrandoNovoUsuario: false, 
    mostrandoHistorico: false,
    mostrandoTermos: false,
    
    // Formulário de Novo Usuário
    novoUser: { 
        nome: '', 
        user: '', 
        pass: '', 
        cargo: 'pizzaiolo' 
    },
    
    // Lista de Usuários do Banco
    usuarios: [],
    
    // Notificações Toast
    notificacao: { 
        ativa: false, 
        texto: '', 
        tipo: '', 
        icone: '' 
    }
};
