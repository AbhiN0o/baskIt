import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PrizeGrid from '../components/PrizeGrid';
import {
  ShoppingBag, Trash2, Plus, Minus, Heart,
  ArrowLeft, Tag, Truck, Shield, Star,
  CreditCard, CheckCircle2, Loader, X
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCart, updateCartItem, removeCartItem, clearCart, createOrder } from '../lib/api';
import useAuthUser from '../hooks/useAuthUser';

export default function CartPage() {
  const { isLoading: aha, authUser } = useAuthUser();
  const navigate = useNavigate();

  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [selectedShipping, setSelectedShipping] = useState('standard');
  const [mounted, setMounted] = useState(false);
  const [savedItems, setSavedItems] = useState([]);
  const [showPrizeGrid, setShowPrizeGrid] = useState(false);
  const [prizeApplied, setPrizeApplied] = useState(false);

  const queryClient = useQueryClient();

  const { data: cart, isLoading, error } = useQuery({ queryKey: ['cart'], queryFn: getCart });

  const updateQuantityMutation = useMutation({ mutationFn: updateCartItem, onSuccess: () => queryClient.invalidateQueries(['cart']) });
  const removeItemMutation = useMutation({ mutationFn: removeCartItem, onSuccess: () => queryClient.invalidateQueries(['cart']) });
  const clearCartMutation = useMutation({ mutationFn: clearCart, onSuccess: () => queryClient.invalidateQueries(['cart']) });

  const checkoutMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (response) => {
      queryClient.invalidateQueries(['cart']);
      clearCartMutation.mutate();
      alert('Order placed successfully!');
      navigate(`/orders/${response.order._id}`);
    },
    onError: (error) => { alert(error.response?.data?.message || 'Failed to place order'); }
  });

  const shippingOptions = [
    { id: 'standard', name: 'Standard Delivery', time: '5-7 business days', price: 0 },
    { id: 'express', name: 'Express Delivery', time: '2-3 business days', price: 15 },
    { id: 'overnight', name: 'Overnight', time: 'Next business day', price: 35 }
  ];

  const discountCodes = {
    'WELCOME10': { type: 'percentage', value: 10, description: '10% off your order' },
    'SAVE20': { type: 'fixed', value: 20, description: '$20 off orders over $100' },
    'FREESHIP': { type: 'shipping', value: 0, description: 'Free shipping' }
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || prizeApplied || !cart) return;
    const subtotal = cart.products.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    if (subtotal > 50) setShowPrizeGrid(true);
  }, [cart, mounted, prizeApplied]);

  const cartItems = cart?.products || [];

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) { removeItemMutation.mutate(productId); return; }
    updateQuantityMutation.mutate({ productId, quantity: newQuantity });
  };
  const removeItem = (productId) => removeItemMutation.mutate(productId);
  const saveForLater = (productId) => {
    const item = cartItems.find(i => i.product._id === productId);
    if (item) { setSavedItems(prev => [...prev, { ...item }]); removeItem(productId); }
  };
  const applyDiscountCode = () => {
    const discount = discountCodes[discountCode.toUpperCase()];
    if (discount) { setAppliedDiscount(discount); setDiscountCode(''); }
  };
  const handleCheckout = async () => {
    if (!authUser) { alert('Please login to proceed with checkout'); return; }
    if (!authUser.address) { alert('Please update your address in profile to proceed with checkout'); return; }
    const orderData = {
      products: cartItems.map(item => ({ productId: item.product._id, quantity: item.quantity })),
      shippingAddress: authUser.address,
      paymentMethod: 'cod'
    };
    checkoutMutation.mutate(orderData);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shippingCost = appliedDiscount?.type === 'shipping' ? 0 : shippingOptions.find(o => o.id === selectedShipping)?.price || 0;
  const discountAmount = appliedDiscount?.type === 'percentage' ? (subtotal * appliedDiscount.value / 100) :
    appliedDiscount?.type === 'fixed' ? Math.min(appliedDiscount.value, subtotal) : 0;
  const tax = (subtotal - discountAmount) * 0.08;
  const total = subtotal - discountAmount + shippingCost + tax;

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
                    disabled={clearCartMutation.isLoading}
                    className="text-stone-600 hover:text-red-400 transition-colors text-xs uppercase tracking-widest flex items-center gap-1"
                  >
                    <X size={12} />
                    {clearCartMutation.isLoading ? 'Clearing...' : 'Clear All'}
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
                              <span className="text-stone-500 text-xs">Total: <span className="text-stone-300">${(item.product.price * item.quantity).toFixed(2)}</span></span>
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
                    </div>
                  )}

                  {/* Promo Code */}
                  <div>
                    <label className="text-stone-500 text-xs uppercase tracking-widest block mb-2">Promo Code</label>
                    <div className="flex">
                      <input
                        type="text"
                        placeholder="Enter code"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        className="flex-1 bg-stone-900 border border-stone-700 border-r-0 px-3 py-2 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-400 text-sm transition-colors"
                      />
                      <motion.button
                        onClick={applyDiscountCode}
                        className="px-4 py-2 bg-amber-400 text-stone-950 font-bold text-xs tracking-widest uppercase hover:bg-amber-300 transition-all"
                        whileTap={{ scale: 0.97 }}
                      >
                        Apply
                      </motion.button>
                    </div>
                    {appliedDiscount && (
                      <div className="mt-2 text-amber-400 text-xs flex items-center gap-1">
                        <Tag size={11} /> {appliedDiscount.description} applied!
                      </div>
                    )}
                  </div>

                  {/* Shipping Options */}
                  <div>
                    <label className="text-stone-500 text-xs uppercase tracking-widest block mb-2">Shipping</label>
                    <div className="space-y-1">
                      {shippingOptions.map((option) => (
                        <label
                          key={option.id}
                          className={`flex items-center justify-between p-3 cursor-pointer transition-all border ${
                            selectedShipping === option.id
                              ? 'border-amber-400 bg-amber-400/5'
                              : 'border-stone-800 hover:border-stone-600'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="shipping"
                              value={option.id}
                              checked={selectedShipping === option.id}
                              onChange={(e) => setSelectedShipping(e.target.value)}
                              className="sr-only"
                            />
                            <div className={`w-3 h-3 border ${selectedShipping === option.id ? 'border-amber-400 bg-amber-400' : 'border-stone-600'}`} />
                            <div>
                              <div className="text-stone-200 text-xs font-semibold">{option.name}</div>
                              <div className="text-stone-600 text-xs">{option.time}</div>
                            </div>
                          </div>
                          <div className="text-stone-300 font-bold text-xs">
                            {option.price === 0 ? 'Free' : `$${option.price}`}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="border-t border-stone-800 pt-4 space-y-2">
                    <div className="flex justify-between text-stone-500 text-sm">
                      <span>Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    {appliedDiscount && (
                      <div className="flex justify-between text-amber-400 text-sm">
                        <span>Discount</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-stone-500 text-sm">
                      <span>Shipping</span>
                      <span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between text-stone-500 text-sm">
                      <span>Tax (8%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-stone-100 font-black text-lg border-t border-stone-700 pt-2 mt-2">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
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
                    disabled={checkoutMutation.isLoading || !authUser}
                    className={`w-full py-4 font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all ${
                      checkoutMutation.isLoading || !authUser
                        ? 'bg-stone-800 text-stone-600 cursor-not-allowed'
                        : 'bg-amber-400 text-stone-950 hover:bg-amber-300'
                    }`}
                    whileHover={!checkoutMutation.isLoading && authUser ? { scale: 1.01 } : {}}
                    whileTap={!checkoutMutation.isLoading && authUser ? { scale: 0.98 } : {}}
                  >
                    {checkoutMutation.isLoading ? (
                      <><Loader className="animate-spin" size={16} /> Processing...</>
                    ) : !authUser ? 'Login to Checkout' : (
                      <><CreditCard size={16} /> Place Order — ${total.toFixed(2)}</>
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

      {showPrizeGrid && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <PrizeGrid
            onWin={(discount) => {
              if (discount) setAppliedDiscount(discount);
              setPrizeApplied(true);
            }}
            onClose={() => setShowPrizeGrid(false)}
          />
        </div>
      )}
    </div>
  );
}
