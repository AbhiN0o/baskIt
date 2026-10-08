import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logout } from '../lib/api';

const links = [
  { to: '/seller/dashboard', label: 'Dashboard' },
  { to: '/seller/products', label: 'Products' },
  { to: '/seller/orders', label: 'Orders' },
  { to: '/market', label: 'Marketplace' },
];

// One nav for every seller page, so every link goes somewhere real.
export default function SellerNav() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate: doLogout } = useMutation({
    mutationFn: () => logout('seller'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
      navigate('/');
    },
  });

  return (
    <nav className="sticky top-0 z-40 bg-stone-950/95 backdrop-blur-sm border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-5 h-5 bg-amber-400 rounded-sm" />
          <span className="text-stone-100 font-black tracking-widest text-sm uppercase">BaskIt</span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-xs sm:text-sm font-medium tracking-wide uppercase whitespace-nowrap transition-colors ${
                  isActive ? 'text-amber-400' : 'text-stone-400 hover:text-amber-400'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <button
            onClick={() => doLogout()}
            className="px-3 py-2 border border-stone-700 text-stone-400 text-xs font-medium hover:border-red-500/50 hover:text-red-400 transition-all uppercase tracking-widest"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
