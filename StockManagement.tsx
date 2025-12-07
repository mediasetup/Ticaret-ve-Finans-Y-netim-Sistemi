
import React, { useState } from 'react';
import { Search, Filter, Plus, AlertTriangle, Layers, Pencil, Trash2, X, Check, Package, Tag } from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { Product, Category, Currency } from '../types';

const StockManagement = () => {
  const { products, addProduct, updateProduct, deleteProduct, categories, addCategory, updateCategory, deleteCategory } = useSales();
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'CATEGORIES'>('PRODUCTS');
  
  // Filter States
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
      name: '', sku: '', category: '', stock: 0, price: 0, cost: 0, currency: 'TRY',
      trackStock: true, unit: 'Adet', vatRate: 20
  });

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({ name: '', description: '' });

  // -- PRODUCTS LOGIC --
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenProductModal = (product?: Product) => {
      if (product) {
          setEditingProduct(product);
          setNewProduct({ ...product });
      } else {
          setEditingProduct(null);
          setNewProduct({
            name: '', sku: '', category: '', stock: 0, price: 0, cost: 0, currency: 'TRY',
            trackStock: true, unit: 'Adet', vatRate: 20
          });
      }
      setIsProductModalOpen(true);
  };

  const handleSaveProduct = () => {
      if (!newProduct.name || !newProduct.sku) return alert("Ürün adı ve kodu zorunludur.");
      
      const productData: Product = {
          id: editingProduct ? editingProduct.id : `PROD-${Date.now()}`,
          name: newProduct.name!,
          sku: newProduct.sku!,
          category: newProduct.category || 'Genel',
          stock: newProduct.stock || 0,
          price: newProduct.price || 0,
          cost: newProduct.cost || 0,
          currency: newProduct.currency || 'TRY',
          trackStock: newProduct.trackStock ?? true,
          unit: newProduct.unit || 'Adet',
          vatRate: newProduct.vatRate || 20,
          barcode: newProduct.barcode, // Kept in data model but removed from UI
          lastRestockDate: editingProduct ? editingProduct.lastRestockDate : new Date().toISOString().split('T')[0]
      };

      if (editingProduct) {
          updateProduct(productData);
      } else {
          addProduct(productData);
      }
      
      setIsProductModalOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
      if (window.confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
          const success = deleteProduct(id);
          if (!success) {
              alert("Bu ürün silinemez çünkü teklif, sipariş veya faturalarda kullanılmaktadır.");
          }
      }
  };

  const getCurrencySymbol = (curr: string) => {
      switch(curr) {
          case 'USD': return '$';
          case 'EUR': return '€';
          default: return '₺';
      }
  };

  // -- CATEGORIES LOGIC --
  const handleOpenCategoryModal = (cat?: Category) => {
      if (cat) {
          setEditingCategory(cat);
          setCategoryForm({ ...cat });
      } else {
          setEditingCategory(null);
          setCategoryForm({ name: '', description: '' });
      }
      setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = () => {
      if (!categoryForm.name) return alert("Kategori adı zorunludur.");
      
      if (editingCategory) {
          updateCategory({ ...editingCategory, name: categoryForm.name, description: categoryForm.description });
      } else {
          addCategory({ 
              id: `CAT-${Date.now()}`, 
              name: categoryForm.name!, 
              description: categoryForm.description 
          });
      }
      setIsCategoryModalOpen(false);
  };

  const handleDeleteCategory = (id: string) => {
      if (window.confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) {
          deleteCategory(id);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Ürün ve Hizmetler</h2>
          <p className="text-slate-500">Ürün envanterinizi, hizmetlerinizi ve kategorileri yönetin</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => handleOpenCategoryModal()}
                className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium shadow-sm"
            >
                <Layers size={18} />
                Kategori Ekle
            </button>
            <button 
                onClick={() => handleOpenProductModal()}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
            >
                <Plus size={18} />
                Yeni Ürün Kartı
            </button>
        </div>
      </div>

      {/* TABS */}
      <div className="border-b border-slate-200">
          <div className="flex gap-6">
              <button 
                onClick={() => setActiveTab('PRODUCTS')}
                className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'PRODUCTS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  Ürünler & Hizmetler
              </button>
              <button 
                onClick={() => setActiveTab('CATEGORIES')}
                className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'CATEGORIES' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  Kategori Yönetimi
              </button>
          </div>
      </div>

      {activeTab === 'PRODUCTS' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 bg-slate-50/50">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Ürün adı, SKU veya barkod ara..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                />
              </div>
              <div className="flex gap-2">
                 <select 
                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm min-w-[150px]"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                 >
                    <option value="ALL">Tüm Kategoriler</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                 </select>
                 <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-slate-600 hover:bg-slate-50 bg-white font-medium text-sm">
                    <Filter size={16} /> Filtrele
                 </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Ürün Adı / SKU</th>
                    <th className="px-6 py-4 font-semibold">Kategori</th>
                    <th className="px-6 py-4 font-semibold text-right">Maliyet (FIFO)</th>
                    <th className="px-6 py-4 font-semibold text-right">Satış Fiyatı</th>
                    <th className="px-6 py-4 font-semibold text-center">Stok Durumu</th>
                    <th className="px-6 py-4 font-semibold text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 group">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{product.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{product.sku}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600">
                        {getCurrencySymbol(product.currency)}{product.cost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900">
                        {getCurrencySymbol(product.currency)}{product.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {product.trackStock ? (
                            product.stock < 10 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                    <AlertTriangle className="w-3 h-3" />
                                    Kritik: {product.stock} {product.unit}
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    {product.stock} {product.unit}
                                </span>
                            )
                        ) : (
                            <span className="text-slate-400 italic text-xs">Takip Yok</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                            onClick={() => handleOpenProductModal(product)}
                            className="p-2 text-slate-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                            title="Düzenle"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                            title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredProducts.length === 0 && (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                 <Package className="w-12 h-12 text-slate-300 mb-2" />
                 <p>Kriterlere uygun ürün bulunamadı.</p>
              </div>
            )}
          </div>
      )}

      {activeTab === 'CATEGORIES' && (
           <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
               <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs">
                       <tr>
                           <th className="px-6 py-4 font-semibold">Kategori Adı</th>
                           <th className="px-6 py-4 font-semibold">Açıklama</th>
                           <th className="px-6 py-4 font-semibold text-right">Ürün Sayısı</th>
                           <th className="px-6 py-4 font-semibold text-center w-32">İşlem</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                       {categories.map(cat => {
                           const count = products.filter(p => p.category === cat.name).length;
                           return (
                               <tr key={cat.id} className="hover:bg-slate-50">
                                   <td className="px-6 py-4 font-medium text-slate-900">{cat.name}</td>
                                   <td className="px-6 py-4 text-slate-500">{cat.description || '-'}</td>
                                   <td className="px-6 py-4 text-right">
                                       <span className="bg-slate-100 text-slate-600 py-0.5 px-2.5 rounded-full text-xs font-medium border border-slate-200">{count} Ürün</span>
                                   </td>
                                   <td className="px-6 py-4 text-center">
                                       <div className="flex items-center justify-center gap-2">
                                           <button onClick={() => handleOpenCategoryModal(cat)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50"><Pencil size={16}/></button>
                                           <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"><Trash2 size={16}/></button>
                                       </div>
                                   </td>
                               </tr>
                           )
                       })}
                   </tbody>
               </table>
               {categories.length === 0 && <div className="p-8 text-center text-slate-500">Kategori bulunamadı.</div>}
           </div>
      )}

      {/* PRODUCT MODAL */}
      {isProductModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <Tag size={20} className="text-blue-600" />
                          {editingProduct ? 'Ürün Kartını Düzenle' : 'Yeni Ürün Kartı'}
                      </h3>
                      <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                  </div>
                  
                  <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                      {/* Basic Info - REORDERED SKU TO TOP */}
                      <div className="grid grid-cols-1 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stok Kodu (SKU) *</label>
                              <input 
                                type="text" 
                                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none font-mono text-sm bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500" 
                                value={newProduct.sku} 
                                onChange={e => setNewProduct({...newProduct, sku: e.target.value})} 
                                placeholder="Örn: MTK-2000" 
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ürün Adı *</label>
                              <input 
                                type="text" 
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder-gray-500" 
                                value={newProduct.name} 
                                onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
                                placeholder="Örn: Endüstriyel Matkap" 
                              />
                          </div>
                      </div>

                      {/* Classification */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                           <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kategori</label>
                              <div className="relative">
                                  <select className="w-full border border-gray-300 rounded-lg p-2.5 outline-none bg-white appearance-none text-gray-900 focus:ring-2 focus:ring-blue-500" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                                      <option value="">Seçiniz</option>
                                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                  </select>
                                  <Layers className="absolute right-3 top-2.5 text-gray-400 w-4 h-4 pointer-events-none" />
                              </div>
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Birim</label>
                              <select className="w-full border border-gray-300 rounded-lg p-2.5 outline-none bg-white text-gray-900 focus:ring-2 focus:ring-blue-500" value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})}>
                                  <option value="Adet">Adet</option>
                                  <option value="Kg">Kg</option>
                                  <option value="Metre">Metre</option>
                                  <option value="Kutu">Kutu</option>
                                  <option value="Saat">Saat</option>
                                  <option value="Hizmet">Hizmet</option>
                              </select>
                           </div>
                      </div>

                      {/* Pricing & Stock */}
                      <div>
                          <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Stok ve Fiyatlandırma</h4>
                          
                          <div className="mb-4">
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Para Birimi</label>
                              <select 
                                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none bg-white text-gray-900 focus:ring-2 focus:ring-blue-500" 
                                  value={newProduct.currency} 
                                  onChange={e => setNewProduct({...newProduct, currency: e.target.value as Currency})}
                              >
                                  <option value="TRY">TRY (₺)</option>
                                  <option value="USD">USD ($)</option>
                                  <option value="EUR">EUR (€)</option>
                              </select>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                  <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Satış Fiyatı</label>
                                  <div className="relative">
                                      <input type="number" className="w-full border border-blue-200 rounded p-2 text-lg font-bold text-blue-900 bg-white" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} />
                                      <span className="absolute right-3 top-2.5 text-blue-400 font-bold text-xs">{newProduct.currency}</span>
                                  </div>
                              </div>
                              <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                                  <label className="block text-xs font-bold text-orange-800 uppercase mb-1">Alış / Maliyet</label>
                                  <div className="relative">
                                      <input type="number" className="w-full border border-orange-200 rounded p-2 font-medium text-orange-900 bg-white" value={newProduct.cost} onChange={e => setNewProduct({...newProduct, cost: parseFloat(e.target.value)})} />
                                      <span className="absolute right-3 top-2.5 text-orange-400 font-bold text-xs">{newProduct.currency}</span>
                                  </div>
                              </div>
                              <div className="bg-slate-100 p-3 rounded-lg border border-slate-200">
                                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">KDV Oranı</label>
                                  <select className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900" value={newProduct.vatRate} onChange={e => setNewProduct({...newProduct, vatRate: parseFloat(e.target.value)})}>
                                      <option value="0">%0</option>
                                      <option value="1">%1</option>
                                      <option value="10">%10</option>
                                      <option value="20">%20</option>
                                  </select>
                              </div>
                          </div>
                          
                          <div className="mt-4 flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                               <label className="flex items-center gap-2 cursor-pointer">
                                   <input type="checkbox" className="w-4 h-4 rounded text-blue-600 bg-white border-gray-300" checked={newProduct.trackStock} onChange={e => setNewProduct({...newProduct, trackStock: e.target.checked})} />
                                   <span className="text-sm font-medium text-slate-700">Stok Takibi Yapılsın</span>
                               </label>
                               
                               {newProduct.trackStock && (
                                   <div className="flex items-center gap-2">
                                       <label className="text-xs font-bold text-slate-500 uppercase">Mevcut Stok:</label>
                                       <input 
                                         type="number" 
                                         className="w-24 border border-gray-300 rounded p-1 text-center font-bold bg-white text-gray-900" 
                                         value={newProduct.stock} 
                                         onChange={e => setNewProduct({...newProduct, stock: parseFloat(e.target.value)})} 
                                       />
                                   </div>
                               )}
                          </div>
                      </div>
                  </div>

                  <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                      <button onClick={() => setIsProductModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">Vazgeç</button>
                      <button onClick={handleSaveProduct} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 shadow-sm">
                          <Check size={18} /> Kaydet
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* CATEGORY MODAL */}
      {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800">{editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}</h3>
                      <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kategori Adı *</label>
                          <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder-gray-500" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Açıklama</label>
                          <textarea className="w-full border border-gray-300 rounded-lg p-2.5 outline-none h-20 resize-none bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500" value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm, description: e.target.value})} />
                      </div>
                  </div>
                  <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                      <button onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">Vazgeç</button>
                      <button onClick={handleSaveCategory} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 shadow-sm">Kaydet</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default StockManagement;
