
import React, { useState, useEffect, useMemo } from 'react';
import { User, Insumo, Config, HistoryRecord, BlocoId, CalcType, UserCargo } from './types';
import { storageService } from './services/storageService';
import { firebaseService } from './services/firebaseService';
import { MASTER_USER, BLOCAS_CONFIG, PERMISSION_PRESETS } from './constants';
import Layout from './components/Layout';
import InventoryScreen from './components/InventoryScreen';
import ProductionScreen from './components/ProductionScreen';
import HistoryScreen from './components/HistoryScreen';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  // Inicialização híbrida (Cache -> Firebase)
  const [user, setUser] = useState<User | null>(() => storageService.getSession());
  const [isLogin, setIsLogin] = useState(!user);
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [loginError, setLoginError] = useState(false);
  
  const [activeScreen, setActiveScreen] = useState<BlocoId | 'home' | 'config' | 'history' | 'dna'>('home');
  const [dna, setDna] = useState<Insumo[]>(() => storageService.getCachedDNA());
  const [config, setConfig] = useState<Config>(() => storageService.getCachedConfig() || { rota: [], destinos: {}, checklist: [], notices: '', isLocked: false });
  const [history, setHistory] = useState<HistoryRecord[]>(() => storageService.getCachedHistory());
  const [users, setUsers] = useState<User[]>(() => storageService.getCachedUsers());
  
  const [showSummary, setShowSummary] = useState<string | null>(null);
  const [extraItems, setExtraItems] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [showUserModal, setShowUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ nome: '', user: '', pass: '', cargo: 'atendente' as UserCargo });

  // 1. Monitorar Conexão
  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  // 2. Sincronização Automática Firebase
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
      setConfig(data);
      storageService.setCacheConfig(data);
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
      setUser(MASTER_USER); storageService.setSession(MASTER_USER); setIsLogin(false); return;
    }

    const found = users.find(x => x.user.toLowerCase() === uInput && x.pass === pInput);
    if (found) {
      setUser(found); storageService.setSession(found); setIsLogin(false);
    } else {
      setLoginError(true);
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
    setSuccessMsg(true); if (navigator.vibrate) navigator.vibrate(50);
    setTimeout(() => setSuccessMsg(false), 2000);
  };

  const handleAddUser = async () => {
    const { nome, user: uName, pass, cargo } = newUserForm;
    if (!nome || !uName || !pass) return alert("Preencha tudo!");
    
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
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isOnline ? 'Online' : 'Modo Offline Ativo'}</p>
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

  return (
    <Layout user={user!} title={activeScreen === 'home' ? (isNight ? 'FECHO TURNO 🌙' : 'PIZZA MASTER') : activeScreen.toUpperCase()} onBack={activeScreen !== 'home' ? () => setActiveScreen('home') : undefined} onConfig={() => setActiveScreen('config')}>
      <div className={`min-h-screen ${isNight ? 'bg-[#121212] text-white' : ''}`}>
        
        {activeScreen === 'home' && (
          <div className="p-4 grid grid-cols-2 gap-4 animate-fadeIn">
            {BLOCAS_CONFIG.map(bloco => {
              if (!isADM && !user?.permissoes[bloco.id]) return null;
              return (
                <button key={bloco.id} onClick={() => setActiveScreen(bloco.id as any)} className={`flex flex-col items-center justify-center p-8 rounded-[2.5rem] text-white shadow-2xl active:scale-95 transition-all ${bloco.color}`}>
                  <i className={`fas ${bloco.icon} text-4xl mb-4`}></i>
                  <span className="font-black text-[11px] tracking-widest uppercase">{bloco.nome}</span>
                </button>
              );
            })}
            {isGerente && (
              <button onClick={() => setActiveScreen('history')} className={`flex flex-col items-center justify-center p-8 rounded-[2.5rem] shadow-2xl active:scale-95 transition-all ${isNight ? 'bg-white/10' : 'bg-gray-600'} text-white`}>
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
            <InventoryScreen blocoId={activeScreen as BlocoId} config={config} dna={dna} onFinish={setShowSummary} onBack={() => setActiveScreen('home')} />
          </div>
        )}

        {activeScreen === 'config' && (
          <div className="p-4 space-y-6 pb-32 animate-fadeIn">
            <section className={`rounded-[2.5rem] p-8 shadow-2xl border ${isNight ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-gray-100'}`}>
              <h3 className="font-black text-sm uppercase mb-6 flex items-center gap-2 text-[#008C45]"><i className="fas fa-users-cog"></i> Equipe</h3>
              {isGerente ? (
                <div className="space-y-3">
                  {users.map((u) => (
                    <div key={u.id} className={`flex justify-between items-center p-4 rounded-2xl border ${isNight ? 'bg-white/5 border-white/10' : 'bg-gray-50'}`}>
                      <div className="flex flex-col">
                        <span className="text-sm font-black uppercase">{u.nome}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{u.cargo} • LOGIN: {u.user}</span>
                      </div>
                      {isADM && (
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

            {isADM && (
               <section className={`rounded-[2.5rem] p-8 shadow-2xl border ${isNight ? 'bg-[#1E1E1E] border-white/5' : 'bg-white'}`}>
                  <h3 className="font-black text-sm uppercase mb-4 text-[#CD212A]"><i className="fas fa-dna"></i> Gestão DNA</h3>
                  <button onClick={() => setActiveScreen('dna')} className="w-full py-5 bg-[#CD212A] text-white rounded-2xl font-black text-sm shadow-xl shadow-red-900/20 uppercase">
                    Configurar Catálogo
                  </button>
               </section>
            )}

            {isADM && (
               <button onClick={() => { if(confirm("ALERTA: Isso resetará o cache local. Continuar?")) storageService.fullReset(); }} className="w-full py-4 text-gray-400 font-black text-[10px] uppercase tracking-widest">
                  <i className="fas fa-sync-alt mr-2"></i> Forçar Reset de Cache
               </button>
            )}
          </div>
        )}

        {/* Modal Adicionar Usuário */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-6">
            <div className={`w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-zoomIn border ${isNight ? 'bg-[#1E1E1E] border-white/10' : 'bg-white'}`}>
              <h3 className="text-xl font-black uppercase mb-8 text-[#008C45]">Novo Perfil</h3>
              <div className="space-y-4 mb-8">
                <input className={`w-full p-4 rounded-2xl border font-bold text-sm ${isNight ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50'}`} placeholder="Nome" value={newUserForm.nome} onChange={e => setNewUserForm({...newUserForm, nome: e.target.value})} />
                <input className={`w-full p-4 rounded-2xl border font-bold text-sm ${isNight ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50'}`} placeholder="Login" value={newUserForm.user} onChange={e => setNewUserForm({...newUserForm, user: e.target.value})} />
                <input className={`w-full p-4 rounded-2xl border font-bold text-sm ${isNight ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50'}`} placeholder="PIN (4 dig)" maxLength={4} inputMode="numeric" value={newUserForm.pass} onChange={e => setNewUserForm({...newUserForm, pass: e.target.value})} />
                <select className={`w-full p-4 rounded-2xl border font-bold text-sm ${isNight ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50'}`} value={newUserForm.cargo} onChange={e => setNewUserForm({...newUserForm, cargo: e.target.value as UserCargo})}>
                  <option value="atendente">Atendente</option>
                  <option value="pizzaiolo">Pizzaiolo</option>
                  <option value="gerente">Gerente</option>
                </select>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowUserModal(false)} className="flex-1 font-black text-xs text-gray-400">CANCELAR</button>
                <button onClick={handleAddUser} className="flex-1 py-4 bg-[#008C45] text-white rounded-2xl font-black text-sm">SALVAR</button>
              </div>
            </div>
          </div>
        )}

        {/* Resumo Final (WhatsApp) */}
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
