// Substitua pelas suas chaves do Firebase
const firebaseConfig = { apiKey: "...", databaseURL: "..." }; 
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function handleLogin() {
    const pin = document.getElementById('pin-input').value;
    const user = document.getElementById('user-input').value.toLowerCase();
    
    if (user === "gabriel" && pin === "1821") {
        showDash("Gabriel", "Administrador");
    } else {
        db.ref('usuarios/' + user).once('value', snap => {
            if (snap.exists() && snap.val().pin === pin) {
                showDash(snap.val().nome, snap.val().cargo);
            } else { alert("Acesso negado."); }
        });
    }
}

function showDash(nome, cargo) {
    document.getElementById('screen-login').classList.remove('active');
    document.getElementById('screen-dash').classList.add('active');
    document.getElementById('user-name').innerText = `Olá, ${nome}`;
    lucide.createIcons();
    checkFeriado();
}

function checkFeriado() {
    const hoje = new Date();
    // Exemplo: Se for sexta-feira, ativa badge
    if (hoje.getDay() === 5) document.getElementById('badge-feriado').classList.remove('hidden');
}

function acceptTerms() {
    localStorage.setItem('art_terms', 'ok');
    document.getElementById('modal-terms').style.display = 'none';
}

if(localStorage.getItem('art_terms')) document.getElementById('modal-terms').style.display = 'none';
