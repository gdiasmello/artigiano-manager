
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, off } from 'firebase/database';
import { User, Insumo, Config, HistoryRecord } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyBL70gtkhjBvC9BiKvz5HBivH07JfRKuo4",
  authDomain: "artigiano-app.firebaseapp.com",
  databaseURL: "https://artigiano-app-default-rtdb.firebaseio.com",
  projectId: "artigiano-app",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

export const firebaseService = {
  // Listeners em tempo real
  syncDNA: (callback: (data: Insumo[]) => void) => {
    const dbRef = ref(db, 'catalogoDNA');
    return onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      callback(data ? Object.values(data) : []);
    });
  },

  syncUsers: (callback: (data: User[]) => void) => {
    const dbRef = ref(db, 'usuarios');
    return onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      callback(data ? Object.values(data) : []);
    });
  },

  syncConfig: (callback: (data: Config) => void) => {
    const dbRef = ref(db, 'config');
    return onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) callback(data);
    });
  },

  syncHistory: (callback: (data: HistoryRecord[]) => void) => {
    const dbRef = ref(db, 'historico');
    return onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.values(data) as HistoryRecord[] : [];
      callback(list.sort((a, b) => b.timestamp - a.timestamp));
    });
  },

  // Escrita (Funciona offline via cache do SDK)
  saveUser: async (user: User) => {
    await set(ref(db, `usuarios/${user.id}`), user);
  },

  removeUser: async (userId: string) => {
    await set(ref(db, `usuarios/${userId}`), null);
  },

  saveDNA: async (dna: Insumo[]) => {
    // Para simplificar, salvamos o array inteiro como um objeto mapeado por ID
    const dnaObj = dna.reduce((acc, item) => ({ ...acc, [item.id]: item }), {});
    await set(ref(db, 'catalogoDNA'), dnaObj);
  },

  saveConfig: async (config: Config) => {
    await set(ref(db, 'config'), config);
  },

  addHistory: async (record: HistoryRecord) => {
    await push(ref(db, 'historico'), record);
  }
};
