import React, { useEffect, useRef, useState } from 'react';
import { Menu, X, Home, ShoppingBag, ShoppingBasket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthUser from '../hooks/useAuthUser';

export default function ArtisanPremiumNavbar({ menuItems }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const { authUser, type } = useAuthUser();

  const menu = menuItems ?? [
    { label: 'Home', icon: <Home size={15} />, href: '/' },
    { label: 'Shop', icon: <ShoppingBag size={15} />, href: '/market' },
    { label: 'Cart', icon: <ShoppingBasket size={15} />, href: '/cart' },
  ];

  useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('keydown', onEsc);
    document.addEventListener('mousedown', onOutside);
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.removeEventListener('mousedown', onOutside);
    };
  }, []);

  return (
    <div ref={rootRef} className="fixed bottom-8 right-8 z-50 flex items-end gap-3">
      {/* Expanded menu — slides in from right */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex items-center gap-px bg-stone-800 border border-stone-700 shadow-2xl"
          >
            {menu.map((item, i) => (
              <motion.a
                key={i}
                href={item.href}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-2 px-5 py-3.5 bg-stone-950 text-stone-400 hover:text-amber-400 hover:bg-stone-900 transition-all text-xs font-bold uppercase tracking-widest border-r border-stone-800 last:border-r-0 group"
                onClick={() => setOpen(false)}
              >
                <span className="group-hover:scale-110 transition-transform">
                  {item.icon}
                </span>
                {item.label}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger button */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
        className={`w-14 h-14 flex items-center justify-center shadow-2xl transition-colors ${
          open
            ? 'bg-amber-400 text-stone-950 hover:bg-amber-300'
            : 'bg-stone-900 border border-stone-700 text-stone-300 hover:border-amber-400 hover:text-amber-400'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </motion.div>
      </motion.button>
    </div>
  );
}
