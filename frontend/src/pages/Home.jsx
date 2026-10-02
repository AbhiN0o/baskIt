import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function ArtisanLanding() {
  const [mounted, setMounted] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const orb1X = useTransform(mouseX, [0, window?.innerWidth || 1920], [0, 15]);
  const orb1Y = useTransform(mouseY, [0, window?.innerHeight || 1080], [0, 15]);

  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { delayChildren: 0.2, staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', damping: 25, stiffness: 80 }
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-stone-950">
      {/* Subtle grain texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px'
        }}
      />

      {/* Architectural grid lines */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(to right, #f5f0e8 1px, transparent 1px), linear-gradient(to bottom, #f5f0e8 1px, transparent 1px)',
          backgroundSize: '80px 80px'
        }}
      />

      {/* Warm amber glow — subtle, off-center */}
      <motion.div
        className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(202,138,4,0.06) 0%, transparent 70%)',
          x: orb1X,
          y: orb1Y,
        }}
      />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(202,138,4,0.04) 0%, transparent 70%)' }}
      />

      {/* Top navigation bar */}
      <motion.header
        className="relative z-20 flex items-center justify-between px-8 md:px-16 py-6 border-b border-stone-800"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-amber-400 rounded-sm" />
          <span className="text-stone-100 font-bold tracking-widest text-sm uppercase">BaskIt</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-stone-500 text-sm tracking-wide">
          <span>Marketplace</span>
          <span>Sellers</span>
          <span>About</span>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            className="px-4 py-2 text-stone-400 text-sm border border-stone-700 hover:border-amber-400 hover:text-amber-400 transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/user/signup')}
          >
            Sign Up
          </motion.button>
        </div>
      </motion.header>

      {/* Main content */}
      <motion.div
        className="relative z-10 flex flex-col min-h-[calc(100vh-73px)]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero section */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Left column — large text */}
          <div className="lg:col-span-8 flex flex-col justify-center px-8 md:px-16 py-20 border-r border-stone-800">
            <motion.div variants={itemVariants} className="mb-4">
              <span className="text-amber-400 text-xs tracking-[0.3em] uppercase font-medium">
                Artisan Marketplace
              </span>
            </motion.div>

            <motion.h1
              className="text-6xl md:text-8xl lg:text-[7rem] font-black text-stone-100 leading-[0.9] tracking-tight mb-8"
              variants={itemVariants}
            >
              Where<br />
              <span className="text-transparent"
                style={{ WebkitTextStroke: '2px #d97706' }}
              >
                Authentic
              </span>
              <br />
              Meets the<br />
              World.
            </motion.h1>

            <motion.p
              className="text-stone-500 text-lg md:text-xl max-w-xl leading-relaxed mb-12 font-light"
              variants={itemVariants}
            >
              Connecting passionate creators with global audiences through trust, quality, and seamless discovery.
            </motion.p>

            <motion.div className="flex flex-col sm:flex-row gap-4" variants={itemVariants}>
              <motion.button
                className="group px-8 py-4 bg-amber-400 text-stone-950 font-bold text-sm tracking-widest uppercase flex items-center gap-3 hover:bg-amber-300 transition-all duration-200"
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/user/signup')}
              >
                <span>🛍</span>
                Shop Authentic
                <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
              </motion.button>

              <motion.button
                className="group px-8 py-4 border border-stone-600 text-stone-300 font-bold text-sm tracking-widest uppercase flex items-center gap-3 hover:border-stone-400 hover:text-stone-100 transition-all duration-200"
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/seller/signup')}
              >
                <span>✦</span>
                List as Seller
                <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
              </motion.button>
            </motion.div>
          </div>

          {/* Right column — decorative stats panel */}
          <div className="lg:col-span-4 flex flex-col border-t border-stone-800 lg:border-t-0">
            {/* Stat blocks stacked vertically */}
            {[
              { num: '12K+', label: 'Artisan Sellers', sub: 'Verified & trusted' },
              { num: '84K+', label: 'Unique Products', sub: 'Handcrafted pieces' },
              { num: '190+', label: 'Countries Served', sub: 'Global reach' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                className="flex-1 flex flex-col justify-center px-10 py-8 border-b border-stone-800 last:border-b-0"
                variants={itemVariants}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-4xl font-black text-stone-100 mb-1">{stat.num}</div>
                <div className="text-amber-400 text-sm font-semibold tracking-wide mb-1">{stat.label}</div>
                <div className="text-stone-600 text-xs">{stat.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <motion.div
          className="border-t border-stone-800 px-8 md:px-16 py-5 flex items-center justify-between"
          variants={itemVariants}
        >
          <div className="flex items-center gap-6">
            {['Handcrafted', 'Verified Sellers', 'Secure Payments', 'Global Shipping'].map((tag) => (
              <span key={tag} className="text-stone-600 text-xs tracking-wider hidden md:block">
                ✦ {tag}
              </span>
            ))}
          </div>
          <div className="text-stone-700 text-xs tracking-widest uppercase">
            © 2025 BaskIt
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
