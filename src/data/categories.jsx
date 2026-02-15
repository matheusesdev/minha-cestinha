import { ShoppingBasket, Leaf, Beef, Milk, SprayCan } from 'lucide-react';

export const CATEGORIES = [
  { id: 'geral', label: 'Geral', icon: <ShoppingBasket size={16} />, color: 'gray' },
  { id: 'hortifruti', label: 'Hortifruti', icon: <Leaf size={16} />, color: 'green' },
  { id: 'carnes', label: 'Carnes', icon: <Beef size={16} />, color: 'red' },
  { id: 'laticinios', label: 'Laticínios', icon: <Milk size={16} />, color: 'blue' },
  { id: 'limpeza', label: 'Limpeza', icon: <SprayCan size={16} />, color: 'indigo' },
];