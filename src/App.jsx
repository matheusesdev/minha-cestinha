import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBasket, Trash2, Plus, Minus, Wallet, 
  PieChart, History, ChevronRight, CheckCircle2,
  X, Edit2, TrendingUp, TrendingDown, Calendar
} from 'lucide-react';

// Importando nossos componentes separados
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { CATEGORIES } from './data/categories';

const App = () => {
  // Estado Global
  const [activeTab, setActiveTab] = useState('list');
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem('cestinha_items')) || []);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('cestinha_history')) || []);
  const [budget, setBudget] = useState(() => parseFloat(localStorage.getItem('cestinha_budget')) || 0);
  
  // Estado do Formulário
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Estado inicial do formulário
  const initialFormState = { 
    name: '', 
    price: 0, 
    quantity: 1, 
    unit: 'un', 
    category: 'geral' 
  };
  const [formData, setFormData] = useState(initialFormState);

  // Persistência
  useEffect(() => { localStorage.setItem('cestinha_items', JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem('cestinha_history', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('cestinha_budget', budget.toString()); }, [budget]);

  // Lógica de Negócio
  const totalCost = useMemo(() => items.reduce((acc, item) => acc + (item.price * item.quantity), 0), [items]);
  const remainingBudget = budget - totalCost;
  const progressPercent = budget > 0 ? Math.min((totalCost / budget) * 100, 100) : 0;

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(date);
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

  const handlePriceChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, ''); 
    const numericValue = rawValue ? parseFloat(rawValue) / 100 : 0;
    setFormData({ ...formData, price: numericValue });
  };

  const handleSaveItem = (e) => {
    e.preventDefault();
    if (!formData.name || formData.price <= 0) return;

    const newItemData = { ...formData, quantity: parseFloat(formData.quantity) };

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
    if (confirm('Deseja finalizar esta compra e salvar no histórico?')) {
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
  };

  const updateQuantity = (id, change) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const isKg = item.unit === 'kg';
        const step = isKg ? 0.1 : 1;
        const newQty = Math.max(isKg ? 0.1 : 1, item.quantity + (change * step));
        const roundedQty = isKg ? Math.round(newQty * 1000) / 1000 : newQty;
        return { ...item, quantity: roundedQty };
      }
      return item;
    }));
  };

  // --- Views ---
  // (Você pode mover estes componentes para arquivos separados na pasta /views no futuro)
  
  const ListView = () => (
    <div className="space-y-4 pb-28 animate-fadeIn">
      <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 border-none shadow-lg shadow-emerald-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-emerald-100 text-sm font-medium mb-1">Total da Cestinha</p>
            <h2 className="text-4xl font-bold tracking-tight">{formatCurrency(totalCost)}</h2>
          </div>
          <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
            <ShoppingBasket size={24} className="text-white" />
          </div>
        </div>
        
        {budget > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-emerald-100">
              <span>Meta: {formatCurrency(budget)}</span>
              <span>Resta: {formatCurrency(remainingBudget)}</span>
            </div>
            <div className="h-2 bg-black/20 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${remainingBudget < 0 ? 'bg-red-400' : 'bg-white'}`} 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
          </div>
        )}
      </Card>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Plus size={32} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium">Sua cestinha está vazia</p>
          </div>
        ) : (
          items.map(item => {
            const catInfo = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[0];
            const isKg = item.unit === 'kg';
            const lastHistory = getProductHistory(item.name);
            const priceDiff = lastHistory ? item.price - lastHistory.price : 0;
            
            return (
              <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center group relative overflow-hidden">
                <div className={`p-3 rounded-lg z-10 ${catInfo.color === 'gray' ? 'bg-gray-100 text-gray-500' : `bg-${catInfo.color}-100 text-${catInfo.color}-600`}`}>
                  {catInfo.icon}
                </div>
                
                <div className="flex-1 min-w-0 z-10">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-800 truncate">{item.name}</h3>
                    <span className="font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <p className="text-xs text-gray-500">
                      {formatCurrency(item.price)} {isKg ? '/kg' : ' un'}
                    </p>
                    
                    {lastHistory && Math.abs(priceDiff) > 0.01 && (
                      <div className={`text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${priceDiff > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {priceDiff > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {priceDiff > 0 ? '+' : ''}{formatCurrency(priceDiff)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-2 py-1">
                      <button onClick={() => updateQuantity(item.id, -1)} className="text-gray-400 hover:text-emerald-600 p-1"><Minus size={14} /></button>
                      <span className="text-sm font-bold min-w-[3ch] text-center">
                        {isKg ? item.quantity.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : item.quantity}
                        <span className="text-[10px] font-normal text-gray-400 ml-0.5">{isKg ? 'kg' : ''}</span>
                      </span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="text-gray-400 hover:text-emerald-600 p-1"><Plus size={14} /></button>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => { if(confirm(`Deseja remover ${item.name} da lista?`)) setItems(items.filter(i => i.id !== item.id)) }} 
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button 
                        onClick={() => { setFormData({ unit: 'un', ...item }); setEditingId(item.id); setIsFormOpen(true); }} 
                        className="p-2 text-gray-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {items.length > 0 && (
          <div className="pt-4">
            <Button onClick={finishShopping} variant="success" className="w-full py-4 shadow-lg shadow-green-200">
              <CheckCircle2 size={20} />
              Finalizar e Salvar Compra
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const HistoryView = () => {
    const historyByMonth = useMemo(() => {
      const groups = {};
      history.forEach(purchase => {
        const date = new Date(purchase.date);
        const key = `${date.getMonth() + 1}/${date.getFullYear()}`;
        if (!groups[key]) groups[key] = { total: 0, purchases: [], monthName: date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }) };
        groups[key].total += purchase.total;
        groups[key].purchases.push(purchase);
      });
      return Object.entries(groups).sort((a, b) => {
        const [m1, y1] = a[0].split('/');
        const [m2, y2] = b[0].split('/');
        return new Date(y2, m2 - 1) - new Date(y1, m1 - 1);
      });
    }, [history]);

    return (
      <div className="space-y-6 pb-24 animate-fadeIn">
        <h2 className="text-2xl font-bold text-gray-800 px-2 flex items-center gap-2">
          <History className="text-emerald-600" /> Histórico de Compras
        </h2>
        {history.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Calendar size={48} className="mx-auto mb-4 opacity-20" />
            <p>Nenhuma compra finalizada ainda.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {historyByMonth.map(([key, data], index) => {
              const nextGroup = historyByMonth[index + 1];
              const diff = nextGroup ? data.total - nextGroup[1].total : 0;
              return (
                <div key={key} className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="font-bold text-gray-500 capitalize">{data.monthName}</h3>
                    {nextGroup && (
                       <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${diff > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                         {diff > 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                         {Math.abs((diff / nextGroup[1].total) * 100).toFixed(0)}% vs mês anterior
                       </span>
                    )}
                  </div>
                  <Card className="divide-y divide-gray-100 border-none shadow-md">
                     <div className="p-4 bg-gray-50 flex justify-between items-center">
                        <span className="text-sm text-gray-500">Total do Mês</span>
                        <span className="text-lg font-bold text-gray-800">{formatCurrency(data.total)}</span>
                     </div>
                     {data.purchases.map(purchase => (
                       <div key={purchase.id} className="p-4 hover:bg-gray-50 transition-colors">
                         <div className="flex justify-between items-center mb-1">
                           <span className="font-semibold text-gray-700">{formatDate(purchase.date)}</span>
                           <span className="font-bold text-emerald-700">{formatCurrency(purchase.total)}</span>
                         </div>
                         <div className="flex justify-between items-center text-xs text-gray-400">
                           <span>{purchase.itemCount} itens</span>
                           <span className="flex items-center gap-1">Ver detalhes <ChevronRight size={12} /></span>
                         </div>
                       </div>
                     ))}
                  </Card>
                </div>
              );
            })}
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
           <PieChart className="text-emerald-600" /> Análise da Cesta Atual
        </h2>
        {stats.length === 0 ? (
          <div className="text-center py-20 text-gray-400">Adicione itens na cestinha para ver a análise.</div>
        ) : (
          <div className="space-y-4">
            {stats.map(stat => (
              <div key={stat.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg bg-${stat.color}-100 text-${stat.color}-600`}>
                    {stat.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between font-semibold text-gray-700">
                      <span>{stat.label}</span>
                      <span>{formatCurrency(stat.total)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{stat.count} itens</span>
                      <span>{Math.round((stat.total / totalCost) * 100)}% do total</span>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className={`h-full bg-${stat.color}-500`} style={{ width: `${(stat.total / totalCost) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // --- Renderização Principal do App ---

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 md:max-w-md md:mx-auto md:shadow-2xl md:border-x border-gray-200">
      
      {/* Top Bar */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-20 border-b border-gray-100 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-700">
                <ShoppingBasket size={20} />
            </div>
            <h1 className="font-bold text-lg text-gray-800 tracking-tight">Minha Cestinha</h1>
        </div>
        <button onClick={() => { if(confirm('Limpar lista atual?')) setItems([]) }} className="text-gray-400 hover:text-red-500 p-2">
          <Trash2 size={20} />
        </button>
      </div>

      <main className="p-4">
        {activeTab === 'list' && <ListView />}
        {activeTab === 'stats' && <StatsView />}
        {activeTab === 'history' && <HistoryView />}
      </main>

      {/* FAB (Botão Flutuante) */}
      {activeTab === 'list' && (
        <button
          onClick={() => { setEditingId(null); setFormData(initialFormState); setIsFormOpen(true); }}
          className="fixed bottom-24 right-4 md:right-[calc(50%-13rem)] w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-600/30 flex items-center justify-center hover:bg-emerald-700 active:scale-90 transition-all z-30"
        >
          <Plus size={28} />
        </button>
      )}

      {/* Modal / Sheet do Formulário */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={() => setIsFormOpen(false)}>
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-slideUp" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">{editingId ? 'Editar Item' : 'Novo Item'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div className="bg-gray-100 p-1 rounded-xl flex">
                <button type="button" onClick={() => setFormData({ ...formData, unit: 'un', quantity: Math.ceil(formData.quantity) })} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.unit === 'un' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}>Unidade (un)</button>
                <button type="button" onClick={() => setFormData({ ...formData, unit: 'kg' })} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.unit === 'kg' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}>Peso (kg)</button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nome do Produto</label>
                <input autoFocus type="text" placeholder="Ex: Alcatra" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-lg font-medium" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                {formData.name.length > 2 && getProductHistory(formData.name) && (
                   <div className="mt-2 text-xs text-gray-500 flex items-center gap-1 bg-yellow-50 p-2 rounded-lg border border-yellow-100">
                     <History size={12} className="text-yellow-600"/>
                     Último preço pago: <strong>{formatCurrency(getProductHistory(formData.name).price)}</strong>
                   </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Preço {formData.unit === 'kg' ? 'do Kg' : 'Unitário'}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">R$</span>
                    <input type="text" inputMode="numeric" placeholder="0,00" className="w-full p-4 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-lg font-medium" value={formData.price > 0 ? formData.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''} onChange={handlePriceChange} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{formData.unit === 'kg' ? 'Peso (Kg)' : 'Qtd (Un)'}</label>
                  {formData.unit === 'kg' ? (
                     <div className="relative">
                        <input type="number" step="0.001" placeholder="0.000" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-lg font-medium" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">kg</span>
                     </div>
                  ) : (
                    <div className="flex items-center h-[60px] bg-gray-50 border border-gray-200 rounded-xl px-2">
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))} className="p-2 text-gray-400 hover:text-emerald-600"><Minus size={20} /></button>
                      <input type="number" className="w-full bg-transparent text-center font-bold text-lg outline-none" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })} />
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, quantity: prev.quantity + 1 }))} className="p-2 text-gray-400 hover:text-emerald-600"><Plus size={20} /></button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Categoria</label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} type="button" onClick={() => setFormData({ ...formData, category: cat.id })} className={`flex flex-col items-center gap-1 p-3 min-w-[80px] rounded-xl border transition-all ${formData.category === cat.id ? `bg-${cat.color}-50 border-${cat.color}-500 text-${cat.color}-700 ring-1 ring-${cat.color}-500` : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                      {cat.icon}
                      <span className="text-xs font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="pt-2 flex gap-3">
                {editingId && <Button type="button" variant="danger" className="flex-1 py-4 rounded-xl" onClick={() => { handleDelete(editingId); setIsFormOpen(false); }}>Excluir</Button>}
                <Button type="submit" className="flex-[2] py-4 rounded-xl text-lg shadow-lg shadow-emerald-200">{editingId ? 'Salvar Alterações' : 'Adicionar à Cestinha'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu Inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-6 flex justify-around items-center z-40 md:max-w-md md:mx-auto">
        <button onClick={() => setActiveTab('list')} className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'list' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <ShoppingBasket size={24} strokeWidth={activeTab === 'list' ? 2.5 : 2} /> <span className="text-[10px] font-medium">Cestinha</span>
        </button>
        <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'stats' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <PieChart size={24} strokeWidth={activeTab === 'stats' ? 2.5 : 2} /> <span className="text-[10px] font-medium">Análise</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'history' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <History size={24} strokeWidth={activeTab === 'history' ? 2.5 : 2} /> <span className="text-[10px] font-medium">Histórico</span>
        </button>
        <button onClick={() => { const novoBudget = prompt('Definir meta de gastos:', budget); if (novoBudget !== null) setBudget(parseFloat(novoBudget) || 0); }} className={`flex flex-col items-center gap-1 p-2 transition-colors ${budget > 0 ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <Wallet size={24} /> <span className="text-[10px] font-medium">Meta</span>
        </button>
      </nav>
    </div>
  );
};

export default App;