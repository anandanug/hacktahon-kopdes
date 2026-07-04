import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  ChevronDown, 
  Edit3, 
  Trash2, 
  Percent, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  AlertCircle,
  TrendingDown,
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import { Product } from '../types';

interface InventoryTabProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  onOpenAiDialog: (productName: string) => void;
  addLog: (msg: string, type?: 'info' | 'success' | 'error' | 'warning' | 'system') => void;
}

export default function InventoryTab({ products, setProducts, onOpenAiDialog, addLog }: React.PropsWithChildren<InventoryTabProps>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Product Form state
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Sembako');
  const [newStock, setNewStock] = useState(100);
  const [newUnit, setNewUnit] = useState('Karung');
  const [newPurchasePrice, setNewPurchasePrice] = useState(50000);
  const [newSellingPrice, setNewSellingPrice] = useState(60000);
  const [newDiscount, setNewDiscount] = useState(10);
  const [newPriority, setNewPriority] = useState<'Tinggi' | 'Sedang' | 'Rendah'>('Sedang');

  // Adjust stock level directly in list
  const adjustStock = (id: string, amount: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const nextStock = Math.max(0, p.stock + amount);
        addLog(`STOCK: Adjusted stock of '${p.name}' to ${nextStock} ${p.unit}.`, 'info');
        return { ...p, stock: nextStock };
      }
      return p;
    }));
  };

  // Adjust discount rate directly in list
  const adjustDiscount = (id: string, rate: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        addLog(`AI: Configured custom AI promo discount for '${p.name}' to ${rate}%.`, 'success');
        return { ...p, discountAI: rate };
      }
      return p;
    }));
  };

  // Create new product form submit handler
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: newName,
      category: newCategory,
      stagnantDays: Math.floor(Math.random() * 40), // Simulate some stale index
      stock: newStock,
      unit: newUnit,
      purchasePrice: newPurchasePrice,
      sellingPrice: newSellingPrice,
      discountAI: newDiscount,
      priority: newPriority
    };

    setProducts(prev => [newProduct, ...prev]);
    addLog(`SUCCESS: New cooperative inventory item registered: '${newName}'`, 'success');
    
    // Clear state
    setNewName('');
    setNewStock(100);
    setNewPurchasePrice(50000);
    setNewSellingPrice(60000);
    setShowAddModal(false);
  };

  // Filter products by category & query
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'Semua' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const categories = ['Semua', 'Sembako', 'Minyak & Lemak', 'Bumbu Dapur', 'Kebutuhan Rumah'];

  // Metrics calculating
  const totalStockVal = products.reduce((acc, curr) => acc + (curr.stock * curr.purchasePrice), 0);
  const totalSellingVal = products.reduce((acc, curr) => acc + (curr.stock * curr.sellingPrice), 0);
  const averageDiscount = Math.round(products.reduce((acc, curr) => acc + curr.discountAI, 0) / products.length);
  const warningStockCount = products.filter(p => p.stock < 15).length;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Title Header */}
      <div className="flex justify-between items-end select-none">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Cooperative Inventory</h1>
          <p className="text-[#64748B] text-sm mt-1">Manage stock profiles, wholesale costs, and AI discount campaigns.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#006C49] hover:bg-[#005236] text-white rounded-lg text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Aggregated Inventory Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 select-none">
        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-[#006C49]">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider block">Total Nilai Stok</span>
            <span className="text-xl font-bold text-[#0F172A]">Rp{totalStockVal.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-[#3B82F6]">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider block">Stok Menipis</span>
            <span className="text-xl font-bold text-[#EF4444]">{warningStockCount} <span className="text-xs font-normal text-[#64748B]">Item</span></span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider block">Nilai Jual Jual</span>
            <span className="text-xl font-bold text-[#0F172A]">Rp{totalSellingVal.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-[#8B5CF6]">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider block">Avg AI Diskon</span>
            <span className="text-xl font-bold text-[#8B5CF6]">{averageDiscount}%</span>
          </div>
        </div>
      </div>

      {/* Filtering Actions Block */}
      <div className="bg-white p-4 border border-[#E2E8F0] rounded-xl shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between select-none">
        {/* Categories Tab Swapper */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                selectedCategory === cat
                  ? 'bg-[#006C49] text-white shadow-sm'
                  : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] hover:text-[#0F172A]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Live Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-[#CBD5E1] rounded-lg text-xs focus:bg-white focus:border-[#006C49] focus:ring-1 focus:ring-[#006C49] outline-none transition-all"
            placeholder="Cari nama produk..."
          />
        </div>
      </div>

      {/* Main Inventory Ledger Card */}
      <section className="enterprise-card select-text">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm select-text">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-bold text-xs uppercase tracking-wider select-none">
                <th className="py-3 px-5">Nama Barang</th>
                <th className="py-3 px-5">Kategori</th>
                <th className="py-3 px-5 text-center">Stok</th>
                <th className="py-3 px-5">Harga Kulakan</th>
                <th className="py-3 px-5">Harga Jual Normal</th>
                <th className="py-3 px-5">AI Diskon Campaign</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#334155] select-text">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#64748B] italic select-none">
                    Tidak menemukan produk yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const isStockWarning = product.stock < 15;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-[#0F172A] text-left">
                        {product.name}
                        {isStockWarning && (
                          <span className="ml-2 bg-[#FEF2F2] border border-[#FCA5A5] text-[#DC2626] font-bold text-[9px] px-1.5 py-0.5 rounded-full uppercase">
                            STOK TIPIS
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-left select-none">
                        <span className="bg-[#F1F5F9] text-[#475569] px-2.5 py-1 rounded text-xs">
                          {product.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-center gap-2 select-none">
                          <button
                            onClick={() => adjustStock(product.id, -5)}
                            className="w-6 h-6 border border-[#CBD5E1] rounded hover:bg-slate-100 flex items-center justify-center cursor-pointer text-[#475569]"
                          >
                            -
                          </button>
                          <span className={`w-14 font-semibold text-center ${isStockWarning ? 'text-[#DC2626] font-bold' : ''}`}>
                            {product.stock} {product.unit}
                          </span>
                          <button
                            onClick={() => adjustStock(product.id, 5)}
                            className="w-6 h-6 border border-[#CBD5E1] rounded hover:bg-slate-100 flex items-center justify-center cursor-pointer text-[#475569]"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-left font-medium">
                        Rp{product.purchasePrice.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-5 text-left font-medium">
                        Rp{product.sellingPrice.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3 select-none">
                          <input
                            type="range"
                            min="0"
                            max="30"
                            step="2"
                            value={product.discountAI}
                            onChange={(e) => adjustDiscount(product.id, parseInt(e.target.value))}
                            className="w-20 accent-[#006C49] h-1.5 cursor-pointer"
                          />
                          <span className="font-bold text-[#059669] w-8 text-xs">{product.discountAI}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right select-none">
                        <button
                          onClick={() => onOpenAiDialog(product.name)}
                          className="bg-[#F5F3FF] border border-[#DDD6FE] text-[#6D28D9] hover:bg-[#EDE9FE] px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
                          <span>AI Blast</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Product Modal Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-xs select-none">
          <div className="bg-white rounded-xl shadow-xl border border-[#E2E8F0] w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3 mb-4 text-left">
              Register New Cooperative Goods
            </h3>
            
            <form onSubmit={handleAddProduct} className="flex flex-col gap-4 text-left">
              <div>
                <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                  Nama Barang / Produk
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Beras Cianjur Cap Pandanwangi"
                  className="w-full px-3.5 py-2 border border-[#CBD5E1] rounded-lg text-sm focus:border-[#006C49] focus:ring-1 focus:ring-[#006C49] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                    Kategori Barang
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-sm focus:border-[#006C49] outline-none"
                  >
                    <option value="Sembako">Sembako</option>
                    <option value="Minyak & Lemak">Minyak & Lemak</option>
                    <option value="Bumbu Dapur">Bumbu Dapur</option>
                    <option value="Kebutuhan Rumah">Kebutuhan Rumah</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                    Satuan Barang
                  </label>
                  <input
                    type="text"
                    required
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="Contoh: Karung, Pcs, Dus"
                    className="w-full px-3.5 py-2 border border-[#CBD5E1] rounded-lg text-sm focus:border-[#006C49] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                    Harga Beli Koperasi (Kulakan)
                  </label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={newPurchasePrice}
                    onChange={(e) => setNewPurchasePrice(parseInt(e.target.value))}
                    className="w-full px-3.5 py-2 border border-[#CBD5E1] rounded-lg text-sm focus:border-[#006C49] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                    Harga Jual Normal
                  </label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={newSellingPrice}
                    onChange={(e) => setNewSellingPrice(parseInt(e.target.value))}
                    className="w-full px-3.5 py-2 border border-[#CBD5E1] rounded-lg text-sm focus:border-[#006C49] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newStock}
                    onChange={(e) => setNewStock(parseInt(e.target.value))}
                    className="w-full px-3.5 py-2 border border-[#CBD5E1] rounded-lg text-sm focus:border-[#006C49] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                    Kampanye Prioritas
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-sm focus:border-[#006C49] outline-none"
                  >
                    <option value="Rendah">Rendah (Normal)</option>
                    <option value="Sedang">Sedang (Tingkat Sedang)</option>
                    <option value="Tinggi">Tinggi (Mendesak/Stale)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#CBD5E1] hover:bg-slate-50 text-[#334155] rounded-lg text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#006C49] hover:bg-[#005236] text-white rounded-lg text-sm font-semibold cursor-pointer shadow-md"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
