
import React, { useState, useEffect, useCallback } from 'react';
import { User, Insumo, Config, HistoryRecord, BlocoId } from './types';
import { storageService } from './services/storageService';
import { MASTER_USER, BLOCAS_CONFIG, COLORS } from './constants';
import Layout from './components/Layout';
import InventoryScreen from './components/InventoryScreen';
import ProductionScreen from './components/ProductionScreen';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(storageService.getSession());
  const [isLogin, setIsLogin] = useState(!user);
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [loginError, setLoginError] = useState(false);
  
  const [activeScreen, setActiveScreen] = useState<BlocoId | 'home' | 'config' | 'history'>('home');
  const [dna, setDna] = useState<Insumo[]>(storageService.getDNA());
  const [config, setConfig] = useState<Config>(storageService.getConfig());
  const [history, setHistory] = useState<HistoryRecord[]>(storageService.getHistory());
  
  const [showSummary, setShowSummary] = useState<string | null>(null);
  const [extraItems, setExtraItems] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  // Persistence
  useEffect(() => {
    storageService.saveDNA(dna);
  }, [dna]);

  useEffect(() => {
    storageService.saveConfig(config);
  }, [config]);

  // Auth Handlers
  const handleLogin = () => {
    setLoginError(false);
    const u = loginForm.user.trim().toLowerCase();
    const p = loginForm.pass.trim();

    if (u === MASTER_USER.user && p === MASTER_USER.pass) {
      setUser(MASTER_USER);
      storageService.setSession(MASTER_USER);
      setIsLogin(false);
      return;
    }

    const savedUsers = storageService.getUsers();
    const found = savedUsers.find(x => x.user.toLowerCase() === u && x.pass === p);
    
    if (found) {
      setUser(found);
      storageService.setSession(found);
      setIsLogin(false);
    } else {
      setLoginError(true);
      if (navigator.vibrate) navigator.vibrate(200);
      setTimeout(() => setLoginError(false), 500);
    }
  };

  const handleLogout = () => {
    if (confirm("Deseja realmente sair?")) {
      storageService.setSession(null);
      setUser(null);
      setIsLogin(true);
    }
  };

  const triggerSuccess = () => {
    setSuccessMsg(true);
    if (navigator.vibrate) navigator.vibrate(50);
    setTimeout(() => setSuccessMsg(false), 2000);
  };

  // Operational Logic
  const handleInventoryFinish = (summary: string) => {
    setShowSummary(summary);
  };

  const sendToWhatsApp = () => {
    if (!showSummary) return;
    const bloco = activeScreen as BlocoId;
    const destino = config.destinos[bloco] || '';
    let text = showSummary;
    if (extraItems.trim()) {
      text += `\n*EXTRAS:*\n${extraItems}\n`;
    }
    
    window.open(`https://api.whatsapp.com/send?phone=${destino}&text=${encodeURIComponent(text)}`, '_blank');
    
    storageService.addHistory({
      data: new Date().toLocaleString(),
      usuario: user?.nome || 'Anon',
      itens: text
    });
    setHistory(storageService.getHistory());
    
    setShowSummary(null);
    setExtraItems('');
    setActiveScreen('home');
    triggerSuccess();
  };

  if (isLogin) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 w-full h-4 italy-gradient"></div>
        <div className="absolute bottom-0 w-full h-4 italy-gradient"></div>
        
        <div className="mb-10 text-center animate-fadeIn">
          <div className="w-24 h-24 bg-[#008C45] rounded-full border-4 border-[#CD212A] flex items-center justify-center text-white text-5xl shadow-2xl mb-4 mx-auto">
            <i className="fas fa-pizza-slice"></i>
          </div>
          <h1 className="text-4xl font-black text-[#008C45] tracking-tighter">
            PiZZA <span className="text-gray-500">Mas</span><span className="text-[#CD212A]">ter</span>
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gestão Premium v1.8.0</p>
        </div>

        <div className={`w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-gray-100 space-y-4 ${loginError ? 'shake-error' : ''}`}>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <i className="fas fa-user text-gray-300"></i>
              <input 
                className="bg-transparent outline-none flex-1 font-bold text-gray-700"
                placeholder="Usuário"
                value={loginForm.user}
                onChange={e => setLoginForm({...loginForm, user: e.target.value})}
              />
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <i className="fas fa-lock text-gray-300"></i>
              <input 
                type="password"
                className="bg-transparent outline-none flex-1 font-bold text-gray-700"
                placeholder="PIN"
                maxLength={4}
                inputMode="numeric"
                value={loginForm.pass}
                onChange={e => setLoginForm({...loginForm, pass: e.target.value})}
              />
            </div>
          </div>
          <button 
            onClick={handleLogin}
            className="w-full py-4 bg-[#008C45] text-white rounded-2xl font-black text-lg shadow-lg shadow-green-900/20 active:scale-95 transition-all"
          >
            ENTRAR
          </button>
        </div>
        
        <div className="mt-8 text-center text-gray-400 font-bold text-xs uppercase cursor-pointer underline">
          Termos de Uso
        </div>
      </div>
    );
  }

  return (
    <Layout 
      user={user!} 
      title={activeScreen === 'home' ? 'PIZZA MASTER PRO' : activeScreen.toUpperCase()}
      onBack={activeScreen !== 'home' ? () => setActiveScreen('home') : undefined}
      onConfig={() => setActiveScreen('config')}
    >
      {activeScreen === 'home' && (
        <div className="p-4 grid grid-cols-2 gap-3 animate-fadeIn">
          {BLOCAS_CONFIG.map(bloco => {
            const hasPerm = user?.permissoes[bloco.id] || user?.permissoes.admin;
            if (!hasPerm) return null;
            return (
              <button
                key={bloco.id}
                onClick={() => setActiveScreen(bloco.id as any)}
                className={`flex flex-col items-center justify-center p-6 rounded-3xl text-white shadow-lg active:scale-95 transition-all ${bloco.color}`}
              >
                <i className={`fas ${bloco.icon} text-3xl mb-3`}></i>
                <span className="font-black text-[10px] tracking-widest">{bloco.nome}</span>
              </button>
            );
          })}
          <button
            onClick={() => setActiveScreen('history')}
            className="flex flex-col items-center justify-center p-6 rounded-3xl bg-gray-600 text-white shadow-lg active:scale-95 transition-all"
          >
            <i className="fas fa-history text-3xl mb-3"></i>
            <span className="font-black text-[10px] tracking-widest">HISTÓRICO</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center p-6 rounded-3xl bg-[#1f2937] text-white shadow-lg active:scale-95 transition-all"
          >
            <i className="fas fa-sign-out-alt text-3xl mb-3"></i>
            <span className="font-black text-[10px] tracking-widest">SAIR</span>
          </button>
        </div>
      )}

      {(activeScreen === BlocoId.SACOLAO || activeScreen === BlocoId.INSUMOS || activeScreen === BlocoId.BEBIDAS || activeScreen === BlocoId.LIMPEZA) && (
        <InventoryScreen 
          blocoId={activeScreen} 
          config={config} 
          dna={dna} 
          onFinish={handleInventoryFinish}
          onBack={() => setActiveScreen('home')}
        />
      )}

      {activeScreen === BlocoId.PRODUCAO && (
        <ProductionScreen 
          onFinish={(qtd) => {
            const text = `*PRODUÇÃO DE MASSA*\nQuant: ${qtd} un\nPor: ${user?.nome}`;
            storageService.addHistory({ data: new Date().toLocaleString(), usuario: user?.nome || '?', itens: text });
            setHistory(storageService.getHistory());
            triggerSuccess();
            setActiveScreen('home');
          }}
        />
      )}

      {activeScreen === 'history' && (
        <div className="p-4 space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-black text-gray-400 text-xs uppercase tracking-widest">Últimos 50 Registros</h3>
            <button onClick={() => { if(confirm("Limpar histórico?")) { localStorage.removeItem('pm_history'); setHistory([]); }}} className="text-[10px] font-bold text-red-500 uppercase">Limpar Tudo</button>
          </div>
          {history.map(h => (
            <div key={h.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-2 border-b border-gray-50 pb-2">
                <span className="text-[10px] font-black text-[#008C45]">{h.data}</span>
                <span className="text-[10px] font-black text-gray-400 uppercase">{h.usuario}</span>
              </div>
              <pre className="text-[11px] text-gray-600 font-semibold whitespace-pre-wrap">{h.itens}</pre>
            </div>
          ))}
          {history.length === 0 && <p className="text-center py-20 text-gray-400 italic text-sm">Sem registros.</p>}
        </div>
      )}

      {activeScreen === 'config' && (
        <div className="p-4 space-y-6 animate-fadeIn">
          {/* Config sections - simplified for the example */}
          <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-black text-gray-800 text-sm uppercase mb-4 flex items-center gap-2">
              <i className="fas fa-users-cog text-[#008C45]"></i>
              Gestão de Equipe
            </h3>
            <p className="text-xs text-gray-500 mb-4 font-bold">Funcionalidade restrita ao Administrador.</p>
            <button className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-xs font-bold hover:border-[#008C45] hover:text-[#008C45] transition-all">
              + NOVO FUNCIONÁRIO
            </button>
          </section>

          <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-black text-gray-800 text-sm uppercase mb-4 flex items-center gap-2">
              <i className="fas fa-route text-[#CD212A]"></i>
              Rota de Contagem
            </h3>
            <div className="space-y-2 mb-4">
              {config.rota.map((r, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl text-xs font-bold text-gray-600">
                  {r}
                  <i className="fas fa-times text-gray-300 hover:text-red-500" onClick={() => {
                    const newRota = config.rota.filter((_, idx) => idx !== i);
                    setConfig({...config, rota: newRota});
                  }}></i>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                id="newLocal"
                placeholder="Novo local..." 
                className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-100 outline-none text-xs font-bold"
              />
              <button 
                onClick={() => {
                  const input = document.getElementById('newLocal') as HTMLInputElement;
                  if(input.value) {
                    setConfig({...config, rota: [...config.rota, input.value]});
                    input.value = '';
                  }
                }}
                className="bg-[#1f2937] text-white px-4 rounded-xl font-bold text-xs"
              >
                ADD
              </button>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-black text-gray-800 text-sm uppercase mb-4 flex items-center gap-2">
              <i className="fas fa-whatsapp text-green-500"></i>
              Destinos WhatsApp
            </h3>
            {BLOCAS_CONFIG.map(b => (
              <div key={b.id} className="mb-3">
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">{b.nome}</label>
                <input 
                  className="w-full bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs font-bold outline-none focus:border-green-500"
                  value={config.destinos[b.id] || ''}
                  onChange={(e) => {
                    const newDestinos = {...config.destinos, [b.id]: e.target.value};
                    setConfig({...config, destinos: newDestinos});
                  }}
                  placeholder="Ex: 5511999999999"
                />
              </div>
            ))}
          </section>
        </div>
      )}

      {/* MODALS */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden animate-zoomIn shadow-2xl">
            <div className="bg-[#008C45] p-5 text-white flex justify-between items-center">
              <h3 className="font-black uppercase tracking-widest text-sm">Resumo do Pedido</h3>
              <i className="fas fa-times cursor-pointer" onClick={() => setShowSummary(null)}></i>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-100 p-4 rounded-2xl border border-gray-200">
                <pre className="text-[11px] font-bold text-gray-700 leading-relaxed whitespace-pre-wrap">{showSummary}</pre>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Itens Extras (Manual)</label>
                <textarea 
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 outline-none text-xs font-bold focus:border-[#008C45]"
                  rows={2}
                  placeholder="Ex: Papel toalha, Pano de prato..."
                  value={extraItems}
                  onChange={e => setExtraItems(e.target.value)}
                />
              </div>
              <button 
                onClick={sendToWhatsApp}
                className="w-full py-4 bg-[#25D366] text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-lg shadow-green-900/20 active:scale-95 transition-all"
              >
                <i className="fab fa-whatsapp text-2xl"></i>
                DISPARAR WHATSAPP
              </button>
            </div>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center pointer-events-none">
          <div className="bg-white p-8 rounded-full shadow-2xl animate-zoomIn flex items-center justify-center border-4 border-[#008C45]">
            <i className="fas fa-check text-5xl text-[#008C45]"></i>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default App;
