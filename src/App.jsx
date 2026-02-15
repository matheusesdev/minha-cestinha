import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShoppingBasket, Trash2, Plus, Minus, Wallet, 
  PieChart, History, ChevronRight, CheckCircle2,
  X, Edit2, TrendingUp, TrendingDown, Calendar, ArrowLeft, AlertCircle
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

// Componente de Modal Genérico para Confirmações
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, variant = 'danger', confirmText = 'Confirmar', cancelText = 'Cancelar' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-scaleUp">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
          {variant === 'danger' ? <Trash2 size={24} /> : <CheckCircle2 size={24} />}
        </div>
        
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-500 mb-6 leading-relaxed">{message}</p>
        
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            {cancelText}
          </Button>
          <Button 
            variant={variant === 'danger' ? 'danger' : 'success'} 
            onClick={() => { onConfirm(); onClose(); }} 
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- Dados Estáticos ---

const CATEGORIES = [
  { id: 'geral', label: 'Geral', icon: <ShoppingBasket size={18} />, color: 'gray' },
  { id: 'hortifruti', label: 'Hortifruti', icon: <Leaf size={18} />, color: 'green' },
  { id: 'carnes', label: 'Carnes', icon: <Beef size={18} />, color: 'red' },
  { id: 'laticinios', label: 'Laticínios', icon: <Milk size={18} />, color: 'blue' },
  { id: 'limpeza', label: 'Limpeza', icon: <SprayCan size={18} />, color: 'indigo' },
];

import { Leaf, Beef, Milk, SprayCan } from 'lucide-react';

