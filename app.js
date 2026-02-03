// Configurações do Firebase
const firebaseConfig = { /* Suas Chaves aqui */ };
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentUser = null;

// --- LÓGICA DE LOGIN ---
function handleLogin() {
    const pin = document.getElementById('pin-input').value;
    
    // Admin Gabriel
    if (pin === "1821") {
        initApp({ nome: "Gabriel", cargo: "admin" });
        return;
    }

    // Consulta Firebase
    db.ref('usuarios').orderByChild('pin').equalTo(pin).once('value', snapshot => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const userKey = Object.keys(data)[0];
            initApp(data[userKey]);
        } else {
            alert("PIN Inválido!");
        }
    });
}

function initApp(user) {
    currentUser = user;
    document.getElementById('screen-login').classList.remove('active');
    document.getElementById('screen-dash').classList.add('active');
    document.getElementById('user-name').innerText = user.nome;
    document.getElementById('user-role').innerText = user.cargo;
    
    if (user.cargo === 'admin' || user.cargo === 'gerente') {
        document.getElementById('admin-icon').classList.remove('hidden');
    }
    lucide.createIcons();
}

// --- CALCULADORA MASTER (PORCENTAGEM DE PADEIRO) ---
function runCalculator() {
    const n = document.getElementById('input-massas').value;
    const resDiv = document.getElementById('res-calc');
    
    if (!n || n <= 0) { resDiv.innerHTML = ""; return; }

    const pesoBolinha = 220;
    const totalMassa = n * pesoBolinha;
    
    // Divisor baseado na soma das % (1.6987)
    const farinha = totalMassa / 1.6987;
    const agua = farinha * 0.4365;
    const gelo = farinha * 0.1872;
    const sal = farinha * 0.03;
    const levain = farinha * 0.045;

    resDiv.innerHTML = `
        <div class="res-item"><strong>Farinha 00:</strong> ${Math.round(farinha)}g</div>
        <div class="res-item"><strong>Água:</strong> ${Math.round(agua)}g</div>
        <div class="res-item"><strong>Gelo:</strong> ${Math.round(gelo)}g</div>
        <div class="res-item"><strong>Sal:</strong> ${Math.round(sal)}g</div>
        <div class="res-item"><strong>Levain:</strong> ${Math.round(levain)}g</div>
        <div class="res-item status"><strong>🌡️ Temp:</strong> ${new Date().getDay() === 1 ? '14°C' : '20°C'}</div>
    `;
}

// --- LÓGICA DE ESTOQUE E WHATSAPP ---
function openInventory(tipo) {
    // Exemplo de lógica de pedido dinâmico
    db.ref('estoque').orderByChild('bloco').equalTo(tipo).once('value', snapshot => {
        const itens = snapshot.val();
        // Gerar modal de contagem...
    });
}

function generateWhatsApp(fornecedor, itensPedido) {
    const hoje = new Date();
    const saudacao = hoje.getHours() < 12 ? "Bom dia" : hoje.getHours() < 18 ? "Boa tarde" : "Boa noite";
    
    let mensagem = `${saudacao}, aqui é o ${currentUser.nome} da Artigiano.\nSeguem itens:\n`;
    itensPedido.forEach(i => {
        mensagem += `✅ ${i.quantidade} ${i.unidade} - ${i.nome}\n`;
    });
    
    // Registro no Histórico (Bloco Lilás)
    db.ref('historico').push({
        data: hoje.toLocaleString(),
        operador: currentUser.nome,
        texto: mensagem
    });

    window.open(`https://wa.me/${fornecedor.tel}?text=${encodeURIComponent(mensagem)}`);
}

// Auxiliares
function openProduction() { document.getElementById('modal-prod').classList.remove('hidden'); }
function closeModals() { document.querySelectorAll('.modal-full').forEach(m => m.classList.add('hidden')); }
function acceptTerms() { localStorage.setItem('art-terms', 'ok'); document.getElementById('modal-terms').style.display = 'none'; }