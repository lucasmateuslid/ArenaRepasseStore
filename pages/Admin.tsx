
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  fetchCars, createCar, updateCar, deleteCar, sellCar, uploadCarImage,
  fetchSellers, createSeller, updateSeller, deleteSeller,
  fetchUsers, deleteUser, 
  adminCreateUser, adminResetPassword, parseError
} from '../supabaseClient';
import { Car, Seller, AppUser } from '../types';

import { AdminLayout } from './admin/Layout';
import { DashboardView } from './admin/views/DashboardView';
import { InventoryView } from './admin/views/InventoryView';
import { CarFormView } from './admin/views/CarFormView';
import { SellersView, UsersView } from './admin/views/PeopleView';
import { ProfileView } from './admin/views/ProfileView';
import { ReportsView } from './admin/views/ReportsView';
import { SettingsView } from './admin/views/SettingsView';

// Helper central robusto para mapear categoria -> vehicleType
export const mapCategoryToType = (category: string | undefined): string => {
  if (!category) return 'carros';
  const cat = category.toLowerCase();
  
  // Mapeamento de MOTOS
  if (['moto', 'motos', 'motocicleta', 'scooter', 'bis', 'fan', 'titan'].some(v => cat.includes(v))) {
    return 'motos';
  }
  
  // Mapeamento de PESADOS
  if (['caminhão', 'caminhao', 'van', 'pesados', 'truck', 'onibus', 'ônibus', 'ducato', 'master', 'sprinter', 'furgão'].some(v => cat.includes(v))) {
    return 'caminhoes';
  }
  
  // Padrão para CARROS
  return 'carros';
};

