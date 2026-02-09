
import React, { useState, useEffect } from 'react';
import { DoughCalculator } from './modules/DoughCalculator';
import { StockManager } from './modules/StockManager';
import { Sacolao } from './modules/Sacolao';
import { ChecklistManager } from './modules/ChecklistManager';
import { User, UserRole, ModuleId } from './types';
import { STORAGE_KEYS, DEFAULT_ADMIN } from './constants';
import { 
  ClipboardCheck, 
  Package, 
  ChefHat, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  User as UserIcon,
  ShoppingCart,
  Zap,
  ChevronDown,
  Eye,
  EyeOff,
  Users as UsersIcon,
  History,
  Lock,
  Calendar
} from 'lucide-react';

// Real-time integration would typically fetch this from Firebase 'usuarios/'
const INITIAL_USERS: User[] = [
  { id: '1', name: 'Gabriel', email: 'gabriel@artigiano.com', pin: '1821', role: UserRole.ADM, allowedModules: ['massas', 'estoque', 'check', 'sacolao', 'perfil'] },
  { id: '2', name: 'Gerente Roberto', email: 'roberto@artigiano.com', pin: '2024', role: UserRole.MANAGER, allowedModules: ['massas', 'estoque', 'check', 'sacolao', 'perfil'] },
  { id: '3', name: 'Pizzaiolo João', email: 'joao@artigiano.com', pin: '1111', role: UserRole.STAFF, allowedModules: ['massas', 'check'] }
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userInput, setUserInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [activeTab, setActiveTab] = useState<ModuleId>('massas');
  const [showTerms, setShowTerms] = useState(false);
  const [isShake, setIsShake] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>(INITIAL_USERS);

  useEffect(() => {
    const savedSession = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
    const termsAccepted = localStorage.getItem(STORAGE_KEYS.TERMS_ACCEPTED);
    const savedUsers = localStorage.getItem('artigiano_users');
    
    if (savedUsers) {
      setAllUsers(JSON.parse(savedUsers));
    } else {
      localStorage.setItem('artigiano_users', JSON.stringify(INITIAL_USERS));
    }

    if (savedSession) {
      const parsedUser = JSON.parse(savedSession);
      const dbUser = allUsers.find(u => u.id === parsedUser.id);
      if (dbUser) setUser(dbUser);
    }
    
    if (!termsAccepted) {
      setShowTerms(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = allUsers.find(u => 
      (u.name.toLowerCase() === userInput.toLowerCase() || u.email.toLowerCase() === userInput.toLowerCase()) && 
      u.pin === pinInput
    );

    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(foundUser));
      if ('vibrate' in navigator) navigator.vibrate([50, 20, 50]);
      if (!foundUser.allowedModules?.includes(activeTab)) {
        setActiveTab(foundUser.allowedModules?.[0] || 'perfil');
      }
    } else {
      setIsShake(true);
      if ('vibrate' in navigator) navigator.vibrate(200);
      setTimeout(() => setIsShake(false), 500);
      setPinInput('');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
  };

  const acceptTerms = () => {
    setShowTerms(false);
    localStorage.setItem(STORAGE_KEYS.TERMS_ACCEPTED, 'true');
  };

  const isModuleAllowed = (mod: ModuleId) => {
    if (!user) return false;
    if (user.role === UserRole.ADM) return true;
    return user.allowedModules?.includes(mod);
  };

  const toggleModuleForUser = (targetUserId: string, modId: ModuleId) => {
    const newUsers = allUsers.map(u => {
      if (u.id === targetUserId) {
        const currentModules = u.allowedModules || [];
        const newModules = currentModules.includes(modId)
          ? currentModules.filter(m => m !== modId)
          : [...currentModules, modId];
        return { ...u, allowedModules: newModules };
      }
      return u;
    });
    setAllUsers(newUsers);
    localStorage.setItem('artigiano_users', JSON.stringify(newUsers));
    if (user?.id === targetUserId) {
        setUser(newUsers.find(u => u.id === targetUserId) || null);
    }
  };

  if (showTerms) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
        <div className="glass rounded-3xl p-8 max-w-md w-full animate-scale-in">
          <div className="w-16 h-16 bg-[#008C45] rounded-2xl flex items-center justify-center text-white mb-6">
            <ClipboardCheck size={32} />
          </div>
          <h2 className="text-2xl font-black text-[#008C45] mb-4">BENVENUTO! 🍕</h2>
          <p className="text-sm opacity-80 mb-6 leading-relaxed">
            Ao utilizar o <strong>PiZZA Master v3.0</strong>, você concorda que todos os dados de estoque, checklists e produção são de propriedade da <strong>Pizzaria Artigiano</strong>. 
            O uso é restrito a colaboradores autorizados.
          </p>
          <button 
            onClick={acceptTerms}
            className="w-full bg-[#008C45] text-white py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-all text-lg"
          >
            Aceito e Entendido
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 relative overflow-hidden bg-italy">
        <div className="absolute top-[-10%] left-[-20%] w-64 h-64 bg-[#008C45]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-20%] w-64 h-64 bg-[#CD212A]/10 rounded-full blur-3xl animate-pulse delay-700"></div>

        <div className="w-full max-w-sm z-10">
          <div className="text-center mb-10">
            <div className="inline-block p-4 glass rounded-[2.5rem] mb-6 text-[#008C45] shadow-inner transform rotate-12">
              <Zap size={48} fill="currentColor" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter mb-2 italic">
              <span className="text-[#008C45]">PiZZA</span>
              <span className="text-[#CD212A]">Master</span>
            </h1>
            <p className="text-xs font-black opacity-30 uppercase tracking-[0.4em] ml-1">v3.0.0 ARTIGIANO</p>
          </div>

          <form 
            onSubmit={handleLogin} 
            className={`glass rounded-[2.5rem] p-8 space-y-5 border border-white/50 shadow-2xl transition-all ${isShake ? 'shake border-red-500/50 bg-red-500/5' : ''}`}
          >
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase opacity-40 ml-1 tracking-widest">Identificação</label>
              <input 
                type="text" 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="w-full bg-black/5 border-none rounded-2xl p-4 text-lg font-bold outline-none focus:ring-4 focus:ring-[#008C45]/10 transition-all placeholder:text-black/10"
                placeholder="Nome ou E-mail"
                required
              />
            </div>

            <div className="space-y-2 relative">
              <label className="text-[10px] font-black uppercase opacity-40 ml-1 tracking-widest">Pin de Acesso</label>
              <div className="relative">
                <input 
                  type={showPin ? "text" : "password"} 
                  maxLength={4}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full bg-black/5 border-none rounded-2xl p-5 text-4xl tracking-[1.5rem] text-center font-black outline-none focus:ring-4 focus:ring-[#008C45]/10 transition-all placeholder:opacity-5"
                  placeholder="****"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 p-2 hover:bg-black/5 rounded-full transition-colors"
                >
                  {showPin ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-[#CD212A] text-white py-5 rounded-2xl font-black shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 text-lg mt-4 uppercase tracking-widest"
            >
              <ShieldCheck size={24} /> Acessar DNA
            </button>
          </form>
          
          <div className="flex flex-col items-center mt-10 space-y-4">
            <p className="text-xs font-black opacity-30 uppercase tracking-widest cursor-pointer hover:opacity-100 transition-opacity">Termos de Uso • v3.0</p>
            <p className="text-[10px] font-bold opacity-20 text-center max-w-[200px] uppercase tracking-tighter">Somente uso profissional autorizado Artigiano.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-8 pb-32 min-h-screen">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-10 px-2">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-2 tracking-tighter">
            Ciao, <span className="text-[#008C45]">{user.name}</span>
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter text-white ${user.role === UserRole.ADM ? 'bg-black' : user.role === UserRole.MANAGER ? 'bg-[#CD212A]' : 'bg-[#008C45]'}`}>
              {user.role}
            </span>
            <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">{new Date().toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="glass w-12 h-12 flex items-center justify-center rounded-2xl text-[#CD212A] shadow-xl active:scale-90 transition-all border border-red-500/20">
          <LogOut size={22} />
        </button>
      </div>

      {/* Main Content Areas */}
      <div className="animate-fade-in-up">
        {activeTab === 'massas' && isModuleAllowed('massas') && <DoughCalculator />}
        {activeTab === 'estoque' && isModuleAllowed('estoque') && <StockManager currentUserRole={user.role} />}
        {activeTab === 'sacolao' && isModuleAllowed('sacolao') && <Sacolao />}
        {activeTab === 'check' && isModuleAllowed('check') && <ChecklistManager />}
        
        {activeTab === 'perfil' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-[#008C45] px-2 tracking-tighter uppercase">Configurações</h2>
            
            <div className="glass rounded-[2.5rem] p-8 space-y-6 shadow-2xl border border-white/80">
               <div className="flex flex-col items-center gap-4 text-center">
                 <div className="relative group">
                    <div className="w-24 h-24 bg-gradient-to-tr from-[#008C45] to-[#76c893] rounded-[2rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl transform group-hover:rotate-6 transition-transform">
                      {user.name[0]}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white p-2 rounded-2xl shadow-lg text-[#008C45] border border-black/5">
                      <Settings size={18} />
                    </div>
                 </div>
                 <div>
                   <p className="font-black text-2xl tracking-tighter text-gray-800">{user.name}</p>
                   <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">{user.email}</p>
                 </div>
               </div>
               
               <div className="grid grid-cols-1 gap-3 pt-6 border-t border-black/5">
                 <ProfileOption icon={<Lock size={18}/>} label="Trocar Meu PIN" />
                 <ProfileOption icon={<Calendar size={18}/>} label="Minha Data Nasc." />
               </div>
            </div>

            {(user.role === UserRole.ADM || user.role === UserRole.MANAGER) && (
              <div className="glass rounded-[2.5rem] p-8 bg-white/60 shadow-xl space-y-6 border border-[#008C45]/10">
                <div className="flex justify-between items-center px-1">
                   <h3 className="font-black text-[#008C45] flex items-center gap-2 text-lg tracking-tight">
                     <UsersIcon size={20} /> Gestão da Equipe
                   </h3>
                   <span className="text-[10px] font-black bg-black/5 px-3 py-1.5 rounded-full text-gray-500 uppercase">{allUsers.length} Membros</span>
                </div>
                <div className="space-y-3">
                  {allUsers.filter(u => u.id !== user.id).map(u => (
                    <div key={u.id} className="flex flex-col gap-3 p-4 bg-white/50 rounded-[1.5rem] border border-white shadow-sm">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#008C45]/10 flex items-center justify-center font-black text-[#008C45] text-sm shadow-inner">{u.name[0]}</div>
                            <div>
                                <p className="text-sm font-black leading-tight text-gray-800">{u.name}</p>
                                <p className="text-[9px] font-black opacity-40 uppercase tracking-tighter text-gray-500">{u.role}</p>
                            </div>
                          </div>
                          <button className="text-[9px] font-black uppercase text-[#CD212A] bg-red-500/10 px-4 py-2 rounded-xl active:scale-95 shadow-sm border border-red-500/5 transition-all">Reset PIN</button>
                       </div>
                       
                       {/* Module visibility toggles */}
                       <div className="flex flex-wrap gap-2 pt-3 border-t border-black/5">
                          {(['massas', 'estoque', 'check', 'sacolao'] as ModuleId[]).map(mod => (
                            <button
                              key={mod}
                              onClick={() => toggleModuleForUser(u.id, mod)}
                              className={`text-[8px] font-black uppercase px-2.5 py-1.5 rounded-lg border transition-all ${u.allowedModules?.includes(mod) ? 'bg-[#008C45] text-white border-[#008C45] shadow-md' : 'bg-gray-100 text-gray-400 border-gray-200 opacity-60'}`}
                            >
                              {mod}
                            </button>
                          ))}
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {user.role === UserRole.ADM && (
              <div className="glass rounded-[2.5rem] p-8 bg-gradient-to-br from-[#1a1a1a] to-[#333] text-white shadow-2xl relative overflow-hidden group border border-white/10">
                 <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-[#CD212A]/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                 <div className="flex items-center gap-3 mb-4">
                   <div className="bg-white/10 p-2 rounded-xl shadow-inner">
                    <ShieldCheck size={24} className="text-[#CD212A]" />
                   </div>
                   <h3 className="font-black text-xl tracking-tighter">DNA ESTRUTURAL</h3>
                 </div>
                 <p className="text-sm opacity-80 mb-8 leading-relaxed font-medium">Controle mestre da Artigiano. Gerencie metas globais, fornecedores e logs de auditoria.</p>
                 <button className="bg-[#CD212A] text-white w-full py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all text-[10px] uppercase tracking-[0.3em] border border-white/10">Configurações Avançadas</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Persistent Navigation */}
      <nav className="fixed bottom-6 left-4 right-4 h-22 glass rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.25)] flex items-center justify-around px-2 border border-white/60 z-40">
        <NavButton 
          active={activeTab === 'massas'} 
          disabled={!isModuleAllowed('massas')}
          onClick={() => setActiveTab('massas')} 
          icon={<ChefHat size={22} />} 
          label="Massa" 
        />
        <NavButton 
          active={activeTab === 'estoque'} 
          disabled={!isModuleAllowed('estoque')}
          onClick={() => setActiveTab('estoque')} 
          icon={<Package size={22} />} 
          label="Stock" 
        />
        <NavButton 
          active={activeTab === 'check'} 
          disabled={!isModuleAllowed('check')}
          onClick={() => setActiveTab('check')} 
          icon={<ClipboardCheck size={22} />} 
          label="POP" 
        />
        <NavButton 
          active={activeTab === 'sacolao'} 
          disabled={!isModuleAllowed('sacolao')}
          onClick={() => setActiveTab('sacolao')} 
          icon={<ShoppingCart size={22} />} 
          label="Horta" 
        />
        <NavButton 
          active={activeTab === 'perfil'} 
          disabled={false}
          onClick={() => setActiveTab('perfil')} 
          icon={<UserIcon size={22} />} 
          label="Perfil" 
        />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; disabled: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, disabled, onClick, icon, label }) => (
  <button 
    disabled={disabled}
    onClick={() => {
      onClick();
      if ('vibrate' in navigator) navigator.vibrate(25);
    }}
    className={`flex flex-col items-center justify-center flex-1 h-16 rounded-2xl transition-all duration-300 relative ${disabled ? 'opacity-5 grayscale pointer-events-none' : ''} ${active ? 'text-[#008C45]' : 'text-gray-400'}`}
  >
    <div className={`transition-all duration-300 ${active ? '-translate-y-1.5 scale-125' : 'hover:scale-110'}`}>
      {icon}
    </div>
    <span className={`text-[8px] font-black uppercase tracking-widest mt-1.5 transition-all duration-300 ${active ? 'opacity-100' : 'opacity-40'}`}>
      {label}
    </span>
    {active && <div className="absolute -bottom-1 w-1.5 h-1.5 bg-[#008C45] rounded-full shadow-lg"></div>}
  </button>
);

const ProfileOption: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <button className="w-full flex justify-between items-center p-5 bg-white/40 rounded-3xl font-black text-gray-700 active:bg-white/60 transition-all border border-white shadow-sm group">
    <div className="flex items-center gap-3">
      <span className="opacity-40 group-active:text-[#008C45] transition-colors">{icon}</span>
      <span className="text-[11px] uppercase tracking-widest">{label}</span>
    </div>
    <div className="w-7 h-7 rounded-2xl bg-black/5 flex items-center justify-center opacity-30">
      <ChevronDown size={14} className="-rotate-90"/>
    </div>
  </button>
);

export default App;
