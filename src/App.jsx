import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBasket, Trash2, Plus, Minus, Wallet, 
  PieChart, History, ChevronRight, CheckCircle2,
  X, Edit2, TrendingUp, TrendingDown, Calendar, ArrowLeft, AlertCircle,
  Leaf, Beef, Milk, SprayCan
} from 'lucide-react';

// --- Componentes de UI Reutilizáveis ---

const Card = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", ...props }) => {
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-lg shadow-emerald-200",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95",
    danger: "bg-red-50 text-red-500 hover:bg-red-100 active:scale-95",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-50",
    success: "bg-green-600 text-white hover:bg-green-700 active:scale-95 shadow-lg shadow-green-200"
  };
  
  return (
    <button 
      onClick={onClick} 
      className={`font-medium h-12 transition-all duration-200 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, variant = 'danger', confirmText = 'Confirmar', cancelText = 'Cancelar' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scaleUp">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
          {variant === 'danger' ? <Trash2 size={28} /> : <CheckCircle2 size={28} />}
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-500 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">{cancelText}</Button>
          <Button variant={variant === 'danger' ? 'danger' : 'success'} onClick={() => { onConfirm(); onClose(); }} className="flex-1">{confirmText}</Button>
        </div>
      </div>
    </div>
  );
};

// --- Configuração ---

const CATEGORIES = [
  { id: 'geral', label: 'Geral', icon: <ShoppingBasket size={18} />, color: 'gray' },
  { id: 'hortifruti', label: 'Hortifruti', icon: <Leaf size={18} />, color: 'green' },
  { id: 'carnes', label: 'Carnes', icon: <Beef size={18} />, color: 'red' },
  { id: 'laticinios', label: 'Laticínios', icon: <Milk size={18} />, color: 'blue' },
  { id: 'limpeza', label: 'Limpeza', icon: <SprayCan size={18} />, color: 'indigo' },
];

const App = () => {
  // --- Estados ---
  const [activeTab, setActiveTab] = useState('list');
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem('cestinha_items')) || []);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('cestinha_history')) || []);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [budget, setBudget] = useState(() => parseFloat(localStorage.getItem('cestinha_budget')) || 0);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'danger' });

  const initialFormState = { name: '', price: '', quantity: 1, unit: 'un', category: 'geral' };
  const [formData, setFormData] = useState(initialFormState);

  // --- Persistência Local ---
  useEffect(() => { localStorage.setItem('cestinha_items', JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem('cestinha_budget', budget.toString()); }, [budget]);
  useEffect(() => { localStorage.setItem('cestinha_history', JSON.stringify(history)); }, [history]);

  // --- Sincronização com Backend ---
  const fetchHistoryFromDb = async () => {
    // Em desenvolvimento, usa localStorage. Em produção (Vercel), usa a API
    const isDev = import.meta.env.DEV;
    
    if (isDev) {
      console.info("Modo desenvolvimento: usando localStorage");
      return;
    }

    setLoadingHistory(true);
    try {
      const response = await fetch('/api/history');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro desconhecido no servidor');
      }
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error("Erro ao sincronizar com o banco:", error.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistoryFromDb();
  }, []);

  // --- Cálculos ---
  const totalCost = useMemo(() => items.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0), [items]);
  const remainingBudget = budget - totalCost;
  const progressPercent = budget > 0 ? Math.min((totalCost / budget) * 100, 100) : 0;

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date);
    } catch (e) { return "Data indisponível"; }
  };

  const getProductHistory = (productName) => {
    if (!productName || !history.length) return null;
    const normalizedName = productName.toLowerCase().trim();
    for (const purchase of history) {
      if (purchase.items && Array.isArray(purchase.items)) {
        const found = purchase.items.find(i => i.name.toLowerCase().trim() === normalizedName);
        if (found) return { price: found.price, date: purchase.date };
      }
    }
    return null;
  };

  // --- Handlers ---
  const handlePriceChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, ''); 
    const numericValue = rawValue ? parseFloat(rawValue) / 100 : '';
    setFormData({ ...formData, price: numericValue });
  };

  const handleSaveItem = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;
    const newItemData = { ...formData, quantity: parseFloat(formData.quantity) || 1, price: parseFloat(formData.price) };

    if (editingId) {
      setItems(items.map(item => item.id === editingId ? { ...newItemData, id: editingId } : item));
      setEditingId(null);
    } else {
      setItems([{ id: Date.now(), ...newItemData, createdAt: new Date().toISOString() }, ...items]);
    }
    setFormData(initialFormState);
    setIsFormOpen(false);
  };

  const finishShopping = () => {
    if (items.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'Finalizar Compra',
      message: 'Deseja salvar esta compra no banco de dados e limpar a lista?',
      variant: 'success',
      confirmText: 'Finalizar',
      onConfirm: async () => {
        const newPurchase = {
          date: new Date().toISOString(),
          total: totalCost,
          itemCount: items.length,
          items: [...items]
        };

        // Salva localmente primeiro (instantâneo)
        setHistory(prev => [newPurchase, ...prev]);
        setItems([]);
        setActiveTab('history');

        // Só sincroniza com o banco em produção
        if (!import.meta.env.DEV) {
          try {
            const response = await fetch('/api/salvar-compra', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(newPurchase)
            });
            if (!response.ok) throw new Error('Erro ao salvar no banco');
            console.info("Compra sincronizada com o banco com sucesso!");
          } catch (error) {
            console.warn("Falha na sincronização online. Os dados permanecem salvos no seu navegador.");
          }
        }
      }
    });
  };

  const updateQuantity = (id, change) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const isKg = item.unit === 'kg';
        const step = isKg ? 0.1 : 1;
        const newQty = Math.max(isKg ? 0.05 : 1, item.quantity + (change * step));
        return { ...item, quantity: isKg ? Math.round(newQty * 1000) / 1000 : newQty };
      }
      return item;
    }));
  };

  // --- Views ---

  const ListView = () => (
    <div className="space-y-5 pb-32 animate-fadeIn">
      <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 border-none shadow-xl shadow-emerald-200/50">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-emerald-100 text-sm font-medium mb-1 uppercase tracking-wider">Total Atual</p>
            <h2 className="text-5xl font-bold tracking-tight">{formatCurrency(totalCost)}</h2>
          </div>
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md"><ShoppingBasket size={26} className="text-white" /></div>
        </div>
        {budget > 0 ? (
          <div className="space-y-3 cursor-pointer active:opacity-80 transition-opacity" onClick={() => setIsBudgetOpen(true)}>
            <div className="flex justify-between text-xs font-bold text-emerald-50 uppercase tracking-widest">
              <span>Meta: {formatCurrency(budget)}</span>
              <span className={remainingBudget < 0 ? 'text-red-200 font-black' : ''}>Resta: {formatCurrency(remainingBudget)}</span>
            </div>
            <div className="h-3 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
              <div className={`h-full transition-all duration-1000 ease-out ${remainingBudget < 0 ? 'bg-red-400' : 'bg-white shadow-[0_0_8px_white]'}`} style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        ) : (
          <button onClick={() => setIsBudgetOpen(true)} className="text-sm bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-2xl transition-all w-full text-left flex items-center gap-2 border border-white/10 font-semibold"><Wallet size={18} /> Definir limite de gastos</button>
        )}
      </Card>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-24 px-6 bg-white rounded-3xl border border-dashed border-gray-200">
            <ShoppingBasket size={44} className="text-gray-200 mx-auto mb-4" />
            <h3 className="text-gray-800 font-bold text-xl mb-1">Cestinha Vazia</h3>
            <p className="text-gray-400 text-sm">Toque no + para adicionar produtos.</p>
          </div>
        ) : (
          items.map(item => {
            const cat = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[0];
            const hist = getProductHistory(item.name);
            const diff = hist ? item.price - hist.price : 0;
            return (
              <div key={item.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex gap-4 items-start active:scale-[0.98] transition-all">
                <div className={`p-4 rounded-2xl shrink-0 bg-${cat.color}-50 text-${cat.color}-600 shadow-inner`}>{cat.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-800 text-lg truncate pr-1">{item.name}</h3>
                    <span className="font-extrabold text-gray-900 text-lg">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4">
                    <p className="text-sm text-gray-500 font-bold">{formatCurrency(item.price)} <span className="text-xs text-gray-400 font-normal">/{item.unit}</span></p>
                    {hist && Math.abs(diff) > 0.01 && (
                      <div className={`text-[10px] font-bold flex items-center gap-0.5 px-2 py-0.5 rounded-full ${diff > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {diff > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {diff > 0 ? '+' : ''}{formatCurrency(Math.abs(diff))}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 bg-gray-50 rounded-2xl p-1.5 border border-gray-100 shadow-inner">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-10 h-10 flex items-center justify-center bg-white text-gray-600 rounded-xl shadow-sm active:bg-gray-100"><Minus size={18} /></button>
                      <div className="min-w-[4rem] text-center">
                         <span className="text-base font-extrabold text-gray-800">{item.unit === 'kg' ? item.quantity.toLocaleString('pt-BR', { minimumFractionDigits: 3 }) : item.quantity}</span>
                         <span className="text-[10px] block font-bold text-gray-400 uppercase leading-none">{item.unit}</span>
                      </div>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-10 h-10 flex items-center justify-center bg-emerald-600 text-white rounded-xl shadow-sm active:bg-emerald-700"><Plus size={18} /></button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setFormData({ ...item }); setEditingId(item.id); setIsFormOpen(true); }} className="p-3 text-gray-400 bg-gray-50 rounded-2xl hover:text-emerald-600"><Edit2 size={20} /></button>
                      <button onClick={() => setConfirmModal({ isOpen: true, title: 'Remover?', message: `Remover ${item.name}?`, onConfirm: () => setItems(items.filter(i => i.id !== item.id)) })} className="p-3 text-gray-400 bg-gray-50 rounded-2xl hover:text-red-500"><Trash2 size={20} /></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {items.length > 0 && <Button onClick={finishShopping} variant="success" className="w-full mt-8 h-16 text-xl font-bold uppercase tracking-wide">Finalizar Compra</Button>}
      </div>
    </div>
  );

  const HistoryView = () => (
    <div className="space-y-6 pb-24 animate-fadeIn">
      <div className="flex justify-between items-center px-2">
         <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3"><History size={28} className="text-emerald-600" /> Histórico</h2>
         <button onClick={fetchHistoryFromDb} className="p-2 text-emerald-600 bg-emerald-50 rounded-xl active:rotate-180 transition-all duration-500"><Plus className="rotate-45" size={20} /></button>
      </div>
      {loadingHistory ? (
        <div className="py-24 text-center">
           <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
           <p className="text-gray-400 font-bold uppercase text-xs tracking-widest tracking-widest">Sincronizando...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-gray-100">
          <Calendar size={48} className="mx-auto mb-4 opacity-10" />
          <p className="text-gray-400 font-medium">Nenhuma compra salva.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...history].sort((a, b) => new Date(b.date) - new Date(a.date)).map(purchase => (
            <Card key={purchase.id || Math.random()} className="active:scale-[0.97] transition-transform duration-200 cursor-pointer" onClick={() => setViewingPurchase(purchase)}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-gray-600 text-lg">{formatDate(purchase.date)}</span>
                  <span className="font-black text-emerald-700 bg-emerald-50 px-4 py-2 rounded-2xl">{formatCurrency(purchase.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-xl">{purchase.itemCount || purchase.items?.length} Itens</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-black text-xs uppercase tracking-widest">Ver Detalhes <ChevronRight size={16} /></span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 md:max-w-md md:mx-auto md:shadow-2xl md:border-x border-gray-200">
      <div className="sticky top-0 bg-white/90 backdrop-blur-md z-30 border-b border-gray-100 px-5 py-5 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2.5 rounded-2xl text-emerald-700 shadow-sm"><ShoppingBasket size={24} /></div>
            <h1 className="font-black text-2xl text-gray-800 tracking-tighter">Minha Cestinha</h1>
        </div>
      </div>

      <main className="p-4 sm:p-5">
        {activeTab === 'list' && <ListView />}
        {activeTab === 'history' && <HistoryView />}
        {activeTab === 'stats' && <div className="p-10 text-center text-gray-400">Em desenvolvimento...</div>}
      </main>

      {activeTab === 'list' && (
        <button onClick={() => { setEditingId(null); setFormData(initialFormState); setIsFormOpen(true); }} className="fixed bottom-28 right-5 md:right-[calc(50%-12rem)] w-16 h-16 bg-emerald-600 text-white rounded-3xl shadow-2xl shadow-emerald-400 flex items-center justify-center active:scale-90 transition-all z-40">
          <Plus size={36} strokeWidth={2.5} />
        </button>
      )}

      {/* MODAL: Formulário */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={() => setIsFormOpen(false)}>
          <div className="bg-white w-full max-w-md mx-auto rounded-t-[40px] shadow-2xl animate-slideUp flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
            <div className="p-8 overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-gray-800">{editingId ? 'Editar Item' : 'Novo Item'}</h3>
                <button onClick={() => setIsFormOpen(false)} className="p-2.5 bg-gray-100 rounded-full text-gray-500"><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveItem} className="space-y-6 pb-12">
                <div className="bg-gray-100 p-1.5 rounded-[20px] flex">
                  <button type="button" onClick={() => setFormData({ ...formData, unit: 'un', quantity: Math.ceil(formData.quantity) })} className={`flex-1 py-3 rounded-2xl text-sm font-black uppercase transition-all ${formData.unit === 'un' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}>Unidade</button>
                  <button type="button" onClick={() => setFormData({ ...formData, unit: 'kg' })} className={`flex-1 py-3 rounded-2xl text-sm font-black uppercase transition-all ${formData.unit === 'kg' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}>Peso (Kg)</button>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nome do Produto</label>
                  <input autoFocus type="text" placeholder="Ex: Batata" className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-[20px] outline-none text-lg font-bold shadow-inner" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="flex gap-4">
                  <div className="flex-[3]">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Preço</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-lg">R$</span>
                      <input type="tel" inputMode="numeric" className="w-full p-5 pl-12 bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-[20px] outline-none text-lg font-bold" value={formData.price ? formData.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''} onChange={handlePriceChange} />
                    </div>
                  </div>
                  <div className="flex-[2]">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 text-center">Quant.</label>
                    <input type="number" step={formData.unit === 'kg' ? "0.001" : "1"} className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-[20px] outline-none text-lg font-bold text-center" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
                  </div>
                </div>
                <Button type="submit" className="w-full h-16 text-xl font-bold uppercase tracking-widest mt-4 shadow-xl">Guardar Produto</Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Meta */}
      {isBudgetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={() => setIsBudgetOpen(false)}>
          <div className="bg-white w-full max-w-md rounded-t-[40px] p-8 shadow-2xl animate-slideUp" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black flex items-center gap-3 text-gray-800"><Wallet className="text-emerald-600" size={28} /> Definir Meta</h3>
              <button onClick={() => setIsBudgetOpen(false)} className="p-2.5 bg-gray-100 rounded-full"><X size={24} /></button>
            </div>
            <div className="text-center space-y-10 pb-10">
              <div className="relative inline-block w-full max-w-[240px]">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl font-black text-gray-300">R$</span>
                <input autoFocus type="tel" inputMode="numeric" className="w-full bg-transparent border-b-4 border-gray-100 py-4 pl-12 text-5xl font-black text-center focus:border-emerald-500 outline-none placeholder:text-gray-100 text-gray-800" placeholder="0,00" value={budget > 0 ? budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''} onChange={e => { const raw = e.target.value.replace(/\D/g, ''); setBudget(raw ? parseFloat(raw)/100 : 0); }} />
              </div>
              <div className="flex gap-4"><Button variant="secondary" className="flex-1 h-14 font-bold" onClick={() => { setBudget(0); setIsBudgetOpen(false); }}>Limpar</Button><Button className="flex-[2] h-14 font-bold text-lg" onClick={() => setIsBudgetOpen(false)}>Salvar Meta</Button></div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Detalhes */}
      {viewingPurchase && (
        <div className="fixed inset-0 z-50 bg-white animate-slideInRight overflow-hidden flex flex-col">
          <div className="px-6 py-6 border-b flex items-center gap-4 sticky top-0 bg-white/80 backdrop-blur-md z-10">
             <button onClick={() => setViewingPurchase(null)} className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-50 active:bg-gray-100 transition-colors"><ArrowLeft size={24} /></button>
             <div><h3 className="font-black text-xl text-gray-800">Resumo</h3><p className="text-xs font-bold text-gray-400 uppercase">{formatDate(viewingPurchase.date)}</p></div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
             <div className="bg-emerald-50 rounded-[32px] p-10 text-center mb-10">
                <p className="text-emerald-600 font-black text-sm uppercase mb-2">Total Gasto</p>
                <p className="text-6xl font-black text-emerald-800">{formatCurrency(viewingPurchase.total)}</p>
             </div>
             <div className="space-y-4">
               {viewingPurchase.items?.map((item, idx) => (
                 <div key={idx} className="flex justify-between items-center p-5 bg-gray-50 rounded-3xl border border-gray-100">
                   <div className="flex items-center gap-4">
                      <div className="bg-white p-3 rounded-2xl text-gray-400 shadow-sm">{CATEGORIES.find(c => c.id === item.category)?.icon || <ShoppingBasket size={20}/>}</div>
                      <div><p className="font-black text-gray-800 text-lg leading-none mb-1">{item.name}</p><p className="text-xs font-bold text-gray-400 uppercase">{item.quantity} {item.unit} x {formatCurrency(item.price)}</p></div>
                   </div>
                   <p className="font-black text-gray-800 text-lg">{formatCurrency(item.price * item.quantity)}</p>
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}

      <ConfirmationModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} variant={confirmModal.variant} confirmText={confirmModal.confirmText} />

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 pb-safe pt-4 px-4 flex justify-around items-center z-40 md:max-w-md md:mx-auto">
        <button onClick={() => setActiveTab('list')} className={`flex flex-col items-center gap-1.5 p-2 w-16 transition-all ${activeTab === 'list' ? 'text-emerald-600' : 'text-gray-300'}`}><ShoppingBasket size={28} strokeWidth={activeTab === 'list' ? 2.5 : 2} /><span className="text-[10px] font-black uppercase tracking-tighter">Cestinha</span></button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1.5 p-2 w-16 transition-all ${activeTab === 'history' ? 'text-emerald-600' : 'text-gray-300'}`}><History size={28} strokeWidth={activeTab === 'history' ? 2.5 : 2} /><span className="text-[10px] font-black uppercase tracking-tighter">Histórico</span></button>
        <button onClick={() => setIsBudgetOpen(true)} className={`flex flex-col items-center gap-1.5 p-2 w-16 transition-all ${budget > 0 ? 'text-emerald-600' : 'text-gray-300'}`}><Wallet size={28} /><span className="text-[10px] font-black uppercase tracking-tighter">Meta</span></button>
      </nav>
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-scaleUp { animation: scaleUp 0.2s ease-out; }
        .animate-slideInRight { animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default App;