

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchCars, createCar, updateCar, deleteCar, uploadCarImage, fetchUsers, createUser, deleteUser, fetchSellers, createSeller, deleteSeller } from '../supabaseClient';
import { Car, AppUser, Seller } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { FaTrash, FaEdit, FaPlus, FaSave, FaTimes, FaCar, FaDollarSign, FaCloudUploadAlt, FaSearchDollar, FaSync, FaUsers, FaUserPlus, FaUserShield, FaSignOutAlt, FaHeadset, FaWhatsapp, FaMotorcycle, FaTruck } from 'react-icons/fa';

// Interfaces FIPE
interface FipeBrand { codigo: string; nome: string; }
interface FipeModel { codigo: number; nome: string; }
interface FipeYear { codigo: string; nome: string; }
interface FipeResult { Valor: string; Marca: string; Modelo: string; AnoModelo: number; Combustivel: string; }

export const Admin = () => {
  const { appUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cars' | 'users' | 'sellers'>('dashboard');
  
  // Data States
  const [cars, setCars] = useState<Car[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  
  // Form States (Cars)
  const [isEditingCar, setIsEditingCar] = useState(false);
  const [carFormData, setCarFormData] = useState<Partial<Car>>({});
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);

  // Form States (Users)
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userFormData, setUserFormData] = useState<Partial<AppUser>>({ role: 'editor' });

  // Form States (Sellers)
  const [isCreatingSeller, setIsCreatingSeller] = useState(false);
  const [sellerFormData, setSellerFormData] = useState<Partial<Seller>>({ active: true });

  // UI States
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // FIPE States
  const [fipeBrands, setFipeBrands] = useState<FipeBrand[]>([]);
  const [fipeModels, setFipeModels] = useState<FipeModel[]>([]);
  const [fipeYears, setFipeYears] = useState<FipeYear[]>([]);
  const [selectedFipeBrand, setSelectedFipeBrand] = useState('');
  const [selectedFipeModel, setSelectedFipeModel] = useState('');
  const [loadingFipe, setLoadingFipe] = useState(false);
  
  // Vehicle Type for FIPE and Form
  const [vehicleType, setVehicleType] = useState('carros');

  useEffect(() => {
    loadAllData();
    loadFipeBrands();
  }, [vehicleType]); // Recarrega marcas FIPE quando muda o tipo

  const loadAllData = async () => {
    const carsRes = await fetchCars({});
    const usersRes = await fetchUsers();
    const sellersRes = await fetchSellers();
    
    if (carsRes.error) showNotification(String(carsRes.error), 'error');
    
    setCars(carsRes.data || []);
    setUsers(usersRes.data || []);
    setSellers(sellersRes.data || []);
  };

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // --- CAR ACTIONS ---
  const handleCarEdit = (car: Car) => {
    setCarFormData({...car});
    setVehicleType(car.vehicleType || 'carros'); // Sincroniza o tipo com o carro editado
    setMainImagePreview(car.image);
    setMainImageFile(null);
    setGalleryFiles([]);
    setIsEditingCar(true);
    setActiveTab('cars');
  };

  const handleCarCreate = () => {
    setCarFormData({ 
      gallery: [], 
      is_active: true,
      category: 'Hatch',
      status: 'available',
      vehicleType: 'carros'
    });
    setVehicleType('carros');
    setMainImagePreview(null);
    setMainImageFile(null);
    setGalleryFiles([]);
    setIsEditingCar(true);
    setActiveTab('cars');
  };

  const handleCarDelete = async (id: string) => {
    if (!confirm("Excluir veículo permanentemente?")) return;
    const { error } = await deleteCar(id);
    if (error) showNotification(String(error.message), 'error');
    else {
      showNotification("Veículo excluído.", 'success');
      loadAllData();
    }
  };

  const handleCarSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carFormData.make || !carFormData.model || !carFormData.price) {
      showNotification("Preencha Marca, Modelo e Preço", 'error');
      return;
    }

    setSaving(true);
    try {
      let finalImage = carFormData.image;
      
      // Upload Main Image
      if (mainImageFile) {
        const url = await uploadCarImage(mainImageFile);
        if (url) {
          finalImage = url;
        } else {
          throw new Error("Falha no upload da imagem principal.");
        }
      }
      
      if (!finalImage) throw new Error("Foto principal obrigatória");

      // Upload Gallery
      const newGalleryUrls = [];
      for (const file of galleryFiles) {
        const url = await uploadCarImage(file);
        if (url) newGalleryUrls.push(url);
      }
      const finalGallery = [...(carFormData.gallery || []), ...newGalleryUrls];

      const payload = {
        ...carFormData,
        price: Number(carFormData.price) || 0,
        fipeprice: Number(carFormData.fipeprice) || 0,
        mileage: Number(carFormData.mileage) || 0,
        year: Number(carFormData.year) || 2020,
        image: finalImage,
        gallery: finalGallery,
        is_active: true,
        vehicleType: vehicleType, // Garante que o tipo selecionado seja salvo
        status: carFormData.status || 'available'
      };

      if (carFormData.id) {
        const { error } = await updateCar(carFormData.id, payload);
        if (error) throw error;
      } else {
        const { error } = await createCar(payload as any);
        if (error) throw error;
      }

      showNotification("Veículo salvo!", 'success');
      setIsEditingCar(false);
      loadAllData();
    } catch (err: any) {
      console.error(err);
      let errorMsg = err.message || "Erro ao salvar";
      if (typeof errorMsg === 'string' && errorMsg.includes("recursion")) {
        errorMsg = "Erro de configuração no Banco de Dados (Recursão). Contate o suporte.";
      }
      showNotification(errorMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleCarStatus = async (car: Car) => {
    const newStatus = car.status === 'sold' ? 'available' : 'sold';
    const { error } = await updateCar(car.id, { status: newStatus });
    if (error) showNotification("Erro ao atualizar status", 'error');
    else {
      loadAllData(); 
    }
  };

  const autoDetectCategory = (modelName: string) => {
    const name = modelName.toLowerCase();
    if (vehicleType === 'motos') return 'Moto';
    if (vehicleType === 'caminhoes') return 'Caminhão';
    
    if (name.includes('hilux') || name.includes('s10') || name.includes('ranger') || name.includes('toro') || name.includes('strada') || name.includes('saveiro') || name.includes('amarok')) return 'Pickup';
    if (name.includes('suv') || name.includes('tracker') || name.includes('renegade') || name.includes('compass') || name.includes('creta') || name.includes('kicks') || name.includes('hr-v')) return 'SUV';
    if (name.includes('sedan') || name.includes('corolla') || name.includes('civic') || name.includes('virtus') || name.includes('cronos') || name.includes('plus')) return 'Sedan';
    
    return 'Hatch';
  };

  // --- FIPE LOGIC ---
  const loadFipeBrands = async () => {
    try { 
      setFipeBrands([]);
      const res = await fetch(`https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas`); 
      setFipeBrands(await res.json()); 
    } catch (e) {}
  };
  const handleFipeBrand = async (codigo: string) => {
    setSelectedFipeBrand(codigo); setSelectedFipeModel(''); setFipeModels([]);
    if(codigo) {
       setLoadingFipe(true);
       const res = await fetch(`https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas/${codigo}/modelos`);
       const data = await res.json();
       setFipeModels(data.modelos);
       setLoadingFipe(false);
    }
  };
  const handleFipeModel = async (codigo: string) => {
    setSelectedFipeModel(codigo); setFipeYears([]);
    if(codigo) {
       setLoadingFipe(true);
       const res = await fetch(`https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas/${selectedFipeBrand}/modelos/${codigo}/anos`);
       setFipeYears(await res.json());
       setLoadingFipe(false);
    }
  };
  const handleFipeYear = async (codigo: string) => {
    if(!codigo) return;
    setLoadingFipe(true);
    try {
      const res = await fetch(`https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas/${selectedFipeBrand}/modelos/${selectedFipeModel}/anos/${codigo}`);
      const data: FipeResult = await res.json();
      const val = parseFloat(data.Valor.replace('R$ ', '').replace('.','').replace(',','.'));
      
      const detectedCategory = autoDetectCategory(data.Modelo);

      setCarFormData(prev => ({ 
        ...prev, 
        make: data.Marca, 
        model: data.Modelo, 
        year: data.AnoModelo, 
        fipeprice: val, 
        fuel: data.Combustivel, 
        price: Math.floor(val * 0.85),
        category: detectedCategory
      }));
    } catch(e) {} finally { setLoadingFipe(false); }
  };

  // --- SELLER HANDLERS ---
  const handleSellerSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerFormData.name || !sellerFormData.whatsapp) {
        showNotification("Preencha Nome e WhatsApp", 'error');
        return;
    }
    setSaving(true);
    try {
        const { error } = await createSeller(sellerFormData as any);
        if (error) throw error;
        showNotification("Vendedor adicionado!", 'success');
        setSellerFormData({ active: true });
        setIsCreatingSeller(false);
        loadAllData();
    } catch (err: any) {
        showNotification(err.message || "Erro ao criar vendedor", 'error');
    } finally {
        setSaving(false);
    }
  };

  const handleSellerDelete = async (id: string) => {
      if (!confirm("Remover vendedor?")) return;
      const { error } = await deleteSeller(id);
      if (error) showNotification("Erro ao remover vendedor", 'error');
      else {
          showNotification("Vendedor removido", 'success');
          loadAllData();
      }
  };

  // --- USER HANDLERS ---
  const handleUserSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!userFormData.name || !userFormData.email) {
          showNotification("Preencha Nome e Email", 'error');
          return;
      }
      setSaving(true);
      try {
          const { error } = await createUser(userFormData as any);
          if (error) throw error;
          showNotification("Usuário adicionado!", 'success');
          setUserFormData({ role: 'editor' });
          setIsCreatingUser(false);
          loadAllData();
      } catch (err: any) {
          showNotification(err.message || "Erro ao criar usuário", 'error');
      } finally {
          setSaving(false);
      }
  };

  const handleUserDelete = async (id: string) => {
      if (!confirm("Remover usuário?")) return;
      const { error } = await deleteUser(id);
      if (error) showNotification("Erro ao remover usuário", 'error');
      else {
          showNotification("Usuário removido", 'success');
          loadAllData();
      }
  };

  // Helpers
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  
  // Dashboard Stats
  const totalStockValue = cars.filter(c => c.status !== 'sold').reduce((acc, c) => acc + (Number(c.price) || 0), 0);
  const totalFipeValue = cars.filter(c => c.status !== 'sold').reduce((acc, c) => acc + (Number(c.fipeprice) || 0), 0);
  const totalSold = cars.filter(c => c.status === 'sold').length;
  const categories = cars.filter(c => c.status !== 'sold').reduce((acc, car) => { const cat = car.category || 'Outros'; acc[cat] = (acc[cat] || 0) + 1; return acc; }, {} as Record<string, number>);
  const vehicleTypes = cars.filter(c => c.status !== 'sold').reduce((acc, car) => { const t = car.vehicleType || 'carros'; acc[t] = (acc[t] || 0) + 1; return acc; }, {} as Record<string, number>);

  const DashboardView = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-brand-surface border border-gray-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition text-brand-orange text-6xl"><FaCar/></div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Disponíveis</h3>
            <p className="text-4xl font-black text-white">{cars.filter(c => c.status !== 'sold').length}</p>
        </div>
        <div className="bg-brand-surface border border-gray-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition text-green-500 text-6xl"><FaDollarSign/></div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Valor Real</h3>
            <p className="text-3xl font-black text-white">{new Intl.NumberFormat('pt-BR', { notation: "compact", style: 'currency', currency: 'BRL' }).format(totalStockValue)}</p>
            <p className="text-[10px] text-gray-500 mt-1">Soma dos preços de venda</p>
        </div>
        <div className="bg-brand-surface border border-gray-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition text-blue-500 text-6xl"><FaSearchDollar/></div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Valor FIPE</h3>
            <p className="text-3xl font-black text-white">{new Intl.NumberFormat('pt-BR', { notation: "compact", style: 'currency', currency: 'BRL' }).format(totalFipeValue)}</p>
            <p className="text-[10px] text-gray-500 mt-1">Soma das tabelas FIPE</p>
        </div>
        <div className="bg-brand-surface border border-gray-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition text-red-500 text-6xl"><FaSync/></div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Vendidos</h3>
            <p className="text-4xl font-black text-white">{totalSold}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-brand-surface border border-gray-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Por Categoria</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(categories).map(([cat, count]) => (
              <div key={cat} className="bg-black/40 px-4 py-3 rounded-xl border border-gray-700 min-w-[100px] flex flex-col items-center">
                <span className="text-[10px] text-gray-500 uppercase block mb-1">{cat}</span>
                <span className="text-2xl font-black text-white">{count}</span>
              </div>
            ))}
            {Object.keys(categories).length === 0 && <span className="text-gray-600 text-sm">Sem dados</span>}
          </div>
        </div>
        
        <div className="bg-brand-surface border border-gray-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Por Tipo de Veículo</h3>
          <div className="flex gap-4">
            <div className="flex-1 bg-black/40 p-3 rounded-xl border border-gray-700 flex items-center gap-3">
              <FaCar className="text-2xl text-blue-500"/>
              <div><span className="block text-2xl font-bold text-white">{vehicleTypes['carros'] || 0}</span><span className="text-[10px] text-gray-500 uppercase">Carros</span></div>
            </div>
            <div className="flex-1 bg-black/40 p-3 rounded-xl border border-gray-700 flex items-center gap-3">
              <FaMotorcycle className="text-2xl text-orange-500"/>
              <div><span className="block text-2xl font-bold text-white">{vehicleTypes['motos'] || 0}</span><span className="text-[10px] text-gray-500 uppercase">Motos</span></div>
            </div>
            <div className="flex-1 bg-black/40 p-3 rounded-xl border border-gray-700 flex items-center gap-3">
              <FaTruck className="text-2xl text-yellow-500"/>
              <div><span className="block text-2xl font-bold text-white">{vehicleTypes['caminhoes'] || 0}</span><span className="text-[10px] text-gray-500 uppercase">Pesados</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-dark font-sans text-gray-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-brand-surface border-r border-gray-800 flex flex-col">
        <div className="h-20 flex items-center justify-center border-b border-gray-800">
           <Link to="/" className="text-xl font-black italic tracking-tighter hover:opacity-80 transition">
             ARENA<span className="text-brand-orange">ADMIN</span>
           </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
           <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-brand-orange text-white' : 'text-gray-400 hover:bg-gray-800'}`}><FaSearchDollar /> Dashboard</button>
           <button onClick={() => setActiveTab('cars')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'cars' ? 'bg-brand-orange text-white' : 'text-gray-400 hover:bg-gray-800'}`}><FaCar /> Inventário</button>
           <button onClick={() => setActiveTab('sellers')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'sellers' ? 'bg-brand-orange text-white' : 'text-gray-400 hover:bg-gray-800'}`}><FaHeadset /> Vendedores</button>
           <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-brand-orange text-white' : 'text-gray-400 hover:bg-gray-800'}`}><FaUsers /> Usuários</button>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <Link to="/" className="flex items-center gap-2 text-xs text-gray-500 hover:text-brand-orange transition justify-center"><i className="fa-solid fa-arrow-left"></i> Voltar ao Site</Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-brand-dark/95 backdrop-blur border-b border-gray-800 flex items-center justify-between px-8">
           <h2 className="text-xl font-bold text-white capitalize">{activeTab}</h2>
           <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-white hidden sm:block">{appUser?.name}</span>
              <button onClick={handleLogout} className="text-gray-400 hover:text-white" title="Sair"><FaSignOutAlt className="text-lg"/></button>
           </div>
        </header>

        {notification && <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl border-l-4 animate-fade-in ${notification.type === 'success' ? 'bg-green-900/90 border-green-500' : 'bg-red-900/90 border-red-500'}`}><p className="font-bold text-sm">{notification.msg}</p></div>}

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-black/20">
           {activeTab === 'dashboard' && <DashboardView />}

           {activeTab === 'cars' && !isEditingCar && (
             <div className="bg-brand-surface border border-gray-800 rounded-2xl overflow-hidden shadow-xl animate-fade-in">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                   <h3 className="font-bold text-white">Inventário Completo</h3>
                   <button onClick={handleCarCreate} className="bg-brand-orange hover:bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 shadow-lg hover:shadow-red-500/20 transition"><FaPlus /> Adicionar Veículo</button>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead className="bg-black/40 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                       <tr><th className="px-6 py-4">Carro</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Categoria</th><th className="px-6 py-4">Preço</th><th className="px-6 py-4 text-right">Ações</th></tr>
                     </thead>
                     <tbody className="divide-y divide-gray-800 text-sm">
                       {cars.map(c => (
                         <tr key={c.id} className="hover:bg-white/5 transition group">
                            <td className="px-6 py-4 flex items-center gap-3">
                              <img src={c.image} className="w-10 h-10 rounded-lg object-cover bg-gray-800" onError={(e) => {e.currentTarget.src='https://via.placeholder.com/50'}}/>
                              <div><span className="font-bold text-white block">{c.make} {c.model}</span><span className="text-[10px] text-gray-500">{c.year} • {c.vehicleType}</span></div>
                            </td>
                            <td className="px-6 py-4"><button onClick={() => toggleCarStatus(c)} className={`px-2 py-1 rounded text-[10px] font-bold uppercase border transition active:scale-95 ${c.status === 'sold' ? 'text-red-500 border-red-500 hover:bg-red-500/10' : 'text-green-500 border-green-500 hover:bg-green-500/10'}`}>{c.status === 'sold' ? 'Vendido' : 'Disponível'}</button></td>
                            <td className="px-6 py-4"><span className="text-xs text-gray-400 border border-gray-700 px-2 py-0.5 rounded">{c.category || 'N/A'}</span></td>
                            <td className="px-6 py-4 font-bold text-white">{formatCurrency(c.price)}</td>
                            <td className="px-6 py-4 text-right flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition"><button onClick={() => handleCarEdit(c)} className="p-2 text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500 rounded-lg transition"><FaEdit/></button><button onClick={() => handleCarDelete(c.id)} className="p-2 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 rounded-lg transition"><FaTrash/></button></td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
             </div>
           )}

           {activeTab === 'cars' && isEditingCar && (
             <div className="max-w-4xl mx-auto bg-brand-surface border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl animate-slide-up">
                <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-white">{carFormData.id ? 'Editar Veículo' : 'Novo Veículo'}</h3><button onClick={() => setIsEditingCar(false)} className="text-gray-500 hover:text-white"><FaTimes/></button></div>
                
                {/* Vehicle Type & FIPE Block */}
                <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 mb-8">
                   <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                     <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase"><FaSearchDollar /> FIPE Automático</div>
                     <div className="flex gap-2">
                       {['carros', 'motos', 'caminhoes'].map(t => (
                         <button 
                           key={t} 
                           type="button" 
                           onClick={() => setVehicleType(t)} 
                           className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold border transition-all ${vehicleType === t ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'text-gray-400 border-gray-700 hover:border-gray-500'}`}
                         >
                           {t}
                         </button>
                       ))}
                     </div>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <select className="bg-black/30 border border-blue-500/20 rounded-lg p-2 text-xs text-gray-300 focus:border-blue-500 outline-none" onChange={e => handleFipeBrand(e.target.value)} value={selectedFipeBrand}><option value="">Selecione a Marca</option>{fipeBrands.map(b => <option key={b.codigo} value={b.codigo}>{b.nome}</option>)}</select>
                      <select className="bg-black/30 border border-blue-500/20 rounded-lg p-2 text-xs text-gray-300 focus:border-blue-500 outline-none" onChange={e => handleFipeModel(e.target.value)} value={selectedFipeModel} disabled={!selectedFipeBrand}><option value="">Selecione o Modelo</option>{fipeModels.map(m => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}</select>
                      <select className="bg-black/30 border border-blue-500/20 rounded-lg p-2 text-xs text-gray-300 focus:border-blue-500 outline-none" onChange={e => handleFipeYear(e.target.value)} disabled={!selectedFipeModel}><option value="">Selecione o Ano</option>{fipeYears.map(y => <option key={y.codigo} value={y.codigo}>{y.nome}</option>)}</select>
                   </div>
                   {loadingFipe && <p className="text-[10px] text-blue-400 mt-2 animate-pulse">Buscando informações na Tabela FIPE...</p>}
                </div>

                <form onSubmit={handleCarSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 mb-2">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Foto Principal</label>
                        <div className="relative h-48 bg-black/40 rounded-xl border-2 border-dashed border-gray-700 hover:border-brand-orange flex items-center justify-center cursor-pointer transition overflow-hidden group">
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => { if(e.target.files?.[0]) { setMainImageFile(e.target.files[0]); setMainImagePreview(URL.createObjectURL(e.target.files[0])); } }} accept="image/*" />
                          {mainImagePreview ? <img src={mainImagePreview} className="w-full h-full object-cover group-hover:opacity-50 transition" /> : <div className="text-center p-4"><FaCloudUploadAlt className="text-3xl text-gray-600 mx-auto mb-2"/><span className="text-gray-500 text-xs">Clique para fazer upload</span></div>}
                          {mainImagePreview && <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><FaEdit className="text-white text-2xl"/></div>}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Galeria de Fotos</label>
                        <div className="relative h-48 bg-black/40 rounded-xl border-2 border-dashed border-gray-700 p-2 overflow-y-auto custom-scrollbar">
                          <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => e.target.files && setGalleryFiles(Array.from(e.target.files))} accept="image/*" />
                          <div className="grid grid-cols-3 gap-2">
                            {carFormData.gallery?.map((url, i) => <img key={i} src={url} className="h-14 w-full object-cover rounded border border-gray-600" />)}
                            {galleryFiles.map((f, i) => <div key={i} className="h-14 w-full bg-green-500/20 border border-green-500 rounded flex items-center justify-center text-[8px] text-green-500 font-bold">Novo</div>)}
                            <div className="flex items-center justify-center h-14 bg-gray-800 rounded text-gray-500 hover:bg-gray-700 transition"><FaPlus/></div>
                          </div>
                        </div>
                      </div>
                   </div>
                   
                   {[ 
                     { label: 'Marca', key: 'make', type: 'text' }, 
                     { label: 'Modelo', key: 'model', type: 'text' }, 
                     { label: 'Ano', key: 'year', type: 'number' }, 
                     { label: 'Categoria', key: 'category', type: 'select', opts: ['Hatch', 'Sedan', 'SUV', 'Pickup', 'Moto', 'Caminhão', 'Van'] }, 
                     { label: 'KM', key: 'mileage', type: 'number' }, 
                     { label: 'Preço Venda', key: 'price', type: 'number' }, 
                     { label: 'FIPE (Ref)', key: 'fipeprice', type: 'number' }, 
                     { label: 'Combustível', key: 'fuel', type: 'select', opts: ['Flex','Gasolina','Diesel','Elétrico','Híbrido'] }, 
                     { label: 'Câmbio', key: 'transmission', type: 'select', opts: ['Manual','Automático','CVT'] }, 
                     { label: 'Cidade/UF', key: 'location', type: 'text' } 
                   ].map((field: any) => (
                     <div key={field.key}>
                       <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">{field.label}</label>
                       {field.type === 'select' ? 
                         <select className="w-full bg-black/30 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-orange outline-none" value={(carFormData as any)[field.key] || ''} onChange={e => setCarFormData({...carFormData, [field.key]: e.target.value})}>
                           {field.opts.map((o:string) => <option key={o} value={o}>{o}</option>)}
                         </select> : 
                         <input type={field.type} className="w-full bg-black/30 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-orange outline-none" value={(carFormData as any)[field.key] || ''} onChange={e => setCarFormData({...carFormData, [field.key]: e.target.value})} />
                       }
                     </div>
                   ))}
                   
                   <div className="md:col-span-2">
                     <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">Descrição / Observações</label>
                     <textarea className="w-full bg-black/30 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white h-24 focus:border-brand-orange outline-none resize-none" value={carFormData.description || ''} onChange={e => setCarFormData({...carFormData, description: e.target.value})} placeholder="Descreva os detalhes e opcionais do veículo..."></textarea>
                   </div>
                   
                   <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-gray-800">
                     <button type="button" onClick={() => setIsEditingCar(false)} className="px-6 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition text-xs font-bold uppercase">Cancelar</button>
                     <button type="submit" disabled={saving} className="px-8 py-3 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-xs uppercase shadow-glow flex items-center gap-2 transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                       {saving ? <FaSync className="animate-spin"/> : <FaSave />} Salvar Veículo
                     </button>
                   </div>
                </form>
             </div>
           )}

           {activeTab === 'sellers' && (
             <div className="bg-brand-surface border border-gray-800 rounded-2xl overflow-hidden shadow-xl animate-fade-in max-w-4xl mx-auto">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                    <h3 className="font-bold text-white flex items-center gap-2"><FaHeadset className="text-brand-orange"/> Vendedores Ativos</h3>
                    <button onClick={() => setIsCreatingSeller(!isCreatingSeller)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 shadow-lg">
                      {isCreatingSeller ? <FaTimes/> : <FaPlus />} {isCreatingSeller ? 'Cancelar' : 'Novo Vendedor'}
                    </button>
                </div>
                {isCreatingSeller && (
                   <form onSubmit={handleSellerSave} className="p-6 bg-blue-900/10 border-b border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4 items-end animate-slide-up">
                      <div><label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">Nome</label><input type="text" className="w-full bg-black/30 border border-gray-700 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none" value={sellerFormData.name || ''} onChange={e => setSellerFormData({...sellerFormData, name: e.target.value})} placeholder="Ex: João Silva" /></div>
                      <div><label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">WhatsApp (Só números)</label><input type="text" className="w-full bg-black/30 border border-gray-700 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none" value={sellerFormData.whatsapp || ''} onChange={e => setSellerFormData({...sellerFormData, whatsapp: e.target.value})} placeholder="Ex: 5511999999999" /></div>
                      <div className="md:col-span-2"><button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg font-bold text-sm h-10 w-full shadow-lg">{saving ? 'Salvando...' : 'Cadastrar Vendedor'}</button></div>
                   </form>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-black/40 text-gray-500 text-[10px] uppercase font-bold tracking-wider"><tr><th className="px-6 py-4">Nome</th><th className="px-6 py-4">WhatsApp</th><th className="px-6 py-4 text-right">Ações</th></tr></thead>
                     <tbody className="divide-y divide-gray-800 text-sm">{sellers.map(s => (
                         <tr key={s.id} className="hover:bg-white/5 transition">
                           <td className="px-6 py-4 font-bold text-white">{s.name}</td>
                           <td className="px-6 py-4 text-gray-400 flex items-center gap-2"><FaWhatsapp className="text-green-500"/> {s.whatsapp}</td>
                           <td className="px-6 py-4 text-right"><button onClick={() => handleSellerDelete(s.id)} className="text-red-500 hover:text-white hover:bg-red-500 p-2 rounded transition"><FaTrash/></button></td>
                         </tr>
                       ))}</tbody>
                  </table>
                  {sellers.length === 0 && <div className="p-8 text-center text-gray-500">Nenhum vendedor cadastrado.</div>}
                </div>
             </div>
           )}

           {activeTab === 'users' && (
             <div className="bg-brand-surface border border-gray-800 rounded-2xl overflow-hidden shadow-xl animate-fade-in max-w-4xl mx-auto">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                    <h3 className="font-bold text-white flex items-center gap-2"><FaUserShield className="text-brand-orange"/> Permissões de Acesso</h3>
                    <button onClick={() => setIsCreatingUser(!isCreatingUser)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 shadow-lg">
                      {isCreatingUser ? <FaTimes/> : <FaUserPlus />} {isCreatingUser ? 'Cancelar' : 'Novo Usuário'}
                    </button>
                </div>
                {isCreatingUser && (
                   <form onSubmit={handleUserSave} className="p-6 bg-blue-900/10 border-b border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4 items-end animate-slide-up">
                      <div><label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">Nome</label><input type="text" className="w-full bg-black/30 border border-gray-700 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none" value={userFormData.name || ''} onChange={e => setUserFormData({...userFormData, name: e.target.value})} /></div>
                      <div><label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">Email</label><input type="email" className="w-full bg-black/30 border border-gray-700 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none" value={userFormData.email || ''} onChange={e => setUserFormData({...userFormData, email: e.target.value})} /></div>
                      <div className="md:col-span-2"><button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg font-bold text-sm h-10 w-full shadow-lg">{saving ? 'Salvando...' : 'Liberar Acesso'}</button></div>
                   </form>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-black/40 text-gray-500 text-[10px] uppercase font-bold tracking-wider"><tr><th className="px-6 py-4">Usuário</th><th className="px-6 py-4">Email</th><th className="px-6 py-4 text-right">Ações</th></tr></thead>
                     <tbody className="divide-y divide-gray-800 text-sm">{users.map(u => (
                         <tr key={u.id} className="hover:bg-white/5 transition">
                           <td className="px-6 py-4 font-bold text-white">{u.name}</td>
                           <td className="px-6 py-4 text-gray-400">{u.email}</td>
                           <td className="px-6 py-4 text-right"><button onClick={() => handleUserDelete(u.id)} className="text-red-500 hover:text-white hover:bg-red-500 p-2 rounded transition"><FaTrash/></button></td>
                         </tr>
                       ))}</tbody>
                  </table>
                </div>
             </div>
           )}
        </main>
      </div>
    </div>
  );
};
