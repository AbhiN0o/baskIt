import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Star, MapPin, Users, Share2, Calendar, Instagram, Twitter, ArrowLeft } from 'lucide-react';

export default function SellerProfilePage() {
  const [following, setFollowing] = useState(false);

  const user = {
    name: "Amara Williams",
    avatar: "👩🏾‍🎨",
    location: "Cape Town, South Africa",
    joined: "March 2021",
    bio: "Painter. Dreamer. Storyteller. Each canvas tells a piece of my journey through light, color, and soul.",
    followers: 3400,
    following: 180,
    rating: 4.9,
    social: { instagram: "amarapaints", twitter: "amara_art" },
    skills: ["Painting", "Mixed Media", "Abstract Art", "Color Theory"],
    featuredWorks: [
      { id: 1, name: "Golden Horizon", image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=600&fit=crop", price: 349, sold: 14 },
      { id: 2, name: "Whispers of the Sea", image: "https://images.unsplash.com/photo-1542039364853-a64f9c9fb467?w=600&h=600&fit=crop", price: 499, sold: 8 },
      { id: 3, name: "Shadows & Light", image: "https://images.unsplash.com/photo-1550948390-6f1a9f2d5c72?w=600&h=600&fit=crop", price: 275, sold: 21 },
    ]
  };

  const stats = [
    { label: 'Followers', value: user.followers.toLocaleString(), icon: Users },
    { label: 'Rating', value: user.rating.toFixed(1), icon: Star },
    { label: 'Products', value: user.featuredWorks.length, icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen bg-stone-950">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-50 bg-stone-950/95 backdrop-blur-sm border-b border-stone-800"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              className="p-2 text-stone-500 hover:text-stone-200 border border-stone-800 hover:border-stone-600 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.history.back()}
            >
              <ArrowLeft size={16} />
            </motion.button>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-400 rounded-sm" />
              <span className="text-stone-100 font-black tracking-widest text-sm uppercase">BaskIt</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              className="p-2 text-stone-500 hover:text-stone-200 border border-stone-800 hover:border-stone-600 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Share2 size={16} />
            </motion.button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Profile Block */}
        <motion.div
          className="border border-stone-800 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Top strip */}
          <div className="h-1 bg-amber-400 w-full" />

          <div className="p-8">
            <div className="flex flex-col lg:flex-row items-start gap-8">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-stone-900 border border-stone-700 flex items-center justify-center text-5xl">
                  {user.avatar}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-stone-100 font-black text-2xl">{user.name}</h2>
                      <span className="text-amber-400 text-xs border border-amber-400/30 px-2 py-0.5 uppercase tracking-widest font-bold">Verified</span>
                    </div>
                    <div className="flex items-center gap-4 text-stone-600 text-sm">
                      <span className="flex items-center gap-1"><MapPin size={12} /> {user.location}</span>
                      <span className="flex items-center gap-1"><Calendar size={12} /> Since {user.joined}</span>
                    </div>
                  </div>

                  <motion.button
                    onClick={() => setFollowing(f => !f)}
                    className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest border transition-all flex-shrink-0 ${
                      following
                        ? 'border-amber-400 text-amber-400 bg-amber-400/10'
                        : 'border-stone-600 text-stone-300 hover:border-amber-400 hover:text-amber-400'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {following ? '✓ Following' : '+ Follow'}
                  </motion.button>
                </div>

                <p className="text-stone-400 text-sm leading-relaxed mb-5 max-w-lg">{user.bio}</p>

                {/* Social Links */}
                <div className="flex items-center gap-4">
                  <a href={`https://instagram.com/${user.social.instagram}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-stone-600 hover:text-pink-400 transition-colors text-xs font-medium">
                    <Instagram size={14} /> @{user.social.instagram}
                  </a>
                  <a href={`https://twitter.com/${user.social.twitter}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-stone-600 hover:text-sky-400 transition-colors text-xs font-medium">
                    <Twitter size={14} /> @{user.social.twitter}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-px bg-stone-800 border-t border-stone-800">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-stone-950 py-4 text-center">
                  <div className="text-stone-100 font-black text-xl mb-0.5">{stat.value}</div>
                  <div className="text-stone-600 text-xs uppercase tracking-widest flex items-center justify-center gap-1">
                    <Icon size={10} /> {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Skills */}
        <motion.div
          className="flex flex-wrap gap-2 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {user.skills.map((skill, i) => (
            <span
              key={i}
              className="px-4 py-2 border border-stone-800 text-stone-400 text-xs font-bold uppercase tracking-widest hover:border-amber-400/50 hover:text-amber-400 transition-colors cursor-default"
            >
              {skill}
            </span>
          ))}
        </motion.div>

        {/* Featured Works */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-amber-400 text-xs tracking-[0.3em] uppercase font-medium block mb-1">Portfolio</span>
              <h3 className="text-stone-100 font-black text-xl">Featured Works</h3>
            </div>
            <button className="text-stone-600 hover:text-amber-400 transition-colors text-xs uppercase tracking-widest font-bold">
              View All →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-stone-800">
            {user.featuredWorks.map((art, index) => (
              <motion.div
                key={art.id}
                className="bg-stone-950 group cursor-pointer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.05 * index + 0.3 }}
              >
                <div className="overflow-hidden" style={{ aspectRatio: '1/1' }}>
                  <motion.img
                    src={art.image}
                    alt={art.name}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.06 }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="p-5 border-t border-stone-800">
                  <h4 className="text-stone-100 font-bold text-base mb-1 group-hover:text-amber-400 transition-colors">{art.name}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-black text-lg">${art.price}</span>
                    <span className="text-stone-600 text-xs">{art.sold} sold</span>
                  </div>
                  <motion.button
                    className="mt-3 w-full py-2.5 border border-stone-700 text-stone-400 text-xs font-bold uppercase tracking-widest hover:border-amber-400 hover:text-amber-400 hover:bg-amber-400/5 transition-all"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    View Product
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
