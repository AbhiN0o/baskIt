import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { errMsg, inr } from '../lib/errors';
import {
  ShoppingBag, Trash2, Plus, Minus, Heart,
  ArrowLeft, Truck, Shield, Star,
  CreditCard, Loader, MapPin, CheckCircle2, X
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCart, updateCartItem, removeCartItem, clearCart, createOrder, addFavorite } from '../lib/api';
import useAuthUser from '../hooks/useAuthUser';

export default function CartPage() {
  const { authUser } = useAuthUser();
  const navigate = useNavigate();

  const [mounted, setMounted] = useState(false);

  const queryClient = useQueryClient();

  const { data: cart, isLoading, error } = useQuery({ queryKey: ['cart'], queryFn: getCart });

  const refreshCart = () => queryClient.invalidateQueries({ queryKey: ['cart'] });
  const updateQuantityMutation = useMutation({
    mutationFn: updateCartItem,
    onSuccess: refreshCart,
    onError: (e) => toast.error(errMsg(e, 'Could not update quantity')),
  });
  const removeItemMutation = useMutation({ mutationFn: removeCartItem, onSuccess: refreshCart });
  const clearCartMutation = useMutation({ mutationFn: clearCart, onSuccess: refreshCart });
  const saveForLaterMutation = useMutation({
    mutationFn: async (productId) => {
      await addFavorite(productId);
      await removeCartItem(productId);
    },
    onSuccess: () => {
      refreshCart();
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
      toast.success('Moved to your saved items');
    },
    onError: (e) => toast.error(errMsg(e, 'Could not save for later')),
  });

  const checkoutMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (response) => {
      // the server already stock-checked and priced this order; now empty the cart
      clearCartMutation.mutate();
      queryClient.invalidateQueries({ queryKey: ['userOrders'] });
      toast.success('Order placed!');
      navigate(`/orders/${response.order._id}`);
    },
    onError: (error) => toast.error(errMsg(error, 'Failed to place order')),
  });

  useEffect(() => { setMounted(true); }, []);

  const cartItems = cart?.products || [];

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) { removeItemMutation.mutate(productId); return; }
    updateQuantityMutation.mutate({ productId, quantity: newQuantity });
  };
  const removeItem = (productId) => removeItemMutation.mutate(productId);
  const saveForLater = (productId) => saveForLaterMutation.mutate(productId);

  const handleCheckout = () => {
    if (!authUser) { toast('Please login to proceed with checkout'); return; }
    if (!authUser.address) { toast.error('Please add a delivery address in your profile first'); navigate('/user?tab=profile'); return; }
    checkoutMutation.mutate({
      products: cartItems.map((item) => ({ productId: item.product._id, quantity: item.quantity })),
      shippingAddress: [authUser.address, authUser.city, authUser.state].filter(Boolean).join(', '),
      paymentMethod: 'cod',
    });
  };

  // What you see is exactly what the server will charge: the sum of item prices.
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const total = subtotal;

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <span className="text-stone-500 text-sm tracking-widest uppercase animate-pulse">Loading cart...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center text-red-400">
        Failed to load cart: {error.message}
      </div>
    );
  }

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
          <motion.button
            className="flex items-center gap-2 text-stone-500 hover:text-stone-200 transition-colors text-sm"
            whileHover={{ x: -3 }}
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={16} />
            Continue Shopping
          </motion.button>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-amber-400 rounded-sm" />
            <span className="text-stone-100 font-black tracking-widest text-sm uppercase">Cart</span>
            <span className="text-stone-600 text-sm">({cartItems.length} items)</span>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {cartItems.length === 0 ? (
          <motion.div className="text-center py-32" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <ShoppingBag className="mx-auto mb-6 text-stone-700" size={64} />
            <h2 className="text-3xl font-black text-stone-200 mb-3">Your cart is empty</h2>
            <p className="text-stone-600 mb-8">Discover handcrafted pieces from artisans worldwide.</p>
            <motion.button
              className="px-8 py-3 bg-amber-400 text-stone-950 font-bold text-sm tracking-widest uppercase hover:bg-amber-300 transition-all"
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/market')}
            >
              Start Shopping →
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-stone-200 font-black text-xl uppercase tracking-wide">
                    Items <span className="text-amber-400">({cartItems.length})</span>
                  </h2>
                  <button
                    onClick={() => clearCartMutation.mutate()}
                    disabled={clearCartMutation.isPending}
                    className="text-stone-600 hover:text-red-400 transition-colors text-xs uppercase tracking-widest flex items-center gap-1"
                  >
                    <X size={12} />
                    {clearCartMutation.isPending ? 'Clearing...' : 'Clear All'}
                  </button>
                </div>

                <div className="border border-stone-800">
                  <AnimatePresence>
                    {cartItems.map((item, index) => (
                      <motion.div
                        key={item.product._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex gap-5 p-5 border-b border-stone-800 last:border-b-0 hover:bg-stone-900/50 transition-colors"
                      >
                        {/* Image */}
                        <div className="w-20 h-20 flex-shrink-0 overflow-hidden">
                          <img
                            src={item.product.images?.[0] || 'https://via.placeholder.com/100'}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-stone-100 font-bold text-base">{item.product.title}</h3>
                              <div className="flex items-center gap-2 text-stone-600 text-xs mt-0.5">
                                <span>by {item.product.seller?.businessName}</span>
                                {item.product.seller?.verified && <CheckCircle2 className="text-amber-400" size={11} />}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-stone-100 font-black text-lg">${item.product.price}</div>
                              <div className="flex items-center gap-0.5 justify-end">
                                <Star className="fill-amber-400 text-amber-400" size={10} />
                                <span className="text-stone-600 text-xs">{item.product.rating}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            {/* Quantity */}
                            <div className="flex items-center border border-stone-700">
                              <motion.button
                                onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                                className="px-3 py-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-all"
                                whileTap={{ scale: 0.9 }}
                              >
                                <Minus size={12} />
                              </motion.button>
                              <span className="px-4 py-1.5 text-stone-100 font-bold text-sm border-x border-stone-700">{item.quantity}</span>
                              <motion.button
                                onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                                className="px-3 py-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-all"
                                whileTap={{ scale: 0.9 }}
                              >
                                <Plus size={12} />
                              </motion.button>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-stone-500 text-xs">Total: <span className="text-stone-300">{inr(item.product.price * item.quantity)}</span></span>
                              <motion.button
                                onClick={() => saveForLater(item.product._id)}
                                className="p-1.5 text-stone-600 hover:text-amber-400 transition-colors"
                                whileHover={{ scale: 1.1 }}
                                title="Save for later"
                              >
                                <Heart size={14} />
                              </motion.button>
                              <motion.button
                                onClick={() => removeItem(item.product._id)}
                                className="p-1.5 text-stone-600 hover:text-red-400 transition-colors"
                                whileHover={{ scale: 1.1 }}
                                title="Remove"
                              >
                                <Trash2 size={14} />
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-4">
              <motion.div
                className="border border-stone-800 bg-stone-900/30 sticky top-24"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="p-6 border-b border-stone-800">
                  <h3 className="text-stone-100 font-black uppercase tracking-widest text-sm">Order Summary</h3>
                </div>

                <div className="p-6 space-y-5">
                  {/* Shipping address */}
                  {authUser?.address && (
                    <div className="border border-stone-700 p-3">
                      <div className="text-stone-500 text-xs uppercase tracking-widest mb-1">Shipping To</div>
                      <p className="text-stone-300 text-sm">{authUser.address}</p>
                      {(authUser.city || authUser.state) && (
                        <p className="text-stone-500 text-xs mt-1 flex items-center gap-1"><MapPin size={10} /> {[authUser.city, authUser.state].filter(Boolean).join(', ')}</p>
                      )}
                    </div>
                  )}

                  {/* Totals - exactly what the order will be charged */}
                  <div className="border-t border-stone-800 pt-4 space-y-2">
                    <div className="flex justify-between text-stone-500 text-sm">
                      <span>Subtotal ({cartItems.reduce((n, i) => n + i.quantity, 0)} items)</span>
                      <span>{inr(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-stone-500 text-sm">
                      <span className="flex items-center gap-1"><Truck size={12} /> Delivery</span>
                      <span>Arranged by the artisan</span>
                    </div>
                    <div className="flex justify-between text-stone-100 font-black text-lg border-t border-stone-700 pt-2 mt-2">
                      <span>Total</span>
                      <span>{inr(total)}</span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="flex items-center gap-2 text-stone-600 text-xs border border-stone-800 p-3">
                    <CreditCard size={13} />
                    <span>Payment: Cash on Delivery</span>
                  </div>

                  {/* Checkout Button */}
                  <motion.button
                    onClick={handleCheckout}
                    disabled={checkoutMutation.isPending || !authUser}
                    className={`w-full py-4 font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all ${
                      checkoutMutation.isPending || !authUser
                        ? 'bg-stone-800 text-stone-600 cursor-not-allowed'
                        : 'bg-amber-400 text-stone-950 hover:bg-amber-300'
                    }`}
                    whileHover={!checkoutMutation.isPending && authUser ? { scale: 1.01 } : {}}
                    whileTap={!checkoutMutation.isPending && authUser ? { scale: 0.98 } : {}}
                  >
                    {checkoutMutation.isPending ? (
                      <><Loader className="animate-spin" size={16} /> Processing...</>
                    ) : !authUser ? 'Login to Checkout' : (
                      <><CreditCard size={16} /> Place Order — {inr(total)}</>
                    )}
                  </motion.button>

                  <div className="flex items-center justify-center gap-2 text-stone-600 text-xs">
                    <Shield size={12} />
                    <span>Secure checkout</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
