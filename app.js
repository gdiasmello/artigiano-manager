import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4",
  authDomain: "artigiano-app.firebaseapp.com",
  databaseURL: "https://artigiano-app-default-rtdb.firebaseio.com",
  projectId: "artigiano-app",
  storageBucket: "artigiano-app.firebasestorage.app",
  messagingSenderId: "212218495726",
  appId: "1:212218495726:web:dd6fec7a4a8c7ad572a9ff"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// SERVICE WORKER PARA MODO OFFLINE
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('data:text/javascript;base64,c2VsZi5hZGRFdmVudExpc3RlbmVyKCdpbnN0YWxsJywgZSA9PiBlLndhaXRVbnRpbChjYWNoZXMub3BlbignY2FjaGUnKS50aGVuKGMgPT4gYy5hZGRBbGwoWycuLicsICdpbmRleC5odG1sJywgJ3N0eWxlLmNzcycsICdhcHAuanMnXSkpKSk7CnNlbGYuYWRkRXZlbnRMaXN0ZW5lcignZmV0Y2gnLCBlID0+IGUucmVzcG9uZFdpdGgoY2FjaGVzLm1hdGNoKGUucmVxdWVzdCkudGhlbihyID0+IHIgfHwgZmV0Y2goZS5yZXF1ZXN0KSkpKTs=');
}

// LÓGICA DE INSTALAÇÃO (PWA)
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});

// AUTH GABRIEL 1821
document.getElementById('btn-login').addEventListener('click', async () => {
    const user = document.getElementById('user-input').value.toLowerCase();
    const pin = document.getElementById('pin-input').value;

    if (user === "gabriel" && pin === "1821") {
        logar(user);
    } else {
        const snap = await get(ref(db, `users/${user}`));
        if (snap.exists() && snap.val().pin === pin) logar(user);
        else alert("Acesso Negado!");
    }
});

function logar(user) {
    document.getElementById('view-login').classList.add('hidden');
    document.getElementById('view-dash').classList.remove('hidden');
    document.getElementById('main-nav').classList.remove('hidden');
    document.getElementById('user-greeting').innerText = `Olá, ${user}`;
    if (deferredPrompt) deferredPrompt.prompt();
}

window.aceitarTermos = () => {
    document.getElementById('modal-termos').classList.add('hidden');
    localStorage.setItem('termos_ok', 'true');
};

if(localStorage.getItem('termos_ok')) document.getElementById('modal-termos').classList.add('hidden');

window.nav = (v) => {
    document.querySelectorAll('.view').forEach(e => e.classList.add('hidden'));
    document.getElementById(`view-${v}`).classList.remove('hidden');
};
