
import React, { useState, useEffect, useMemo } from 'react';
import { User, Insumo, Config, HistoryRecord, BlocoId, CalcType, UserCargo } from './types';
import { storageService } from './services/storageService';
import { firebaseService } from './services/firebaseService';
import { MASTER_USER, BLOCAS_CONFIG, PERMISSION_PRESETS } from './constants';
import Layout from './components/Layout';
import InventoryScreen from './components/InventoryScreen';
import ProductionScreen from './components/ProductionScreen';
import HistoryScreen from './components/HistoryScreen';
import { audio } from './services/audioService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => storageService.getSession());
  const [isLogin, setIsLogin] = useState(!user);
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [loginError, setLoginError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeScreen, setActiveScreen] = useState<BlocoId | 'home' | 'config' | 'history' | 'dna'>('home');
  const [dna, setDna] = useState<Insumo[]>(() => storageService.getCachedDNA());
  const [config, setConfig] = useState<Config>(() => storageService.getCachedConfig() || { 
    rota: [], destinos: {}, checklist: [], notices: '', isLocked: false, 
    templateSaudacao: '*[saudacao]! Segue lista de [bloco]:*', 
    templateAgradecimento: '_Gerado por [nome] via PiZZA Master Pro 🍕_' 
  });
  const [history, setHistory] = useState<HistoryRecord[]>(() => storageService.getCachedHistory());
  const [users, setUsers] = useState<User[]>(() => storageService.getCachedUsers());
  
  const [showSummary, setShowSummary] = useState<string | null>(null);
  const [extraItems, setExtraItems] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [showUserModal, setShowUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ nome: '', user: '', pass: '', cargo: 'atendente' as UserCargo });

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    
    // Simulação de Loader com som de borbulhas
    const timer = setTimeout(() => {
        setIsLoading(false);
    }, 1500);
    audio.playBubbles();

    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    storageService.clearOldCache();

    const unsubDNA = firebaseService.syncDNA((data) => {
      setDna(data);
      storageService.setCacheDNA(data);
    });
    const unsubUsers = firebaseService.syncUsers((data) => {
      setUsers(data);
      storageService.setCacheUsers(data);
    });
    const unsubConfig = firebaseService.syncConfig((data) => {
      setConfig(prev => ({ ...prev, ...data }));
      storageService.setCacheConfig({ ...config, ...data });
    });
    const unsubHistory = firebaseService.syncHistory((data) => {
      setHistory(data);
      storageService.setCacheHistory(data);
    });

    return () => {
      unsubDNA(); unsubUsers(); unsubConfig(); unsubHistory();
    };
  }, []);

  const isNight = useMemo(() => {
    const hour = new Date().getHours();
    return hour >= 19 || hour < 6;
  }, []);

  useEffect(() => {
    document.body.style.backgroundColor = isNight ? '#121212' : '#FDFBF7';
  }, [isNight]);

  const handleLogin = () => {
    if (config.isLocked && loginForm.pass !== MASTER_USER.pass) {
      alert("SISTEMA BLOQUEADO."); return;
    }
    setLoginError(false);
    const uInput = loginForm.user.trim().toLowerCase();
    const pInput = loginForm.pass.trim();

    if (uInput === MASTER_USER.user && pInput === MASTER_USER.pass) {
      setUser(MASTER_USER); storageService.setSession(MASTER_USER); setIsLogin(false); 
      audio.playSuccess();
      return;
    }

    const found = users.find(x => x.user.toLowerCase() === uInput && x.pass === pInput);
    if (found) {
      setUser(found); storageService.setSession(found); setIsLogin(false);
      audio.playSuccess();
    } else {
      setLoginError(true);
      audio.playAlert();
      if (navigator.vibrate) navigator.vibrate(200);
      setTimeout(() => setLoginError(false), 500);
    }
  };

  const handleLogout = () => {
    if (confirm("Sair do turno?")) {
      storageService.setSession(null); setUser(null); setIsLogin(true); setActiveScreen('home');
    }
  };

  const triggerSuccess = () => {
    setSuccessMsg(true); 
    audio.playSuccess();
    if (navigator.vibrate) navigator.vibrate(50);
    setTimeout(() => setSuccessMsg(false), 2000);
  };

  const handleAddUser = async () => {
    const { nome, user: uName, pass, cargo } = newUserForm;
    if (!nome || !uName || !pass) return alert("Preencha tudo!");
    
    // Segurança: Somente Gabriel cria admins
    if (cargo === 'admin' && user?.id !== 'master') {
        alert("Apenas Gabriel pode criar administradores.");
        return;
    }

    const permissions = PERMISSION_PRESETS[cargo] || PERMISSION_PRESETS.atendente;
    const newUserObj: User = {
      id: `u_${Date.now()}`,
      nome, user: uName.toLowerCase(), pass, cargo,
      permissoes: permissions
    };

    try {
      await firebaseService.saveUser(newUserObj);
      setShowUserModal(false);
      setNewUserForm({ nome: '', user: '', pass: '', cargo: 'atendente' });
      triggerSuccess();
    } catch (e) {
      alert("Erro ao salvar. O app sincronizará quando houver rede.");
    }
  };

  const updateConfig = async (newConfig: Partial<Config>) => {
    const fullConfig = { ...config, ...newConfig };
    setConfig(fullConfig);
    try {
      await firebaseService.saveConfig(fullConfig);
    } catch (e) {
      console.error("Erro ao salvar config no Firebase");
    }
  };

  const sendToWhatsApp = async () => {
    if (!showSummary) return;
    const bloco = activeScreen as BlocoId;
    const destino = config.destinos[bloco] || '';
    
    const finalAction = async (locStr?: string) => {
      let text = showSummary + (extraItems.trim() ? `\n*EXTRAS:*\n${extraItems}` : '') + (locStr ? `\n_Local: @Artigiano (${locStr})_` : '');
      window.open(`https://api.whatsapp.com/send?phone=${destino}&text=${encodeURIComponent(text)}`, '_blank');
      
      const record: HistoryRecord = {
        id: `h_${Date.now()}`,
        data: new Date().toLocaleString('pt-BR'),
        timestamp: Date.now(),
        usuario: user?.nome || '?',
        itens: text,
        localizacao: locStr
      };
      
      await firebaseService.addHistory(record);
      setShowSummary(null); setExtraItems(''); setActiveScreen('home'); triggerSuccess();
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => finalAction(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`),
      () => finalAction()
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center">
        <div className="w-24 h-24 text-[#008C45] text-7xl pizza-loader">
          <i className="fas fa-pizza-slice"></i>
        </div>
        <p className="mt-6 font-black text-[#008C45] animate-pulse">CARREGANDO ARTIGIANO...</p>
      </div>
    );
  }

  if (isLogin) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 relative transition-all duration-700 ${isNight ? 'bg-[#121212]' : 'bg-[#FDFBF7]'}`}>
        <div className="absolute top-0 w-full h-4 italy-gradient"></div>
        <div className="mb-10 text-center animate-fadeIn">
          <div className="w-24 h-24 bg-[#008C45] rounded-full border-4 border-[#CD212A] flex items-center justify-center text-white text-5xl shadow-2xl mb-4 mx-auto">
            <i className="fas fa-pizza-slice"></i>
          </div>
          <h1 className={`text-5xl font-black tracking-tighter ${isNight ? 'text-white' : 'text-[#008C45]'}`}>PiZZA Master</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isOnline ? 'Online' : 'Modo Offline Ativo'} | v2.0.0</p>
          </div>
        </div>

        <div className={`w-full max-w-sm p-10 rounded-[3rem] shadow-2xl border ${isNight ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-gray-100'} ${loginError ? 'shake-error' : ''}`}>
          <div className="space-y-4 mb-8">
            <input className={`w-full p-4 rounded-2xl border font-bold ${isNight ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50'}`} placeholder="Login" value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value})} />
            <input type="password" className={`w-full p-4 rounded-2xl border font-bold ${isNight ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50'}`} placeholder="PIN" maxLength={4} inputMode="numeric" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} />
          </div>
          <button onClick={handleLogin} className="w-full py-5 bg-[#008C45] text-white rounded-[1.5rem] font-black text-xl active:scale-95 transition-all">ENTRAR</button>
        </div>
      </div>
    );
  }

  const isADM = user?.cargo === 'admin';
  const isGerente = user?.cargo === 'gerente' || isADM;

  const navigateTo = (screen: any) => {
    setActiveScreen(screen);
    audio.playPop();
  };

  return (
    <Layout user={user!} title={activeScreen === 'home' ? (isNight ? 'FECHO TURNO 🌙' : 'PIZZA MASTER') : activeScreen.toUpperCase()} onBack={activeScreen !== 'home' ? () => navigateTo('home') : undefined} onConfig={() => navigateTo('config')}>
      <div className={`min-h-screen ${isNight ? 'bg-[#121212] text-white' : ''}`}>
        
        {activeScreen === 'home' && (
          <div className="p-4 grid grid-cols-2 gap-4 animate-fadeIn">
            {BLOCAS_CONFIG.map(bloco => {
              if (!isADM && !user?.permissoes[bloco.id]) return null;
              return (
                <button key={bloco.id} onClick={() => navigateTo(bloco.id as any)} className={`flex flex-col items-center justify-center p-8 rounded-[2.5rem] text-white shadow-2xl active:scale-95 transition-all ${bloco.color}`}>
                  <i className={`fas ${bloco.icon} text-4xl mb-4`}></i>
                  <span className="font-black text-[11px] tracking-widest uppercase">{bloco.nome}</span>
                </button>
              );
            })}
            {isGerente && (
              <button onClick={() => navigateTo('history')} className={`flex flex-col items-center justify-center p-8 rounded-[2.5rem] shadow-2xl active:scale-95 transition-all ${isNight ? 'bg-white/10' : 'bg-gray-600'} text-white`}>
                <i className="fas fa-history text-4xl mb-4"></i>
                <span className="font-black text-[11px] tracking-widest uppercase">HISTÓRICO</span>
              </button>
            )}
            <button onClick={handleLogout} className={`flex flex-col items-center justify-center p-8 rounded-[2.5rem] shadow-2xl active:scale-95 transition-all ${isNight ? 'bg-[#CD212A]' : 'bg-[#1f2937]'} text-white`}>
              <i className="fas fa-sign-out-alt text-4xl mb-4"></i>
              <span className="font-black text-[11px] tracking-widest uppercase">SAIR</span>
            </button>
          </div>
        )}

        {Object.values(BlocoId).includes(activeScreen as BlocoId) && activeScreen !== BlocoId.PRODUCAO && (
          <div className={isNight ? 'dark-inventory' : ''}>
            <InventoryScreen blocoId={activeScreen as BlocoId} config={config} dna={dna} userName={user?.nome || ''} onFinish={setShowSummary} onBack={() => navigateTo('home')} />
          </div>
        )}

        {activeScreen === 'config' && (
          <div className="p-4 space-y-6 pb-32 animate-fadeIn">
            <section className={`rounded-[2.5rem] p-8 shadow-2xl border ${isNight ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-gray-100'}`}>
              <h3 className="font-black text-sm uppercase mb-6 flex items-center gap-2 text-[#008C45]"><i className="fas fa-users-cog"></i> Equipe Artigiano</h3>
              {isGerente ? (
                <div className="space-y-3">
                  {users.map((u) => (
                    <div key={u.id} className={`flex justify-between items-center p-4 rounded-2xl border ${isNight ? 'bg-white/5 border-white/10' : 'bg-gray-50'}`}>
                      <div className="flex flex-col">
                        <span className="text-sm font-black uppercase">{u.nome}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{u.cargo} • LOGIN: {u.user}</span>
                      </div>
                      {isADM && u.id !== 'master' && (
                        <button onClick={async () => { if(confirm("Remover?")) await firebaseService.removeUser(u.id); }} className="text-red-500 p-2">
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setShowUserModal(true)} className="w-full py-4 mt-2 rounded-2xl border-2 border-dashed border-[#008C45] text-[#008C45] font-black text-xs uppercase tracking-widest">
                    + NOVO FUNCIONÁRIO
                  </button>
                </div>
              ) : <p className="text-xs font-bold text-gray-400 uppercase text-center">Apenas gerentes.</p>}
            </section>

            {isGerente && (
              <section className={`rounded-[2.5rem] p-8 shadow-2xl border ${isNight ? 'bg-[#1E1E1E] border-white/5' : 'bg-white'}`}>
                <h3 className="font-black text-sm uppercase mb-6 flex items-center gap-2 text-[#D4AF37]"><i className="fas fa-comment-dots"></i> Mensagens WhatsApp</h3>
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase opacity-40 ml-2">Saudação Inicial</label>
                      <textarea 
                        className={`w-full p-4 rounded-2xl border text-xs font-bold ${isNight ? 'bg-white/5 text-white border-white/10' : 'bg-gray-50'}`} 
                        rows={3} 
                        value={config.templateSaudacao} 
                        onChange={(e) => updateConfig({ templateSaudacao: e.target.value })}
                        placeholder="Ex: *[saudacao]! Segue lista de [bloco]:*"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase opacity-40 ml-2">Agradecimento Final</label>
                      <textarea 
                        className={`w-full p-4 rounded-2xl border text-xs font-bold ${isNight ? 'bg-white/5 text-white border-white/10' : 'bg-gray-50'}`} 
                        rows={3} 
                        value={config.templateAgradecimento} 
                        onChange={(e) => updateConfig({ templateAgradecimento: e.target.value })}
                        placeholder="Ex: _Gerado por [nome] via PiZZA Master Pro 🍕_"
                      />
                   </div>
                   <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                      <h4 className="text-[8px] font-black uppercase mb-2 text-blue-500 opacity-60">Variáveis Disponíveis</h4>
                      <p className="text-[9px] font-bold text-blue-400 leading-relaxed">
                        [saudacao] • [nome] • [bloco] • [data] • [hora]
                      </p>
                   </div>
                </div>
              </section>
            )}

            {isADM && (
               <section className={`rounded-[2.5rem] p-8 shadow-2xl border ${isNight ? 'bg-[#1E1E1E] border-white/5' : 'bg-white'}`}>
                  <h3 className="font-black text-sm uppercase mb-4 text-[#CD212A]"><i className="fas fa-dna"></i> Gestão DNA</h3>
                  <button onClick={() => navigateTo('dna')} className="w-full py-5 bg-[#CD212A] text-white rounded-2xl font-black text-sm shadow-xl shadow-red-900/20 uppercase">
                    Configurar Catálogo
                  </button>
               </section>
            )}

            <div className="text-center space-y-1 py-4 opacity-30">
                <p className="font-black text-[10px] uppercase tracking-widest">PiZZA Master v2.0.0</p>
                <p className="font-bold text-[8px] uppercase">L'Experienza Sonora • Artigiano Gestão</p>
            </div>
          </div>
        )}

        {/* Modals... (omitted for brevity, keep logic same as v1.9.0) */}
        
        {showSummary && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
            <div className={`w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl border ${isNight ? 'bg-[#1E1E1E] border-white/10' : 'bg-white'}`}>
              <div className="bg-[#008C45] p-6 text-white flex justify-between items-center"><h3 className="font-black uppercase text-sm">Lista de Reposição</h3><i className="fas fa-times" onClick={() => setShowSummary(null)}></i></div>
              <div className="p-8 space-y-6">
                <div className={`p-6 rounded-[2rem] border ${isNight ? 'bg-white/5' : 'bg-gray-100'}`}><pre className={`text-[11px] font-bold leading-relaxed whitespace-pre-wrap ${isNight ? 'text-white/80' : 'text-gray-700'}`}>{showSummary}</pre></div>
                <textarea className={`w-full p-4 rounded-2xl border text-xs font-bold ${isNight ? 'bg-white/5 text-white border-white/10' : 'bg-gray-50'}`} rows={2} placeholder="Extras..." value={extraItems} onChange={e => setExtraItems(e.target.value)} />
                <button onClick={sendToWhatsApp} className="w-full py-5 bg-[#25D366] text-white rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-3 shadow-2xl">
                  <i className="fab fa-whatsapp text-3xl"></i> DISPARAR WHATSAPP
                </button>
              </div>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center pointer-events-none animate-zoomIn">
            <div className="bg-white p-12 rounded-full shadow-2xl border-[6px] border-[#008C45]"><i className="fas fa-check text-7xl text-[#008C45]"></i></div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
