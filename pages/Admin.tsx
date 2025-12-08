
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  fetchCars, createCar, updateCar, deleteCar, sellCar, uploadCarImage,
  fetchSellers, createSeller, updateSeller, deleteSeller,
  fetchUsers, createUser, deleteUser, 
  adminCreateUser, adminResetPassword 
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

export const Admin = () => {
  const { appUser, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  // Global Data
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cars' | 'users' | 'sellers' | 'profile' | 'reports' | 'settings'>('dashboard');
  const [cars, setCars] = useState<Car[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  // Inventory View State
  const [searchTerm, setSearchTerm] = useState('');

  // Car Form State
  const [isEditingCar, setIsEditingCar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [carFormData, setCarFormData] = useState<Partial<Car>>({});
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

  // FIPE State
  const [vehicleType, setVehicleType] = useState('carros');
  const [fipeBrands, setFipeBrands] = useState<any[]>([]);
  const [fipeModels, setFipeModels] = useState<any[]>([]);
  const [fipeYears, setFipeYears] = useState<any[]>([]);
  const [loadingFipe, setLoadingFipe] = useState(false);
  
  const [selectedBrandCode, setSelectedBrandCode] = useState('');
  const [selectedModelCode, setSelectedModelCode] = useState('');

  // People State
  const [isCreatingSeller, setIsCreatingSeller] = useState(false);
  const [sellerFormData, setSellerFormData] = useState<Partial<Seller>>({});
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userFormData, setUserFormData] = useState<Partial<AppUser>>({});

  // --- Helpers ---
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

  // --- Data Loading ---
  const loadAllData = useCallback(async () => {
    try {
      const [carsData, sellersData, usersData] = await Promise.all([
        fetchCars(),
        fetchSellers(),
        isAdmin ? fetchUsers() : Promise.resolve({ data: [], error: null })
      ]);

      if (carsData.data) setCars(carsData.data);
      if (sellersData.data) setSellers(sellersData.data);
      if (usersData.data) setUsers(usersData.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // --- Handlers: Car ---
  const handleNewCar = () => {
    setCarFormData({ status: 'available', gallery: [] });
    setMainImageFile(null);
    setMainImagePreview(null);
    setGalleryFiles([]);
    
    // Reset FIPE selection
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
    
    // Reset FIPE selection (edit mode doesn't autoload fipe steps yet)
    setSelectedBrandCode('');
    setSelectedModelCode('');
    setFipeModels([]);
    setFipeYears([]);

    setIsEditingCar(true);
  };

  const handleDeleteCar = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este veículo?')) {
      requireAdmin(async () => {
        await deleteCar(id);
        showNotification('Veículo excluído.', 'success');
        loadAllData();
      });
    }
  };

  const handleCarSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return; 
    setSaving(true); 

    try {
        if (!isAdmin) throw new Error("Permissão negada.");

        if (!carFormData.make || !carFormData.model)
          throw new Error('Preencha Marca e Modelo.');
        if (!carFormData.price || Number(carFormData.price) <= 0) 
          throw new Error('Preencha o valor de venda corretamente.');

        let finalImage = carFormData.image;
        
        if (mainImageFile) {
          const url = await uploadCarImage(mainImageFile);
          if (url) {
            finalImage = url;
          } else {
            throw new Error('Falha no upload da imagem principal. Tente novamente.');
          }
        }

        if (!finalImage) throw new Error('Foto principal é obrigatória.');

        const currentGallery = carFormData.gallery || [];
        const newGalleryUrls: string[] = [];
        
        if (galleryFiles.length > 0) {
           const uploadPromises = galleryFiles.map(file => uploadCarImage(file));
           const results = await Promise.all(uploadPromises);
           
           const failedCount = results.filter(r => r === null).length;
           if (failedCount > 0) {
              console.warn(`${failedCount} imagens da galeria falharam no upload.`);
           }

           results.forEach(url => {
             if (url) newGalleryUrls.push(url);
           });
        }
        
        const finalGallery = [...currentGallery, ...newGalleryUrls];

        const effectivePrice = getNumber(carFormData.price);
        const effectiveFipe = getNumber(carFormData.fipeprice);
        const effectiveMileage = getNumber(carFormData.mileage);
        const effectiveYear = getNumber(carFormData.year) || new Date().getFullYear();
        const effectivePurchasePrice = getNumber(carFormData.purchasePrice);
        
        const isSold = carFormData.status === 'sold';
        const effectiveSoldPrice = isSold ? getNumber(carFormData.soldPrice) : null;
        const effectiveSoldDate = isSold ? (carFormData.soldDate || new Date().toISOString().split('T')[0]) : null;
        const effectiveSoldBy = isSold ? carFormData.soldBy : null;

        if (isSold && (!effectiveSoldPrice || !effectiveSoldBy)) {
           throw new Error('Para marcar como vendido, informe o Valor Final e o Vendedor.');
        }

        const payload: any = {
          ...carFormData,
          price: effectivePrice,
          fipeprice: effectiveFipe,
          mileage: effectiveMileage,
          year: effectiveYear,
          image: finalImage,
          gallery: finalGallery,
          purchasePrice: effectivePurchasePrice,
          expenses: carFormData.expenses || [],
          soldPrice: effectiveSoldPrice,
          soldDate: effectiveSoldDate,
          soldBy: effectiveSoldBy,
          vehicleType: vehicleType,
          is_active: true,
          status: carFormData.status || 'available'
        };

        let result;
        if (carFormData.id) {
          result = await updateCar(carFormData.id, payload);
          if (isSold && !result.error) {
             await sellCar(carFormData.id, {
                soldPrice: effectiveSoldPrice!,
                soldDate: effectiveSoldDate!,
                soldBy: effectiveSoldBy!
             });
          }
        } else {
          const { id, ...createPayload } = payload;
          result = await createCar(createPayload);
        }

        if (result.error) {
          console.error("Erro do Supabase:", result.error);
          throw new Error(result.error.message || "Erro ao salvar no banco de dados.");
        }

        showNotification('Veículo salvo com sucesso!', 'success');
        setIsEditingCar(false);
        setCarFormData({});
        setGalleryFiles([]);
        setMainImageFile(null);
        loadAllData();

    } catch (err: any) {
      console.error("Erro no processo de salvamento:", err);
      showNotification(err.message || 'Ocorreu um erro inesperado.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // --- Handlers: Sellers ---
  const handleSellerSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await requireAdmin(async () => {
        if (sellerFormData.id) {
           await updateSeller(sellerFormData.id, sellerFormData);
           showNotification('Vendedor atualizado.', 'success');
        } else {
           if (sellerFormData.email) {
             const { data: authData, error: authError } = await adminCreateUser(
               sellerFormData.email, 
               sellerFormData.name || 'Vendedor', 
               'editor'
             );
             if (authError) {
               console.warn("Não foi possível criar o login do vendedor:", authError);
               showNotification('Vendedor criado, mas erro ao gerar login: ' + authError.message, 'error');
             } else {
               showNotification('Login de vendedor gerado: ' + sellerFormData.email + ' / 123456', 'success');
             }
           }
           const { id, ...data } = sellerFormData as any;
           await createSeller({ ...data, active: true });
        }
        setIsCreatingSeller(false);
        setSellerFormData({});
        loadAllData();
      });
    } catch (err: any) {
      showNotification('Erro: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSeller = (id: string) => {
    if (window.confirm('Excluir vendedor?')) {
      requireAdmin(async () => {
        await deleteSeller(id);
        loadAllData();
      });
    }
  };

  // --- Handlers: Users ---
  const handleUserSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await requireAdmin(async () => {
        const { name, email, role } = userFormData as any;
        const { error } = await adminCreateUser(email, name, role || 'editor');
        if(error) throw error;
        showNotification('Usuário criado com senha padrão "123456".', 'success');
        setIsCreatingUser(false);
        setUserFormData({});
        loadAllData();
      });
    } catch (err: any) {
      showNotification('Erro ao criar usuário: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm('Remover acesso e deletar usuário?')) {
      requireAdmin(async () => {
        await deleteUser(id);
        showNotification('Usuário removido.', 'success');
        loadAllData();
      });
    }
  };

  const handleResetPassword = async (id: string) => {
    if (window.confirm('Resetar a senha deste usuário para "123456"?')) {
      requireAdmin(async () => {
         const { error } = await adminResetPassword(id);
         if (error) showNotification('Erro ao resetar senha.', 'error');
         else showNotification('Senha resetada para "123456".', 'success');
      });
    }
  };

  // --- FIPE Logic ---
  const fetchFipe = async (url: string) => {
    try {
      const res = await fetch(url);
      return await res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  useEffect(() => {
    if (isEditingCar) {
      setLoadingFipe(true);
      fetchFipe(`https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas`)
        .then(data => { setFipeBrands(data); setLoadingFipe(false); });
    }
  }, [vehicleType, isEditingCar]);

  const onFipeBrandWrapper = async (codigo: string) => {
    setLoadingFipe(true);
    setSelectedBrandCode(codigo);
    // Limpa seleções anteriores
    setSelectedModelCode('');
    setFipeModels([]);
    setFipeYears([]);
    
    const brandName = fipeBrands.find(b => b.codigo === codigo)?.nome;
    if (brandName) setCarFormData(prev => ({ ...prev, make: brandName }));
    
    const data = await fetchFipe(`https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas/${codigo}/modelos`);
    setFipeModels(data.modelos || []);
    setLoadingFipe(false);
  };

  const onFipeModelWrapper = async (codigo: string) => {
    setLoadingFipe(true);
    setSelectedModelCode(codigo);
    // Limpa ano anterior
    setFipeYears([]);
    
    const modelName = fipeModels.find(m => String(m.codigo) === String(codigo))?.nome;
    if(modelName) setCarFormData(prev => ({ ...prev, model: modelName }));
    
    const data = await fetchFipe(`https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas/${selectedBrandCode}/modelos/${codigo}/anos`);
    setFipeYears(data || []);
    setLoadingFipe(false);
  };

  const onFipeYearWrapper = async (codigo: string) => {
    setLoadingFipe(true);
    const data = await fetchFipe(`https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas/${selectedBrandCode}/modelos/${selectedModelCode}/anos/${codigo}`);
    if (data) {
      const fipePrice = parseFloat(data.Valor.replace('R$ ', '').replace('.', '').replace(',', '.'));
      const fuelMap: Record<string, string> = { 'Gasolina': 'Gasolina', 'Diesel': 'Diesel', 'Ethanol': 'Flex', 'Flex': 'Flex' };
      setCarFormData(prev => ({
        ...prev,
        year: data.AnoModelo,
        fuel: fuelMap[data.Combustivel] || data.Combustivel,
        fipeprice: fipePrice
      }));
    }
    setLoadingFipe(false);
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          const data = await res.json();
          const city = data.address.city || data.address.town || data.address.village;
          const state = data.address.state_district || data.address.state;
          if(city) setCarFormData(prev => ({ ...prev, location: `${city}, ${state || ''}` }));
        } catch (e) {
          showNotification('Erro ao obter localização.', 'error');
        }
      });
    } else {
      showNotification('Geolocalização não suportada.', 'error');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <AdminLayout 
      activeTab={activeTab as any} 
      setActiveTab={setActiveTab as any} 
      appUser={appUser} 
      handleLogout={handleLogout}
      notification={notification}
    >
      {activeTab === 'dashboard' && (
        <DashboardView 
          cars={cars} 
          sellers={sellers} 
          setActiveTab={setActiveTab as any} 
          isAdmin={isAdmin} 
        />
      )}

      {activeTab === 'reports' && (
        isAdmin ? (
          <ReportsView cars={cars} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
             <i className="fa-solid fa-lock text-4xl mb-4"></i>
             <h2 className="text-xl font-bold">Acesso Restrito</h2>
             <p>Apenas administradores podem visualizar relatórios financeiros.</p>
          </div>
        )
      )}

      {activeTab === 'settings' && (
        isAdmin ? (
          <SettingsView showNotification={showNotification} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
             <i className="fa-solid fa-lock text-4xl mb-4"></i>
             <h2 className="text-xl font-bold">Acesso Restrito</h2>
             <p>Apenas administradores podem alterar configurações da empresa.</p>
          </div>
        )
      )}

      {activeTab === 'cars' && (
        !isEditingCar ? (
          <InventoryView 
            cars={cars} 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm}
            onNew={handleNewCar}
            onEdit={handleEditCar}
            onDelete={handleDeleteCar}
            onToggleStatus={() => {}} 
            isAdmin={isAdmin}
          />
        ) : (
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
            onFipeBrand={onFipeBrandWrapper}
            onFipeModel={onFipeModelWrapper}
            onFipeYear={onFipeYearWrapper}
            loadingFipe={loadingFipe}
            onGetLocation={handleGetLocation}
            sellers={sellers}
            // Passando o estado para controlar os resets
            selectedBrandCode={selectedBrandCode}
            selectedModelCode={selectedModelCode}
          />
        )
      )}

      {activeTab === 'sellers' && (
        <SellersView 
          sellers={sellers}
          onSave={handleSellerSave}
          onDelete={handleDeleteSeller}
          saving={saving}
          isCreating={isCreatingSeller}
          setIsCreating={setIsCreatingSeller}
          formData={sellerFormData}
          setFormData={setSellerFormData}
          isAdmin={isAdmin}
        />
      )}

      {activeTab === 'users' && (
        <UsersView 
          users={users}
          onSave={handleUserSave}
          onDelete={handleDeleteUser}
          onResetPassword={handleResetPassword}
          saving={saving}
          isCreating={isCreatingUser}
          setIsCreating={setIsCreatingUser}
          formData={userFormData}
          setFormData={setUserFormData}
          onApprove={() => {
              showNotification('Acesso aprovado com sucesso!', 'success');
              loadAllData();
          }}
        />
      )}

      {activeTab === 'profile' && (
        <ProfileView 
           appUser={appUser}
           showNotification={showNotification}
        />
      )}
    </AdminLayout>
  );
};
