import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBasket, Trash2, Plus, Minus, Wallet, Banknote, CreditCard,
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

const PixIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.08 17.67l-2.37-2.37a1 1 0 00-1.41 0l-2.37 2.37a2.83 2.83 0 01-2 .83h-.7l3.68 3.68a3.22 3.22 0 004.57 0l3.68-3.68h-.55a2.83 2.83 0 01-2-.83h-.53z"/>
    <path d="M8.93 6.33l2.37 2.37a1 1 0 001.41 0l2.37-2.37a2.83 2.83 0 012-.83h.55L14 1.82a3.22 3.22 0 00-4.57 0L5.76 5.5h.7a2.83 2.83 0 012 .83h.47z"/>
    <path d="M21.18 9.42l-1.59-1.59a.42.42 0 00-.3-.12h-1.76a1.42 1.42 0 00-1 .41l-2.37 2.37a2.42 2.42 0 01-3.42 0L8.37 8.12a1.42 1.42 0 00-1-.41H5.61a.42.42 0 00-.3.12L3.72 9.42a3.22 3.22 0 000 4.57l1.59 1.59a.42.42 0 00.3.12h1.76a1.42 1.42 0 001-.41l2.37-2.37a2.42 2.42 0 013.42 0l2.37 2.37a1.42 1.42 0 001 .41h1.76a.42.42 0 00.3-.12l1.59-1.59a3.22 3.22 0 000-4.57z"/>
  </svg>
);

