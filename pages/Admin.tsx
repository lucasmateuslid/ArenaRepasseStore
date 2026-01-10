import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchCars,
  createCar,
  updateCar,
  deleteCar,
  uploadCarImage,
  fetchSellers,
  fetchUsers,
  parseError
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

/* ================= HELPERS ================= */

export const mapCategoryToType = (
  category?: string
): 'carros' | 'motos' | 'caminhoes' => {
  if (!category) return 'carros';
  const cat = category.toLowerCase();

  if (['moto', 'motocicleta', 'scooter', 'bis', 'fan', 'titan'].some(v => cat.includes(v))) {
    return 'motos';
  }

  if (['caminhão', 'caminhao', 'van', 'truck', 'ônibus', 'onibus', 'furgão'].some(v => cat.includes(v))) {
    return 'caminhoes';
  }

  return 'carros';
};

type Notification = { msg: string; type: 'success' | 'error' };
type FipeItem = { codigo: string; nome: string };

/* ================= COMPONENT ================= */

export const Admin: React.FC = () => {
  const { appUser, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] =
    useState<'dashboard' | 'cars' | 'users' | 'sellers' | 'profile' | 'reports' | 'settings'>('dashboard');

  const [cars, setCars] = useState<Car[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [notification, setNotification] = useState<Notification | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingCar, setIsEditingCar] = useState(false);
  const [saving, setSaving] = useState(false);

  const [carFormData, setCarFormData] = useState<Partial<Car>>({});
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

  const [vehicleType, setVehicleType] =
    useState<'carros' | 'motos' | 'caminhoes'>('carros');

  const [fipeBrands, setFipeBrands] = useState<FipeItem[]>([]);
  const [fipeModels, setFipeModels] = useState<FipeItem[]>([]);
  const [fipeYears, setFipeYears] = useState<any[]>([]);
  const [loadingFipe, setLoadingFipe] = useState(false);

  const [selectedBrandCode, setSelectedBrandCode] = useState('');
  const [selectedModelCode, setSelectedModelCode] = useState('');

  const [isCreatingSeller, setIsCreatingSeller] = useState(false);
  const [sellerFormData, setSellerFormData] = useState<Partial<Seller>>({});
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userFormData, setUserFormData] = useState<Partial<AppUser>>({});

  /* ================= UTILS ================= */

  const showNotification = (msg: string, type: Notification['type']) => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const getNumber = (val: unknown): number => {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    return Number(String(val).replace(',', '.')) || 0;
  };

  const requireAdmin = async (cb: () => Promise<void>) => {
    if (!isAdmin) {
      showNotification('Acesso negado. Apenas administradores.', 'error');
      return;
    }
    await cb();
  };

  /* ================= LOAD ================= */

  const loadAllData = useCallback(async () => {
    const [carsRes, sellersRes, usersRes] = await Promise.all([
      fetchCars(),
      fetchSellers(),
      isAdmin ? fetchUsers() : Promise.resolve({ data: [], error: null })
    ]);

    if (carsRes.data) setCars(carsRes.data);
    if (sellersRes.data) setSellers(sellersRes.data);
    if (usersRes.data) setUsers(usersRes.data);
  }, [isAdmin]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  /* ================= SELLER STATS ================= */

  const sellersWithStats = useMemo(() => {
    const soldCars = cars.filter(c => c.status === 'sold');
    return sellers.map(seller => {
      const sales = soldCars.filter(c => c.soldBy === seller.name);
      return {
        ...seller,
        stats: {
          totalQty: sales.length,
          totalValue: sales.reduce(
            (acc, c) => acc + (c.soldPrice ?? c.price ?? 0),
            0
          )
        }
      };
    });
  }, [cars, sellers]);

  /* ================= VEHICLES ================= */

  const handleNewCar = () => {
    setCarFormData({ status: 'available', gallery: [] });
    setMainImageFile(null);
    setMainImagePreview(null);
    setGalleryFiles([]);
    setIsEditingCar(true);
  };

  const handleEditCar = (car: Car) => {
    setCarFormData(car);
    setMainImagePreview(car.image || null);
    // Fixed: explicit cast to specific union type
    setVehicleType((car.vehicleType as 'carros' | 'motos' | 'caminhoes') || mapCategoryToType(car.category));
    setIsEditingCar(true);
  };

  const handleDeleteCar = async (id: string) => {
    if (!window.confirm('Excluir veículo?')) return;
    await requireAdmin(async () => {
      const { error } = await deleteCar(id);
      if (error) throw error;
      showNotification('Veículo excluído', 'success');
      loadAllData();
    });
  };

  const handleCarSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    try {
      // Fixed: explicitly allow null for potential return from uploadCarImage
      let imageUrl: string | null | undefined = carFormData.image;

      if (mainImageFile) {
        imageUrl = await uploadCarImage(mainImageFile);
      }

      if (!imageUrl) throw new Error('Imagem obrigatória');

      const payload = {
        ...carFormData,
        image: imageUrl,
        price: getNumber(carFormData.price),
        fipeprice: getNumber(carFormData.fipeprice),
        mileage: getNumber(carFormData.mileage),
        vehicleType
      };

      if (carFormData.id) {
        await updateCar(carFormData.id, payload as Partial<Car>);
      } else {
        // Fixed: cast to any to satisfy the complex Omit<Car, 'id'> requirements
        await createCar(payload as any);
      }

      showNotification('Veículo salvo', 'success');
      setIsEditingCar(false);
      loadAllData();
    } catch (err) {
      showNotification(parseError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ================= AUTH ================= */

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  /* ================= RENDER ================= */

  return (
    <AdminLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      appUser={appUser}
      handleLogout={handleLogout}
      notification={notification}
    >
      {activeTab === 'dashboard' && (
        <DashboardView cars={cars} sellers={sellers} setActiveTab={setActiveTab} isAdmin={isAdmin} />
      )}

      {activeTab === 'reports' &&
        (isAdmin ? <ReportsView cars={cars} /> : <div className="p-10">Acesso restrito</div>)}

      {activeTab === 'settings' &&
        (isAdmin ? <SettingsView showNotification={showNotification} /> : <div className="p-10">Acesso restrito</div>)}

      {activeTab === 'cars' && (
        !isEditingCar ? (
          <InventoryView
            cars={cars}
            sellers={sellers}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onNew={handleNewCar}
            onEdit={handleEditCar}
            onDelete={handleDeleteCar}
            onToggleStatus={() => {}}
            isAdmin={isAdmin}
            onRefresh={loadAllData}
            showNotification={showNotification}
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
            uploadStatus=""
            uploadProgress={0}
            vehicleType={vehicleType}
            setVehicleType={setVehicleType}
            fipeBrands={fipeBrands}
            fipeModels={fipeModels}
            fipeYears={fipeYears}
            onFipeBrand={() => {}}
            onFipeModel={() => {}}
            onFipeYear={() => {}}
            loadingFipe={loadingFipe}
            sellers={sellers}
            selectedBrandCode={selectedBrandCode}
            selectedModelCode={selectedModelCode}
          />
        )
      )}

      {activeTab === 'sellers' && (
        <SellersView
          sellers={sellersWithStats}
          onSave={() => {}}
          onDelete={() => {}}
          saving={saving}
          isCreating={isCreatingSeller}
          setIsCreating={setIsCreatingSeller}
          formData={sellerFormData}
          setFormData={setSellerFormData}
          isAdmin={isAdmin}
          onEdit={s => {
            setSellerFormData(s);
            setIsCreatingSeller(true);
          }}
        />
      )}

      {activeTab === 'users' && (
        <UsersView
          users={users}
          onSave={() => {}}
          onDelete={() => {}}
          onResetPassword={() => {}}
          saving={saving}
          isCreating={isCreatingUser}
          setIsCreating={setIsCreatingUser}
          formData={userFormData}
          setFormData={setUserFormData}
          onApprove={loadAllData}
        />
      )}

      {activeTab === 'profile' && <ProfileView appUser={appUser} showNotification={showNotification} />}
    </AdminLayout>
  );
};