
import React, { useState, useEffect, useMemo } from 'react';
import { User, Insumo, Config, HistoryRecord, BlocoId, CalcType, UserCargo } from './types';
import { storageService } from './services/storageService';
import { MASTER_USER, BLOCAS_CONFIG, PERMISSION_PRESETS } from './constants';
import Layout from './components/Layout';
import InventoryScreen from './components/InventoryScreen';
import ProductionScreen from './components/ProductionScreen';
import HistoryScreen from './components/HistoryScreen';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(storageService.getSession());
  const [isLogin, setIsLogin] = useState(!user);
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [loginError, setLoginError] = useState(false);
  
  const [activeScreen, setActiveScreen] = useState<BlocoId | 'home' | 'config' | 'history' | 'dna'>('home');
  const [dna, setDna] = useState<Insumo[]>(storageService.getDNA());
  const [config, setConfig] = useState<Config>(storageService.getConfig());
  const [history, setHistory] = useState<HistoryRecord[]>(storageService.getHistory());
  const [users, setUsers] = useState<User[]>(storageService.getUsers());
  
  const [showSummary, setShowSummary] = useState<string | null>(null);
  const [extraItems, setExtraItems] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<string | null>(null);

  // Modal para adicionar funcionário
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ nome: '', user: '', pass: '', cargo: 'atendente' as UserCargo });

  // Night Mode automático
  const isNight = useMemo(() => {
    const hour = new Date().getHours();
    return hour >= 19 || hour < 6;
  }, []);

  useEffect(() => {
    document.body.style.backgroundColor = isNight ? '#121212' : '#FDFBF7';
  }, [isNight]);

  // Persistência
  useEffect(() => { storageService.saveDNA(dna); }, [dna]);
  useEffect(() => { storageService.saveConfig(config); }, [config]);
  useEffect(() => { storageService.saveUsers(users); }, [users]);

  // IA de Previsão
  const fetchPrediction = async () => {
    setIsPredicting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const histSummary = history.slice(0, 15).map(h => h.itens).join('\n');
      const dnaNames = dna.map(i => i.nome).join(', ');
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analise o histórico de pedidos e sugira 3 prioridades de compra. Insumos DNA: ${dnaNames}. Histórico:\n${histSummary}. Responda em PT-BR.`,
      });
      setPrediction(response.text || 'Sem sugestões.');
    } catch (err) { setPrediction('Erro de IA.'); } finally { setIsPredicting(false); }
  };

  // Auth Handlers
  const handleLogin = () => {
    if (config.isLocked && loginForm.pass !== MASTER_USER.pass) {
      alert("BLOQUEIO DE EMERGÊNCIA ATIVO."); return;
    }
    setLoginError(false);
    const u = loginForm.user.trim().toLowerCase();
    const p = loginForm.pass.trim();

    // Login ADM (Gabriel)
    if (u === MASTER_USER.user && p === MASTER_USER.pass) {
      setUser(MASTER_USER); storageService.setSession(MASTER_USER); setIsLogin(false); return;
    }

    // Login Funcionário
    const found = users.find(x => x.user.toLowerCase() === u && x.pass === p);
    if (found) {
      setUser(found); storageService.setSession(found); setIsLogin(false);
    } else {
      setLoginError(true);
      if (navigator.vibrate) navigator.vibrate(200);
      setTimeout(() => setLoginError(false), 500);
    }
  };

  const handleLogout = () => {
    if (confirm("Deseja sair da sessão?")) {
      storageService.setSession(null); setUser(null); setIsLogin(true); setActiveScreen('home');
    }
  };

  const triggerSuccess = () => {
    setSuccessMsg(true); if (navigator.vibrate) navigator.vibrate(50);
    setTimeout(() => setSuccessMsg(false), 2000);
  };

  const handleAddUser = () => {
    const { nome, user: uName, pass, cargo } = newUserForm;
    if (!nome || !uName || !pass) {
      alert("Preencha todos os campos!");
      return;
    }
    const permissions = PERMISSION_PRESETS[cargo] || PERMISSION_PRESETS.atendente;
    const newUserObj: User = {
      id: Date.now().toString(),
      nome, user: uName, pass, cargo,
      permissoes: permissions
    };
    setUsers([...users, newUserObj]);
    setNewUserForm({ nome: '', user: '', pass: '', cargo: 'atendente' });
    setShowUserModal(false);
    triggerSuccess();
  };

  const sendToWhatsApp = () => {
    if (!showSummary) return;
    const bloco = activeScreen as BlocoId;
    const destino = config.destinos[bloco] || '';
    
    navigator.geolocation.getCurrentPosition((pos) => {
      const locStr = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
      let text = showSummary + (extraItems.trim() ? `\n*EXTRAS:*\n${extraItems}` : '') + `\n_Local: @Artigiano (${locStr})_`;
      window.open(`https://api.whatsapp.com/send?phone=${destino}&text=${encodeURIComponent(text)}`, '_blank');
      storageService.addHistory({ data: new Date().toLocaleString(), usuario: user?.nome || '?', itens: text, localizacao: locStr });
      setHistory(storageService.getHistory());
      setShowSummary(null); setExtraItems(''); setActiveScreen('home'); triggerSuccess();
    }, () => {
      let text = showSummary + (extraItems.trim() ? `\n*EXTRAS:*\n${extraItems}` : '');
      window.open(`https://api.whatsapp.com/send?phone=${destino}&text=${encodeURIComponent(text)}`, '_blank');
      storageService.addHistory({ data: new Date().toLocaleString(), usuario: user?.nome || '?', itens: text });
      setHistory(storageService.getHistory());
      setShowSummary(null); setExtraItems(''); setActiveScreen('home'); triggerSuccess();
    });
  };

  if (isLogin) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 relative transition-colors duration-700 ${isNight ? 'bg-[#121212]' : 'bg-[#FDFBF7]'}`}>
        <div className="absolute top-0 w-full h-4 italy-gradient"></div>
        <div className="mb-8 text-center animate-fadeIn">
          <div className="w-24 h-24 bg-[#008C45] rounded-full border-4 border-[#CD212A] flex items-center justify-center text-white text-5xl shadow-2xl mb-4 mx-auto">
            <i className="fas fa-pizza-slice"></i>
          </div>
          <h1 className={`text-4xl font-black tracking-tighter ${isNight ? 'text-white' : 'text-[#008C45]'}`}>PiZZA Master</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">v1.8.0 Premium Control</p>
        </div>
        {config.notices && (
          <div className={`w-full max-w-sm mb-6 p-5 rounded-3xl border-l-8 animate-slideUp ${isNight ? 'bg-[#1E1E1E] border-[#D4AF37] text-white/80' : 'bg-amber-50 border-amber-400 text-amber-900'}`}>
            <h4 className="text-[10px] font-black uppercase mb-1 flex items-center gap-2 text-[#D4AF37]">
              <i className="fas fa-bullhorn"></i> Quadro de Avisos
            </h4>
            <p className="text-xs font-bold leading-relaxed">{config.notices}</p>
          </div>
        )}
        <div className={`w-full max-w-sm p-10 rounded-[2.5rem] shadow-2xl border transition-all ${isNight ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-gray-100'} ${loginError ? 'shake-error' : ''}`}>
          <div className="space-y-4 mb-8">
            <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${isNight ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
              <i className="fas fa-user opacity-30"></i>
              <input className="bg-transparent outline-none flex-1 font-bold" placeholder="Usuário" value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value})} />
            </div>
            <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${isNight ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
              <i className="fas fa-key opacity-30"></i>
              <input type="password" className="bg-transparent outline-none flex-1 font-bold" placeholder="PIN" maxLength={4} inputMode="numeric" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} />
            </div>
          </div>
          <button onClick={handleLogin} className="w-full py-5 bg-[#008C45] text-white rounded-2xl font-black text-xl shadow-lg shadow-green-900/40 active:scale-95 transition-all">
            ENTRAR NO TURNO
          </button>
        </div>
      </div>
    );
  }

  const isADM = user?.cargo === 'admin';
  const isGerente = user?.cargo === 'gerente' || isADM;

  return (
    <Layout user={user!} title={activeScreen === 'home' ? (isNight ? 'FECHO DE TURNO 🌙' : 'PIZZA MASTER') : activeScreen.toUpperCase()} onBack={activeScreen !== 'home' ? () => setActiveScreen('home') : undefined} onConfig={() => setActiveScreen('config')}>
      <div className={`min-h-screen ${isNight ? 'bg-[#121212] text-white' : ''}`}>
        
        {activeScreen === 'home' && (
          <div className="p-4 grid grid-cols-2 gap-4 animate-fadeIn">
            {BLOCAS_CONFIG.map(bloco => {
              const hasPerm = isADM || user?.permissoes[bloco.id];
              if (!hasPerm) return null;
              return (
                <button key={bloco.id} onClick={() => setActiveScreen(bloco.id as any)} className={`flex flex-col items-center justify-center p-8 rounded-[2rem] text-white shadow-xl active:scale-95 transition-all ${bloco.color}`}>
                  <i className={`fas ${bloco.icon} text-4xl mb-4`}></i>
                  <span className="font-black text-[11px] tracking-widest uppercase">{bloco.nome}</span>
                </button>
              );
            })}
            {isGerente && (
              <button onClick={() => setActiveScreen('history')} className={`flex flex-col items-center justify-center p-8 rounded-[2rem] shadow-xl active:scale-95 transition-all ${isNight ? 'bg-white/10' : 'bg-gray-600'} text-white`}>
                <i className="fas fa-history text-4xl mb-4"></i>
                <span className="font-black text-[11px] tracking-widest uppercase">HISTÓRICO</span>
              </button>
            )}
            <button onClick={handleLogout} className={`flex flex-col items-center justify-center p-8 rounded-[2rem] shadow-xl active:scale-95 transition-all ${isNight ? 'bg-[#CD212A]' : 'bg-[#1f2937]'} text-white`}>
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

        {activeScreen === BlocoId.PRODUCAO && (
          <ProductionScreen isNight={isNight} onFinish={(qtd, text) => {
            storageService.addHistory({ data: new Date().toLocaleString(), usuario: user?.nome || '?', itens: text });
            setHistory(storageService.getHistory()); triggerSuccess(); setActiveScreen('home');
          }} />
        )}

        {activeScreen === 'history' && isGerente && (
          <HistoryScreen history={history} users={[MASTER_USER, ...users]} isNight={isNight} onClear={() => { if(confirm("Limpar?")) { localStorage.removeItem('pm_historico'); setHistory([]); }}} />
        )}

        {activeScreen === 'config' && (
          <div className="p-4 space-y-6 pb-32 animate-fadeIn">
            <section className={`rounded-3xl p-6 shadow-xl border ${isNight ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-gray-100'}`}>
              <h3 className="font-black text-sm uppercase mb-6 flex items-center gap-2"><i className="fas fa-users-cog text-[#008C45]"></i> Equipe Artigiano</h3>
              {isGerente ? (
                <div className="space-y-3">
                  {users.map((u, i) => (
                    <div key={i} className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${isNight ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex flex-col">
                        <span className="text-sm font-black uppercase">{u.nome}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{u.cargo} • PIN: {u.pass}</span>
                      </div>
                      {isADM && (
                        <button onClick={() => { if(confirm("Remover funcionário?")) setUsers(users.filter((_, idx) => idx !== i)); }} className="text-red-500 w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-500/10">
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setShowUserModal(true)} className="w-full py-4 mt-4 rounded-2xl border-2 border-dashed border-[#008C45] text-[#008C45] font-black text-xs hover:bg-[#008C45]/5 transition-all uppercase tracking-widest">
                    + ADICIONAR FUNCIONÁRIO
                  </button>
                </div>
              ) : <p className="text-xs font-bold text-gray-400 uppercase text-center p-4">Acesso exclusivo à gerência.</p>}
            </section>

            {isADM && (
               <section className={`rounded-3xl p-6 shadow-xl border ${isNight ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-gray-100'}`}>
                  <h3 className="font-black text-sm uppercase mb-4 text-[#CD212A]"><i className="fas fa-dna"></i> Gestão Estratégica (DNA)</h3>
                  <p className="text-[10px] font-bold text-gray-400 mb-6 uppercase">Controle de metas globais e fatores de conversão.</p>
                  <button onClick={() => setActiveScreen('dna')} className="w-full py-5 bg-[#CD212A] text-white rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg shadow-red-900/20">
                    EDITAR METAS E INSUMOS
                  </button>
               </section>
            )}

            {isGerente && (
              <section className={`rounded-3xl p-6 shadow-xl border ${isNight ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-gray-100'}`}>
                <h3 className="font-black text-sm uppercase mb-4"><i className="fas fa-route"></i> Logística de Loja (Rota)</h3>
                <div className="space-y-2 mb-6">
                  {config.rota.map((r, i) => (
                    <div key={i} className={`flex justify-between items-center p-3 rounded-xl text-xs font-bold border-b border-gray-50 ${isNight ? 'bg-white/5' : 'bg-gray-50'}`}>
                      {r} <i className="fas fa-times-circle text-red-500 cursor-pointer" onClick={() => setConfig({...config, rota: config.rota.filter((_, idx) => idx !== i)})}></i>
                    </div>
                  ))}
                </div>
                <button onClick={() => {const l = prompt("Novo Local da Rota:"); if(l) setConfig({...config, rota: [...config.rota, l]});}} className="w-full py-3 border border-dashed rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest">+ NOVO LOCAL NA ROTA</button>
              </section>
            )}

            {isADM && (
               <section className={`rounded-3xl p-6 border transition-all ${config.isLocked ? 'border-green-500 bg-green-500/5' : 'border-red-500 bg-red-500/10'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <i className={`fas fa-shield-alt text-2xl ${config.isLocked ? 'text-green-500' : 'text-red-500'}`}></i>
                    <h3 className={`font-black text-sm uppercase ${config.isLocked ? 'text-green-500' : 'text-red-500'}`}>Blindagem do Sistema</h3>
                  </div>
                  <button onClick={() => setConfig({...config, isLocked: !config.isLocked})} className={`w-full py-5 rounded-2xl text-white font-black text-sm transition-all shadow-xl ${config.isLocked ? 'bg-green-500' : 'bg-red-500'}`}>
                    {config.isLocked ? 'DESBLOQUEAR ACESSO GERAL' : 'BLOQUEIO DE EMERGÊNCIA (MASTER)'}
                  </button>
               </section>
            )}
          </div>
        )}

        {/* MODAL DNA (ADM ONLY) */}
        {activeScreen === 'dna' && isADM && (
          <div className="p-4 space-y-4 animate-fadeIn pb-32">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setActiveScreen('config')} className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center"><i className="fas fa-chevron-left"></i></button>
              <h3 className="font-black text-xl uppercase text-[#CD212A]">Painel de Insumos</h3>
            </div>
            {dna.map((item, i) => (
              <div key={item.id} className={`p-6 rounded-[2rem] border shadow-md ${isNight ? 'bg-[#1E1E1E] border-white/5' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-4">
                   <h4 className="font-black text-base">{item.nome}</h4>
                   <button onClick={() => setDna(dna.filter((_, idx) => idx !== i))} className="text-red-500"><i className="fas fa-trash-alt"></i></button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[10px] font-black uppercase opacity-60">
                  <div className="space-y-1">
                    META ({item.un_contagem}):
                    <input className={`w-full p-3 rounded-xl font-black text-sm ${isNight ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'} border`} type="number" value={item.meta} onChange={e => {
                      const d = [...dna]; d[i].meta = parseInt(e.target.value) || 0; setDna(d);
                    }} />
                  </div>
                  <div className="space-y-1">
                    FATOR CONVERSÃO:
                    <input className={`w-full p-3 rounded-xl font-black text-sm ${isNight ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'} border`} type="number" value={item.fator} onChange={e => {
                      const d = [...dna]; d[i].fator = parseInt(e.target.value) || 1; setDna(d);
                    }} />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={() => {
              const name = prompt("Nome do Insumo:"); if(!name) return;
              setDna([...dna, { id: Date.now().toString(), nome: name, bloco: BlocoId.INSUMOS, un_contagem: 'un', meta: 10, tipo_calculo: CalcType.CAIXA, fator: 1, locais: [config.rota[0]] }]);
            }} className="w-full py-5 bg-[#008C45] text-white rounded-[2rem] font-black shadow-xl shadow-green-900/30">+ ADICIONAR AO DNA</button>
          </div>
        )}

        {/* MODAL USUÁRIO */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-6">
            <div className={`w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl overflow-hidden animate-zoomIn border ${isNight ? 'bg-[#1E1E1E] border-white/10' : 'bg-white'}`}>
              <h3 className="text-xl font-black uppercase mb-8 flex items-center gap-3">
                <i className="fas fa-user-plus text-[#008C45]"></i> Novo Colaborador
              </h3>
              <div className="space-y-4 mb-8">
                <input className={`w-full p-4 rounded-2xl border font-bold text-sm ${isNight ? 'bg-white/5 border-white/10' : 'bg-gray-50'}`} placeholder="Nome Completo" value={newUserForm.nome} onChange={e => setNewUserForm({...newUserForm, nome: e.target.value})} />
                <input className={`w-full p-4 rounded-2xl border font-bold text-sm ${isNight ? 'bg-white/5 border-white/10' : 'bg-gray-50'}`} placeholder="Login do Sistema" value={newUserForm.user} onChange={e => setNewUserForm({...newUserForm, user: e.target.value})} />
                <input className={`w-full p-4 rounded-2xl border font-bold text-sm ${isNight ? 'bg-white/5 border-white/10' : 'bg-gray-50'}`} placeholder="PIN (4 dígitos)" maxLength={4} inputMode="numeric" value={newUserForm.pass} onChange={e => setNewUserForm({...newUserForm, pass: e.target.value})} />
                <select className={`w-full p-4 rounded-2xl border font-bold text-sm ${isNight ? 'bg-white/5 border-white/10' : 'bg-gray-50'}`} value={newUserForm.cargo} onChange={e => setNewUserForm({...newUserForm, cargo: e.target.value as UserCargo})}>
                  <option value="atendente">Atendente</option>
                  <option value="pizzaiolo">Pizzaiolo</option>
                  <option value="gerente">Gerente</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowUserModal(false)} className="flex-1 py-4 font-black uppercase text-xs text-gray-400">CANCELAR</button>
                <button onClick={handleAddUser} className="flex-1 py-4 bg-[#008C45] text-white rounded-2xl font-black text-sm shadow-lg shadow-green-900/20">SALVAR</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL RESUMO */}
        {showSummary && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
            <div className={`w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl border transition-all ${isNight ? 'bg-[#1E1E1E] border-white/10' : 'bg-white'}`}>
              <div className="bg-[#008C45] p-6 text-white flex justify-between items-center">
                <h3 className="font-black uppercase tracking-widest text-sm">Resumo da Contagem</h3>
                <i className="fas fa-times cursor-pointer" onClick={() => setShowSummary(null)}></i>
              </div>
              <div className="p-8 space-y-5">
                <div className={`p-5 rounded-[1.5rem] border ${isNight ? 'bg-white/5 border-white/5' : 'bg-gray-100'}`}>
                  <pre className={`text-[11px] font-bold leading-relaxed whitespace-pre-wrap ${isNight ? 'text-white/80' : 'text-gray-700'}`}>{showSummary}</pre>
                </div>
                {isGerente && (
                  <div className="p-4 bg-[#D4AF37]/10 rounded-2xl border border-[#D4AF37]/20 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#D4AF37]"></div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black uppercase text-[#D4AF37] flex items-center gap-2">
                        <i className="fas fa-brain"></i> Sugestão IA Gemini
                      </span>
                      <button onClick={fetchPrediction} disabled={isPredicting} className="text-[10px] font-black underline text-[#D4AF37] hover:opacity-70">
                        {isPredicting ? 'PENSANDO...' : 'ANALISAR HISTÓRICO'}
                      </button>
                    </div>
                    {prediction && <p className="text-[10px] font-bold italic text-[#D4AF37] leading-relaxed animate-fadeIn">{prediction}</p>}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase opacity-40 ml-2">Extras / Itens Faltantes</label>
                  <textarea className={`w-full p-4 rounded-2xl border text-xs font-bold transition-all ${isNight ? 'bg-white/5 border-white/10 text-white focus:border-[#008C45]' : 'bg-gray-50 focus:border-[#008C45]'}`} rows={2} placeholder="Ex: papel toalha, detergente..." value={extraItems} onChange={e => setExtraItems(e.target.value)} />
                </div>
                <button onClick={sendToWhatsApp} className="w-full py-5 bg-[#25D366] text-white rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-green-900/30 active:scale-95 transition-all">
                  <i className="fab fa-whatsapp text-2xl"></i> DISPARAR WHATSAPP
                </button>
              </div>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center pointer-events-none">
            <div className="bg-white p-10 rounded-full shadow-2xl animate-zoomIn border-4 border-[#008C45]">
              <i className="fas fa-check text-6xl text-[#008C45]"></i>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
