
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
        contents: `Analise o histórico e sugira 3 itens prioritários para comprar. Insumos DNA: ${dnaNames}. Histórico:\n${histSummary}`,
      });
      setPrediction(response.text || 'Sem sugestões.');
    } catch (err) { setPrediction('Erro de IA.'); } finally { setIsPredicting(false); }
  };

  // Login e Sessão
  const handleLogin = () => {
    if (config.isLocked && loginForm.pass !== MASTER_USER.pass) {
      alert("SISTEMA BLOQUEADO."); return;
    }
    setLoginError(false);
    const u = loginForm.user.trim().toLowerCase();
    const p = loginForm.pass.trim();

    if (u === MASTER_USER.user && p === MASTER_USER.pass) {
      setUser(MASTER_USER); storageService.setSession(MASTER_USER); setIsLogin(false); return;
    }

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
    if (confirm("Sair do sistema?")) {
      storageService.setSession(null); setUser(null); setIsLogin(true);
    }
  };

  const triggerSuccess = () => {
    setSuccessMsg(true); if (navigator.vibrate) navigator.vibrate(50);
    setTimeout(() => setSuccessMsg(false), 2000);
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
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 relative transition-colors ${isNight ? 'bg-[#121212]' : 'bg-[#FDFBF7]'}`}>
        <div className="absolute top-0 w-full h-4 italy-gradient"></div>
        <div className="mb-6 text-center animate-fadeIn">
          <div className="w-24 h-24 bg-[#008C45] rounded-full border-4 border-[#CD212A] flex items-center justify-center text-white text-5xl shadow-2xl mb-4 mx-auto">
            <i className="fas fa-pizza-slice"></i>
          </div>
          <h1 className={`text-4xl font-black tracking-tighter ${isNight ? 'text-white' : 'text-[#008C45]'}`}>PiZZA Master</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">v1.8.0 Premium</p>
        </div>
        {config.notices && (
          <div className={`w-full max-w-sm mb-6 p-4 rounded-2xl border-l-4 ${isNight ? 'bg-[#1E1E1E] border-[#D4AF37] text-white/80' : 'bg-amber-50 border-amber-400 text-amber-900'}`}>
            <h4 className="text-[10px] font-black uppercase mb-1"><i className="fas fa-bullhorn text-[#D4AF37]"></i> Quadro de Avisos</h4>
            <p className="text-xs font-semibold leading-relaxed">{config.notices}</p>
          </div>
        )}
        <div className={`w-full max-w-sm p-8 rounded-3xl shadow-xl border ${isNight ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-gray-100'} ${loginError ? 'shake-error' : ''}`}>
          <div className="space-y-3 mb-6">
            <input className={`w-full p-4 rounded-2xl border font-bold ${isNight ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100'}`} placeholder="Login" value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value})} />
            <input type="password" className={`w-full p-4 rounded-2xl border font-bold ${isNight ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100'}`} placeholder="PIN" maxLength={4} inputMode="numeric" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} />
          </div>
          <button onClick={handleLogin} className="w-full py-4 bg-[#008C45] text-white rounded-2xl font-black text-lg active:scale-95 transition-all">ENTRAR</button>
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
          <div className="p-4 grid grid-cols-2 gap-3 animate-fadeIn">
            {BLOCAS_CONFIG.map(bloco => {
              const hasPerm = isADM || user?.permissoes[bloco.id];
              if (!hasPerm) return null;
              return (
                <button key={bloco.id} onClick={() => setActiveScreen(bloco.id as any)} className={`flex flex-col items-center justify-center p-6 rounded-3xl text-white shadow-lg active:scale-95 transition-all ${bloco.color}`}>
                  <i className={`fas ${bloco.icon} text-3xl mb-3`}></i>
                  <span className="font-black text-[10px] tracking-widest">{bloco.nome}</span>
                </button>
              );
            })}
            {isGerente && (
              <button onClick={() => setActiveScreen('history')} className={`flex flex-col items-center justify-center p-6 rounded-3xl shadow-lg active:scale-95 transition-all ${isNight ? 'bg-white/10' : 'bg-gray-600'} text-white`}>
                <i className="fas fa-history text-3xl mb-3"></i>
                <span className="font-black text-[10px] tracking-widest">HISTÓRICO</span>
              </button>
            )}
            <button onClick={handleLogout} className={`flex flex-col items-center justify-center p-6 rounded-3xl shadow-lg active:scale-95 transition-all ${isNight ? 'bg-[#CD212A]' : 'bg-[#1f2937]'} text-white`}>
              <i className="fas fa-sign-out-alt text-3xl mb-3"></i>
              <span className="font-black text-[10px] tracking-widest">SAIR</span>
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
          <HistoryScreen history={history} users={[MASTER_USER, ...users]} isNight={isNight} onClear={() => { if(confirm("Limpar?")) { localStorage.removeItem('pm_history'); setHistory([]); }}} />
        )}

        {activeScreen === 'dna' && isADM && (
          <div className="p-4 space-y-4 animate-fadeIn">
            <h3 className="font-black text-lg uppercase mb-4 text-[#CD212A]">Painel DNA</h3>
            {dna.map((item, i) => (
              <div key={item.id} className={`p-4 rounded-2xl border ${isNight ? 'bg-[#1E1E1E] border-white/5' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-2">
                   <h4 className="font-black text-sm">{item.nome}</h4>
                   <button onClick={() => setDna(dna.filter((_, idx) => idx !== i))} className="text-red-500"><i className="fas fa-trash-alt"></i></button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[10px] font-bold">
                  <div>META: <input className="w-full bg-gray-50 rounded p-1" type="number" value={item.meta} onChange={e => {
                    const d = [...dna]; d[i].meta = parseInt(e.target.value); setDna(d);
                  }} /></div>
                  <div>FATOR: <input className="w-full bg-gray-50 rounded p-1" type="number" value={item.fator} onChange={e => {
                    const d = [...dna]; d[i].fator = parseInt(e.target.value); setDna(d);
                  }} /></div>
                </div>
              </div>
            ))}
            <button onClick={() => {
              const name = prompt("Nome:"); if(!name) return;
              setDna([...dna, { id: Date.now().toString(), nome: name, bloco: BlocoId.INSUMOS, un_contagem: 'un', meta: 10, tipo_calculo: CalcType.CAIXA, fator: 1, locais: [config.rota[0]] }]);
            }} className="w-full py-4 bg-[#008C45] text-white rounded-2xl font-black">+ ADICIONAR ITEM</button>
          </div>
        )}

        {activeScreen === 'config' && (
          <div className="p-4 space-y-6 pb-32 animate-fadeIn">
            <section className={`rounded-2xl p-4 shadow-sm border ${isNight ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-gray-100'}`}>
              <h3 className="font-black text-sm uppercase mb-4 flex items-center gap-2"><i className="fas fa-users-cog text-[#008C45]"></i> Equipe</h3>
              {isGerente ? (
                <div className="space-y-2">
                  {users.map((u, i) => (
                    <div key={i} className={`flex justify-between items-center p-3 rounded-xl border ${isNight ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <span className="text-xs font-bold uppercase">{u.nome} ({u.cargo})</span>
                      {isADM && <button onClick={() => setUsers(users.filter((_, idx) => idx !== i))} className="text-red-500"><i className="fas fa-trash"></i></button>}
                    </div>
                  ))}
                  <button onClick={() => {
                    const n = prompt("Nome:"); const u_name = prompt("Login:"); const pin = prompt("PIN:"); const c = prompt("Cargo (admin, gerente, pizzaiolo, atendente):") as UserCargo;
                    if(n && u_name && pin && c) {
                      setUsers([...users, { id: Date.now().toString(), nome: n, user: u_name, pass: pin, cargo: c, permissoes: PERMISSION_PRESETS[c] || PERMISSION_PRESETS.atendente }]);
                    }
                  }} className="w-full py-3 rounded-xl border-2 border-dashed border-[#008C45] text-[#008C45] text-xs font-bold">+ NOVO USUÁRIO</button>
                </div>
              ) : <p className="text-xs font-bold text-gray-400">Acesso Restrito.</p>}
            </section>

            {isADM && (
               <section className={`rounded-2xl p-4 shadow-sm border ${isNight ? 'bg-[#1E1E1E] border-white/5' : 'bg-white'}`}>
                  <h3 className="font-black text-sm uppercase mb-4 text-[#CD212A]"><i className="fas fa-dna"></i> Gestão de DNA</h3>
                  <button onClick={() => setActiveScreen('dna')} className="w-full py-4 bg-[#CD212A] text-white rounded-xl font-bold">CONFIGURAR METAS E FATORES</button>
               </section>
            )}

            {isGerente && (
              <section className={`rounded-2xl p-4 shadow-sm border ${isNight ? 'bg-[#1E1E1E] border-white/5' : 'bg-white'}`}>
                <h3 className="font-black text-sm uppercase mb-4"><i className="fas fa-route"></i> Rota de Loja</h3>
                {config.rota.map((r, i) => (
                  <div key={i} className="flex justify-between p-2 border-b border-gray-50 text-xs font-bold">
                    {r} <i className="fas fa-times text-red-500" onClick={() => setConfig({...config, rota: config.rota.filter((_, idx) => idx !== i)})}></i>
                  </div>
                ))}
                <button onClick={() => {const l = prompt("Local:"); if(l) setConfig({...config, rota: [...config.rota, l]});}} className="w-full mt-3 py-2 border border-dashed rounded-lg text-xs font-bold">+ LOCAL</button>
              </section>
            )}

            {isADM && (
               <section className={`rounded-2xl p-4 border ${config.isLocked ? 'border-green-500 bg-green-500/5' : 'border-red-500 bg-red-500/5'}`}>
                  <h3 className={`font-black text-xs uppercase mb-3 ${config.isLocked ? 'text-green-500' : 'text-red-500'}`}>Segurança Máxima</h3>
                  <button onClick={() => setConfig({...config, isLocked: !config.isLocked})} className={`w-full py-4 rounded-xl text-white font-black ${config.isLocked ? 'bg-green-500' : 'bg-red-500'}`}>
                    {config.isLocked ? 'DESBLOQUEAR SISTEMA' : 'BLOQUEIO DE EMERGÊNCIA'}
                  </button>
               </section>
            )}
          </div>
        )}

        {showSummary && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
            <div className={`w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl ${isNight ? 'bg-[#1E1E1E] border border-white/10' : 'bg-white'}`}>
              <div className="bg-[#008C45] p-5 text-white flex justify-between items-center"><h3 className="font-black uppercase text-sm">Resumo do Pedido</h3><i className="fas fa-times" onClick={() => setShowSummary(null)}></i></div>
              <div className="p-6 space-y-4">
                <div className={`p-4 rounded-2xl border ${isNight ? 'bg-white/5 border-white/5' : 'bg-gray-100'}`}><pre className={`text-[11px] font-bold whitespace-pre-wrap ${isNight ? 'text-white/80' : 'text-gray-700'}`}>{showSummary}</pre></div>
                {isGerente && (
                  <div className="p-3 bg-[#D4AF37]/10 rounded-xl border border-[#D4AF37]/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-black uppercase text-[#D4AF37]">Previsão IA Gemini</span>
                      <button onClick={fetchPrediction} disabled={isPredicting} className="text-[9px] font-black underline">{isPredicting ? '...' : 'ANALISAR'}</button>
                    </div>
                    {prediction && <p className="text-[10px] italic text-[#D4AF37] leading-tight">{prediction}</p>}
                  </div>
                )}
                <textarea className={`w-full p-4 rounded-2xl border text-xs font-bold ${isNight ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50'}`} rows={2} placeholder="Extras..." value={extraItems} onChange={e => setExtraItems(e.target.value)} />
                <button onClick={sendToWhatsApp} className="w-full py-4 bg-[#25D366] text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3"> <i className="fab fa-whatsapp text-2xl"></i> DISPARAR PEDIDO</button>
              </div>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center pointer-events-none">
            <div className="bg-white p-8 rounded-full shadow-2xl animate-zoomIn border-4 border-[#008C45]"><i className="fas fa-check text-5xl text-[#008C45]"></i></div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
