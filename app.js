const firebaseConfig = { /* Insira suas chaves do Firebase aqui */ };
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentUser = null;

function handleLogin() {
    const pin = document.getElementById('pin-input').value;
    if (pin === "1821") {
        initApp({ nome: "Gabriel", cargo: "admin" });
        return;
    }
    db.ref('usuarios').orderByChild('pin').equalTo(pin).once('value', snapshot => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            initApp(data[Object.keys(data)[0]]);
        } else { alert("PIN Inválido!"); }
    });
}

function initApp(user) {
    currentUser = user;
    document.getElementById('screen-login').classList.remove('active');
    document.getElementById('screen-dash').classList.add('active');
    document.getElementById('user-name').innerText = user.nome;
    if (user.cargo === 'admin') document.getElementById('admin-icon').classList.remove('hidden');
    lucide.createIcons();
}

function runCalculator(n) {
    const farinha = (n * 220) / 1.6987;
    return {
        farinha: Math.round(farinha),
        agua: Math.round(farinha * 0.4365),
        gelo: Math.round(farinha * 0.1872),
        sal: Math.round(farinha * 0.03),
        levain: Math.round(farinha * 0.045)
    };
}

function acceptTerms() { 
    localStorage.setItem('art-terms', 'ok'); 
    document.getElementById('modal-terms').classList.add('hidden'); 
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