const App = () => {
  // --- Estados Globais ---
  const [activeTab, setActiveTab] = useState('list');
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem('cestinha_items')) || []);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('cestinha_history')) || []);
  const [budget, setBudget] = useState(() => parseFloat(localStorage.getItem('cestinha_budget')) || 0);
  
  // --- Estados de Interface (Modais) ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState(null);
  const [editingId, setEditingId] = useState(null);
  
  // Estado para Modal de Confirmação
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'danger' });

  const initialFormState = { name: '', price: '', quantity: 1, unit: 'un', category: 'geral' };
  const [formData, setFormData] = useState(initialFormState);

  // --- Persistência ---
  useEffect(() => { localStorage.setItem('cestinha_items', JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem('cestinha_history', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('cestinha_budget', budget.toString()); }, [budget]);

  // --- Lógica de Negócio ---
  const totalCost = useMemo(() => items.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0), [items]);
  const remainingBudget = budget - totalCost;
  const progressPercent = budget > 0 ? Math.min((totalCost / budget) * 100, 100) : 0;

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date);
  };

  const getProductHistory = (productName) => {
    if (!productName) return null;
    const normalizedName = productName.toLowerCase().trim();
    for (const purchase of history) {
      const foundItem = purchase.items.find(i => i.name.toLowerCase().trim() === normalizedName);
      if (foundItem) return { price: foundItem.price, date: purchase.date };
    }
    return null;
  };

  // --- Handlers ---
  
  // Abre modal de confirmação genérico
  const openConfirmation = (config) => {
    setConfirmModal({ isOpen: true, confirmText: 'Confirmar', cancelText: 'Cancelar', ...config });
  };

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

  const handleDeleteItem = (id) => {
    openConfirmation({
      title: 'Remover Item',
      message: 'Tem certeza que deseja remover este item da sua cestinha?',
      variant: 'danger',
      confirmText: 'Remover',
      onConfirm: () => setItems(items.filter(i => i.id !== id))
    });
  };

  const handleClearList = () => {
    openConfirmation({
      title: 'Limpar Cestinha',
      message: 'Isso apagará todos os itens da lista atual. Você não poderá desfazer.',
      variant: 'danger',
      confirmText: 'Limpar Tudo',
      onConfirm: () => setItems([])
    });
  };

  const finishShopping = () => {
    if (items.length === 0) return;
    openConfirmation({
      title: 'Finalizar Compra',
      message: 'Deseja salvar esta compra no histórico e limpar a cestinha atual?',
      variant: 'success',
      confirmText: 'Finalizar',
      onConfirm: () => {
        const newPurchase = {
          id: Date.now(),
          date: new Date().toISOString(),
          total: totalCost,
          itemCount: items.length,
          items: [...items]
        };
        setHistory([newPurchase, ...history]);
        setItems([]);
        setActiveTab('history');
      }
    });
  };

  const updateQuantity = (id, change) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const isKg = item.unit === 'kg';
        const step = isKg ? 0.1 : 1;
        const newQty = Math.max(isKg ? 0.05 : 1, item.quantity + (change * step));
        const roundedQty = isKg ? Math.round(newQty * 1000) / 1000 : newQty;
        return { ...item, quantity: roundedQty };
      }
      return item;
    }));
  };

  // --- Views ---

  const ListView = () => (
    <div className="space-y-4 pb-32 animate-fadeIn">
      {/* Card de Resumo e Meta */}
      <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 border-none shadow-xl shadow-emerald-200/50">
        <div className="flex justify-between items-start mb-5">
          <div>
            <p className="text-emerald-100 text-sm font-medium mb-1">Total da Cestinha</p>
            <h2 className="text-5xl font-bold tracking-tight">{formatCurrency(totalCost)}</h2>
          </div>
          <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
            <ShoppingBasket size={24} className="text-white" />
          </div>
        </div>
        
        {budget > 0 ? (
          <div className="space-y-2 cursor-pointer active:opacity-80 transition-opacity" onClick={() => setIsBudgetOpen(true)}>
            <div className="flex justify-between text-xs font-medium text-emerald-100 uppercase tracking-wide">
              <span>Meta: {formatCurrency(budget)}</span>
              <span>Resta: {formatCurrency(remainingBudget)}</span>
            </div>
            <div className="h-3 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
              <div 
                className={`h-full transition-all duration-700 ease-out ${remainingBudget < 0 ? 'bg-red-400' : 'bg-white'}`} 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
            {remainingBudget < 0 && (
              <p className="text-xs text-red-200 font-bold mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> Você ultrapassou a meta!
              </p>
            )}
          </div>
        ) : (
          <button 
            onClick={() => setIsBudgetOpen(true)}
            className="text-sm bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-xl transition-colors w-full text-left flex items-center gap-2 font-medium"
          >
            <Wallet size={18} />
            Definir meta de gastos
          </button>
        )}
      </Card>

      {/* Lista de Itens */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBasket size={40} className="text-gray-300" />
            </div>
            <h3 className="text-gray-800 font-bold text-lg mb-2">Sua cestinha está vazia</h3>
            <p className="text-gray-500 text-sm max-w-[200px] mx-auto">Adicione produtos tocando no botão + abaixo.</p>
          </div>
        ) : (
          items.map(item => {
            const catInfo = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[0];
            const isKg = item.unit === 'kg';
            const lastHistory = getProductHistory(item.name);
            const priceDiff = lastHistory ? item.price - lastHistory.price : 0;
            
            return (
              <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-start group relative overflow-hidden transition-transform active:scale-[0.99]">
                <div className={`p-3.5 rounded-xl z-10 shrink-0 ${catInfo.color === 'gray' ? 'bg-gray-100 text-gray-500' : `bg-${catInfo.color}-50 text-${catInfo.color}-600`}`}>
                  {catInfo.icon}
                </div>
                
                <div className="flex-1 min-w-0 z-10">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-gray-800 text-lg leading-tight truncate pr-2">{item.name}</h3>
                    <span className="font-bold text-gray-900 text-lg">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
                    <p className="text-sm text-gray-500 font-medium">
                      {formatCurrency(item.price)} <span className="text-xs text-gray-400 font-normal">/{isKg ? 'kg' : 'un'}</span>
                    </p>
                    
                    {lastHistory && Math.abs(priceDiff) > 0.01 && (
                      <div className={`text-[10px] font-bold flex items-center gap-0.5 px-2 py-0.5 rounded-md ${priceDiff > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {priceDiff > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {priceDiff > 0 ? '+' : ''}{formatCurrency(priceDiff)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 border border-gray-100">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-9 h-9 flex items-center justify-center bg-white text-gray-600 rounded-lg shadow-sm border border-gray-100 active:bg-gray-50 touch-manipulation"><Minus size={16} /></button>
                      <div className="flex flex-col items-center justify-center min-w-[3.5rem] px-1">
                         <span className="text-sm font-bold text-gray-800 leading-none">
                            {isKg ? item.quantity.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : item.quantity}
                         </span>
                         <span className="text-[9px] font-medium text-gray-400 uppercase leading-none mt-0.5">{isKg ? 'kg' : 'un'}</span>
                      </div>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-9 h-9 flex items-center justify-center bg-emerald-600 text-white rounded-lg shadow-sm active:bg-emerald-700 touch-manipulation"><Plus size={16} /></button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { setFormData({ unit: 'un', ...item }); setEditingId(item.id); setIsFormOpen(true); }} 
                        className="p-2.5 text-gray-400 bg-gray-50 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id)} 
                        className="p-2.5 text-gray-400 bg-gray-50 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {items.length > 0 && (
          <div className="pt-6">
            <Button onClick={finishShopping} variant="success" className="w-full py-4 text-lg shadow-xl shadow-green-100">
              <CheckCircle2 size={20} />
              Finalizar e Salvar Compra
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const HistoryView = () => {
    const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
      <div className="space-y-6 pb-24 animate-fadeIn">
        <h2 className="text-2xl font-bold text-gray-800 px-2 flex items-center gap-2">
          <History className="text-emerald-600" /> Histórico
        </h2>
        {history.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
               <Calendar size={32} className="text-gray-300" />
            </div>
            <p className="text-gray-600 font-medium">Nenhuma compra finalizada.</p>
            <p className="text-gray-400 text-sm mt-1">Ao finalizar uma cesta, ela aparecerá aqui.</p>
          </div>
        ) : (
          <div className="space-y-4">
             {sortedHistory.map(purchase => (
               <Card key={purchase.id} className="cursor-pointer hover:border-emerald-200 transition-colors active:scale-[0.98]" onClick={() => setViewingPurchase(purchase)}>
                 <div className="p-5">
                   <div className="flex justify-between items-center mb-3">
                     <div>
                       <span className="block font-bold text-gray-800 text-lg">{formatDate(purchase.date).split(',')[0]}</span>
                       <span className="text-xs text-gray-400 font-medium">{formatDate(purchase.date).split(',')[1]}</span>
                     </div>
                     <span className="font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                       {formatCurrency(purchase.total)}
                     </span>
                   </div>
                   <div className="flex justify-between items-center text-sm text-gray-500">
                     <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-600">{purchase.itemCount} itens</span>
                     <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs uppercase tracking-wide">
                       Ver detalhes <ChevronRight size={14} />
                     </span>
                   </div>
                 </div>
               </Card>
             ))}
          </div>
        )}
      </div>
    );
  };

  const StatsView = () => {
    const stats = CATEGORIES.map(cat => {
      const catItems = items.filter(i => i.category === cat.id);
      const total = catItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
      return { ...cat, total, count: catItems.length };
    }).filter(s => s.total > 0).sort((a, b) => b.total - a.total);

    return (
      <div className="space-y-6 pb-24 animate-fadeIn">
        <h2 className="text-2xl font-bold text-gray-800 px-2 flex items-center gap-2">
           <PieChart className="text-emerald-600" /> Análise Atual
        </h2>
        {stats.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
               <PieChart size={32} className="text-gray-300" />
            </div>
            <p className="text-gray-600 font-medium">Sem dados para analisar.</p>
            <p className="text-gray-400 text-sm mt-1">Adicione itens na cestinha primeiro.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.map(stat => (
              <div key={stat.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-${stat.color}-50 text-${stat.color}-600`}>
                  {stat.icon}
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-gray-700">{stat.label}</span>
                      <span className="font-bold text-gray-900">{formatCurrency(stat.total)}</span>
                   </div>
                   <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-1">
                      <div className={`h-full bg-${stat.color}-500`} style={{ width: `${(stat.total / totalCost) * 100}%` }} />
                   </div>
                   <p className="text-xs text-gray-400 text-right">{Math.round((stat.total / totalCost) * 100)}% dos gastos</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // --- Renderização Principal ---

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 md:max-w-md md:mx-auto md:shadow-2xl md:border-x border-gray-200">
      
      {/* Top Bar */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md z-30 border-b border-gray-100 px-5 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2.5">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700 shadow-sm">
                <ShoppingBasket size={22} />
            </div>
            <h1 className="font-extrabold text-xl text-gray-800 tracking-tight">Minha Cestinha</h1>
        </div>
        {items.length > 0 && activeTab === 'list' && (
          <button 
            onClick={handleClearList} 
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Limpar tudo"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>

      <main className="p-4 sm:p-5">
        {activeTab === 'list' && <ListView />}
        {activeTab === 'stats' && <StatsView />}
        {activeTab === 'history' && <HistoryView />}
      </main>

      {/* FAB - Botão Flutuante */}
      {activeTab === 'list' && (
        <button
          onClick={() => { setEditingId(null); setFormData(initialFormState); setIsFormOpen(true); }}
          className="fixed bottom-24 right-5 md:right-[calc(50%-12rem)] w-14 h-14 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center hover:bg-emerald-700 active:scale-90 transition-all z-40"
        >
          <Plus size={30} />
        </button>
      )}

      {/* --- MODAIS (AJUSTADOS PARA TECLADO) --- */}

      {/* MODAL 1: Formulário de Item */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={() => setIsFormOpen(false)}>
          {/* Container flexível que empurra conteúdo para cima se necessário, mas mantém bottom sheet */}
          <div 
            className="bg-white w-full max-w-md mx-auto rounded-t-3xl shadow-2xl animate-slideUp flex flex-col max-h-[90vh]" 
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 overflow-y-auto pb-safe">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">{editingId ? 'Editar Item' : 'Novo Item'}</h3>
                <button onClick={() => setIsFormOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="space-y-5">
                {/* Seletor de Unidade */}
                <div className="bg-gray-100 p-1.5 rounded-2xl flex">
                  <button type="button" onClick={() => setFormData({ ...formData, unit: 'un', quantity: Math.ceil(formData.quantity) })} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${formData.unit === 'un' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}>Unidade</button>
                  <button type="button" onClick={() => setFormData({ ...formData, unit: 'kg' })} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${formData.unit === 'kg' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}>Peso (Kg)</button>
                </div>

                {/* Nome */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nome do Produto</label>
                  <input 
                    autoFocus 
                    type="text" 
                    placeholder="Ex: Arroz" 
                    className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl outline-none transition-all text-lg font-semibold text-gray-800 placeholder:text-gray-300" 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    required 
                  />
                </div>

                {/* Preço e Qtd */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Preço ({formData.unit === 'kg' ? 'Kg' : 'Un'})</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">R$</span>
                      <input 
                        type="tel" 
                        inputMode="numeric" 
                        placeholder="0,00" 
                        className="w-full p-4 pl-10 bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl outline-none text-lg font-semibold text-gray-800 placeholder:text-gray-300" 
                        value={formData.price ? formData.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''} 
                        onChange={handlePriceChange} 
                      />
                    </div>
                  </div>
                  <div className="w-[40%]">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Quantidade</label>
                    {formData.unit === 'kg' ? (
                       <div className="relative">
                          <input 
                            type="number" 
                            step="0.001" 
                            className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl outline-none text-lg font-semibold text-center text-gray-800 placeholder:text-gray-300" 
                            value={formData.quantity} 
                            onChange={e => setFormData({ ...formData, quantity: e.target.value })} 
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">KG</span>
                       </div>
                    ) : (
                      <div className="flex items-center h-[62px] bg-gray-50 rounded-2xl px-1 border-2 border-transparent focus-within:border-emerald-500 focus-within:bg-white transition-all">
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))} className="w-10 h-full text-gray-400 hover:text-emerald-600 flex items-center justify-center active:scale-90"><Minus size={18} /></button>
                        <input type="number" className="w-full bg-transparent text-center font-bold text-lg outline-none p-0" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })} />
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, quantity: prev.quantity + 1 }))} className="w-10 h-full text-gray-400 hover:text-emerald-600 flex items-center justify-center active:scale-90"><Plus size={18} /></button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Categorias */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Categoria</label>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                    {CATEGORIES.map(cat => (
                      <button 
                        key={cat.id} 
                        type="button" 
                        onClick={() => setFormData({ ...formData, category: cat.id })} 
                        className={`flex flex-col items-center gap-2 p-3 min-w-[84px] rounded-2xl border-2 transition-all ${formData.category === cat.id ? `bg-${cat.color}-50 border-${cat.color}-500 text-${cat.color}-700 shadow-sm scale-105` : 'bg-white border-gray-100 text-gray-400 grayscale hover:grayscale-0'}`}
                      >
                        <div className={`p-1.5 rounded-full ${formData.category === cat.id ? 'bg-white' : 'bg-gray-100'}`}>{cat.icon}</div>
                        <span className="text-[10px] font-bold uppercase tracking-wide">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 pb-4"> {/* Padding extra para teclado */}
                  <Button type="submit" className="w-full py-4 text-lg shadow-xl shadow-emerald-200 h-14">
                    {editingId ? 'Salvar Alterações' : 'Adicionar à Cestinha'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Definir Meta (Ajustado para teclado) */}
      {isBudgetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={() => setIsBudgetOpen(false)}>
          <div 
            className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl animate-slideUp flex flex-col"
            style={{ maxHeight: '85vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Wallet className="text-emerald-600" /> Definir Meta
                </h3>
                <button onClick={() => setIsBudgetOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-8">
                <div className="text-center">
                  <label className="text-sm font-semibold text-gray-500 mb-4 block uppercase tracking-wide">Qual seu limite de gastos?</label>
                  <div className="relative inline-block w-full max-w-[200px]">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-300">R$</span>
                    <input 
                      autoFocus
                      type="tel" 
                      inputMode="numeric"
                      className="w-full bg-transparent border-b-2 border-gray-200 py-2 pl-10 pr-2 text-4xl font-bold text-gray-800 focus:outline-none focus:border-emerald-500 transition-all text-center placeholder:text-gray-200"
                      placeholder="0,00"
                      value={budget > 0 ? budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
                      onChange={(e) => {
                         const rawValue = e.target.value.replace(/\D/g, ''); 
                         const numericValue = rawValue ? parseFloat(rawValue) / 100 : 0;
                         setBudget(numericValue);
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pb-6 pt-4">
                  <Button 
                    variant="secondary" 
                    className="flex-1 h-14" 
                    onClick={() => { setBudget(0); setIsBudgetOpen(false); }}
                  >
                    Remover
                  </Button>
                  <Button 
                    className="flex-[2] h-14 shadow-xl shadow-emerald-200" 
                    onClick={() => setIsBudgetOpen(false)}
                  >
                    Salvar Meta
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Detalhes do Histórico (Full Screen style) */}
      {viewingPurchase && (
        <div className="fixed inset-0 z-50 bg-white animate-slideInRight overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 bg-white/80 backdrop-blur-md sticky top-0 z-10">
             <button onClick={() => setViewingPurchase(null)} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors -ml-2">
               <ArrowLeft size={22} className="text-gray-700" />
             </button>
             <div>
               <h3 className="font-bold text-gray-800 text-lg">Detalhes da Compra</h3>
               <p className="text-xs text-gray-500 font-medium">{formatDate(viewingPurchase.date)}</p>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 pb-safe">
             <div className="bg-emerald-50/80 rounded-2xl p-8 text-center mb-8 border border-emerald-100">
                <p className="text-emerald-600 font-semibold mb-2 text-sm uppercase tracking-wider">Valor Total</p>
                <p className="text-5xl font-extrabold text-emerald-800 mb-2">{formatCurrency(viewingPurchase.total)}</p>
                <div className="inline-flex items-center gap-1.5 bg-white px-3 py-1 rounded-full shadow-sm text-xs font-bold text-emerald-600">
                  <ShoppingBasket size={12} /> {viewingPurchase.itemCount} itens
                </div>
             </div>

             <h4 className="font-bold text-gray-800 mb-4 px-1 text-lg">Itens Comprados</h4>
             <div className="space-y-3">
               {viewingPurchase.items.map((item, idx) => (
                 <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                   <div className="flex items-center gap-4">
                      <div className="bg-white p-3 rounded-xl text-gray-400 shadow-sm">
                         {CATEGORIES.find(c => c.id === item.category)?.icon || <ShoppingBasket size={20}/>}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-base">{item.name}</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                          {item.quantity} {item.unit} x {formatCurrency(item.price)}
                        </p>
                      </div>
                   </div>
                   <p className="font-bold text-gray-800 text-lg">{formatCurrency(item.price * item.quantity)}</p>
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Confirmação Universal */}
      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
      />

      {/* Menu Inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-3 px-2 flex justify-around items-center z-40 md:max-w-md md:mx-auto">
        <button onClick={() => setActiveTab('list')} className={`flex flex-col items-center gap-1 p-2 w-16 transition-all active:scale-90 ${activeTab === 'list' ? 'text-emerald-600' : 'text-gray-400'}`}>
          <ShoppingBasket size={26} strokeWidth={activeTab === 'list' ? 2.5 : 2} className={activeTab === 'list' ? 'drop-shadow-sm' : ''} /> <span className="text-[10px] font-bold">Cestinha</span>
        </button>
        <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 p-2 w-16 transition-all active:scale-90 ${activeTab === 'stats' ? 'text-emerald-600' : 'text-gray-400'}`}>
          <PieChart size={26} strokeWidth={activeTab === 'stats' ? 2.5 : 2} className={activeTab === 'stats' ? 'drop-shadow-sm' : ''} /> <span className="text-[10px] font-bold">Análise</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 p-2 w-16 transition-all active:scale-90 ${activeTab === 'history' ? 'text-emerald-600' : 'text-gray-400'}`}>
          <History size={26} strokeWidth={activeTab === 'history' ? 2.5 : 2} className={activeTab === 'history' ? 'drop-shadow-sm' : ''} /> <span className="text-[10px] font-bold">Histórico</span>
        </button>
        <button onClick={() => setIsBudgetOpen(true)} className={`flex flex-col items-center gap-1 p-2 w-16 transition-all active:scale-90 ${budget > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
          <Wallet size={26} strokeWidth={budget > 0 ? 2.5 : 2} className={budget > 0 ? 'drop-shadow-sm' : ''} /> <span className="text-[10px] font-bold">Meta</span>
        </button>
      </nav>
      
      {/* Estilos Globais e Animações */}
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
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;