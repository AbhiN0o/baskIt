import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Pie, Bar } from 'react-chartjs-2';
import { toast } from 'react-hot-toast';
import {
  Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend,
} from 'chart.js';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import useAuthUser from '../hooks/useAuthUser';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logout, sendVerificationEmail } from '../lib/api';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const chartDefaults = {
  plugins: {
    legend: { labels: { color: '#a8a29e', font: { size: 11 } } }
  },
  scales: {
    x: { ticks: { color: '#78716c' }, grid: { color: '#292524' } },
    y: { ticks: { color: '#78716c' }, grid: { color: '#292524' } }
  }
};

export default function SellerDashboard() {
  const { authUser } = useAuthUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSending, setIsSending] = useState(false);

  const { mutate: logoutMutation } = useMutation({
    mutationFn: logout,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['authUser'] }); navigate('/'); },
  });
  const handleLogout = () => logoutMutation('seller');

  const topCategories = [
    { category: 'Handicrafts', totalSales: 1200 },
    { category: 'Jewelry', totalSales: 950 },
    { category: 'Apparel', totalSales: 800 },
    { category: 'Home Decor', totalSales: 700 },
    { category: 'Art Supplies', totalSales: 500 },
  ];
  const topSellers = [
    { seller: 'Crafty Co.', totalSales: 1500 },
    { seller: 'Artisan Hub', totalSales: 1300 },
    { seller: 'Handmade Wonders', totalSales: 1100 },
    { seller: 'Creative Souls', totalSales: 900 },
    { seller: 'Unique Crafts', totalSales: 800 },
  ];

  const pieData = {
    labels: topCategories.map(c => c.category),
    datasets: [{
      label: 'Total Sales',
      data: topCategories.map(c => c.totalSales),
      backgroundColor: ['#d97706', '#b45309', '#92400e', '#78350f', '#451a03'],
      borderWidth: 0,
    }],
  };

  const barData = {
    labels: topSellers.map(s => s.seller),
    datasets: [{
      label: 'Total Sales ($)',
      data: topSellers.map(s => s.totalSales),
      backgroundColor: '#d97706',
      borderRadius: 0,
    }],
  };

  const handleSendVerification = async () => {
    setIsSending(true);
    try {
      const res = await sendVerificationEmail();
      toast.success(res.message || 'Verification email sent!');
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send verification email');
    } finally {
      setIsSending(false);
    }
  };

  const statCards = [
    { label: 'Total Revenue', value: '$12,540', change: '+8.2%', up: true },
    { label: 'Total Orders', value: '284', change: '+12.1%', up: true },
    { label: 'Products', value: '47', change: '+3', up: true },
    { label: 'Followers', value: '1,289', change: '+24', up: true },
  ];

  return (
    <div className="min-h-screen bg-stone-950">
      {/* Nav */}
      <motion.nav
        className="sticky top-0 z-50 bg-stone-950/95 backdrop-blur-sm border-b border-stone-800"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-5 h-5 bg-amber-400 rounded-sm" />
            <span className="text-stone-100 font-black tracking-widest text-sm uppercase">BaskIt</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/seller/dashboard" className="text-stone-400 hover:text-amber-400 transition-colors text-sm font-medium tracking-wide uppercase">
              Dashboard
            </Link>
            <Link to="/sellermarket" className="text-stone-400 hover:text-amber-400 transition-colors text-sm font-medium tracking-wide uppercase">
              My Products
            </Link>
            <motion.button
              onClick={handleLogout}
              className="px-4 py-2 border border-stone-700 text-stone-400 text-sm font-medium hover:border-red-500/50 hover:text-red-400 transition-all uppercase tracking-widest"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Logout
            </motion.button>
          </div>
        </div>
      </motion.nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Page Header */}
        <motion.div
          className="mb-10 border-b border-stone-800 pb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-amber-400 text-xs tracking-[0.3em] uppercase font-medium block mb-2">Seller Dashboard</span>
          <h1 className="text-4xl font-black text-stone-100">Analytics Overview</h1>
          <p className="text-stone-600 mt-2">Welcome back, {authUser?.fullName?.split(' ')[0] || 'Seller'}</p>
        </motion.div>

        {/* Verify Banner */}
        {!authUser?.verified && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 border border-amber-400/30 bg-amber-400/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div>
              <div className="text-amber-400 font-bold text-sm uppercase tracking-widest mb-1">⚠ Email Unverified</div>
              <p className="text-stone-400 text-sm">Verify your email to unlock full seller features and get your verified badge.</p>
            </div>
            <motion.button
              onClick={handleSendVerification}
              disabled={isSending}
              className="px-5 py-2.5 bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-widest hover:bg-amber-300 transition-all flex-shrink-0"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSending ? 'Sending...' : 'Verify Now →'}
            </motion.button>
          </motion.div>
        )}

        {/* Stats Row */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-stone-800 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          {statCards.map((stat, i) => (
            <div key={i} className="bg-stone-950 p-6">
              <div className="text-stone-600 text-xs uppercase tracking-widest mb-2">{stat.label}</div>
              <div className="text-3xl font-black text-stone-100 mb-1">{stat.value}</div>
              <div className={`text-xs font-semibold ${stat.up ? 'text-green-400' : 'text-red-400'}`}>
                {stat.up ? '↑' : '↓'} {stat.change} this month
              </div>
            </div>
          ))}
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            className="border border-stone-800 bg-stone-900/20 p-8"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="mb-6 border-b border-stone-800 pb-4">
              <div className="text-stone-500 text-xs uppercase tracking-widest mb-1">Distribution</div>
              <h2 className="text-stone-100 font-black text-lg">Top 5 Categories</h2>
            </div>
            <div className="max-w-xs mx-auto">
              <Pie
                data={pieData}
                options={{
                  plugins: { legend: { position: 'bottom', labels: { color: '#a8a29e', boxWidth: 12, font: { size: 11 } } } }
                }}
              />
            </div>
          </motion.div>

          <motion.div
            className="border border-stone-800 bg-stone-900/20 p-8"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="mb-6 border-b border-stone-800 pb-4">
              <div className="text-stone-500 text-xs uppercase tracking-widest mb-1">Performance</div>
              <h2 className="text-stone-100 font-black text-lg">Highest Sellers</h2>
            </div>
            <Bar
              data={barData}
              options={{
                ...chartDefaults,
                plugins: { legend: { display: false } }
              }}
            />
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-px bg-stone-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {[
            { label: 'Manage Products', desc: 'Add, edit, or remove your listings', href: '/sellermarket', action: '→' },
            { label: 'View Orders', desc: 'Track and manage your orders', href: '/admin/orders', action: '→' },
            { label: 'Edit Profile', desc: 'Update your seller information', href: '/seller/profile', action: '→' },
          ].map((item, i) => (
            <Link
              key={i}
              to={item.href}
              className="bg-stone-950 p-6 group hover:bg-stone-900 transition-colors"
            >
              <div className="text-stone-100 font-bold text-sm mb-1 group-hover:text-amber-400 transition-colors">{item.label}</div>
              <div className="text-stone-600 text-xs mb-3">{item.desc}</div>
              <div className="text-amber-400 text-sm font-bold group-hover:translate-x-1 transition-transform inline-block">{item.action}</div>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
