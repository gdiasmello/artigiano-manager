
import React, { useState, useEffect } from 'react';
import { audio } from '../services/audioService';

interface IceScreenProps {
  onFinish: (summary: string) => void;
  isNight: boolean;
  userName: string;
}

const IceScreen: React.FC<IceScreenProps> = ({ onFinish, isNight, userName }) => {
  const [count, setCount] = useState(8);
  const META = 8;

  const getStatusColor = () => {
    if (count <= 2) return 'text-red-500';
    if (count <= 6) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getGlowClass = () => {
    if (count <= 2) return 'ice-glow-red';
    if (count <= 6) return 'ice-glow-yellow';
    return 'ice-glow-green';
  };

  const handleIncrement = () => {
    if (count < 20) {
      setCount(prev => prev + 1);
      audio.playCash();
      if (navigator.vibrate) navigator.vibrate(10);
      if (count + 1 === META) audio.playSuccess();
    }
  };

  const handleDecrement = () => {
    if (count > 0) {
      setCount(prev => prev - 1);
      audio.playPop();
      if (navigator.vibrate) navigator.vibrate(10);
      if (count - 1 <= 2) audio.playAlert();
    }
  };

  const handleFinish = () => {
    const falta = META - count;
    let summary = `*CONTAGEM DE GELO*\nResponsável: ${userName}\nEstoque Atual: ${count} sacos\n`;
    
    if (falta > 0) {
      summary += `\n*PEDIDO: ${falta} sacos de gelo*\nStatus: Reposição Urgente 🚨`;
    } else {
      summary += `\nStatus: Estoque Ideal ✅`;
    }
    
    onFinish(summary);
  };

  return (
    <div className={`p-6 min-h-[80vh] flex flex-col items-center justify-center animate-fadeIn ${isNight ? 'bg-blue-900/10' : 'bg-blue-500/5'}`}>
      <div className={`w-full max-w-sm glass rounded-[3rem] p-10 flex flex-col items-center transition-all duration-500 ${getGlowClass()}`}>
        <h3 className="text-blue-500 font-black text-xs uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
          <i className="fas fa-snowflake animate-pulse"></i> Modulo Gelo v3.0
        </h3>

        <div className="relative mb-12">
            <div className={`text-8xl font-black transition-colors duration-500 ${getStatusColor()}`}>
                {count}
            </div>
            <span className="absolute -right-8 bottom-2 text-[10px] font-black text-blue-400 uppercase opacity-40">Sacos</span>
        </div>

        <div className="flex gap-6 mb-12 w-full">
            <button 
                onClick={handleDecrement}
                className="flex-1 py-8 glass rounded-3xl text-4xl text-blue-500 active:scale-90 transition-all shadow-inner"
            >
                <i className="fas fa-minus"></i>
            </button>
            <button 
                onClick={handleIncrement}
                className="flex-1 py-8 glass rounded-3xl text-4xl text-blue-500 active:scale-90 transition-all shadow-inner"
            >
                <i className="fas fa-plus"></i>
            </button>
        </div>

        <div className="w-full space-y-2 mb-8">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter opacity-30 px-2">
                <span>Vazio</span>
                <span>Meta: 8</span>
                <span>Cheio</span>
            </div>
            <div className="h-3 w-full bg-black/5 rounded-full overflow-hidden border border-white/10">
                <div 
                    className={`h-full transition-all duration-700 ${getStatusColor().replace('text-', 'bg-')}`}
                    style={{ width: `${Math.min((count/META)*100, 100)}%` }}
                ></div>
            </div>
        </div>

        <button 
            onClick={handleFinish}
            className="w-full py-5 bg-blue-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 active:scale-95 transition-all uppercase tracking-widest"
        >
            Fechar Gelo
        </button>
      </div>

      <div className="mt-8 text-center opacity-20">
          <p className="text-[10px] font-black uppercase tracking-widest">Crystalline Interface • Artigiano</p>
      </div>
    </div>
  );
};

export default IceScreen;
