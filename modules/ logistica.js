import { db } from "../main.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export const Logistica = {
    // 1. Fórmula Base: Ceil((Meta - Estoque) / Fator de Conversão)
    calcularPedido: (item, estoqueAtual, config) => {
        let metaFinal = parseFloat(item.meta);

        // 2. Multiplicadores Dinâmicos
        const hoje = new Date();
        const eSexta = hoje.getDay() === 5;

        // Modo Feriado (Aumenta metas em 50%)
        if (config.modoFeriado) {
            metaFinal *= 1.5; 
        } 
        // Regra de Sexta-feira (Triplica Hortifruti para o fim de semana)
        else if (eSexta && item.setor === 'sacolao') {
            metaFinal *= 3;
        }

        const emFalta = metaFinal - estoqueAtual;
        if (emFalta <= 0) return 0;

        // Fator de Conversão (Ex: Peça de 5kg, fardo de 12un)
        const fator = parseFloat(item.fator) || 1;

        // Resultado arredondado para cima (Ceil)
        return Math.ceil(emFalta / fator);
    },

    // 4. Rácio de Produção (A Massa Perfeita)
    calcularMassa: (qtdBolinhas) => {
        const farinha = qtdBolinhas * 133; // 133g por bolinha
        const sal = qtdBolinhas * 4;       // 4g por bolinha
        const aguaTotal = farinha * 0.70;  // Hidratação 70%
        
        return {
            farinha: (farinha / 1000).toFixed(2),     // kg
            sal: sal.toFixed(0),                      // g
            aguaMineral: (aguaTotal * 0.70).toFixed(0), // 70% da água (ml)
            gelo: (aguaTotal * 0.30).toFixed(0)         // 30% da água em gelo (g)
        };
    }
};
