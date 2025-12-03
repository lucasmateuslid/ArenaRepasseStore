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

// UI Layout
import { AdminLayout } from './admin/Layout';

// Views
import { DashboardView } from './admin/views/DashboardView';
import { InventoryView } from './admin/views/InventoryView';
import { CarFormView } from './admin/views/CarFormView';
import { SellersView, UsersView } from './admin/views/PeopleView';
import { ProfileView } from './admin/views/ProfileView';

// FIPE Interfaces
interface FipeBrand { codigo: string; nome: string; }
interface FipeModel { codigo: number; nome: string; }
interface FipeYear { codigo: string; nome: string; }
interface FipeResult { Valor: string; Marca: string; Modelo: string; AnoModelo: number; Combustivel: string; }

export const Admin = () => {
  const { appUser, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'cars' | 'users' | 'sellers' | 'profile'>('dashboard');

  // Data
  const [cars, setCars] = useState<Car[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // UI
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] =
    useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Car Form
  const [isEditingCar, setIsEditingCar] = useState(false);
  const [carFormData, setCarFormData] = useState<Partial<Car>>({});
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Users & Sellers
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userFormData, setUserFormData] = useState<Partial<AppUser>>({ role: 'editor' });

  const [isCreatingSeller, setIsCreatingSeller] = useState(false);
  const [sellerFormData, setSellerFormData] = useState<Partial<Seller>>({ active: true });

  // FIPE
  const [fipeBrands, setFipeBrands] = useState<FipeBrand[]>([]);
  const [fipeModels, setFipeModels] = useState<FipeModel[]>([]);
  const [fipeYears, setFipeYears] = useState<FipeYear[]>([]);
  const [loadingFipe, setLoadingFipe] = useState(false);
  const [vehicleType, setVehicleType] = useState('carros');
  const [selectedFipeBrand, setSelectedFipeBrand] = useState('');
  const [selectedFipeModel, setSelectedFipeModel] = useState('');

  // 📌 Centraliza verificação de admin (melhoria importante)
  const requireAdmin = useCallback(
    (callback: Function) => {
      if (!isAdmin) {
        showNotification('Ação restrita a administradores.', 'error');
        return;
      }
      return callback();
    },
    [isAdmin]
  );

  // Notifications
  const showNotification = (msg: string, type: 'success' | 'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Safe number parse
  const getNumber = (val: any): number => {
    if (!val) return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  // Load Data
  const loadAllData = useCallback(async () => {
    setDataLoading(true);
    try {
      const carsPromise = fetchCars({});
      const sellersPromise = fetchSellers();
      const usersPromise = isAdmin ? fetchUsers() : Promise.resolve({ data: [], error: null });

      const [carsRes, usersRes, sellersRes] = await Promise.all([
        carsPromise, usersPromise, sellersPromise
      ]);

      if (!carsRes.error) setCars(carsRes.data || []);
      setSellers(sellersRes.data || []);
      if (isAdmin) setUsers(usersRes.data || []);
    } catch (error) {
      console.error(error);
      showNotification('Erro ao carregar dados.', 'error');
    } finally {
      setDataLoading(false);
    }
  }, [isAdmin]);

  // FIPE Loading
  const loadFipeBrands = useCallback(async () => {
    try {
      setFipeBrands([]);
      const res = await fetch(`https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas`);
      setFipeBrands(await res.json());
    } catch {
      showNotification('Erro ao carregar FIPE.', 'error');
    }
  }, [vehicleType]);

  // Effect: Load Data
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Effect: FIPE
  useEffect(() => {
    loadFipeBrands();
  }, [loadFipeBrands]);

  // Protege aba de usuários
  useEffect(() => {
    if (activeTab === 'users' && !isAdmin) {
      setActiveTab('dashboard');
      showNotification('Acesso restrito a administradores.', 'error');
    }
  }, [activeTab, isAdmin]);

  // Logout
  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // 📌 Car Save (refatorado)
  const handleCarSave = async (e: React.FormEvent) => {
    e.preventDefault();
    return requireAdmin(async () => {
      try {
        setSaving(true);

        if (!carFormData.make || !carFormData.model)
          throw new Error('Preencha Marca e Modelo');

        const effectivePrice = getNumber(carFormData.price);
        const effectiveFipe = getNumber(carFormData.fipeprice);
        const effectiveMileage = getNumber(carFormData.mileage);
        const effectiveYear = getNumber(carFormData.year) || new Date().getFullYear();

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

        const newGalleryUrls = [];
        for (const file of galleryFiles) {
          const url = await uploadCarImage(file);
          if (url) newGalleryUrls.push(url);
        }

        const payload = {
          ...carFormData,
          price: effectivePrice,
          fipeprice: effectiveFipe,
          mileage: effectiveMileage,
          year: effectiveYear,
          image: finalImage,
          gallery: [...(carFormData.gallery || []), ...newGalleryUrls],
          soldPrice: effectiveSoldPrice,
          soldDate: effectiveSoldDate,
          soldBy: effectiveSoldBy,
          vehicleType,
          is_active: true,
          status: carFormData.status || 'available'
        };

        if (carFormData.id) {
          await updateCar(carFormData.id, payload);
          if (isSold) await sellCar(carFormData.id, {
            soldPrice: effectiveSoldPrice!,
            soldDate: effectiveSoldDate!,
            soldBy: effectiveSoldBy!
          });
        } else {
          const { id, ...createPayload } = payload;
          await createCar(createPayload as any);
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

  const handleCarDelete = (id: string) => 
    requireAdmin(async () => {
      if (confirm('Excluir veículo permanentemente?')) {
        const { error } = await deleteCar(id);
        if (error) showNotification(error.message, 'error');
        else {
          showNotification('Veículo removido.', 'success');
          loadAllData();
        }
      }
    });

  const toggleCarStatus = (car: Car) =>
    requireAdmin(async () => {
      const newStatus = car.status === 'sold' ? 'available' : 'sold';
      await updateCar(car.id, { status: newStatus });
      loadAllData();
    });

  // Sellers CRUD
  const handleSellerSave = (e: React.FormEvent) => {
    e.preventDefault();
    return requireAdmin(async () => {
      setSaving(true);
      const { error } = await createSeller(sellerFormData as any);
      if (error) showNotification(error.message, 'error');
      else {
        showNotification('Consultor cadastrado!', 'success');
        setIsCreatingSeller(false);
        loadAllData();
      }
      setSaving(false);
    });
  };

  const handleSellerDelete = (id: string) =>
    requireAdmin(async () => {
      if (confirm('Remover?')) {
        await deleteSeller(id);
        loadAllData();
      }
    });

  // Users CRUD
  const handleUserSave = (e: React.FormEvent) => {
    e.preventDefault();
    return requireAdmin(async () => {
      setSaving(true);
      const { error } = await createUser(userFormData as any);
      if (error) showNotification(error.message, 'error');
      else {
        showNotification('Usuário autorizado!', 'success');
        setIsCreatingUser(false);
        loadAllData();
      }
      setSaving(false);
    });
  };

  const handleUserDelete = (id: string) =>
    requireAdmin(async () => {
      if (confirm('Revogar acesso?')) {
        await deleteUser(id);
        loadAllData();
      }
    });

  // FIPE
  const handleFipeBrand = async (codigo: string) => {
    setSelectedFipeBrand(codigo);
    setSelectedFipeModel('');
    setFipeModels([]);

    if (!codigo) return;
    setLoadingFipe(true);
    const res = await fetch(
      `https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas/${codigo}/modelos`
    );
    const data = await res.json();
    setFipeModels(data.modelos);
    setLoadingFipe(false);
  };

  const handleFipeModel = async (codigo: string) => {
    setSelectedFipeModel(codigo);
    setFipeYears([]);

    if (!codigo) return;
    setLoadingFipe(true);
    const res = await fetch(
      `https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas/${selectedFipeBrand}/modelos/${codigo}/anos`
    );
    setFipeYears(await res.json());
    setLoadingFipe(false);
  };

  const handleFipeYear = async (codigo: string) => {
    if (!codigo) return;
    setLoadingFipe(true);

    try {
      const res = await fetch(
        `https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas/${selectedFipeBrand}/modelos/${selectedFipeModel}/anos/${codigo}`
      );

      const data: FipeResult = await res.json();
      const val = parseFloat(
        data.Valor.replace('R$ ', '').replace('.', '').replace(',', '.')
      );

      const autoDetectCategory = (modelName: string) => {
        const name = modelName.toLowerCase();
        if (vehicleType === 'motos') return 'Moto';
        if (vehicleType === 'caminhoes') return 'Caminhão';
        if (name.includes('hilux') || name.includes('s10') || name.includes('ranger') || name.includes('toro'))
          return 'Pickup';
        if (name.includes('suv') || name.includes('compass') || name.includes('creta'))
          return 'SUV';
        if (name.includes('sedan') || name.includes('corolla') || name.includes('civic'))
          return 'Sedan';
        return 'Hatch';
      };

      setCarFormData(prev => ({
        ...prev,
        make: data.Marca,
        model: data.Modelo,
        year: data.AnoModelo,
        fipeprice: val,
        fuel: data.Combustivel,
        category: autoDetectCategory(data.Modelo)
      }));
    } finally {
      setLoadingFipe(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return showNotification("Indisponível", 'error');

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
        );

        const data = await res.json();
        const city = data.address.city || data.address.town || data.address.municipality;
        const state = data.address.state_code || data.address.state;

        setCarFormData(prev => ({
          ...prev,
          location: `${city}, ${state}`
        }));

        showNotification("Localização obtida!", 'success');
      } catch {
        showNotification("Erro ao obter endereço", 'error');
      } finally {
        setLoadingLocation(false);
      }
    });
  };

  // PROTEÇÃO GLOBAL
  if (authLoading) return <div>Carregando autenticação...</div>;
  if (!appUser) return <div>Carregando perfil...</div>;

  return (
    <AdminLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      appUser={appUser}
      handleLogout={handleLogout}
      notification={notification}
    >
      
      {activeTab === 'dashboard' && (
        <DashboardView
          cars={cars}
          sellers={sellers}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 'profile' && (
        <ProfileView
          appUser={appUser}
          showNotification={showNotification}
        />
      )}

      {activeTab === 'cars' && !isEditingCar && (
        <InventoryView
          cars={cars}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isAdmin={isAdmin}
          onNew={() => {
            requireAdmin(() => {
              setCarFormData({
                gallery: [],
                is_active: true,
                category: 'Hatch',
                status: 'available',
                vehicleType: 'carros'
              });
              setMainImagePreview(null);
              setMainImageFile(null);
              setGalleryFiles([]);
              setIsEditingCar(true);
            });
          }}
          onEdit={(c: Car) => {
            requireAdmin(() => {
              setCarFormData({ ...c });
              setVehicleType(c.vehicleType || 'carros');
              setMainImagePreview(c.image);
              setGalleryFiles([]);
              setIsEditingCar(true);
            });
          }}
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
          isAdmin={isAdmin}
          onSave={handleSellerSave}
          onDelete={handleSellerDelete}
          saving={saving}
          isCreating={isCreatingSeller}
          setIsCreating={setIsCreatingSeller}
          formData={sellerFormData}
          setFormData={setSellerFormData}
        />
      )}

      {activeTab === 'users' && isAdmin && (
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
