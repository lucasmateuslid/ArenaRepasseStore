
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchCars, createCar, updateCar, deleteCar, uploadCarImage, fetchUsers, createUser, deleteUser, fetchSellers, createSeller, deleteSeller } from '../supabaseClient';
import { Car, AppUser, Seller } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { FaTrash, FaEdit, FaPlus, FaSave, FaTimes, FaCar, FaDollarSign, FaCloudUploadAlt, FaSearchDollar, FaSync, FaUsers, FaUserPlus, FaUserShield, FaSignOutAlt, FaHeadset, FaWhatsapp } from 'react-icons/fa';

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
  
  // Vehicle Type for FIPE
  const [vehicleType, setVehicleType] = useState('carros');

  useEffect(() => {
    loadAllData();
    loadFipeBrands();
  }, [vehicleType]); 

  const loadAllData = async () => {
    const carsRes = await fetchCars({});
    const usersRes = await fetchUsers();
    const sellersRes = await fetchSellers();
    
    if (carsRes.error) showNotification("Erro ao carregar carros", 'error');
    
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
    setVehicleType(car.vehicleType || 'carros');
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
    if (error) showNotification(error.message, 'error');
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
          // Se falhar o upload, lançamos erro para cair no catch
          throw new Error("Falha no upload da imagem principal. Verifique o Storage.");
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
        vehicleType: vehicleType
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
      // Tratamento de erro detalhado para o caso de recursão
      let errorMsg = typeof err === 'string' ? err : err.message || "Erro ao salvar";
      if (errorMsg.includes("recursion")) {
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

  // --- USER ACTIONS ---
  const handleUserSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name || !userFormData.email) {
      showNotification("Preencha Nome e Email", 'error');
      return;
    }
    setSaving(true);
    const { error } = await createUser(userFormData as any);
    setSaving(false);
    
    if (error) showNotification(error.message, 'error');
    else {
      showNotification("Usuário adicionado!", 'success');
      setIsCreatingUser(false);
      setUserFormData({ role: 'editor' });
      loadAllData();
    }
  };

  const handleUserDelete = async (id: string) => {
    if (!confirm("Remover acesso deste usuário?")) return;
    const { error } = await deleteUser(id);
    if (error) showNotification(error.message, 'error');
    else {
      showNotification("Usuário removido.", 'success');
      loadAllData();
    }
  };

  // --- SELLER ACTIONS ---
  const handleSellerSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerFormData.name || !sellerFormData.whatsapp) {
      showNotification("Preencha Nome e WhatsApp", 'error');
      return;
    }
    setSaving(true);
    const { error } = await createSeller(sellerFormData as any);
    setSaving(false);
    
    if (error) showNotification(error.message, 'error');
    else {
      showNotification("Vendedor adicionado!", 'success');
      setIsCreatingSeller(false);
      setSellerFormData({ active: true });
      loadAllData();
    }
  };

  const handleSellerDelete = async (id: string) => {
    if (!confirm("Remover este vendedor?")) return;
    const { error } = await deleteSeller(id);
    if (error) showNotification(error.message, 'error');
    else {
      showNotification("Vendedor removido.", 'success');
      loadAllData();
    }
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
      
      let detectedCategory = 'Hatch';
      const modelLower = data.Modelo.toLowerCase();
      if(vehicleType === 'motos') detectedCategory = 'Moto';
      else if(vehicleType === 'caminhoes') detectedCategory = 'Caminhão';
      else {
        if(modelLower.includes('suv') || modelLower.includes('tracker') || modelLower.includes('creta') || modelLower.includes('renegade') || modelLower.includes('hr-v')) detectedCategory = 'SUV';
        else if(modelLower.includes('sedan') || modelLower.includes('plus') || modelLower.includes('virtus') || modelLower.includes('corolla') || modelLower.includes('civic')) detectedCategory = 'Sedan';
        else if(modelLower.includes('pickup') || modelLower.includes('strada') || modelLower.includes('toro') || modelLower.includes('hilux') || modelLower.includes('s10')) detectedCategory = 'Pickup';
      }

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

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const totalStockValue = cars.reduce((acc, c) => acc + (Number(c.price) || 0), 0);
  const potentialProfit = cars.reduce((acc, c) => acc + (Number(c.fipeprice) || 0), 0) - totalStockValue;
  const categories = cars.reduce((acc, car) => { const cat = car.category || 'Outros'; acc[cat] = (acc[cat] || 0) + 1; return acc; }, {} as Record<string, number>);
  
  const DashboardView = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-brand-surface border border-gray-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition text-brand-orange text-6xl"><FaCar/></div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Total Veículos</h3>
            <p className="text-4xl font-black text-white">{cars.length}</p>
        </div>
        <div className="bg-brand-surface border border-gray-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition text-green-500 text-6xl"><FaDollarSign/></div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Valor em Estoque</h3>
            <p className="text-4xl font-black text-white">{new Intl.NumberFormat('pt-BR', { notation: "compact", style: 'currency', currency: 'BRL' }).format(totalStockValue)}</p>
        </div>
        <div className="bg-brand-surface border border-gray-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition text-yellow-500 text-6xl"><FaSearchDollar/></div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Gap FIPE</h3>
            <p className="text-4xl font-black text-white">{new Intl.NumberFormat('pt-BR', { notation: "compact", style: 'currency', currency: 'BRL' }).format(potentialProfit)}</p>
        </div>
        <div className="bg-brand-surface border border-gray-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition text-blue-500 text-6xl"><FaUsers/></div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Equipe</h3>
            <p className="text-4xl font-black text-white">{sellers.length}</p>
        </div>
      </div>
      <div className="bg-brand-surface border border-gray-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Estoque por Categoria</h3>
        <div className="flex flex-wrap gap-4">
          {Object.entries(categories).map(([cat, count]) => (
            <div key={cat} className="bg-black/40 px-4 py-3 rounded-xl border border-gray-700 min-w-[120px]">
              <span className="text-xs text-gray-500 uppercase block mb-1">{cat}</span>
              <span className="text-2xl font-black text-white">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-dark font-sans text-gray-100 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-brand-surface border-r border-gray-800 flex flex-col">
        <div className="h-20 flex items-center justify-center border-b border-gray-800">
           <Link to="/" className="text-xl font-black italic tracking-tighter hover:opacity-80 transition">
             ARENA<span className="text-brand-orange">ADMIN</span>
           </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
           <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-brand-orange text-white' : 'text-gray-400 hover:bg-gray-800'}`}><FaSearchDollar /> Dashboard</button>
           <button onClick={() => setActiveTab('cars')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'cars' ? 'bg-brand-orange text-white' : 'text-gray-400 hover:bg-gray-800'}`}><FaCar /> Veículos</button>
           <button onClick={() => setActiveTab('sellers')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'sellers' ? 'bg-brand-orange text-white' : 'text-gray-400 hover:bg-gray-800'}`}><FaHeadset /> Vendedores</button>
           <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-brand-orange text-white' : 'text-gray-400 hover:bg-gray-800'}`}><FaUsers /> Usuários</button>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <Link to="/" className="flex items-center gap-2 text-xs text-gray-500 hover:text-brand-orange transition justify-center"><i className="fa-solid fa-arrow-left"></i> Voltar ao Site</Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-brand-dark/95 backdrop-blur border-b border-gray-800 flex items-center justify-between px-8">
           <h2 className="text-xl font-bold text-white capitalize">{activeTab}</h2>
           <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-white hidden sm:block">{appUser?.name}</span>
              <button onClick={handleLogout} className="text-gray-400 hover:text-white"><FaSignOutAlt className="text-lg"/></button>
           </div>
        </header>

        {notification && <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl border-l-4 animate-fade-in ${notification.type === 'success' ? 'bg-green-900/90 border-green-500' : 'bg-red-900/90 border-red-500'}`}><p className="font-bold text-sm">{notification.msg}</p></div>}

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-black/20">
           {activeTab === 'dashboard' && <DashboardView />}

           {activeTab === 'cars' && !isEditingCar && (
             <div className="bg-brand-surface border border-gray-800 rounded-2xl overflow-hidden shadow-xl animate-fade-in">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                   <h3 className="font-bold text-white">Inventário</h3>
                   <button onClick={handleCarCreate} className="bg-brand-orange hover:bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2"><FaPlus /> Novo</button>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead className="bg-black/40 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                       <tr><th className="px-6 py-4">Carro</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Preço</th><th className="px-6 py-4 text-right">Ações</th></tr>
                     </thead>
                     <tbody className="divide-y divide-gray-800 text-sm">
                       {cars.map(c => (
                         <tr key={c.id} className="hover:bg-white/5 transition">
                            <td className="px-6 py-4 flex items-center gap-3">
                              <img src={c.image} className="w-10 h-10 rounded-lg object-cover" onError={(e) => {e.currentTarget.src='https://via.placeholder.com/50'}}/>
                              <div><span className="font-bold text-white block">{c.make} {c.model}</span><span className="text-[10px] text-gray-500">{c.year} • ID: {c.id.substring(0,6)}</span></div>
                            </td>
                            <td className="px-6 py-4"><button onClick={() => toggleCarStatus(c)} className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${c.status === 'sold' ? 'text-red-500 border-red-500' : 'text-green-500 border-green-500'}`}>{c.status === 'sold' ? 'Vendido' : 'Disponível'}</button></td>
                            <td className="px-6 py-4 font-bold text-white">{formatCurrency(c.price)}</td>
                            <td className="px-6 py-4 text-right flex justify-end gap-2"><button onClick={() => handleCarEdit(c)} className="p-2 text-blue-400 hover:text-white"><FaEdit/></button><button onClick={() => handleCarDelete(c.id)} className="p-2 text-red-400 hover:text-white"><FaTrash/></button></td>
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
                <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 mb-8">
                   <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase"><FaSearchDollar /> FIPE Automático</div>
                     <div className="flex gap-2">{['carros', 'motos', 'caminhoes'].map(t => <button type="button" key={t} onClick={() => setVehicleType(t)} className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${vehicleType === t ? 'bg-blue-500 text-white' : 'text-gray-500 border-gray-700'}`}>{t}</button>)}</div>
                   </div>
                   <div className="grid grid-cols-3 gap-3">
                      <select className="bg-black/30 border border-blue-500/20 rounded-lg p-2 text-xs text-gray-300" onChange={e => handleFipeBrand(e.target.value)} value={selectedFipeBrand}><option value="">Marca</option>{fipeBrands.map(b => <option key={b.codigo} value={b.codigo}>{b.nome}</option>)}</select>
                      <select className="bg-black/30 border border-blue-500/20 rounded-lg p-2 text-xs text-gray-300" onChange={e => handleFipeModel(e.target.value)} value={selectedFipeModel} disabled={!selectedFipeBrand}><option value="">Modelo</option>{fipeModels.map(m => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}</select>
                      <select className="bg-black/30 border border-blue-500/20 rounded-lg p-2 text-xs text-gray-300" onChange={e => handleFipeYear(e.target.value)} disabled={!selectedFipeModel}><option value="">Ano</option>{fipeYears.map(y => <option key={y.codigo} value={y.codigo}>{y.nome}</option>)}</select>
                   </div>
                </div>
                <form onSubmit={handleCarSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="md:col-span-2 grid grid-cols-2 gap-6 mb-2">
                      <div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Foto Principal</label><div className="relative h-48 bg-black/40 rounded-xl border-2 border-dashed border-gray-700 hover:border-brand-orange flex items-center justify-center cursor-pointer"><input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => { if(e.target.files?.[0]) { setMainImageFile(e.target.files[0]); setMainImagePreview(URL.createObjectURL(e.target.files[0])); } }} accept="image/*" />{mainImagePreview ? <img src={mainImagePreview} className="w-full h-full object-cover rounded-xl" /> : <FaCloudUploadAlt className="text-3xl text-gray-600"/>}</div></div>
                      <div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Galeria</label><div className="relative h-48 bg-black/40 rounded-xl border-2 border-dashed border-gray-700 p-2 overflow-y-auto"><input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => e.target.files && setGalleryFiles(Array.from(e.target.files))} accept="image/*" /><div className="grid grid-cols-3 gap-2">{carFormData.gallery?.map((url, i) => <img key={i} src={url} className="h-14 w-full object-cover rounded" />)}{galleryFiles.map((f, i) => <div key={i} className="h-14 w-full bg-green-500/20 border border-green-500 rounded flex items-center justify-center text-[8px] text-green-500">Novo</div>)}<div className="flex items-center justify-center h-14 bg-gray-800 rounded text-gray-500"><FaPlus/></div></div></div></div>
                   </div>
                   {[ { label: 'Marca', key: 'make', type: 'text' }, { label: 'Modelo', key: 'model', type: 'text' }, { label: 'Ano', key: 'year', type: 'number' }, { label: 'Categoria', key: 'category', type: 'select', opts: ['Hatch', 'Sedan', 'SUV', 'Pickup', 'Moto', 'Caminhão'] }, { label: 'KM', key: 'mileage', type: 'number' }, { label: 'Preço', key: 'price', type: 'number' }, { label: 'FIPE', key: 'fipeprice', type: 'number' }, { label: 'Combustível', key: 'fuel', type: 'select', opts: ['Flex','Gasolina','Diesel','Elétrico'] }, { label: 'Câmbio', key: 'transmission', type: 'select', opts: ['Manual','Automático','CVT'] }, { label: 'Cidade', key: 'location', type: 'text' } ].map((field: any) => (<div key={field.key}><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">{field.label}</label>{field.type === 'select' ? <select className="w-full bg-black/30 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white" value={(carFormData as any)[field.key] || ''} onChange={e => setCarFormData({...carFormData, [field.key]: e.target.value})}>{field.opts.map((o:string) => <option key={o} value={o}>{o}</option>)}</select> : <input type={field.type} className="w-full bg-black/30 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white" value={(carFormData as any)[field.key] || ''} onChange={e => setCarFormData({...carFormData, [field.key]: e.target.value})} />}</div>))}
                   <div className="md:col-span-2"><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">Descrição</label><textarea className="w-full bg-black/30 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white h-24" value={carFormData.description || ''} onChange={e => setCarFormData({...carFormData, description: e.target.value})}></textarea></div>
                   <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-gray-800"><button type="button" onClick={() => setIsEditingCar(false)} className="px-6 py-3 rounded-xl border border-gray-700 text-gray-400">Cancelar</button><button type="submit" disabled={saving} className="px-8 py-3 rounded-xl bg-brand-orange text-white font-bold text-xs uppercase shadow-glow flex items-center gap-2">{saving ? <FaSync className="animate-spin"/> : <FaSave />} Salvar</button></div>
                </form>
             </div>
           )}

           {activeTab === 'sellers' && (
             <div className="bg-brand-surface border border-gray-800 rounded-2xl overflow-hidden shadow-xl animate-fade-in max-w-4xl mx-auto">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                    <h3 className="font-bold text-white flex items-center gap-2"><FaHeadset className="text-brand-orange"/> Vendedores</h3>
                    <button onClick={() => setIsCreatingSeller(!isCreatingSeller)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2">
                      {isCreatingSeller ? <FaTimes/> : <FaPlus />} {isCreatingSeller ? 'Cancelar' : 'Adicionar'}
                    </button>
                </div>
                {isCreatingSeller && (
                   <form onSubmit={handleSellerSave} className="p-6 bg-blue-900/10 border-b border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <div><label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">Nome</label><input type="text" className="w-full bg-black/30 border border-gray-700 rounded-lg p-2 text-sm text-white" value={sellerFormData.name || ''} onChange={e => setSellerFormData({...sellerFormData, name: e.target.value})} placeholder="Ex: João Silva" /></div>
                      <div><label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">WhatsApp (Só números)</label><input type="text" className="w-full bg-black/30 border border-gray-700 rounded-lg p-2 text-sm text-white" value={sellerFormData.whatsapp || ''} onChange={e => setSellerFormData({...sellerFormData, whatsapp: e.target.value})} placeholder="Ex: 5511999999999" /></div>
                      <div className="md:col-span-2"><button type="submit" className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg font-bold text-sm h-10 w-full">Salvar Vendedor</button></div>
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
                    <h3 className="font-bold text-white flex items-center gap-2"><FaUserShield className="text-brand-orange"/> Usuários Admin</h3>
                    <button onClick={() => setIsCreatingUser(!isCreatingUser)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2">
                      {isCreatingUser ? <FaTimes/> : <FaUserPlus />} {isCreatingUser ? 'Cancelar' : 'Adicionar'}
                    </button>
                </div>
                {isCreatingUser && (
                   <form onSubmit={handleUserSave} className="p-6 bg-blue-900/10 border-b border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <div><label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">Nome</label><input type="text" className="w-full bg-black/30 border border-gray-700 rounded-lg p-2 text-sm text-white" value={userFormData.name || ''} onChange={e => setUserFormData({...userFormData, name: e.target.value})} /></div>
                      <div><label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">Email</label><input type="email" className="w-full bg-black/30 border border-gray-700 rounded-lg p-2 text-sm text-white" value={userFormData.email || ''} onChange={e => setUserFormData({...userFormData, email: e.target.value})} /></div>
                      <div className="md:col-span-2"><button type="submit" className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg font-bold text-sm h-10 w-full">Salvar Usuário</button></div>
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
