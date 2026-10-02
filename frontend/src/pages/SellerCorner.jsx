import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAuthUser from '../hooks/useAuthUser';
import { getAllProducts, createProduct, updateProduct, deleteProduct, getFollowers } from '../lib/api';
import { BouncingDotsLoader } from '../components/Loading';
import { X, Plus, Edit3, Trash2, Package } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function SellerCorner() {
  const { authUser, isLoading: authLoading, type } = useAuthUser();
  const sellerId = authUser?._id;
  const queryClient = useQueryClient();

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['sellerProducts', sellerId],
    queryFn: () => getAllProducts({ seller: sellerId }),
    enabled: !!sellerId,
  });

  const { data: followersData } = useQuery({
    queryKey: ['followers', sellerId],
    queryFn: () => getFollowers(sellerId),
    enabled: !!sellerId,
  });
  const followersCount = followersData?.followersCount || 0;

  const salesChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Sales',
      data: [120, 190, 300, 500, 200, 300, 450],
      backgroundColor: '#d97706',
      borderRadius: 0,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false }, title: { display: false } },
    scales: {
      x: { ticks: { color: '#78716c' }, grid: { color: '#1c1917' } },
      y: { ticks: { color: '#78716c' }, grid: { color: '#1c1917' } },
    },
  };

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', category: '', tags: '', quantity: '', images: [], keepImages: [],
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  const handleFileChange = (e) => setFormData({ ...formData, images: Array.from(e.target.files) });

  const openForm = (mode, product = null) => {
    setFormMode(mode);
    setSelectedProduct(product);
    if (product) {
      setFormData({
        title: product.title?.replace(/"/g, '').trim() || '',
        description: product.description?.replace(/"/g, '').trim() || '',
        price: product.price || '',
        category: product.category?.replace(/"/g, '').trim() || '',
        tags: product.tags?.join(', ') || '',
        quantity: product.quantity || '',
        images: [],
        keepImages: product.images || [],
      });
    } else {
      setFormData({ title: '', description: '', price: '', category: '', tags: '', quantity: '', images: [], keepImages: [] });
    }
    setIsFormOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => { queryClient.invalidateQueries(['sellerProducts']); setIsFormOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['sellerProducts']); setIsFormOpen(false); },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => queryClient.invalidateQueries(['sellerProducts']),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const productToSend = { ...formData, tags: formData.tags.split(',').map(t => t.trim()) };
    if (formMode === 'add') createMutation.mutate(productToSend);
    else if (selectedProduct) updateMutation.mutate({ id: selectedProduct._id, data: productToSend });
  };

  const displayProducts = products || [];

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

  return (
    <div className="min-h-screen bg-stone-950">
      {/* Header */}
      <div className="border-b border-stone-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-400 rounded-sm" />
          <span className="text-stone-100 font-black tracking-widest text-sm uppercase">BaskIt</span>
          <span className="text-stone-700 mx-2">›</span>
          <span className="text-stone-400 text-sm">Seller Corner</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Profile + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-stone-800 mb-8">
          {/* Profile */}
          <motion.div
            className="bg-stone-950 p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-stone-500 text-xs uppercase tracking-widest mb-6">Seller Profile</div>
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 overflow-hidden border border-stone-700 flex-shrink-0">
                <img src={authUser.profilePic} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-stone-100 font-black text-xl mb-0.5">{authUser.fullName}</h2>
                <div className="text-amber-400 text-sm font-medium mb-3">{authUser.businessName || 'No Business Name'}</div>
                <div className="space-y-1">
                  {[
                    ['Email', authUser.email],
                    ['Followers', followersCount],
                    ['Member Since', new Date(authUser.createdAt).toLocaleDateString()],
                  ].map(([key, val]) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-stone-600 text-xs uppercase tracking-widest w-20 flex-shrink-0">{key}</span>
                      <span className="text-stone-300 text-sm">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-px bg-stone-800 mt-6">
              {[
                { label: 'Products', value: displayProducts.length },
                { label: 'Followers', value: followersCount },
                { label: 'Revenue', value: '$—' },
              ].map((s) => (
                <div key={s.label} className="bg-stone-950 p-4 text-center">
                  <div className="text-stone-100 font-black text-xl">{s.value}</div>
                  <div className="text-stone-600 text-xs uppercase tracking-widest mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Sales Chart */}
          <motion.div
            className="bg-stone-950 p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="text-stone-500 text-xs uppercase tracking-widest mb-6">Weekly Sales Overview</div>
            <Bar data={salesChartData} options={chartOptions} />
          </motion.div>
        </div>

        {/* Products Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-stone-100 font-black text-xl uppercase tracking-wide">
                Your Products <span className="text-amber-400">({displayProducts.length})</span>
              </h2>
            </div>
            <motion.button
              onClick={() => openForm('add')}
              className="flex items-center gap-2 px-5 py-3 bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-widest hover:bg-amber-300 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={14} /> Add Product
            </motion.button>
          </div>

          {displayProducts.length === 0 ? (
            <div className="border border-dashed border-stone-800 py-24 text-center">
              <Package size={40} className="mx-auto text-stone-700 mb-4" />
              <h3 className="text-stone-400 font-bold mb-1">No products yet</h3>
              <p className="text-stone-600 text-sm mb-6">Add your first product to start selling</p>
              <motion.button
                onClick={() => openForm('add')}
                className="px-6 py-3 bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-widest hover:bg-amber-300 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                + Add Your First Product
              </motion.button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-stone-800">
              {displayProducts.map((product) => (
                <motion.div
                  key={product._id}
                  className="bg-stone-950 group"
                  whileHover={{ backgroundColor: 'rgba(28, 25, 23, 0.8)' }}
                >
                  <div className="overflow-hidden border-b border-stone-800" style={{ aspectRatio: '4/3' }}>
                    <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-stone-100 font-bold text-base mb-1 truncate">{product.title.replace(/"/g, '').trim()}</h3>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-amber-400 font-black">₹{product.price}</span>
                      <span className="text-stone-600 text-xs">{product.quantity} in stock</span>
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => openForm('edit', product)}
                        className="flex-1 py-2 border border-stone-700 text-stone-400 text-xs font-bold uppercase tracking-widest hover:border-amber-400 hover:text-amber-400 transition-all flex items-center justify-center gap-1"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Edit3 size={11} /> Edit
                      </motion.button>
                      <motion.button
                        onClick={() => deleteMutation.mutate(product._id)}
                        className="flex-1 py-2 border border-stone-700 text-stone-600 text-xs font-bold uppercase tracking-widest hover:border-red-500/50 hover:text-red-400 transition-all flex items-center justify-center gap-1"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Trash2 size={11} /> Delete
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Add/Edit Overlay Form */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-950/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setIsFormOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-900 border border-stone-700 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Form Header */}
              <div className="flex items-center justify-between p-6 border-b border-stone-800">
                <div>
                  <div className="text-amber-400 text-xs uppercase tracking-widest mb-0.5">Seller Studio</div>
                  <h2 className="text-stone-100 font-black text-lg">{formMode === 'add' ? 'Add Product' : 'Edit Product'}</h2>
                </div>
                <button onClick={() => setIsFormOpen(false)} className="p-2 text-stone-600 hover:text-stone-200 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="divide-y divide-stone-800">
                {[
                  { name: 'title', placeholder: 'Product title', label: 'Title', type: 'text' },
                  { name: 'price', placeholder: '0', label: 'Price (₹)', type: 'number' },
                  { name: 'category', placeholder: 'e.g. jewelry', label: 'Category', type: 'text' },
                  { name: 'tags', placeholder: 'handmade, artisan, craft', label: 'Tags (comma separated)', type: 'text' },
                  { name: 'quantity', placeholder: '0', label: 'Quantity', type: 'number' },
                ].map((field) => (
                  <div key={field.name} className="px-6 pt-3 pb-4">
                    <label className="text-stone-600 text-xs uppercase tracking-widest block mb-1">{field.label}</label>
                    <input
                      name={field.name}
                      type={field.type}
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
                  <textarea
                    name="description"
                    placeholder="Describe your product..."
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full bg-transparent text-stone-100 focus:outline-none placeholder-stone-700 text-sm resize-none"
                  />
                </div>

                <div className="px-6 pt-3 pb-4">
                  <label className="text-stone-600 text-xs uppercase tracking-widest block mb-2">Images</label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="text-stone-500 text-sm file:mr-3 file:py-1 file:px-3 file:border file:border-stone-700 file:bg-transparent file:text-stone-400 file:text-xs file:uppercase file:tracking-widest file:cursor-pointer hover:file:border-amber-400 hover:file:text-amber-400 file:transition-all"
                  />
                </div>

                <div className="p-6">
                  <motion.button
                    type="submit"
                    disabled={createMutation.isLoading || updateMutation.isLoading}
                    className="w-full py-4 bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-widest hover:bg-amber-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {createMutation.isLoading || updateMutation.isLoading
                      ? 'Saving...'
                      : formMode === 'add' ? 'Create Product →' : 'Update Product →'
                    }
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
