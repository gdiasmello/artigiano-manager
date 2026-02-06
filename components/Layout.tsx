
import React from 'react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  title: string;
  onBack?: () => void;
  onConfig?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, title, onBack, onConfig }) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#FDFBF7] max-w-md mx-auto shadow-2xl relative">
      <header className="bg-[#1f2937] text-white p-4 sticky top-0 z-50 rounded-b-2xl shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
                <i className="fas fa-chevron-left text-lg"></i>
              </button>
            )}
            <h1 className="font-black text-lg tracking-tight uppercase">{title}</h1>
          </div>
          <div 
            onClick={onConfig}
            className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full cursor-pointer hover:bg-white/20 transition-all border border-white/5"
          >
            <span className="text-xs font-bold uppercase tracking-wider">{user.nome}</span>
            <i className="fas fa-cog text-xs opacity-70"></i>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>
    </div>
  );
};

export default Layout;
