import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { X, Plus, Edit3, Trash2, Package, MapPin, Eye } from 'lucide-react';
import useAuthUser from '../hooks/useAuthUser';
import { getAllProducts, createProduct, updateProduct, deleteProduct, getSellerStats, updateSellerProfile } from '../lib/api';
import { errMsg, inr } from '../lib/errors';
import { BouncingDotsLoader } from '../components/Loading';
import RegionSelect from '../components/RegionSelect';
import SellerNav from '../components/SellerNav';

const EMPTY_FORM = { title: '', description: '', price: '', category: '', tags: '', quantity: '', images: [], keepImages: [] };

export default function SellerCorner() {
  const { authUser, isLoading: authLoading, type } = useAuthUser();
  const sellerId = authUser?._id;
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['sellerProducts', sellerId],
    queryFn: () => getAllProducts({ seller: sellerId }),
    enabled: !!sellerId,
  });

  const { data: stats } = useQuery({ queryKey: ['sellerStats'], queryFn: getSellerStats, enabled: !!sellerId });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // region editor
  const [editingRegion, setEditingRegion] = useState(false);
  const [region, setRegion] = useState({ state: '', city: '' });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['sellerProducts'] });
    queryClient.invalidateQueries({ queryKey: ['sellerStats'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setFormData({ ...formData, images: Array.from(e.target.files) });
  const removeExistingImage = (url) =>
    setFormData((f) => ({ ...f, keepImages: f.keepImages.filter((u) => u !== url) }));

  const openForm = (mode, product = null) => {
    setFormMode(mode);
    setSelectedProduct(product);
    setFormData(
      product
        ? {
            title: product.title?.replace(/"/g, '').trim() || '',
            description: product.description?.replace(/"/g, '').trim() || '',
            price: product.price ?? '',
            category: product.category?.replace(/"/g, '').trim() || '',
            tags: product.tags?.join(', ') || '',
            quantity: product.quantity ?? '',
            images: [],
            keepImages: product.images || [],
          }
        : EMPTY_FORM
    );
    setIsFormOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => { refreshAll(); setIsFormOpen(false); toast.success('Product listed'); },
    onError: (e) => toast.error(errMsg(e, 'Could not create product')),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: () => { refreshAll(); setIsFormOpen(false); toast.success('Product updated'); },
    onError: (e) => toast.error(errMsg(e, 'Could not update product')),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => { refreshAll(); toast.success('Product deleted'); },
    onError: (e) => toast.error(errMsg(e, 'Could not delete product')),
  });
  const regionMutation = useMutation({
    mutationFn: updateSellerProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
      refreshAll();
      setEditingRegion(false);
      toast.success('Region updated - your listings now show in this area');
    },
    onError: (e) => toast.error(errMsg(e, 'Could not update region')),
  });

  const saving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e) => {
    e.preventDefault();
    const productToSend = { ...formData, tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean) };
    if (formMode === 'add') createMutation.mutate(productToSend);
    else if (selectedProduct) updateMutation.mutate({ id: selectedProduct._id, data: productToSend });
  };

  const handleDelete = (product) => {
    if (window.confirm(`Delete "${product.title.replace(/"/g, '').trim()}"? This can't be undone.`)) {
      deleteMutation.mutate(product._id);
    }
  };

  if (authLoading || productsLoading) return <BouncingDotsLoader />;

  if (!authUser || type !== 'seller') {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="border border-red-500/20 bg-red-500/5 p-8 text-center">
          <div className="text-red-400 font-bold uppercase tracking-widest mb-2">Access Denied</div>
          <div className="text-stone-500 text-sm">This area is for sellers only.</div>
        </div>
      </div>
    );
  }

  const location = [authUser.city, authUser.state].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-stone-950">
      <SellerNav />

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Profile */}
        <motion.div className="border border-stone-800 mb-8 p-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex flex-col md:flex-row md:items-start gap-6 justify-between">
            <div className="flex items-start gap-5 min-w-0">
              <div className="w-16 h-16 overflow-hidden border border-stone-700 flex-shrink-0">
                <img src={authUser.profilePic} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <h2 className="text-stone-100 font-black text-xl mb-0.5">{authUser.fullName}</h2>
                <div className="text-amber-400 text-sm font-medium mb-2">{authUser.businessName}</div>
                <div className="text-stone-500 text-sm flex items-center gap-1 flex-wrap">
                  <MapPin size={13} />
                  {location || <span className="text-amber-400">No region set yet</span>}
                  <button
                    onClick={() => { setRegion({ state: authUser.state || '', city: authUser.city || '' }); setEditingRegion((v) => !v); }}
                    className="ml-2 text-xs uppercase tracking-widest font-bold text-stone-400 hover:text-amber-400 underline underline-offset-4"
                  >
                    {location ? 'Change' : 'Set region'}
                  </button>
                </div>
                <div className="text-stone-600 text-xs mt-2">{authUser.email} · Member since {new Date(authUser.createdAt).toLocaleDateString('en-IN')}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-px bg-stone-800 flex-shrink-0">
              {[
                { label: 'Products', value: products.length },
                { label: 'Followers', value: stats?.totals.followers ?? '—' },
                { label: 'Revenue', value: stats ? inr(stats.totals.revenue) : '—' },
              ].map((s) => (
                <div key={s.label} className="bg-stone-950 px-5 py-4 text-center">
                  <div className="text-stone-100 font-black text-lg">{s.value}</div>
                  <div className="text-stone-600 text-xs uppercase tracking-widest mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {editingRegion && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="pt-6 mt-6 border-t border-stone-800 max-w-xl">
                  <p className="text-stone-500 text-xs mb-3">Buyers in this state and city will find your products first.</p>
                  <RegionSelect state={region.state} city={region.city} onChange={setRegion} />
                  <div className="flex gap-2 mt-3">
                    <button
                      disabled={!region.state || !region.city || regionMutation.isPending}
                      onClick={() => regionMutation.mutate(region)}
                      className="px-5 py-2.5 bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-widest hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {regionMutation.isPending ? 'Saving...' : 'Save region'}
                    </button>
                    <button onClick={() => setEditingRegion(false)} className="px-5 py-2.5 border border-stone-700 text-stone-400 text-xs font-bold uppercase tracking-widest hover:border-stone-500">
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Products */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-stone-100 font-black text-xl uppercase tracking-wide">
            Your Products <span className="text-amber-400">({products.length})</span>
          </h2>
          <button
            onClick={() => openForm('add')}
            className="flex items-center gap-2 px-5 py-3 bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-widest hover:bg-amber-300 transition-all"
          >
            <Plus size={14} /> Add Product
          </button>
        </div>

        {products.length === 0 ? (
          <div className="border border-dashed border-stone-800 py-24 text-center">
            <Package size={40} className="mx-auto text-stone-700 mb-4" />
            <h3 className="text-stone-400 font-bold mb-1">No products yet</h3>
            <p className="text-stone-600 text-sm mb-6">Add your first product to start selling to your region</p>
            <button onClick={() => openForm('add')} className="px-6 py-3 bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-widest hover:bg-amber-300 transition-all">
              + Add Your First Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-stone-800">
            {products.map((product) => (
              <div key={product._id} className="bg-stone-950 group">
                <Link to={`/product/${product._id}`} className="block overflow-hidden border-b border-stone-800" style={{ aspectRatio: '4/3' }}>
                  {product.images[0] ? (
                    <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-700"><Package size={32} /></div>
                  )}
                </Link>
                <div className="p-5">
                  <h3 className="text-stone-100 font-bold text-base mb-1 truncate">{product.title.replace(/"/g, '').trim()}</h3>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-amber-400 font-black">{inr(product.price)}</span>
                    <span className={`text-xs ${product.quantity === 0 ? 'text-red-400' : 'text-stone-600'}`}>
                      {product.quantity === 0 ? 'Sold out' : `${product.quantity} in stock`}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openForm('edit', product)} className="flex-1 py-2 border border-stone-700 text-stone-400 text-xs font-bold uppercase tracking-widest hover:border-amber-400 hover:text-amber-400 transition-all flex items-center justify-center gap-1">
                      <Edit3 size={11} /> Edit
                    </button>
                    <Link to={`/product/${product._id}`} className="px-3 py-2 border border-stone-700 text-stone-400 hover:border-amber-400 hover:text-amber-400 transition-all flex items-center justify-center" title="View in marketplace">
                      <Eye size={13} />
                    </Link>
                    <button
                      onClick={() => handleDelete(product)}
                      disabled={deleteMutation.isPending}
                      className="flex-1 py-2 border border-stone-700 text-stone-600 text-xs font-bold uppercase tracking-widest hover:border-red-500/50 hover:text-red-400 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit form */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-950/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setIsFormOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-900 border border-stone-700 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-stone-800">
                <div>
                  <div className="text-amber-400 text-xs uppercase tracking-widest mb-0.5">Seller Studio</div>
                  <h2 className="text-stone-100 font-black text-lg">{formMode === 'add' ? 'Add Product' : 'Edit Product'}</h2>
                </div>
                <button onClick={() => setIsFormOpen(false)} className="p-2 text-stone-600 hover:text-stone-200 transition-colors"><X size={18} /></button>
              </div>

              <form onSubmit={handleSubmit} className="divide-y divide-stone-800">
                {[
                  { name: 'title', placeholder: 'Product title', label: 'Title', type: 'text' },
                  { name: 'price', placeholder: '0', label: 'Price (₹)', type: 'number', min: 0 },
                  { name: 'category', placeholder: 'e.g. pottery, textiles, jewelry', label: 'Category', type: 'text' },
                  { name: 'tags', placeholder: 'handmade, artisan, craft', label: 'Tags (comma separated)', type: 'text' },
                  { name: 'quantity', placeholder: '0', label: 'Quantity', type: 'number', min: 0 },
                ].map((field) => (
                  <div key={field.name} className="px-6 pt-3 pb-4">
                    <label className="text-stone-600 text-xs uppercase tracking-widest block mb-1">{field.label}</label>
                    <input
                      name={field.name}
                      type={field.type}
                      min={field.min}
                      placeholder={field.placeholder}
                      value={formData[field.name]}
                      onChange={handleInputChange}
                      required={['title', 'price', 'category', 'quantity'].includes(field.name)}
                      className="w-full bg-transparent text-stone-100 focus:outline-none placeholder-stone-700 text-sm"
                    />
                  </div>
                ))}

                <div className="px-6 pt-3 pb-4">
                  <label className="text-stone-600 text-xs uppercase tracking-widest block mb-1">Description</label>
                  <textarea name="description" placeholder="Tell the story of this piece..." value={formData.description} onChange={handleInputChange} required rows={3} className="w-full bg-transparent text-stone-100 focus:outline-none placeholder-stone-700 text-sm resize-none" />
                </div>

                <div className="px-6 pt-3 pb-4">
                  <label className="text-stone-600 text-xs uppercase tracking-widest block mb-2">Images</label>
                  {formMode === 'edit' && formData.keepImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.keepImages.map((url) => (
                        <div key={url} className="relative w-16 h-16 border border-stone-700">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeExistingImage(url)} className="absolute -top-2 -right-2 bg-stone-950 border border-stone-600 text-stone-300 hover:text-red-400 p-0.5" title="Remove image">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input type="file" multiple accept="image/*" onChange={handleFileChange} className="text-stone-500 text-sm file:mr-3 file:py-1 file:px-3 file:border file:border-stone-700 file:bg-transparent file:text-stone-400 file:text-xs file:uppercase file:tracking-widest file:cursor-pointer hover:file:border-amber-400 hover:file:text-amber-400 file:transition-all" />
                  <p className="text-stone-700 text-xs mt-2">Up to 5 images.</p>
                </div>

                <div className="p-6">
                  <button type="submit" disabled={saving} className="w-full py-4 bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-widest hover:bg-amber-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {saving ? 'Saving...' : formMode === 'add' ? 'Create Product →' : 'Update Product →'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
