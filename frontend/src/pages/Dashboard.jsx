import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Pie, Bar } from 'react-chartjs-2';
import { toast } from 'react-hot-toast';
import {
  Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend,
} from 'chart.js';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, AlertTriangle } from 'lucide-react';
import useAuthUser from '../hooks/useAuthUser';
import { getSellerStats, sendVerificationEmail } from '../lib/api';
import { errMsg, inr } from '../lib/errors';
import SellerNav from '../components/SellerNav';
import { BouncingDotsLoader } from '../components/Loading';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const PIE_COLORS = ['#d97706', '#b45309', '#92400e', '#78350f', '#f59e0b', '#451a03'];
const axisOpts = {
  ticks: { color: '#78716c' },
  grid: { color: '#292524' },
};

const STATUS_STYLE = {
  pending: 'text-yellow-400',
  processing: 'text-blue-400',
  shipped: 'text-amber-400',
  delivered: 'text-green-400',
  cancelled: 'text-red-400',
};

const Empty = ({ children }) => (
  <div className="h-48 flex items-center justify-center text-stone-600 text-sm text-center px-6">{children}</div>
);

export default function SellerDashboard() {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const [isSending, setIsSending] = useState(false);

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['sellerStats'],
    queryFn: getSellerStats,
  });

  const handleSendVerification = async () => {
    setIsSending(true);
    try {
      const res = await sendVerificationEmail();
      toast.success(res.message || 'Verification email sent!');
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
    } catch (err) {
      toast.error(errMsg(err, 'Failed to send verification email'));
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) return <BouncingDotsLoader />;

  if (error) {
    return (
      <div className="min-h-screen bg-stone-950">
        <SellerNav />
        <div className="max-w-md mx-auto mt-24 border border-red-500/20 bg-red-500/5 p-8 text-center">
          <div className="text-red-400 font-bold uppercase tracking-widest mb-2">Couldn't load analytics</div>
          <p className="text-stone-500 text-sm mb-5">{errMsg(error)}</p>
          <button onClick={() => refetch()} className="px-5 py-2.5 bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-widest">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const { totals, changes, dailyRevenue, categories, topProducts, statusCounts, lowStock, recentOrders } = stats;

  const trend = (value) =>
    changes.hasHistory ? { text: `${value >= 0 ? '↑' : '↓'} ${Math.abs(value)}% vs previous 30 days`, up: value >= 0 } : null;

  const statCards = [
    { label: 'Total Revenue', value: inr(totals.revenue), sub: trend(changes.revenue) },
    { label: 'Orders', value: totals.orders, sub: trend(changes.orders) },
    { label: 'Products Listed', value: totals.products },
    { label: 'Followers', value: totals.followers },
  ];

  const hasCategoryData = categories.length > 0;
  const hasSales = dailyRevenue.some((d) => d.amount > 0);

  const pieData = {
    labels: categories.map((c) => c.category),
    datasets: [{
      data: categories.map((c) => c.amount),
      backgroundColor: PIE_COLORS,
      borderWidth: 0,
    }],
  };

  const barData = {
    labels: dailyRevenue.map((d) =>
      new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })
    ),
    datasets: [{
      label: 'Revenue (₹)',
      data: dailyRevenue.map((d) => d.amount),
      backgroundColor: '#d97706',
      borderRadius: 0,
    }],
  };

  const location = [authUser?.city, authUser?.state].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-stone-950">
      <SellerNav />

      <div className="max-w-7xl mx-auto px-6 py-10">
        <motion.div
          className="mb-10 border-b border-stone-800 pb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-amber-400 text-xs tracking-[0.3em] uppercase font-medium block mb-2">Seller Dashboard</span>
          <h1 className="text-4xl font-black text-stone-100">Analytics Overview</h1>
          <p className="text-stone-600 mt-2 flex flex-wrap items-center gap-x-4">
            <span>Welcome back, {authUser?.fullName?.split(' ')[0] || 'Seller'}</span>
            {location ? (
              <span className="flex items-center gap-1 text-stone-500"><MapPin size={12} /> Selling from {location}</span>
            ) : (
              <Link to="/seller/products" className="flex items-center gap-1 text-amber-400 hover:text-amber-300">
                <MapPin size={12} /> Set your city so nearby buyers can find you →
              </Link>
            )}
          </p>
        </motion.div>

        {!authUser?.verified && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 border border-amber-400/30 bg-amber-400/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div>
              <div className="text-amber-400 font-bold text-sm uppercase tracking-widest mb-1">⚠ Email Unverified</div>
              <p className="text-stone-400 text-sm">Verify your email to get the verified badge buyers trust.</p>
            </div>
            <button
              onClick={handleSendVerification}
              disabled={isSending}
              className="px-5 py-2.5 bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-widest hover:bg-amber-300 transition-all flex-shrink-0 disabled:opacity-50"
            >
              {isSending ? 'Sending...' : 'Verify Now →'}
            </button>
          </motion.div>
        )}

        {/* Stat cards */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-stone-800 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-stone-950 p-6">
              <div className="text-stone-600 text-xs uppercase tracking-widest mb-2">{stat.label}</div>
              <div className="text-3xl font-black text-stone-100 mb-1">{stat.value}</div>
              {stat.sub && (
                <div className={`text-xs font-semibold ${stat.sub.up ? 'text-green-400' : 'text-red-400'}`}>{stat.sub.text}</div>
              )}
            </div>
          ))}
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-stone-800 bg-stone-900/20 p-8">
            <div className="mb-6 border-b border-stone-800 pb-4">
              <div className="text-stone-500 text-xs uppercase tracking-widest mb-1">Last 7 days</div>
              <h2 className="text-stone-100 font-black text-lg">Daily Revenue</h2>
            </div>
            {hasSales ? (
              <Bar
                data={barData}
                options={{ plugins: { legend: { display: false } }, scales: { x: axisOpts, y: { ...axisOpts, beginAtZero: true } } }}
              />
            ) : (
              <Empty>No sales in the last 7 days yet. Orders will show up here as they come in.</Empty>
            )}
          </div>

          <div className="border border-stone-800 bg-stone-900/20 p-8">
            <div className="mb-6 border-b border-stone-800 pb-4">
              <div className="text-stone-500 text-xs uppercase tracking-widest mb-1">Revenue by category</div>
              <h2 className="text-stone-100 font-black text-lg">Top Categories</h2>
            </div>
            {hasCategoryData ? (
              <div className="max-w-xs mx-auto">
                <Pie
                  data={pieData}
                  options={{ plugins: { legend: { position: 'bottom', labels: { color: '#a8a29e', boxWidth: 12, font: { size: 11 } } } } }}
                />
              </div>
            ) : (
              <Empty>Category breakdown appears after your first sale.</Empty>
            )}
          </div>
        </div>

        {/* Orders pipeline + top products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="border border-stone-800 bg-stone-900/20">
            <div className="px-8 py-5 border-b border-stone-800 flex items-center justify-between">
              <h2 className="text-stone-100 font-black text-lg">Recent Orders</h2>
              <Link to="/seller/orders" className="text-amber-400 text-xs uppercase tracking-widest font-bold hover:text-amber-300">View all →</Link>
            </div>
            {recentOrders.length === 0 ? (
              <Empty>No orders yet.</Empty>
            ) : (
              <div className="divide-y divide-stone-800">
                {recentOrders.map((o) => (
                  <div key={o._id} className="px-8 py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-stone-200 text-sm font-semibold truncate">{o.customer}</div>
                      <div className="text-stone-600 text-xs">{new Date(o.createdAt).toLocaleDateString('en-IN')}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-stone-100 font-black text-sm">{inr(o.total)}</div>
                      <div className={`text-xs uppercase tracking-widest font-bold ${STATUS_STYLE[o.status] || 'text-stone-500'}`}>{o.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-5 gap-px bg-stone-800 border-t border-stone-800">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="bg-stone-950 py-3 text-center">
                  <div className="text-stone-100 font-black">{count}</div>
                  <div className="text-stone-600 text-[10px] uppercase tracking-widest">{status}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="border border-stone-800 bg-stone-900/20">
              <div className="px-8 py-5 border-b border-stone-800">
                <h2 className="text-stone-100 font-black text-lg">Best Sellers</h2>
              </div>
              {topProducts.length === 0 ? (
                <Empty>Your best-selling products will appear here.</Empty>
              ) : (
                <div className="divide-y divide-stone-800">
                  {topProducts.map((p, i) => (
                    <div key={p.title + i} className="px-8 py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex items-center gap-3">
                        <span className="text-amber-400 font-black text-sm w-4">{i + 1}</span>
                        <span className="text-stone-200 text-sm truncate">{p.title.replace(/"/g, '').trim()}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-stone-100 font-bold text-sm">{inr(p.revenue)}</div>
                        <div className="text-stone-600 text-xs">{p.units} sold</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {lowStock.length > 0 && (
              <div className="border border-amber-400/30 bg-amber-400/5 p-6">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest mb-3">
                  <AlertTriangle size={14} /> Running low on stock
                </div>
                <ul className="space-y-2">
                  {lowStock.map((p) => (
                    <li key={p._id} className="flex items-center justify-between text-sm">
                      <span className="text-stone-300 truncate pr-4">{p.title.replace(/"/g, '').trim()}</span>
                      <span className={p.quantity === 0 ? 'text-red-400 font-bold' : 'text-stone-400'}>
                        {p.quantity === 0 ? 'Sold out' : `${p.quantity} left`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions - every one is a real route */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-px bg-stone-800">
          {[
            { label: 'Manage Products', desc: 'Add, edit, or remove your listings', href: '/seller/products' },
            { label: 'Manage Orders', desc: 'Update status for orders of your products', href: '/seller/orders' },
            { label: 'See Your Public Page', desc: 'How local buyers see your shop', href: `/seller/${authUser?._id}` },
          ].map((item) => (
            <Link key={item.label} to={item.href} className="bg-stone-950 p-6 group hover:bg-stone-900 transition-colors">
              <div className="text-stone-100 font-bold text-sm mb-1 group-hover:text-amber-400 transition-colors">{item.label}</div>
              <div className="text-stone-600 text-xs mb-3">{item.desc}</div>
              <div className="text-amber-400 text-sm font-bold group-hover:translate-x-1 transition-transform inline-block">→</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