export const Admin = () => {
  const { appUser, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'cars' | 'users' | 'sellers' | 'profile' | 'reports' | 'settings'>('dashboard');
  const [cars, setCars] = useState<Car[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingCar, setIsEditingCar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>(''); 
  
  const [carFormData, setCarFormData] = useState<Partial<Car>>({});
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

  const [vehicleType, setVehicleType] = useState('carros');
  const [fipeBrands, setFipeBrands] = useState<any[]>([]);
  const [fipeModels, setFipeModels] = useState<any[]>([]);
  const [fipeYears, setFipeYears] = useState<any[]>([]);
  const [loadingFipe, setLoadingFipe] = useState(false);
  
  const [selectedBrandCode, setSelectedBrandCode] = useState('');
  const [selectedModelCode, setSelectedModelCode] = useState('');

  const [isCreatingSeller, setIsCreatingSeller] = useState(false);
  const [sellerFormData, setSellerFormData] = useState<Partial<Seller>>({});
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userFormData, setUserFormData] = useState<Partial<AppUser>>({});

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const getNumber = (val: any) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    return Number(val) || 0;
  };

  const requireAdmin = async (callback: () => Promise<void>) => {
    if (!isAdmin) {
      showNotification('Acesso negado. Apenas administradores.', 'error');
      return;
    }
    await callback();
  };

  const loadAllData = useCallback(async () => {
    try {
      const [carsData, sellersData, usersData] = await Promise.all([
        fetchCars(),
        fetchSellers(),
        isAdmin ? fetchUsers() : Promise.resolve({ data: [], error: null })
      ]);
      
      if (carsData.error) console.error("Erro carros:", carsData.error);
      if (sellersData.error) console.error("Erro vendedores:", sellersData.error);
      if (usersData.error) console.error("Erro usuários:", usersData.error);

      if (carsData.data) setCars(carsData.data);
      if (sellersData.data) setSellers(sellersData.data);
      if (usersData.data) setUsers(usersData.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", parseError(error));
    }
  }, [isAdmin]);

  useEffect(() => { loadAllData(); }, [loadAllData]);

  const handleNewCar = () => {
    setCarFormData({ status: 'available', gallery: [], vehicleType: 'carros', category: 'Hatch' });
    setMainImageFile(null);
    setMainImagePreview(null);
    setGalleryFiles([]);
    setUploadStatus('');
    setVehicleType('carros');
    setSelectedBrandCode('');
    setSelectedModelCode('');
    setFipeModels([]);
    setFipeYears([]);
    setIsEditingCar(true);
  };

  const handleEditCar = (car: Car) => {
    setCarFormData({ ...car });
    setMainImagePreview(car.image);
    setMainImageFile(null);
    setGalleryFiles([]);
    setUploadStatus('');
    setVehicleType(car.vehicleType || mapCategoryToType(car.category));
    setSelectedBrandCode('');
    setSelectedModelCode('');
    setFipeModels([]);
    setFipeYears([]);
    setIsEditingCar(true);
  };

  const handleDeleteCar = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este veículo?')) {
      requireAdmin(async () => {
        const { error } = await deleteCar(id);
        if (error) {
          showNotification(error, 'error');
        } else {
          showNotification('Veículo excluído.', 'success');
          loadAllData();
        }
      });
    }
  };

  const handleCarSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return; 
    setSaving(true); 
    setUploadStatus('Processando imagens...');

    try {
        if (!isAdmin) throw new Error("Permissão negada.");
        if (!carFormData.make || !carFormData.model) throw new Error('Marca e Modelo são obrigatórios.');

        let finalImage = carFormData.image;
        if (mainImageFile) {
          const url = await uploadCarImage(mainImageFile);
          if (url) finalImage = url;
          else throw new Error('Falha no upload da imagem principal.');
        }

        if (!finalImage) throw new Error('Foto principal é obrigatória.');

        const currentGallery = carFormData.gallery || [];
        const newGalleryUrls: string[] = [];
        if (galleryFiles.length > 0) {
           const uploadPromises = galleryFiles.map(file => uploadCarImage(file));
           const results = await Promise.all(uploadPromises);
           results.forEach(url => { if (url) newGalleryUrls.push(url); });
        }
        const finalGallery = [...currentGallery, ...newGalleryUrls];

        // Sincronização Final Crítica: Força o vehicleType correto baseado na categoria
        const finalType = mapCategoryToType(carFormData.category);

        const payload: any = {
          ...carFormData,
          price: getNumber(carFormData.price),
          fipeprice: getNumber(carFormData.fipeprice),
          mileage: getNumber(carFormData.mileage),
          year: getNumber(carFormData.year) || new Date().getFullYear(),
          image: finalImage,
          gallery: finalGallery,
          purchasePrice: getNumber(carFormData.purchasePrice),
          expenses: carFormData.expenses || [],
          vehicleType: finalType,
          status: carFormData.status || 'available'
        };

        if (carFormData.id) {
          const { error } = await updateCar(carFormData.id, payload);
          if (error) throw new Error(error);
        } else {
          const { id, ...createPayload } = payload;
          const { error } = await createCar(createPayload);
          if (error) throw new Error(error);
        }

        showNotification('Veículo salvo com sucesso!', 'success');
        setIsEditingCar(false);
        loadAllData();
    } catch (err: any) {
      showNotification(parseError(err), 'error');
    } finally {
      setSaving(false);
      setUploadStatus('');
    }
  };

  const handleSellerSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await requireAdmin(async () => {
        if (sellerFormData.id) {
          const { error } = await updateSeller(sellerFormData.id, sellerFormData);
          if (error) throw new Error(error);
        } else {
          const { error } = await createSeller({ ...(sellerFormData as any), active: true });
          if (error) throw new Error(error);
        }
        setIsCreatingSeller(false);
        loadAllData();
      });
    } catch (err: any) { 
      showNotification(parseError(err), 'error'); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleDeleteSeller = (id: string) => {
    if (window.confirm('Excluir vendedor?')) requireAdmin(async () => { 
      const { error } = await deleteSeller(id);
      if (error) showNotification(error, 'error');
      loadAllData(); 
    });
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm('Excluir usuário?')) requireAdmin(async () => { 
      const { error } = await deleteUser(id);
      if (error) showNotification(error, 'error');
      loadAllData(); 
    });
  };

  const handleResetPassword = async (userId: string) => {
    if (window.confirm('Resetar senha para 123456?')) {
      requireAdmin(async () => {
        const { error } = await adminResetPassword(userId);
        if (error) showNotification(error, 'error');
        else showNotification('Senha resetada para 123456', 'success');
      });
    }
  };

  const handleUserSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await requireAdmin(async () => {
        const { name, email, role } = userFormData as any;
        const { error } = await adminCreateUser(email, name, role || 'editor');
        if (error) throw new Error(error);
        setIsCreatingUser(false);
        loadAllData();
      });
    } catch (err: any) { 
      showNotification(parseError(err), 'error'); 
    } finally { 
      setSaving(false); 
    }
  };

  const fetchFipe = async (url: string) => { try { const res = await fetch(url); return await res.json(); } catch { return []; } };

  useEffect(() => {
    if (isEditingCar) {
      setLoadingFipe(true);
      fetchFipe(`https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas`)
        .then(data => { setFipeBrands(data); setLoadingFipe(false); });
    }
  }, [vehicleType, isEditingCar]);

  const onFipeBrandWrapper = async (codigo: string) => {
    setLoadingFipe(true); setSelectedBrandCode(codigo); setSelectedModelCode(''); setFipeModels([]);
    const brandName = fipeBrands.find(b => b.codigo === codigo)?.nome;
    if (brandName) setCarFormData(prev => ({ ...prev, make: brandName }));
    const data = await fetchFipe(`https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas/${codigo}/modelos`);
    setFipeModels(data.modelos || []); setLoadingFipe(false);
  };

  const onFipeModelWrapper = async (codigo: string) => {
    setLoadingFipe(true); setSelectedModelCode(codigo);
    const modelName = fipeModels.find(m => String(m.codigo) === String(codigo))?.nome;
    if(modelName) setCarFormData(prev => ({ ...prev, model: modelName }));
    const data = await fetchFipe(`https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas/${selectedBrandCode}/modelos/${codigo}/anos`);
    setFipeYears(data || []); setLoadingFipe(false);
  };

  const onFipeYearWrapper = async (codigo: string) => {
    setLoadingFipe(true);
    const data = await fetchFipe(`https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas/${selectedBrandCode}/modelos/${selectedModelCode}/anos/${codigo}`);
    if (data) {
      const fipePrice = parseFloat(data.Valor.replace('R$ ', '').replace('.', '').replace(',', '.'));
      
      // Auto-detect categoria se for Moto ou Caminhão vindo da FIPE
      let autoCategory = carFormData.category || 'Hatch';
      if (vehicleType === 'motos') autoCategory = 'Moto';
      if (vehicleType === 'caminhoes') autoCategory = 'Caminhão';

      setCarFormData(prev => ({ 
        ...prev, 
        year: data.AnoModelo, 
        fipeprice: fipePrice,
        category: autoCategory,
        vehicleType: vehicleType
      }));
    }
    setLoadingFipe(false);
  };

  const handleLogout = async () => { await signOut(); navigate('/login'); };

  return (
    <AdminLayout activeTab={activeTab as any} setActiveTab={setActiveTab as any} appUser={appUser} handleLogout={handleLogout} notification={notification}>
      {activeTab === 'dashboard' && <DashboardView cars={cars} sellers={sellers} setActiveTab={setActiveTab as any} isAdmin={isAdmin} />}
      {activeTab === 'reports' && (isAdmin ? <ReportsView cars={cars} /> : <div className="p-10 text-center">Acesso Restrito</div>)}
      {activeTab === 'settings' && (isAdmin ? <SettingsView showNotification={showNotification} /> : <div className="p-10 text-center">Acesso Restrito</div>)}
      {activeTab === 'cars' && (!isEditingCar ? <InventoryView cars={cars} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onNew={handleNewCar} onEdit={handleEditCar} onDelete={handleDeleteCar} onToggleStatus={() => {}} isAdmin={isAdmin} /> : <CarFormView carFormData={carFormData} setCarFormData={setCarFormData} mainImagePreview={mainImagePreview} setMainImagePreview={setMainImagePreview} galleryFiles={galleryFiles} setGalleryFiles={setGalleryFiles} setMainImageFile={setMainImageFile} onSave={handleCarSave} onCancel={() => setIsEditingCar(false)} saving={saving} uploadStatus={uploadStatus} vehicleType={vehicleType} setVehicleType={setVehicleType} fipeBrands={fipeBrands} fipeModels={fipeModels} fipeYears={fipeYears} onFipeBrand={onFipeBrandWrapper} onFipeModel={onFipeModelWrapper} onFipeYear={onFipeYearWrapper} loadingFipe={loadingFipe} onGetLocation={() => {}} sellers={sellers} selectedBrandCode={selectedBrandCode} selectedModelCode={selectedModelCode} />)}
      {activeTab === 'sellers' && <SellersView sellers={sellers} onSave={handleSellerSave} onDelete={handleDeleteSeller} saving={saving} isCreating={isCreatingSeller} setIsCreating={setIsCreatingSeller} formData={sellerFormData} setFormData={setSellerFormData} isAdmin={isAdmin} />}
      {activeTab === 'users' && <UsersView users={users} onSave={handleUserSave} onDelete={handleDeleteUser} onResetPassword={handleResetPassword} saving={saving} isCreating={isCreatingUser} setIsCreating={setIsCreatingUser} formData={userFormData} setFormData={setUserFormData} onApprove={loadAllData} />}
      {activeTab === 'profile' && <ProfileView appUser={appUser} showNotification={showNotification} />}
    </AdminLayout>
  );
};