const PAYMENT_METHODS = [
  { id: 'dinheiro', label: 'Dinheiro', icon: <Banknote size={18} />, active: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
  { id: 'pix', label: 'Pix', icon: <PixIcon size={18} />, active: 'border-teal-500 bg-teal-50 text-teal-700' },
  { id: 'credito', label: 'Crédito', icon: <CreditCard size={18} />, active: 'border-blue-500 bg-blue-50 text-blue-700' },
  { id: 'debito', label: 'Débito', icon: <CreditCard size={18} />, active: 'border-purple-500 bg-purple-50 text-purple-700' },
];

const getPaymentInfo = (id) => PAYMENT_METHODS.find(m => m.id === id);

const App = () => {
  // --- Estados ---
  const [activeTab, setActiveTab] = useState('list');
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem('cestinha_items')) || []);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('cestinha_history')) || []);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [budget, setBudget] = useState(() => parseFloat(localStorage.getItem('cestinha_budget')) || 0);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [isFinishOpen, setIsFinishOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
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
    setSelectedPayment(null);
    setIsFinishOpen(true);
  };

  const confirmFinishShopping = async () => {
    if (!selectedPayment) return;
    const newPurchase = {
      date: new Date().toISOString(),
      total: totalCost,
      itemCount: items.length,
      items: [...items],
      budget: budget > 0 ? budget : null,
      paymentMethod: selectedPayment
    };

    setHistory(prev => [newPurchase, ...prev]);
    setItems([]);
    setBudget(0);
    setIsFinishOpen(false);
    setActiveTab('history');

    if (!import.meta.env.DEV) {
      try {
        const response = await fetch('/api/salvar-compra', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPurchase)
        });
        if (!response.ok) throw new Error('Erro ao salvar no banco');
      } catch (_) {
        console.warn("Falha na sincronização online.");
      }
    }
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
    <div className="space-y-3 pb-28 animate-fadeIn">
      <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 border-none shadow-lg shadow-emerald-200/40">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-emerald-100 text-[11px] font-medium uppercase tracking-wider">Total Atual</p>
            <h2 className="text-3xl font-bold tracking-tight">{formatCurrency(totalCost)}</h2>
          </div>
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md"><ShoppingBasket size={20} className="text-white" /></div>
        </div>
        {budget > 0 ? (
          <div className="space-y-1.5 cursor-pointer active:opacity-80 transition-opacity" onClick={() => setIsBudgetOpen(true)}>
            <div className="flex justify-between text-[10px] font-bold text-emerald-50 uppercase tracking-wider">
              <span>Meta: {formatCurrency(budget)}</span>
              <span className={remainingBudget < 0 ? 'text-red-200 font-black' : ''}>Resta: {formatCurrency(remainingBudget)}</span>
            </div>
            <div className="h-2 bg-black/20 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-1000 ease-out ${remainingBudget < 0 ? 'bg-red-400' : 'bg-white'}`} style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        ) : (
          <button onClick={() => setIsBudgetOpen(true)} className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl transition-all w-full text-left flex items-center gap-2 border border-white/10 font-medium"><Wallet size={14} /> Definir limite de gastos</button>
        )}
      </Card>

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-gray-200">
            <ShoppingBasket size={32} className="text-gray-200 mx-auto mb-3" />
            <h3 className="text-gray-700 font-bold text-base mb-0.5">Cestinha Vazia</h3>
            <p className="text-gray-400 text-xs">Toque no + para adicionar produtos.</p>
          </div>
        ) : (
          items.map(item => {
            const cat = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[0];
            const hist = getProductHistory(item.name);
            const diff = hist ? item.price - hist.price : 0;
            return (
              <div key={item.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-3 items-start active:scale-[0.98] transition-all">
                <div className={`p-2.5 rounded-xl shrink-0 bg-${cat.color}-50 text-${cat.color}-600`}>{cat.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-800 text-sm truncate pr-1">{item.name}</h3>
                    <span className="font-bold text-gray-900 text-sm shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 mb-2">
                    <p className="text-xs text-gray-500">{formatCurrency(item.price)} <span className="text-[10px] text-gray-400">/{item.unit}</span></p>
                    {hist && Math.abs(diff) > 0.01 && (
                      <div className={`text-[9px] font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${diff > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {diff > 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />} {diff > 0 ? '+' : ''}{formatCurrency(Math.abs(diff))}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-0.5 bg-gray-50 rounded-xl p-1 border border-gray-100">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white text-gray-600 rounded-lg shadow-sm active:bg-gray-100"><Minus size={14} /></button>
                      <div className="min-w-[3rem] text-center">
                         <span className="text-sm font-bold text-gray-800">{item.unit === 'kg' ? item.quantity.toLocaleString('pt-BR', { minimumFractionDigits: 3 }) : item.quantity}</span>
                         <span className="text-[9px] block font-semibold text-gray-400 uppercase leading-none">{item.unit}</span>
                      </div>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-emerald-600 text-white rounded-lg shadow-sm active:bg-emerald-700"><Plus size={14} /></button>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setFormData({ ...item }); setEditingId(item.id); setIsFormOpen(true); }} className="p-2 text-gray-400 bg-gray-50 rounded-xl hover:text-emerald-600"><Edit2 size={16} /></button>
                      <button onClick={() => setConfirmModal({ isOpen: true, title: 'Remover?', message: `Remover ${item.name}?`, onConfirm: () => setItems(items.filter(i => i.id !== item.id)) })} className="p-2 text-gray-400 bg-gray-50 rounded-xl hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {items.length > 0 && <Button onClick={finishShopping} variant="success" className="w-full mt-4 h-12 text-base font-bold">Finalizar Compra</Button>}
      </div>
    </div>
  );

  const deletePurchase = (purchaseToDelete) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir compra?',
      message: `Remover a compra de ${formatCurrency(purchaseToDelete.total)}?`,
      variant: 'danger',
      confirmText: 'Excluir',
      onConfirm: () => {
        const updated = history.filter(h => h !== purchaseToDelete && (h.id !== purchaseToDelete.id || h.date !== purchaseToDelete.date));
        setHistory(updated);
      }
    });
  };

  const clearAllHistory = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Limpar histórico?',
      message: 'Isso removerá todas as compras salvas. Esta ação não pode ser desfeita.',
      variant: 'danger',
      confirmText: 'Limpar tudo',
      onConfirm: () => setHistory([])
    });
  };

  const HistoryView = () => {
    // Agrupamento por mês
    const groupedByMonth = useMemo(() => {
      const sorted = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
      const groups = {};
      sorted.forEach(purchase => {
        const d = new Date(purchase.date);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const dayLabel = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });

        if (!groups[monthKey]) groups[monthKey] = { label: monthLabel, total: 0, days: {} };
        groups[monthKey].total += purchase.total;

        if (!groups[monthKey].days[dayKey]) groups[monthKey].days[dayKey] = { label: dayLabel, total: 0, purchases: [] };
        groups[monthKey].days[dayKey].total += purchase.total;
        groups[monthKey].days[dayKey].purchases.push(purchase);
      });
      return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
    }, [history]);

    return (
      <div className="space-y-4 pb-24 animate-fadeIn">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><History size={22} className="text-emerald-600" /> Histórico</h2>
          {history.length > 0 && (
            <button onClick={clearAllHistory} className="text-xs text-red-400 hover:text-red-600 font-semibold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
              <Trash2 size={13} /> Limpar
            </button>
          )}
        </div>

        {loadingHistory ? (
          <div className="py-16 text-center">
            <div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-gray-400 font-medium text-xs uppercase tracking-wider">Sincronizando...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Calendar size={36} className="mx-auto mb-3 opacity-10" />
            <p className="text-gray-400 text-sm">Nenhuma compra salva.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {groupedByMonth.map(([monthKey, monthData]) => (
              <div key={monthKey}>
                {/* Cabeçalho do mês */}
                <div className="flex justify-between items-center mb-2 px-1">
                  <h3 className="text-sm font-bold text-gray-700 capitalize">{monthData.label}</h3>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{formatCurrency(monthData.total)}</span>
                </div>

                <div className="space-y-2">
                  {Object.entries(monthData.days).sort((a, b) => b[0].localeCompare(a[0])).map(([dayKey, dayData]) => (
                    <div key={dayKey}>
                      {/* Cabeçalho do dia */}
                      <div className="flex justify-between items-center mb-1 px-1">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase">{dayData.label}</span>
                        <span className="text-[11px] font-semibold text-gray-400">{formatCurrency(dayData.total)}</span>
                      </div>

                      {/* Compras do dia */}
                      {dayData.purchases.map((purchase, idx) => {
                        const pm = getPaymentInfo(purchase.paymentMethod);
                        return (
                        <Card key={purchase.id || idx} className="mb-1.5">
                          <div className="p-3 flex items-center gap-3">
                            <div className="flex-1 cursor-pointer" onClick={() => setViewingPurchase(purchase)}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-500 font-medium">
                                  {new Date(purchase.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="font-bold text-emerald-700 text-sm">{formatCurrency(purchase.total)}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                {pm && <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded-md">{pm.icon} {pm.label}</span>}
                                {purchase.budget && <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">Meta: {formatCurrency(purchase.budget)}</span>}
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] text-gray-400">{purchase.itemCount || purchase.items?.length} itens</span>
                                <span className="flex items-center gap-0.5 text-emerald-600 text-[10px] font-semibold">Ver detalhes <ChevronRight size={12} /></span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); deletePurchase(purchase); }}
                              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </Card>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 md:max-w-md md:mx-auto md:shadow-2xl md:border-x border-gray-200">
      <div className="sticky top-0 bg-white/90 backdrop-blur-md z-30 border-b border-gray-100 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700"><ShoppingBasket size={20} /></div>
            <h1 className="font-bold text-lg text-gray-800 tracking-tight">Minha Cestinha</h1>
        </div>
      </div>

      <main className="p-4 sm:p-5">
        {activeTab === 'list' && <ListView />}
        {activeTab === 'history' && <HistoryView />}
        {activeTab === 'stats' && <div className="p-10 text-center text-gray-400">Em desenvolvimento...</div>}
      </main>

      {activeTab === 'list' && (
        <button onClick={() => { setEditingId(null); setFormData(initialFormState); setIsFormOpen(true); }} className="fixed bottom-24 right-4 md:right-[calc(50%-12rem)] w-14 h-14 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-400/30 flex items-center justify-center active:scale-90 transition-all z-40">
          <Plus size={28} strokeWidth={2.5} />
        </button>
      )}

      {/* MODAL: Formulário */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={() => setIsFormOpen(false)}>
          <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl shadow-2xl animate-slideUp flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-5 overflow-y-auto">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Editar Item' : 'Novo Item'}</h3>
                <button onClick={() => setIsFormOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveItem} className="space-y-4 pb-6">
                <div className="bg-gray-100 p-1 rounded-xl flex">
                  <button type="button" onClick={() => setFormData({ ...formData, unit: 'un', quantity: Math.ceil(formData.quantity) })} className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase transition-all ${formData.unit === 'un' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}>Unidade</button>
                  <button type="button" onClick={() => setFormData({ ...formData, unit: 'kg' })} className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase transition-all ${formData.unit === 'kg' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}>Peso (Kg)</button>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Nome do Produto</label>
                  <input autoFocus type="text" placeholder="Ex: Batata" className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-xl outline-none text-base font-semibold" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="flex gap-3">
                  <div className="flex-[3]">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Preço</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-sm">R$</span>
                      <input type="tel" inputMode="numeric" className="w-full p-4 pl-11 bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-xl outline-none text-base font-semibold" value={formData.price ? formData.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''} onChange={handlePriceChange} />
                    </div>
                  </div>
                  <div className="flex-[2]">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 text-center">Quant.</label>
                    <input type="number" step={formData.unit === 'kg' ? "0.001" : "1"} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-xl outline-none text-base font-semibold text-center" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 text-base font-bold mt-2">Guardar Produto</Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Meta */}
      {isBudgetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={() => setIsBudgetOpen(false)}>
          <div className="bg-white w-full max-w-md rounded-t-3xl p-5 shadow-2xl animate-slideUp" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800"><Wallet className="text-emerald-600" size={22} /> Definir Meta</h3>
              <button onClick={() => setIsBudgetOpen(false)} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="text-center space-y-6 pb-6">
              <div className="relative inline-block w-full max-w-[200px]">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-300">R$</span>
                <input autoFocus type="tel" inputMode="numeric" className="w-full bg-transparent border-b-3 border-gray-100 py-3 pl-10 text-4xl font-bold text-center focus:border-emerald-500 outline-none placeholder:text-gray-100 text-gray-800" placeholder="0,00" value={budget > 0 ? budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''} onChange={e => { const raw = e.target.value.replace(/\D/g, ''); setBudget(raw ? parseFloat(raw)/100 : 0); }} />
              </div>
              <div className="flex gap-3"><Button variant="secondary" className="flex-1 h-12 font-semibold text-sm" onClick={() => { setBudget(0); setIsBudgetOpen(false); }}>Limpar</Button><Button className="flex-[2] h-12 font-bold" onClick={() => setIsBudgetOpen(false)}>Salvar Meta</Button></div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Finalizar Compra */}
      {isFinishOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={() => setIsFinishOpen(false)}>
          <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl shadow-2xl animate-slideUp" onClick={e => e.stopPropagation()}>
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Finalizar Compra</h3>
                <button onClick={() => setIsFinishOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={20} /></button>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-4 text-center mb-4">
                <p className="text-emerald-600 font-bold text-xs uppercase mb-1">Total da Compra</p>
                <p className="text-3xl font-bold text-emerald-800">{formatCurrency(totalCost)}</p>
                <p className="text-xs text-emerald-600/60 mt-1">{items.length} itens</p>
                {budget > 0 && (
                  <div className={`mt-2 text-xs font-semibold ${remainingBudget >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    Meta: {formatCurrency(budget)} · {remainingBudget >= 0 ? `Economia de ${formatCurrency(remainingBudget)}` : `Estourou ${formatCurrency(Math.abs(remainingBudget))}`}
                  </div>
                )}
              </div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Forma de Pagamento</label>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {PAYMENT_METHODS.map(method => (
                  <button key={method.id} onClick={() => setSelectedPayment(method.id)} className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all text-sm font-semibold ${selectedPayment === method.id ? method.active : 'border-gray-100 bg-gray-50 text-gray-500'}`}>
                    {method.icon} {method.label}
                  </button>
                ))}
              </div>
              <Button onClick={confirmFinishShopping} variant="success" className="w-full h-12 text-base font-bold" disabled={!selectedPayment}>Confirmar Compra</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Detalhes */}
      {viewingPurchase && (
        <div className="fixed inset-0 z-50 bg-white animate-slideInRight overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b flex items-center gap-3 sticky top-0 bg-white/90 backdrop-blur-md z-10">
             <button onClick={() => setViewingPurchase(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 active:bg-gray-100 transition-colors"><ArrowLeft size={20} /></button>
             <div><h3 className="font-bold text-base text-gray-800">Resumo da Compra</h3><p className="text-[10px] font-semibold text-gray-400 uppercase">{formatDate(viewingPurchase.date)}</p></div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
             <div className="bg-emerald-50 rounded-2xl p-6 text-center mb-4">
                <p className="text-emerald-600 font-bold text-xs uppercase mb-1">Total Gasto</p>
                <p className="text-3xl font-bold text-emerald-800">{formatCurrency(viewingPurchase.total)}</p>
                <p className="text-xs text-emerald-600/60 mt-1">{viewingPurchase.itemCount || viewingPurchase.items?.length} itens</p>
             </div>
             {(viewingPurchase.paymentMethod || viewingPurchase.budget) && (
             <div className="flex gap-2 mb-5">
               {(() => { const pm = getPaymentInfo(viewingPurchase.paymentMethod); return pm ? (
                 <div className="flex-1 bg-gray-50 rounded-xl p-3 flex items-center gap-2 border border-gray-100">
                   <span className="text-gray-500">{pm.icon}</span>
                   <div><p className="text-[10px] text-gray-400 font-bold uppercase">Pagamento</p><p className="text-sm font-semibold text-gray-700">{pm.label}</p></div>
                 </div>
               ) : null; })()}
               {viewingPurchase.budget && (
                 <div className="flex-1 bg-amber-50 rounded-xl p-3 border border-amber-100">
                   <p className="text-[10px] text-amber-500 font-bold uppercase">Meta</p>
                   <p className="text-sm font-semibold text-amber-700">{formatCurrency(viewingPurchase.budget)}</p>
                   <p className={`text-[10px] font-semibold mt-0.5 ${viewingPurchase.total <= viewingPurchase.budget ? 'text-emerald-600' : 'text-red-500'}`}>
                     {viewingPurchase.total <= viewingPurchase.budget ? `Economizou ${formatCurrency(viewingPurchase.budget - viewingPurchase.total)}` : `Estourou ${formatCurrency(viewingPurchase.total - viewingPurchase.budget)}`}
                   </p>
                 </div>
               )}
             </div>
             )}
             <div className="space-y-2">
               {viewingPurchase.items?.map((item, idx) => (
                 <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                   <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-xl text-gray-400 shadow-sm">{CATEGORIES.find(c => c.id === item.category)?.icon || <ShoppingBasket size={16}/>}</div>
                      <div><p className="font-semibold text-gray-800 text-sm">{item.name}</p><p className="text-[10px] text-gray-400">{item.quantity} {item.unit} x {formatCurrency(item.price)}</p></div>
                   </div>
                   <p className="font-bold text-gray-800 text-sm">{formatCurrency(item.price * item.quantity)}</p>
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}

      <ConfirmationModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} variant={confirmModal.variant} confirmText={confirmModal.confirmText} />

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 pb-safe pt-2 px-4 flex justify-around items-center z-40 md:max-w-md md:mx-auto">
        <button onClick={() => setActiveTab('list')} className={`flex flex-col items-center gap-1 p-2 w-14 transition-all ${activeTab === 'list' ? 'text-emerald-600' : 'text-gray-300'}`}><ShoppingBasket size={22} strokeWidth={activeTab === 'list' ? 2.5 : 2} /><span className="text-[9px] font-bold uppercase">Cestinha</span></button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 p-2 w-14 transition-all ${activeTab === 'history' ? 'text-emerald-600' : 'text-gray-300'}`}><History size={22} strokeWidth={activeTab === 'history' ? 2.5 : 2} /><span className="text-[9px] font-bold uppercase">Histórico</span></button>
        <button onClick={() => setIsBudgetOpen(true)} className={`flex flex-col items-center gap-1 p-2 w-14 transition-all ${budget > 0 ? 'text-emerald-600' : 'text-gray-300'}`}><Wallet size={22} /><span className="text-[9px] font-bold uppercase">Meta</span></button>
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