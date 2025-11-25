
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';
import { MOCK_CARS } from './constants';
import { Car } from './types';

// CONFIGURAÇÃO FIREBASE - PROJETO STOREARENA
const firebaseConfig = {
  apiKey: "AIzaSyB9cHCBWHCWrIzU2KFleqeLZj2uPOHgKzs",
  authDomain: "storearena-aa9f4.firebaseapp.com",
  projectId: "storearena-aa9f4",
  storageBucket: "storearena-aa9f4.firebasestorage.app",
  messagingSenderId: "229409336986",
  appId: "1:229409336986:web:29507adc25248b51a83923",
  measurementId: "G-FXBS5CWNG4"
};

// Inicialização do Firebase
let db: any = null;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log("Firebase 'storearena' initialized successfully");
} catch (e) {
  console.error("Firebase initialization failed:", e);
}

// Definição do tipo de retorno
type FetchResponse = {
  data: Car[];
  error: 'permission-denied' | 'database-not-found' | 'sdk-not-initialized' | 'unknown' | null;
};

/**
 * Busca carros do Firestore (Coleção 'cars').
 * Retorna dados ou um código de erro específico para a UI tratar.
 */
export const fetchCars = async (): Promise<FetchResponse> => {
  if (!db) {
    return { data: [], error: 'sdk-not-initialized' };
  }

  try {
    const carsCol = collection(db, 'cars');
    const carSnapshot = await getDocs(carsCol);
    
    if (carSnapshot.empty) {
        return { data: [], error: null };
    }

    const carList = carSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      };
    }) as unknown as Car[];

    return { data: carList, error: null };
  } catch (error: any) {
    console.error('Erro detalhado ao buscar:', error);
    
    // Tratamento de erros comuns do Firebase
    if (error.code === 'permission-denied') {
        return { data: [], error: 'permission-denied' };
    }
    
    if (error.code === 'not-found' || (error.message && error.message.includes('does not exist'))) {
        return { data: [], error: 'database-not-found' };
    }

    return { data: [], error: 'unknown' };
  }
};

/**
 * Função utilitária para enviar os dados Mockados para o Firestore.
 * Útil para popular o banco inicialmente.
 */
export const uploadMockData = async () => {
  if (!db) {
    alert("Firebase não configurado.");
    return false;
  }

  try {
    const batch = writeBatch(db);
    
    MOCK_CARS.forEach((car) => {
      // Usa o ID do mock como ID do documento
      const docRef = doc(db, "cars", car.id.toString());
      const { id, ...carData } = car; 
      batch.set(docRef, carData);
    });

    await batch.commit();
    return true;
  } catch (e: any) {
    console.error("Erro ao enviar dados:", e);
    if (e.code === 'permission-denied') {
       alert("ERRO DE PERMISSÃO: Você precisa alterar as regras do Firestore para 'allow read, write: if true;' no console do Firebase.");
    }
    return false;
  }
};
