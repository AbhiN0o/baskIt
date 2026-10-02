import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Package, Truck, CheckCircle2, Clock, X,
  Search, Trash2, User, Calendar, DollarSign, RefreshCw
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllOrders, updateOrderStatus, deleteOrder } from '../lib/api';
import { BouncingDotsLoader } from '../components/Loading.jsx';

const STATUS_ICONS = { pending: Clock, processing: Package, shipped: Truck, delivered: CheckCircle2, cancelled: X };
const STATUS_STYLES = {
  pending:    'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
  processing: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  shipped:    'text-amber-400 border-amber-400/30 bg-amber-400/5',
  delivered:  'text-green-400 border-green-400/30 bg-green-400/5',
  cancelled:  'text-red-400 border-red-400/30 bg-red-400/5',
};
const PAYMENT_STYLES = { pending: 'text-yellow-400', completed: 'text-green-400', failed: 'text-red-400' };

export default function AdminOrderManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const { data: orders = [], isLoading, error, refetch } = useQuery({
    queryKey: ['allOrders'],
    queryFn: getAllOrders,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, statusData }) => updateOrderStatus(orderId, statusData),
    onSuccess: () => { queryClient.invalidateQueries(['allOrders']); alert('Order status updated!'); },
    onError: (error) => { alert(error.response?.data?.message || 'Failed to update order status'); }
  });

  const deleteOrderMutation = useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => { queryClient.invalidateQueries(['allOrders']); alert('Order deleted!'); },
    onError: (error) => { alert(error.response?.data?.message || 'Failed to delete order'); }
  });

  const handleStatusChange = (orderId, field, value) => {
    updateStatusMutation.mutate({ orderId, statusData: { [field]: value } });
  };

  const handleDeleteOrder = (orderId) => {
    if (window.confirm('Delete this order? This action cannot be undone.')) {
      deleteOrderMutation.mutate(orderId);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.orderStatus === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  if (isLoading) return <BouncingDotsLoader />;

  if (error) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="border border-stone-800 p-10 text-center max-w-sm">
          <div className="text-red-400 text-4xl mb-4">⚠</div>
          <h2 className="text-stone-200 font-black text-lg mb-2">Failed to Load Orders</h2>
          <p className="text-stone-600 text-sm mb-6">{error.message}</p>
          <motion.button
            onClick={() => refetch()}
            className="px-5 py-3 bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-widest hover:bg-amber-300 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Retry
          </motion.button>
        </div>
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
          <div className="flex items-center gap-3">
            <motion.button
              className="p-2 text-stone-500 hover:text-stone-200 transition-colors border border-stone-800 hover:border-stone-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/seller/dashboard')}
            >
              <ArrowLeft size={16} />
            </motion.button>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-400 rounded-sm" />
                <span className="text-stone-100 font-black tracking-widest text-sm uppercase">Order Management</span>
              </div>
              <p className="text-stone-600 text-xs">{filteredOrders.length} orders found</p>
            </div>
          </div>
          <motion.button
            onClick={() => refetch()}
            className="p-2 text-stone-500 hover:text-amber-400 transition-colors border border-stone-800 hover:border-amber-400"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Refresh"
          >
            <RefreshCw size={14} />
          </motion.button>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Stats Row */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-stone-800 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {[
            { label: 'Total', count: orders.length, accent: false },
            { label: 'Pending', count: orders.filter(o => o.orderStatus === 'pending').length, accent: 'yellow' },
            { label: 'Processing', count: orders.filter(o => o.orderStatus === 'processing').length, accent: 'blue' },
            { label: 'Shipped', count: orders.filter(o => o.orderStatus === 'shipped').length, accent: 'amber' },
            { label: 'Delivered', count: orders.filter(o => o.orderStatus === 'delivered').length, accent: 'green' },
          ].map((s, i) => (
            <div key={i} className="bg-stone-950 p-4 text-center cursor-pointer hover:bg-stone-900 transition-colors"
              onClick={() => setStatusFilter(s.label === 'Total' ? 'all' : s.label.toLowerCase())}>
              <div className={`text-2xl font-black mb-0.5 ${
                s.accent === 'yellow' ? 'text-yellow-400' :
                s.accent === 'blue' ? 'text-blue-400' :
                s.accent === 'amber' ? 'text-amber-400' :
                s.accent === 'green' ? 'text-green-400' :
                'text-stone-100'
              }`}>{s.count}</div>
              <div className="text-stone-600 text-xs uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          className="border border-stone-800 p-5 mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600" size={14} />
              <input
                type="text"
                placeholder="Search orders or users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 py-2.5 pl-9 pr-4 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-400 transition-colors text-sm"
              />
            </div>

            {/* Order Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-stone-900 border border-stone-700 py-2.5 px-4 text-stone-200 focus:outline-none focus:border-amber-400 transition-colors text-sm appearance-none cursor-pointer"
            >
              <option value="all" className="bg-stone-900">All Order Statuses</option>
              <option value="pending" className="bg-stone-900">Pending</option>
              <option value="processing" className="bg-stone-900">Processing</option>
              <option value="shipped" className="bg-stone-900">Shipped</option>
              <option value="delivered" className="bg-stone-900">Delivered</option>
              <option value="cancelled" className="bg-stone-900">Cancelled</option>
            </select>

            {/* Payment Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-stone-900 border border-stone-700 py-2.5 px-4 text-stone-200 focus:outline-none focus:border-amber-400 transition-colors text-sm appearance-none cursor-pointer"
            >
              <option value="all" className="bg-stone-900">All Payment Statuses</option>
              <option value="pending" className="bg-stone-900">Payment Pending</option>
              <option value="completed" className="bg-stone-900">Payment Completed</option>
              <option value="failed" className="bg-stone-900">Payment Failed</option>
            </select>

            {/* Clear */}
            <motion.button
              onClick={() => { setSearchQuery(''); setStatusFilter('all'); setPaymentFilter('all'); }}
              className="border border-stone-700 text-stone-500 py-2.5 px-4 text-xs font-bold uppercase tracking-widest hover:border-stone-500 hover:text-stone-200 transition-all"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              Clear Filters
            </motion.button>
          </div>
        </motion.div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-stone-800">
            <Package className="mx-auto text-stone-700 mb-4" size={40} />
            <h3 className="text-stone-400 font-bold text-lg mb-2">No orders found</h3>
            <p className="text-stone-600 text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-0 border border-stone-800">
            {/* Table Header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 border-b border-stone-800 bg-stone-900/50">
              {['Order / Customer', 'Items', 'Amount', 'Order Status', 'Payment Status', 'Actions'].map((h) => (
                <div key={h} className={`text-stone-600 text-xs font-bold uppercase tracking-widest ${
                  h === 'Order / Customer' ? 'col-span-3' :
                  h === 'Items' ? 'col-span-1' :
                  h === 'Amount' ? 'col-span-1' :
                  h === 'Order Status' ? 'col-span-2' :
                  h === 'Payment Status' ? 'col-span-2' :
                  'col-span-3'
                }`}>{h}</div>
              ))}
            </div>

            <AnimatePresence>
              {filteredOrders.map((order, index) => {
                const StatusIcon = STATUS_ICONS[order.orderStatus] || Clock;
                return (
                  <motion.div
                    key={order._id}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 py-5 border-b border-stone-800 last:border-b-0 hover:bg-stone-900/30 transition-colors items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    {/* Order Info */}
                    <div className="lg:col-span-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-stone-100 font-black text-sm">#{order._id.slice(-8).toUpperCase()}</span>
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-stone-500 text-xs">
                          <User size={11} />
                          <span>{order.user?.fullName || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-stone-500 text-xs">
                          <Calendar size={11} />
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Items Count */}
                    <div className="lg:col-span-1">
                      <span className="text-stone-300 font-bold">{order.products.length}</span>
                      <div className="text-stone-600 text-xs truncate max-w-[80px]">
                        {order.products.slice(0, 1).map(i => i.product?.title).join(', ')}
                        {order.products.length > 1 && '...'}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="lg:col-span-1">
                      <span className="text-stone-100 font-black text-sm">₹{order.totalAmount}</span>
                    </div>

                    {/* Order Status Dropdown */}
                    <div className="lg:col-span-2">
                      <select
                        value={order.orderStatus}
                        onChange={(e) => handleStatusChange(order._id, 'orderStatus', e.target.value)}
                        disabled={updateStatusMutation.isLoading}
                        className={`w-full border py-1.5 px-2 text-xs font-bold uppercase tracking-wide focus:outline-none focus:border-amber-400 transition-colors appearance-none cursor-pointer ${STATUS_STYLES[order.orderStatus] || ''}`}
                        style={{ backgroundColor: 'transparent' }}
                      >
                        {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                          <option key={s} value={s} className="bg-stone-900 text-stone-200">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </div>

                    {/* Payment Status Dropdown */}
                    <div className="lg:col-span-2">
                      <select
                        value={order.paymentStatus}
                        onChange={(e) => handleStatusChange(order._id, 'paymentStatus', e.target.value)}
                        disabled={updateStatusMutation.isLoading}
                        className="w-full bg-stone-900 border border-stone-700 py-1.5 px-2 text-stone-300 text-xs focus:outline-none focus:border-amber-400 transition-colors appearance-none cursor-pointer"
                      >
                        {['pending', 'completed', 'failed'].map(s => (
                          <option key={s} value={s} className="bg-stone-900">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </div>

                    {/* Actions */}
                    <div className="lg:col-span-3 flex items-center gap-2">
                      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 border ${PAYMENT_STYLES[order.paymentStatus]} border-current border-opacity-30`}>
                        {order.paymentStatus}
                      </div>
                      <motion.button
                        onClick={() => handleDeleteOrder(order._id)}
                        disabled={deleteOrderMutation.isLoading}
                        className="p-2 border border-stone-800 text-stone-600 hover:border-red-500/50 hover:text-red-400 transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Delete Order"
                      >
                        <Trash2 size={13} />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
