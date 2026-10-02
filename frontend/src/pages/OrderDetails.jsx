import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Package, Truck, CheckCircle2, Clock, X,
  MapPin, CreditCard, Calendar, Star, Eye, ShoppingBag,
  Copy, AlertCircle, RefreshCw
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrderById } from '../lib/api';
import useAuthUser from '../hooks/useAuthUser';

const STATUS_CONFIG = {
  pending:    { color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5', icon: Clock },
  processing: { color: 'text-blue-400 border-blue-400/30 bg-blue-400/5', icon: Package },
  shipped:    { color: 'text-amber-400 border-amber-400/30 bg-amber-400/5', icon: Truck },
  delivered:  { color: 'text-green-400 border-green-400/30 bg-green-400/5', icon: CheckCircle2 },
  cancelled:  { color: 'text-red-400 border-red-400/30 bg-red-400/5', icon: X },
};

const PAYMENT_COLOR = { pending: 'text-yellow-400', completed: 'text-green-400', failed: 'text-red-400' };

const PROGRESS_STEPS = ['pending', 'processing', 'shipped', 'delivered'];

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { authUser } = useAuthUser();
  const [copiedOrderId, setCopiedOrderId] = useState(false);

  const { data: orderData, isLoading, error, refetch } = useQuery({
    queryKey: ['orderDetails', orderId],
    queryFn: () => getOrderById(orderId),
    enabled: !!orderId,
  });

  const order = orderData?.order || orderData;

  const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order._id);
    setCopiedOrderId(true);
    setTimeout(() => setCopiedOrderId(false), 2000);
  };

  const getOrderProgress = (status) => {
    const idx = PROGRESS_STEPS.indexOf(status);
    if (status === 'cancelled') return { steps: [], progress: 0 };
    return { steps: PROGRESS_STEPS.slice(0, idx + 1), progress: ((idx + 1) / PROGRESS_STEPS.length) * 100 };
  };

  const canCancelOrder = () => order?.orderStatus === 'pending' && order?.paymentStatus !== 'completed';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <span className="text-stone-600 text-xs tracking-widest uppercase animate-pulse">Loading order...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="border border-stone-800 p-10 text-center max-w-sm">
          <Package className="mx-auto text-stone-700 mb-4" size={40} />
          <h2 className="text-stone-200 font-black text-xl mb-2">Order Not Found</h2>
          <p className="text-stone-600 text-sm mb-6">This order doesn't exist or you don't have permission to view it.</p>
          <motion.button
            onClick={() => navigate('/user')}
            className="px-6 py-3 bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-widest hover:bg-amber-300 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Back to Profile
          </motion.button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.orderStatus);
  const StatusIcon = statusConfig.icon;
  const orderProgress = getOrderProgress(order.orderStatus);

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
              className="p-2 text-stone-500 hover:text-stone-200 transition-colors border border-stone-800 hover:border-stone-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/user')}
            >
              <ArrowLeft size={16} />
            </motion.button>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-400 rounded-sm" />
                <span className="text-stone-100 font-black tracking-widest text-sm uppercase">Order Details</span>
              </div>
              <p className="text-stone-600 text-xs">#{order._id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={refetch}
              className="p-2 text-stone-500 hover:text-stone-200 transition-colors border border-stone-800 hover:border-stone-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw size={14} />
            </motion.button>
            <motion.button
              className="p-2 bg-amber-400 text-stone-950 hover:bg-amber-300 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/cart')}
            >
              <ShoppingBag size={14} />
            </motion.button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Order Overview Card */}
        <motion.div
          className="border border-stone-800 mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-stone-100 font-black text-2xl">#{order._id.slice(-8).toUpperCase()}</h2>
                <motion.button
                  onClick={handleCopyOrderId}
                  className="p-1.5 text-stone-600 hover:text-amber-400 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Copy full order ID"
                >
                  {copiedOrderId ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} />}
                </motion.button>
              </div>
              <div className="flex items-center gap-2 text-stone-500 text-sm">
                <Calendar size={14} />
                <span>{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            <div className="lg:text-right">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 border text-sm font-semibold mb-3 ${statusConfig.color}`}>
                <StatusIcon size={14} />
                <span className="capitalize">{order.orderStatus}</span>
              </div>
              <div className="text-stone-100 font-black text-3xl mb-1">₹{order.totalAmount}</div>
              <div className={`text-sm font-semibold capitalize ${PAYMENT_COLOR[order.paymentStatus]}`}>
                Payment: {order.paymentStatus}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Tracker */}
        {order.orderStatus !== 'cancelled' && (
          <motion.div
            className="border border-stone-800 mb-6 p-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <div className="text-stone-500 text-xs uppercase tracking-widest mb-6">Order Progress</div>
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-4 left-0 right-0 h-px bg-stone-800">
                <motion.div
                  className="h-full bg-amber-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${orderProgress.progress}%` }}
                  transition={{ duration: 1, delay: 0.4 }}
                />
              </div>

              {/* Steps */}
              <div className="grid grid-cols-4 gap-2">
                {PROGRESS_STEPS.map((status) => {
                  const isCompleted = orderProgress.steps.includes(status);
                  const isCurrent = order.orderStatus === status;
                  const StepIcon = STATUS_CONFIG[status].icon;
                  return (
                    <div key={status} className="text-center">
                      <div className={`w-8 h-8 mx-auto mb-3 border-2 flex items-center justify-center relative z-10 transition-all ${
                        isCompleted ? 'bg-amber-400 border-amber-400' : 'bg-stone-950 border-stone-700'
                      } ${isCurrent ? 'ring-4 ring-amber-400/20' : ''}`}>
                        <StepIcon size={14} className={isCompleted ? 'text-stone-950' : 'text-stone-600'} />
                      </div>
                      <div className={`text-xs font-bold uppercase tracking-widest capitalize ${isCompleted ? 'text-stone-300' : 'text-stone-700'}`}>
                        {status}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2">
            <motion.div
              className="border border-stone-800"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="px-6 py-4 border-b border-stone-800 flex items-center gap-2">
                <Package className="text-amber-400" size={16} />
                <span className="text-stone-200 font-black text-sm uppercase tracking-widest">
                  Items Ordered <span className="text-amber-400">({order.products.length})</span>
                </span>
              </div>

              <div className="divide-y divide-stone-800">
                {order.products.map((item, index) => (
                  <motion.div
                    key={index}
                    className="flex gap-4 p-5 hover:bg-stone-900/30 transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 + 0.3 }}
                  >
                    <div className="w-20 h-20 flex-shrink-0 overflow-hidden border border-stone-800">
                      <img
                        src={item.product.images?.[0] || 'https://via.placeholder.com/100'}
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-stone-100 font-bold text-sm">{item.product.title}</h4>
                        <div className="text-right">
                          <div className="text-stone-100 font-black">${(item.price * item.quantity).toFixed(2)}</div>
                          <div className="text-stone-600 text-xs">Qty: {item.quantity}</div>
                        </div>
                      </div>
                      <p className="text-stone-600 text-xs mb-2">Price at order: ${item.price}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="fill-amber-400 text-amber-400" size={11} />
                          <span className="text-stone-600 text-xs">{item.product.rating || 'No rating'}</span>
                        </div>
                        <motion.button
                          onClick={() => navigate(`/product/${item.product._id}`)}
                          className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors text-xs font-bold uppercase tracking-widest"
                          whileHover={{ scale: 1.02 }}
                        >
                          <Eye size={11} /> View
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-4">
            {/* Order Summary */}
            <motion.div
              className="border border-stone-800"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="px-5 py-4 border-b border-stone-800">
                <span className="text-stone-200 font-black text-xs uppercase tracking-widest">Summary</span>
              </div>
              <div className="p-5 space-y-2">
                <div className="flex justify-between text-stone-500 text-sm">
                  <span>Items ({order.products.reduce((s, i) => s + i.quantity, 0)})</span>
                  <span>${order.products.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-500 text-sm">
                  <span>Shipping</span><span>Free</span>
                </div>
                <div className="flex justify-between text-stone-500 text-sm">
                  <span>Tax</span><span>Included</span>
                </div>
                <div className="flex justify-between text-stone-100 font-black text-lg border-t border-stone-800 pt-2 mt-2">
                  <span>Total</span><span>₹{order.totalAmount}</span>
                </div>
              </div>
            </motion.div>

            {/* Payment Details */}
            <motion.div
              className="border border-stone-800"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              <div className="px-5 py-4 border-b border-stone-800 flex items-center gap-2">
                <CreditCard className="text-amber-400" size={14} />
                <span className="text-stone-200 font-black text-xs uppercase tracking-widest">Payment</span>
              </div>
              <div className="p-5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-600 text-sm">Method</span>
                  <span className="text-stone-200 font-bold text-sm uppercase">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600 text-sm">Status</span>
                  <span className={`font-bold text-sm capitalize ${PAYMENT_COLOR[order.paymentStatus]}`}>{order.paymentStatus}</span>
                </div>
                {order.paymentMethod === 'cod' && (
                  <div className="mt-3 border border-yellow-400/20 bg-yellow-400/5 p-3">
                    <div className="flex items-center gap-2 text-yellow-400 text-xs">
                      <AlertCircle size={12} />
                      Pay cash upon delivery
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Shipping Address */}
            <motion.div
              className="border border-stone-800"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="px-5 py-4 border-b border-stone-800 flex items-center gap-2">
                <MapPin className="text-amber-400" size={14} />
                <span className="text-stone-200 font-black text-xs uppercase tracking-widest">Shipping Address</span>
              </div>
              <div className="p-5">
                <p className="text-stone-400 text-sm leading-relaxed">{order.shippingAddress}</p>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              className="space-y-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.5 }}
            >
              <motion.button
                className="w-full bg-amber-400 text-stone-950 font-black py-4 uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-amber-300 transition-all"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <Truck size={14} /> Track Order
              </motion.button>

              {canCancelOrder() && (
                <motion.button
                  className="w-full border-2 border-red-500/30 text-red-400 font-bold py-3 uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-red-500/10 transition-all"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <X size={14} /> Cancel Order
                </motion.button>
              )}

              <motion.button
                onClick={() => navigate('/user')}
                className="w-full border border-stone-700 text-stone-400 font-bold py-3 uppercase tracking-widest text-xs hover:border-stone-500 hover:text-stone-200 transition-all"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                Back to Orders
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
