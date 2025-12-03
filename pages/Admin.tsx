import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  fetchCars, createCar, updateCar, deleteCar, uploadCarImage, 
  fetchUsers, createUser, updateUser, deleteUser, 
  fetchSellers, createSeller, updateSeller, deleteSeller,
  sellCar
} from '../supabaseClient';
import { Car, AppUser, Seller } from '../types';
import { useAuth } from '../contexts/AuthContext';

// Novos componentes
import { AdminLayout } from './admin/Layout';
import { DashboardView } from './admin/views/DashboardView';
import { InventoryView } from './admin/views/InventoryView';
import { CarFormView } from './admin/views/CarFormView';
import { SellersView, UsersView } from './admin/views/PeopleView';
import { ProfileView } from './admin/views/ProfileView';

// Interfaces FIPE
interface FipeBrand { codigo: string; nome: string; }
interface FipeModel { codigo: number; nome: string; }
interface FipeYear { codigo: string; nome: string; }
interface FipeResult { Valor: string; Marca: string; Modelo: string; AnoModelo: number; Combustivel: string; }

export const Admin = () => {
  const { appUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cars' | 'users' | 'sellers' | 'profile'>('dashboard');
  
  // Data State
  const [cars, setCars] = useState<Car[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  
  // UI State
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form States (Car)
  const [isEditingCar, setIsEditingCar] = useState(false);
  const [carFormData, setCarFormData] = useState<Partial<Car>>({});
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Aux Form States (People)
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userFormData, setUserFormData] = useState<Partial<AppUser>>({ role: 'editor' });
  const [isCreatingSeller, setIsCreatingSeller] = useState(false);
  const [sellerFormData, setSellerFormData] = useState<Partial<Seller>>({ active: true });

  // FIPE State
  const [fipeBrands, setFipeBrands] = useState<FipeBrand[]>([]);
  const [fipeModels, setFipeModels] = useState<FipeModel[]>([]);
  const [fipeYears, setFipeYears] = useState<FipeYear[]>([]);
  const [loadingFipe, setLoadingFipe] = useState(false);
  const [vehicleType, setVehicleType] = useState('carros');
  const [selectedFipeBrand, setSelectedFipeBrand] = useState('');
  const [selectedFipeModel, setSelectedFipeModel] = useState('');

  // --- Data Loading Wrapped in useCallback to prevent loops ---
  const loadAllData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [carsRes, usersRes, sellersRes] = await Promise.all([
        fetchCars({}),
        fetchUsers(),
        fetchSellers()
      ]);

      if (carsRes.error) console.error("Erro ao carregar carros:", carsRes.error);
      
      setCars(carsRes.data || []);
      setUsers(usersRes.data || []);
      setSellers(sellersRes.data || []);
    } catch (error) {
      console.error("Erro crítico ao carregar dados:", error);
      showNotification("Erro de conexão. Tente recarregar.", 'error');
    } finally {
      setDataLoading(false);
    }
  }, []);

  const loadFipeBrands = useCallback(async () => { 
    try { 
      setFipeBrands([]); 
      const res = await fetch(`https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas`); 
      setFipeBrands(await res.json()); 
    } catch (e) {
      console.error("Erro FIPE:", e);
    } 
  }, [vehicleType]);

  // --- Effects ---
  useEffect(() => { 
    loadAllData(); 
  }, [loadAllData]);

  useEffect(() => {
    loadFipeBrands();
  }, [loadFipeBrands]);

  // --- Handlers ---
  const handleLogout = async () => { await signOut(); navigate('/'); };
  
  const showNotification = (msg: string, type: 'success' | 'error') => { 
    setNotification({ msg, type }); 
    setTimeout(() => setNotification(null), 5000); 
  };
  
  const getNumber = (val: any): number => {
    if (!val) return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  // CRUD: Carros
  const handleCarSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carFormData.make || !carFormData.model) return showNotification("Preencha Marca e Modelo", 'error');
    setSaving(true);
    try {
      // 1. Definição de Valores Efetivos (Fallback seguro para valores vazios)
      const effectivePrice = getNumber(carFormData.price);
      const effectiveFipe = getNumber(carFormData.fipeprice);
      const effectiveMileage = getNumber(carFormData.mileage);
      const effectiveYear = getNumber(carFormData.year) || new Date().getFullYear();
      
      // Lógica de Venda
      const isSold = carFormData.status === 'sold';
      
      // Se status for vendido mas data estiver vazia, define HOJE
      const effectiveSoldDate = (isSold && !carFormData.soldDate) 
        ? new Date().toISOString().split('T')[0] 
        : carFormData.soldDate;
        
      const effectiveSoldPrice = isSold ? getNumber(carFormData.soldPrice) : null;
      const effectiveSoldBy = isSold ? carFormData.soldBy : null;

      // 2. Validação Específica de Venda
      if (isSold) {
        if (!effectiveSoldPrice || effectiveSoldPrice <= 0) throw new Error("Informe o valor final da venda.");
        if (!effectiveSoldBy) throw new Error("Selecione o vendedor responsável.");
      }

      // 3. Upload de Imagem
      let finalImage = carFormData.image;
      if (mainImageFile) {
        const url = await uploadCarImage(mainImageFile);
        if (url) finalImage = url;
        else throw new Error("Erro no upload da imagem principal.");
      }
      if (!finalImage) throw new Error("Foto principal obrigatória");
      
      const newGalleryUrls = [];
      for (const file of galleryFiles) {
        const url = await uploadCarImage(file);
        if (url) newGalleryUrls.push(url);
      }
      const finalGallery = [...(carFormData.gallery || []), ...newGalleryUrls];
      
      // 4. Construção do Payload Base
      const payload = {
        ...carFormData,
        price: effectivePrice,
        fipeprice: effectiveFipe,
        mileage: effectiveMileage,
        year: effectiveYear,
        // Garante que campos de venda sejam salvos corretamente
        soldPrice: effectiveSoldPrice,
        soldDate: effectiveSoldDate,
        soldBy: effectiveSoldBy,
        
        image: finalImage,
        gallery: finalGallery,
        is_active: true,
        vehicleType: vehicleType,
        status: carFormData.status || 'available'
      };

      if (carFormData.id) { 
        // 5. Atualização ou Venda
        if (isSold) {
           // Primeiro salva as edições normais
           const { error: updateError } = await updateCar(carFormData.id, payload);
           if (updateError) throw updateError;

           // Dispara a lógica de venda (Edge Function ou Fallback)
           const { error: sellError } = await sellCar(carFormData.id, {
             soldPrice: effectiveSoldPrice!,
             soldDate: effectiveSoldDate!,
             soldBy: effectiveSoldBy!
           });
           if (sellError) throw sellError;

        } else {
           // Atualização comum
           const { error } = await updateCar(carFormData.id, payload); 
           if (error) throw error; 
        }
      } else { 
        // Criação (Remove ID para evitar erro)
        const { id, ...createPayload } = payload;
        const { error } = await createCar(createPayload as any); 
        if (error) throw error; 
      }
      
      showNotification("Veículo salvo com sucesso!", 'success'); 
      setIsEditingCar(false); 
      loadAllData();

    } catch (err: any) { 
      console.error(err);
      showNotification(err.message || "Erro ao salvar", 'error'); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleCarDelete = async (id: string) => { if (confirm("Excluir veículo permanentemente?")) { const { error } = await deleteCar(id); if (error) showNotification(String(error.message), 'error'); else { showNotification("Veículo excluído.", 'success'); loadAllData(); } } };
  const toggleCarStatus = async (car: Car) => { const newStatus = car.status === 'sold' ? 'available' : 'sold'; const { error } = await updateCar(car.id, { status: newStatus }); if (!error) loadAllData(); };

  // CRUD: Sellers & Users
  const handleSellerSave = async (e: React.FormEvent) => { e.preventDefault(); setSaving(true); const { error } = await createSeller(sellerFormData as any); if(error) showNotification(error.message, 'error'); else { showNotification("Consultor adicionado!", 'success'); setIsCreatingSeller(false); loadAllData(); } setSaving(false); };
  const handleSellerDelete = async (id: string) => { if(confirm("Remover?")) { await deleteSeller(id); loadAllData(); } };
  const handleUserSave = async (e: React.FormEvent) => { e.preventDefault(); setSaving(true); const { error } = await createUser(userFormData as any); if(error) showNotification(error.message, 'error'); else { showNotification("Autorizado!", 'success'); setIsCreatingUser(false); loadAllData(); } setSaving(false); };
  const handleUserDelete = async (id: string) => { if(confirm("Revogar?")) { await deleteUser(id); loadAllData(); } };

  // FIPE Logic
  const handleFipeBrand = async (codigo: string) => { setSelectedFipeBrand(codigo); setSelectedFipeModel(''); setFipeModels([]); if(codigo) { setLoadingFipe(true); const res = await fetch(`https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas/${codigo}/modelos`); const data = await res.json(); setFipeModels(data.modelos); setLoadingFipe(false); } };
  const handleFipeModel = async (codigo: string) => { setSelectedFipeModel(codigo); setFipeYears([]); if(codigo) { setLoadingFipe(true); const res = await fetch(`https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas/${selectedFipeBrand}/modelos/${codigo}/anos`); setFipeYears(await res.json()); setLoadingFipe(false); } };
  const handleFipeYear = async (codigo: string) => { if(!codigo) return; setLoadingFipe(true); try { const res = await fetch(`https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas/${selectedFipeBrand}/modelos/${selectedFipeModel}/anos/${codigo}`); const data: FipeResult = await res.json(); const val = parseFloat(data.Valor.replace('R$ ', '').replace('.','').replace(',','.')); 
    const autoDetectCategory = (modelName: string) => { const name = modelName.toLowerCase(); if (vehicleType === 'motos') return 'Moto'; if (vehicleType === 'caminhoes') return 'Caminhão'; if (name.includes('hilux') || name.includes('s10') || name.includes('ranger') || name.includes('toro')) return 'Pickup'; if (name.includes('suv') || name.includes('compass') || name.includes('creta')) return 'SUV'; if (name.includes('sedan') || name.includes('corolla') || name.includes('civic')) return 'Sedan'; return 'Hatch'; };
    setCarFormData(prev => ({ ...prev, make: data.Marca, model: data.Modelo, year: data.AnoModelo, fipeprice: val, fuel: data.Combustivel, category: autoDetectCategory(data.Modelo) })); } catch(e) {} finally { setLoadingFipe(false); } };
  const handleGetLocation = () => { if (!navigator.geolocation) return showNotification("Indisponível", 'error'); setLoadingLocation(true); navigator.geolocation.getCurrentPosition(async (pos) => { try { const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`); const data = await res.json(); const city = data.address.city || data.address.town || data.address.municipality; const state = data.address.state_code || data.address.state; setCarFormData(prev => ({ ...prev, location: `${city}, ${state}` })); showNotification("Localização obtida!", 'success'); } catch (e) { showNotification("Erro ao buscar endereço", 'error'); } finally { setLoadingLocation(false); } }); };

  return (
    <AdminLayout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      appUser={appUser} 
      handleLogout={handleLogout}
      notification={notification}
    >
      {activeTab === 'dashboard' && (
        <DashboardView cars={cars} sellers={sellers} setActiveTab={setActiveTab} />
      )}

      {activeTab === 'profile' && (
        <ProfileView appUser={appUser} showNotification={showNotification} />
      )}

      {activeTab === 'cars' && !isEditingCar && (
        <InventoryView 
          cars={cars} 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          onNew={() => { setCarFormData({ gallery: [], is_active: true, category: 'Hatch', status: 'available', vehicleType: 'carros' }); setMainImagePreview(null); setMainImageFile(null); setGalleryFiles([]); setIsEditingCar(true); }} 
          onEdit={(c: Car) => { setCarFormData({...c}); setVehicleType(c.vehicleType || 'carros'); setMainImagePreview(c.image); setGalleryFiles([]); setIsEditingCar(true); }} 
          onDelete={handleCarDelete} 
          onToggleStatus={toggleCarStatus} 
        />
      )}

      {activeTab === 'cars' && isEditingCar && (
        <CarFormView 
          carFormData={carFormData} 
          setCarFormData={setCarFormData} 
          mainImagePreview={mainImagePreview} 
          setMainImagePreview={setMainImagePreview} 
          galleryFiles={galleryFiles} 
          setGalleryFiles={setGalleryFiles} 
          setMainImageFile={setMainImageFile} 
          onSave={handleCarSave} 
          onCancel={() => setIsEditingCar(false)} 
          saving={saving} 
          vehicleType={vehicleType} 
          setVehicleType={setVehicleType} 
          fipeBrands={fipeBrands} 
          fipeModels={fipeModels} 
          fipeYears={fipeYears} 
          onFipeBrand={handleFipeBrand} 
          onFipeModel={handleFipeModel} 
          onFipeYear={handleFipeYear} 
          loadingFipe={loadingFipe} 
          onGetLocation={handleGetLocation} 
          sellers={sellers} 
        />
      )}

      {activeTab === 'sellers' && (
        <SellersView 
          sellers={sellers} 
          onSave={handleSellerSave} 
          onDelete={handleSellerDelete} 
          saving={saving} 
          isCreating={isCreatingSeller} 
          setIsCreating={setIsCreatingSeller} 
          formData={sellerFormData} 
          setFormData={setSellerFormData} 
        />
      )}

      {activeTab === 'users' && (
        <UsersView 
          users={users} 
          onSave={handleUserSave} 
          onDelete={handleUserDelete} 
          saving={saving} 
          isCreating={isCreatingUser} 
          setIsCreating={setIsCreatingUser} 
          formData={userFormData} 
          setFormData={setUserFormData} 
        />
      )}
    </AdminLayout>
  );
};