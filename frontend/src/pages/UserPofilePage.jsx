import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  User, MapPin, Mail, Calendar,
  Package, Truck, CheckCircle2, Clock, X,
  ArrowLeft, Star, Eye, ShoppingBag, Camera, Heart, Pencil
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserOrders, updateUserProfile, updateUserDetails, getFavorites, removeFavorite } from '../lib/api';
import RegionSelect from '../components/RegionSelect';
import { errMsg, inr } from '../lib/errors';
import useAuthUser from '../hooks/useAuthUser';

const STATUS_CONFIG = {
  pending:    { color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5', icon: Clock },
  processing: { color: 'text-blue-400 border-blue-400/30 bg-blue-400/5', icon: Package },
  shipped:    { color: 'text-amber-400 border-amber-400/30 bg-amber-400/5', icon: Truck },
  delivered:  { color: 'text-green-400 border-green-400/30 bg-green-400/5', icon: CheckCircle2 },
  cancelled:  { color: 'text-red-400 border-red-400/30 bg-red-400/5', icon: X },
};
const PAYMENT_COLOR = { pending: 'text-yellow-400', completed: 'text-green-400', failed: 'text-red-400' };

export default function UserProfilePage() {
  const { authUser, isLoading: authLoading } = useAuthUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchParams] = useSearchParams();
  const initialTab = ['profile', 'orders', 'saved'].includes(searchParams.get('tab')) ? searchParams.get('tab') : 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({ address: '', state: '', city: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const { data: orders = [], isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ['userOrders'],
    queryFn: getUserOrders,
    enabled: !!authUser,
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
      setSelectedFile(null);
      setPreviewUrl('');
      toast.success('Profile picture updated');
    },
    onError: (error) => toast.error(errMsg(error, 'Failed to update profile picture')),
  });

  const detailsMutation = useMutation({
    mutationFn: updateUserDetails,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
      setEditingAddress(false);
      toast.success('Delivery details saved');
    },
    onError: (error) => toast.error(errMsg(error, 'Could not save details')),
  });

  const { data: favorites = [], isLoading: favoritesLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    enabled: !!authUser,
  });
  const unsaveMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
    },
    onError: (error) => toast.error(errMsg(error, 'Could not remove item')),
  });

  const startEditingAddress = () => {
    setAddressForm({ address: authUser.address || '', state: authUser.state || '', city: authUser.city || '' });
    setEditingAddress(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    if (selectedFile) updateProfileMutation.mutate(selectedFile);
  };

  const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <span className="text-stone-600 text-xs tracking-widest uppercase animate-pulse">Loading profile...</span>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="border border-stone-800 p-10 text-center max-w-sm">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-stone-200 font-black text-xl mb-2">Access Denied</h2>
          <p className="text-stone-600 text-sm mb-6">Please login to view your profile.</p>
          <motion.button
            onClick={() => navigate('/user/login')}
            className="px-6 py-3 bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-widest hover:bg-amber-300 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Sign In
          </motion.button>
        </div>
      </div>
    );
  }

  const deliveredCount = orders.filter(o => o.orderStatus === 'delivered').length;
  const activeCount = orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.orderStatus)).length;
  const totalSpent = orders.reduce((s, o) => s + o.totalAmount, 0);

  return (
    <div className="min-h-screen bg-stone-950">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-50 bg-stone-950/95 backdrop-blur-sm border-b border-stone-800"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              className="p-2 text-stone-500 hover:text-stone-200 border border-stone-800 hover:border-stone-600 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/market')}
            >
              <ArrowLeft size={16} />
            </motion.button>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-400 rounded-sm" />
                <span className="text-stone-100 font-black tracking-widest text-sm uppercase">My Profile</span>
              </div>
              <p className="text-stone-600 text-xs">{authUser.fullName}</p>
            </div>
          </div>
          <motion.button
            className="p-2 bg-amber-400 text-stone-950 hover:bg-amber-300 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/cart')}
          >
            <ShoppingBag size={14} />
          </motion.button>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Profile Hero */}
        <motion.div
          className="border border-stone-800 mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="p-8">
            <div className="flex flex-col lg:flex-row items-start gap-8">
              {/* Avatar */}
              <div className="text-center">
                <div className="relative group mb-3">
                  <div className="w-20 h-20 overflow-hidden border border-stone-700 bg-stone-900 flex items-center justify-center text-stone-100 font-black text-2xl">
                    {authUser.profilePic ? (
                      <img src={previewUrl || authUser.profilePic} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      authUser.fullName ? authUser.fullName[0].toUpperCase() : 'U'
                    )}
                  </div>
                  <button
                    onClick={() => document.getElementById('fileInput').click()}
                    className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                  >
                    <Camera className="text-amber-400" size={18} />
                  </button>
                  <input id="fileInput" type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                </div>

                {selectedFile && (
                  <motion.button
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                    className="px-3 py-1.5 bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-widest hover:bg-amber-300 transition-all disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Photo'}
                  </motion.button>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h2 className="text-stone-100 font-black text-2xl mb-1">{authUser.fullName}</h2>
                <p className="text-stone-500 text-sm mb-1">{authUser.email}</p>
                <div className="flex items-center gap-1 text-stone-700 text-xs mb-5">
                  <Calendar size={11} />
                  <span>Member since {new Date(authUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-stone-800 border border-stone-800">
                  {[
                    { label: 'Total Orders', value: orders.length, color: 'text-stone-100' },
                    { label: 'Delivered', value: deliveredCount, color: 'text-green-400' },
                    { label: 'Active', value: activeCount, color: 'text-amber-400' },
                    { label: 'Total Spent', value: `₹${totalSpent.toFixed(0)}`, color: 'text-stone-100' },
                  ].map((s) => (
                    <div key={s.label} className="bg-stone-950 p-4 text-center">
                      <div className={`text-xl font-black mb-0.5 ${s.color}`}>{s.value}</div>
                      <div className="text-stone-600 text-xs uppercase tracking-widest">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex mb-6 border-b border-stone-800">
          {[
            { id: 'profile', label: 'Profile Info', icon: User },
            { id: 'orders', label: 'Order History', icon: Package, count: orders.length },
            { id: 'saved', label: 'Saved', icon: Heart, count: favorites.length }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-stone-600 hover:text-stone-300'
                }`}
              >
                <Icon size={13} />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`text-xs px-1.5 py-0.5 font-black ${activeTab === tab.id ? 'bg-amber-400 text-stone-950' : 'bg-stone-800 text-stone-500'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Info */}
                <div className="border border-stone-800">
                  <div className="px-6 py-4 border-b border-stone-800">
                    <span className="text-stone-200 font-black text-xs uppercase tracking-widest">Personal Information</span>
                  </div>
                  <div className="divide-y divide-stone-800">
                    {[
                      { icon: User, label: 'Full Name', value: authUser.fullName || 'Not provided' },
                      { icon: Mail, label: 'Email', value: authUser.email },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center gap-4 px-6 py-4">
                        <Icon className="text-amber-400 flex-shrink-0" size={16} />
                        <div>
                          <div className="text-stone-600 text-xs uppercase tracking-widest mb-0.5">{label}</div>
                          <div className="text-stone-200 font-semibold text-sm">{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Address + Stats */}
                <div className="space-y-4">
                  <div className="border border-stone-800">
                    <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between">
                      <span className="text-stone-200 font-black text-xs uppercase tracking-widest">Delivery &amp; Region</span>
                      {!editingAddress && (
                        <button onClick={startEditingAddress} className="flex items-center gap-1 text-stone-500 hover:text-amber-400 text-xs uppercase tracking-widest font-bold transition-colors">
                          <Pencil size={11} /> Edit
                        </button>
                      )}
                    </div>
                    {editingAddress ? (
                      <div className="p-6 space-y-4">
                        <div>
                          <label className="text-stone-600 text-xs uppercase tracking-widest block mb-1">Delivery address</label>
                          <textarea
                            rows={3}
                            value={addressForm.address}
                            onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                            placeholder="House no., street, area, pincode"
                            className="w-full bg-stone-900 border border-stone-700 text-stone-200 text-sm p-3 focus:outline-none focus:border-amber-400 resize-none"
                          />
                        </div>
                        <RegionSelect state={addressForm.state} city={addressForm.city} onChange={(r) => setAddressForm({ ...addressForm, ...r })} />
                        <div className="flex gap-2">
                          <button
                            disabled={!addressForm.state || !addressForm.city || detailsMutation.isPending}
                            onClick={() => detailsMutation.mutate(addressForm)}
                            className="px-5 py-2.5 bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-widest hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {detailsMutation.isPending ? 'Saving...' : 'Save'}
                          </button>
                          <button onClick={() => setEditingAddress(false)} className="px-5 py-2.5 border border-stone-700 text-stone-400 text-xs font-bold uppercase tracking-widest hover:border-stone-500">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="px-6 py-4 flex items-start gap-3">
                        <MapPin className="text-amber-400 flex-shrink-0 mt-0.5" size={16} />
                        <div>
                          <div className="text-stone-600 text-xs uppercase tracking-widest mb-1">Delivery Address</div>
                          <div className="text-stone-200 text-sm leading-relaxed">{authUser.address || 'No address on file'}</div>
                          <div className="text-stone-500 text-xs mt-2">
                            {[authUser.city, authUser.state].filter(Boolean).join(', ') || 'No region set - add one to see artisans near you'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border border-stone-800">
                    <div className="px-6 py-4 border-b border-stone-800">
                      <span className="text-stone-200 font-black text-xs uppercase tracking-widest">Account Stats</span>
                    </div>
                    <div className="grid grid-cols-2 gap-px bg-stone-800">
                      <div className="bg-stone-950 p-5 text-center">
                        <div className="text-amber-400 font-black text-2xl mb-1">{orders.length}</div>
                        <div className="text-stone-600 text-xs uppercase tracking-widest">Orders Placed</div>
                      </div>
                      <div className="bg-stone-950 p-5 text-center">
                        <div className="text-amber-400 font-black text-2xl mb-1">₹{totalSpent.toFixed(0)}</div>
                        <div className="text-stone-600 text-xs uppercase tracking-widest">Total Spent</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'saved' && (
            <motion.div key="saved" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              {favoritesLoading ? (
                <div className="text-center py-20 text-stone-600 text-xs uppercase tracking-widest animate-pulse">Loading saved items...</div>
              ) : favorites.length === 0 ? (
                <div className="text-center py-24 border border-dashed border-stone-800">
                  <Heart className="mx-auto text-stone-700 mb-4" size={40} />
                  <h4 className="text-stone-300 font-black text-lg mb-2">Nothing saved yet</h4>
                  <p className="text-stone-600 text-sm mb-6">Tap the heart on any product to keep it here.</p>
                  <button onClick={() => navigate('/market')} className="px-6 py-3 bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-widest hover:bg-amber-300 transition-all">Browse local crafts →</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-stone-800">
                  {favorites.map((p) => (
                    <div key={p._id} className="bg-stone-950 group">
                      <Link to={`/product/${p._id}`} className="block overflow-hidden" style={{ aspectRatio: '4/3' }}>
                        <img src={p.images?.[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </Link>
                      <div className="p-5 border-t border-stone-800">
                        <h4 className="text-stone-100 font-bold truncate">{p.title.replace(/"/g, '').trim()}</h4>
                        <div className="text-stone-600 text-xs mt-1">{p.seller?.businessName}{p.city ? ` · ${p.city}` : ''}</div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-amber-400 font-black">{inr(p.price)}</span>
                          <button onClick={() => unsaveMutation.mutate(p._id)} className="text-stone-500 hover:text-red-400 text-xs uppercase tracking-widest font-bold transition-colors">Remove</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {ordersLoading ? (
                <div className="text-center py-20 text-stone-600 text-xs uppercase tracking-widest animate-pulse">
                  Loading orders...
                </div>
              ) : ordersError ? (
                <div className="text-center py-20 text-red-400">Failed to load orders</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-24 border border-dashed border-stone-800">
                  <Package className="mx-auto text-stone-700 mb-4" size={40} />
                  <h4 className="text-stone-300 font-black text-lg mb-2">No orders yet</h4>
                  <p className="text-stone-600 text-sm mb-6">Start shopping to see your orders here.</p>
                  <motion.button
                    onClick={() => navigate('/market')}
                    className="px-6 py-3 bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-widest hover:bg-amber-300 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Start Shopping →
                  </motion.button>
                </div>
              ) : (
                <div className="border border-stone-800 divide-y divide-stone-800">
                  {orders.map((order, index) => {
                    const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.pending;
                    const StatusIcon = cfg.icon;
                    return (
                      <motion.div
                        key={order._id}
                        className="p-6 hover:bg-stone-900/30 transition-colors"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.04 }}
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                          {/* Order Info + Products */}
                          <div className="lg:col-span-7">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="text-stone-100 font-black text-sm">
                                  #{order._id.slice(-8).toUpperCase()}
                                </h4>
                                <p className="text-stone-600 text-xs mt-0.5">
                                  {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-stone-100 font-black">₹{order.totalAmount}</div>
                                <div className={`text-xs font-semibold ${PAYMENT_COLOR[order.paymentStatus]}`}>
                                  {order.paymentMethod.toUpperCase()}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              {order.products.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-stone-900/40 border border-stone-800 p-3">
                                  <div className="w-10 h-10 overflow-hidden border border-stone-700 flex-shrink-0">
                                    <img
                                      src={item.product.images?.[0] || 'https://via.placeholder.com/60'}
                                      alt={item.product.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h5 className="text-stone-200 text-xs font-bold truncate">{item.product.title}</h5>
                                    <div className="flex items-center gap-3 text-stone-600 text-xs mt-0.5">
                                      <span>Qty: {item.quantity}</span>
                                      <span>₹{item.price}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Status + Actions */}
                          <div className="lg:col-span-5 flex flex-col gap-3">
                            <div className={`flex items-center gap-2 px-3 py-2 border text-xs font-bold uppercase tracking-widest w-fit ${cfg.color}`}>
                              <StatusIcon size={12} />
                              <span className="capitalize">{order.orderStatus}</span>
                            </div>

                            <div className="flex flex-col gap-2">
                              <motion.button
                                onClick={() => navigate(`/orders/${order._id}`)}
                                className="flex items-center justify-center gap-2 border border-stone-700 text-stone-300 text-xs font-bold uppercase tracking-widest py-3 hover:border-amber-400 hover:text-amber-400 transition-all"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Eye size={12} /> View Details
                              </motion.button>

                              {order.orderStatus === 'delivered' && (
                                <motion.button
                                  className="flex items-center justify-center gap-2 border border-stone-700 text-stone-500 text-xs font-bold uppercase tracking-widest py-3 hover:border-amber-400 hover:text-amber-400 transition-all"
                                  whileHover={{ scale: 1.01 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Star size={12} /> Leave Review
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
