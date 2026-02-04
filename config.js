// config.js
const firebaseConfig = { 
    apiKey: "AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4", 
    authDomain: "artigiano-app.firebaseapp.com", 
    databaseURL: "https://artigiano-app-default-rtdb.firebaseio.com", 
    projectId: "artigiano-app", 
    storageBucket: "artigiano-app.firebasestorage.app", 
    messagingSenderId: "212218495726", 
    appId: "1:212218495726:web:dd6fec7a4a8c7ad572a9ff" 
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const LOCAIS_ESTOQUE = [
    "Estoque seco", 
    "Geladeira do forno", 
    "Freezer de congelamento",
    "Freezer das Bufulas", 
    "Cozinha dos freelas", 
    "Quartinho de baixo da escada"
];
