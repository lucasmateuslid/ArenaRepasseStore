
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  fetchCars, createCar, updateCar, deleteCar, sellCar, uploadCarImage,
  fetchSellers, createSeller, updateSeller, deleteSeller,
  fetchUsers, createUser, deleteUser, 
  adminCreateUser, adminResetPassword // Novas funções
} from '../supabaseClient';
import { Car, Seller, AppUser } from '../types';

import { AdminLayout } from './admin/Layout';
import { DashboardView } from './admin/views/DashboardView';
import { InventoryView } from './admin/views/InventoryView';
import { CarFormView } from './admin/views/CarFormView';
import { SellersView, UsersView } from './admin/views/PeopleView';
import { ProfileView } from './admin/views/ProfileView';

export const Admin = () => {
  const { appUser, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  // Global Data
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cars' | 'users' | 'sellers' | 'profile'>('dashboard');
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
    const [carsData, sellersData, usersData] = await Promise.all([
      fetchCars(),
      fetchSellers(),
      isAdmin ? fetchUsers() : Promise.resolve({ data: [], error: null })
    ]);

    if (carsData.data) setCars(carsData.data);
    if (sellersData.data) setSellers(sellersData.data);
    if (usersData.data) setUsers(usersData.data);
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
    setIsEditingCar(true);
  };

  const handleEditCar = (car: Car) => {
    setCarFormData({ ...car });
    setMainImagePreview(car.image);
    setMainImageFile(null);
    setGalleryFiles([]);
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
    await requireAdmin(async () => {
      try {
        setSaving(true);

        if (!carFormData.make || !carFormData.model)
          throw new Error('Preencha Marca e Modelo');

        const effectivePrice = getNumber(carFormData.price);
        const effectiveFipe = getNumber(carFormData.fipeprice);
        const effectiveMileage = getNumber(carFormData.mileage);
        const effectiveYear = getNumber(carFormData.year) || new Date().getFullYear();
        
        const effectivePurchasePrice = getNumber(carFormData.purchasePrice);
        const effectiveExpenses = carFormData.expenses || []; 

        const isSold = carFormData.status === 'sold';
        const effectiveSoldDate =
          isSold && !carFormData.soldDate
            ? new Date().toISOString().split('T')[0]
            : carFormData.soldDate;

        const effectiveSoldPrice = isSold ? getNumber(carFormData.soldPrice) : null;
        const effectiveSoldBy = isSold ? carFormData.soldBy : null;

        if (isSold) {
          if (!effectiveSoldPrice) throw new Error('Informe o valor final.');
          if (!effectiveSoldBy) throw new Error('Selecione o vendedor.');
        }

        let finalImage = carFormData.image;
        if (mainImageFile) {
          const url = await uploadCarImage(mainImageFile);
          if (!url) throw new Error('Erro no upload da imagem principal.');
          finalImage = url;
        }

        if (!finalImage) throw new Error('Foto principal obrigatória.');

        const newGalleryUrls: string[] = [];
        for (const file of galleryFiles) {
          const url = await uploadCarImage(file);
          if (url) newGalleryUrls.push(url);
        }

        const payload: any = {
          ...carFormData,
          price: effectivePrice,
          fipeprice: effectiveFipe,
          mileage: effectiveMileage,
          year: effectiveYear,
          image: finalImage,
          gallery: [...(carFormData.gallery || []), ...newGalleryUrls],
          
          purchasePrice: effectivePurchasePrice,
          expenses: effectiveExpenses,

          soldPrice: effectiveSoldPrice,
          soldDate: effectiveSoldDate,
          soldBy: effectiveSoldBy,
          vehicleType,
          is_active: true,
          status: carFormData.status || 'available'
        };

        if (carFormData.id) {
          await updateCar(carFormData.id, payload);
          if (isSold) {
             await sellCar(carFormData.id, {
                soldPrice: effectiveSoldPrice!,
                soldDate: effectiveSoldDate!,
                soldBy: effectiveSoldBy!
             });
          }
        } else {
          const { id, ...createPayload } = payload;
          await createCar(createPayload);
        }

        showNotification('Veículo salvo!', 'success');
        setIsEditingCar(false);
        loadAllData();

      } catch (err: any) {
        showNotification(err.message || 'Erro ao salvar.', 'error');
      } finally {
        setSaving(false);
      }
    });
  };

  // --- Handlers: Sellers ---
  const handleSellerSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await requireAdmin(async () => {
      try {
        setSaving(true);
        if (sellerFormData.id) {
           await updateSeller(sellerFormData.id, sellerFormData);
           showNotification('Vendedor atualizado.', 'success');
        } else {
           // Fluxo de criação de vendedor
           // 1. Cria usuário 'editor' no Auth (com senha padrao 123456)
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

           // 2. Cria registro do vendedor
           const { id, ...data } = sellerFormData as any;
           await createSeller({ ...data, active: true });
        }
        
        setIsCreatingSeller(false);
        setSellerFormData({});
        loadAllData();
      } catch (err: any) {
        showNotification('Erro: ' + err.message, 'error');
      } finally {
        setSaving(false);
      }
    });
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
    await requireAdmin(async () => {
      try {
        setSaving(true);
        const { name, email, role } = userFormData as any;

        // Cria usuário real no Auth via Edge Function
        const { error } = await adminCreateUser(email, name, role || 'editor');
        
        if(error) throw error;
        
        showNotification('Usuário criado com senha padrão "123456".', 'success');
        setIsCreatingUser(false);
        setUserFormData({});
        loadAllData();
      } catch (err: any) {
        showNotification('Erro ao criar usuário: ' + err.message, 'error');
      } finally {
        setSaving(false);
      }
    });
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
    const brandName = fipeBrands.find(b => b.codigo === codigo)?.nome;
    if (brandName) setCarFormData(prev => ({ ...prev, make: brandName }));
    
    const data = await fetchFipe(`https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas/${codigo}/modelos`);
    setFipeModels(data.modelos || []);
    setLoadingFipe(false);
  };

  const onFipeModelWrapper = async (codigo: string) => {
    setLoadingFipe(true);
    setSelectedModelCode(codigo);
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
          onResetPassword={handleResetPassword} // Passado para a view
          saving={saving}
          isCreating={isCreatingUser}
          setIsCreating={setIsCreatingUser}
          formData={userFormData}
          setFormData={setUserFormData}
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
