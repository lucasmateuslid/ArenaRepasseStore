import { db, storage } from "../firebaseConfig";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  Timestamp 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Car } from "../types";

const COLLECTION_NAME = "cars";

// Converter dados do Firestore para nossa interface Car
const mapDocToCar = (doc: any): Car => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    // Garante que campos numéricos sejam números
    year: Number(data.year),
    price: Number(data.price),
    fipeprice: Number(data.fipeprice),
    mileage: Number(data.mileage),
  };
};

export const getProducts = async (): Promise<Car[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("created_at", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(mapDocToCar);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    throw error;
  }
};

export const addProduct = async (car: Omit<Car, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...car,
      created_at: Timestamp.now(),
      is_active: true
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao adicionar produto:", error);
    throw error;
  }
};

export const updateProduct = async (id: string, updates: Partial<Car>) => {
  try {
    const carRef = doc(db, COLLECTION_NAME, id);
    // Removemos id e created_at para não duplicar ou dar erro
    const { id: _, created_at: __, ...cleanUpdates } = updates as any;
    await updateDoc(carRef, cleanUpdates);
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    throw error;
  }
};

export const deleteProduct = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error("Erro ao deletar produto:", error);
    throw error;
  }
};

export const uploadImage = async (file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const storageRef = ref(storage, `car-images/${fileName}`);
    
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Erro no upload:", error);
    throw error;
  }
};