import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, User as UserIcon, LogOut, ClipboardList, Heart, Search, Star, MapPin, Store } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getAllProducts, logout, addToCart, getCart } from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import useAuthUser from '../hooks/useAuthUser';
import useFavorites from '../hooks/useFavorites';
import { BouncingDotsLoader } from '../components/Loading';
import RegionSelect from '../components/RegionSelect';
import { errMsg, inr } from '../lib/errors';

const REGION_KEY = 'baskit_region';
const loadRegion = () => {
  try { return JSON.parse(localStorage.getItem(REGION_KEY)) || null; } catch { return null; }
};

export default function ArtisanMarketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const { authUser, type } = useAuthUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isFavorite, toggle: toggleFavorite } = useFavorites();

  // Region filter: remembered between visits, and defaults to the buyer's own
  // city the first time they land here.
  const [region, setRegion] = useState(() => loadRegion() || { state: '', city: '' });
  const [regionTouched, setRegionTouched] = useState(() => !!loadRegion());
  useEffect(() => {
    if (!regionTouched && type === 'user' && authUser?.state) {
      setRegion({ state: authUser.state, city: authUser.city || '' });
    }
  }, [authUser, type, regionTouched]);

  const changeRegion = (next) => {
    setRegion(next);
    setRegionTouched(true);
    try { localStorage.setItem(REGION_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
  };

  const { mutate: logoutMutation } = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
      navigate('/');
    },
  });
  const handleLogout = () => {
    logoutMutation(type === 'seller' ? 'seller' : 'user');
    setIsProfileOpen(false);
  };

  const profilePic = authUser?.profilePic || 'https://img.myloview.com/stickers/default-avatar-profile-icon-vector-social-media-user-photo-700-205577532.jpg';

  const { data: cart } = useQuery({ queryKey: ['cart'], queryFn: getCart, enabled: type === 'user' });
  const cartQuantity = (cart?.products || []).reduce((n, item) => n + (item?.quantity || 0), 0);

  const { data: products = [], isLoading: isProductLoading, error } = useQuery({
    queryKey: ['products', region.state, region.city, sort],
    queryFn: () => getAllProducts({ state: region.state, city: region.city, sort }),
  });

  const categories = (() => {
    const unique = [...new Set(products.map((p) => p.category))];
    const emojis = { electronics: '📱', jewelry: '💎', pottery: '🏺', textiles: '🧵', art: '🎨', wood: '🌳', clothing: '👕', books: '📚', home: '🏠', sports: '⚽' };
    return [
      { id: 'all', name: 'All', emoji: '✦' },
      ...unique.map((c) => ({ id: c, name: c.charAt(0).toUpperCase() + c.slice(1), emoji: emojis[c] || '🛍' })),
    ];
  })();

  const q = searchQuery.toLowerCase();
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(q) ||
      product.seller?.businessName?.toLowerCase().includes(q) ||
      product.tags.some((tag) => tag.toLowerCase().includes(q)) ||
      product.description.toLowerCase().includes(q);
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const { mutate: addToCartMutate } = useMutation({
    mutationFn: addToCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to cart');
    },
    onError: (e) => toast.error(errMsg(e, 'Failed to add to cart')),
  });

  const handleAddToCart = (productId) => {
    if (!authUser) { toast('Log in to add items to your cart'); navigate('/user/login'); return; }
    addToCartMutate({ productId, quantity: 1 });
  };

  const regionLabel = region.city
    ? `${region.city}, ${region.state}`
    : region.state
    ? region.state
    : 'all of India';

  if (isProductLoading && products.length === 0) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <BouncingDotsLoader />
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-400 text-xl">
        Error loading products. Please try again.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950">
      {/* NAV */}
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

          <div className="flex items-center gap-3">
            {type === 'user' && (
              <motion.div whileHover={{ scale: 1.02 }}>
                <Link to="/cart" className="flex items-center gap-2 px-3 py-2 border border-stone-700 text-stone-300 hover:border-amber-400 hover:text-amber-400 transition-all text-sm">
                  <ShoppingBag size={16} />
                  <span className="font-bold">{cartQuantity}</span>
                </Link>
              </motion.div>
            )}

            {type === 'seller' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                className="px-4 py-2 bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-widest hover:bg-amber-300 transition-all"
                onClick={() => navigate('/seller/dashboard')}
              >
                Seller Dashboard
              </motion.button>
            )}

            {authUser ? type === 'user' && (
              <div className="relative">
                <motion.img
                  src={profilePic}
                  alt="Profile"
                  className="w-9 h-9 object-cover cursor-pointer border border-stone-700 hover:border-amber-400 transition-all"
                  style={{ borderRadius: 0 }}
                  whileHover={{ scale: 1.05 }}
                  onMouseEnter={() => setIsProfileOpen(true)}
                  onMouseLeave={() => setIsProfileOpen(false)}
                />
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="absolute right-0 mt-1 w-44 bg-stone-900 border border-stone-700 shadow-xl z-50"
                      onMouseEnter={() => setIsProfileOpen(true)}
                      onMouseLeave={() => setIsProfileOpen(false)}
                    >
                      <Link to="/user" className="flex items-center gap-2 px-4 py-3 text-stone-300 hover:bg-stone-800 hover:text-amber-400 transition-all text-sm border-b border-stone-800">
                        <UserIcon size={14} /> Profile
                      </Link>
                      <Link to="/user?tab=orders" className="flex items-center gap-2 px-4 py-3 text-stone-300 hover:bg-stone-800 hover:text-amber-400 transition-all text-sm border-b border-stone-800">
                        <ClipboardList size={14} /> Orders
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-all text-sm"
                      >
                        <LogOut size={14} /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link to="/user/login" className="px-4 py-2 border border-stone-700 text-stone-400 text-sm hover:border-amber-400 hover:text-amber-400 transition-all">
                  Login
                </Link>
                <Link to="/user/signup" className="hidden sm:block px-4 py-2 bg-amber-400 text-stone-950 text-sm font-bold hover:bg-amber-300 transition-all">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.nav>

      <div className="max-w-7xl mx-auto px-6">
        {/* HERO */}
        <div className="py-14 border-b border-stone-800">
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, duration: 0.6 }}>
            <span className="text-amber-400 text-xs tracking-[0.3em] uppercase font-medium mb-4 block">✦ Local artisans, near you</span>
            <h1 className="text-5xl md:text-7xl font-black text-stone-100 leading-[0.9] tracking-tight mb-6">
              Made by hands<br />
              <span className="text-stone-600">in your region.</span>
            </h1>
            <p className="text-stone-500 max-w-xl mb-8 leading-relaxed">
              Meet the potters, weavers and makers in your own state and city. Buy local, keep the craft alive.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-4xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" size={18} />
                <input
                  type="text"
                  placeholder="Search products, artisans, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 py-3 pl-12 pr-4 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-400 transition-colors text-base"
                />
              </div>
              <RegionSelect compact anyLabel state={region.state} city={region.city} onChange={changeRegion} />
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
              <MapPin size={12} className="text-amber-400" />
              <span className="text-stone-500">Showing artisans in <span className="text-stone-200 font-semibold">{regionLabel}</span></span>
              {type === 'user' && authUser?.state && (
                <>
                  <button onClick={() => changeRegion({ state: authUser.state, city: authUser.city || '' })} className="px-2 py-1 border border-stone-700 text-stone-400 hover:border-amber-400 hover:text-amber-400 uppercase tracking-widest font-bold">My area</button>
                  <button onClick={() => changeRegion({ state: authUser.state, city: '' })} className="px-2 py-1 border border-stone-700 text-stone-400 hover:border-amber-400 hover:text-amber-400 uppercase tracking-widest font-bold">My state</button>
                </>
              )}
              {(region.state || region.city) && (
                <button onClick={() => changeRegion({ state: '', city: '' })} className="px-2 py-1 border border-stone-700 text-stone-400 hover:border-amber-400 hover:text-amber-400 uppercase tracking-widest font-bold">All India</button>
              )}
            </div>
          </motion.div>
        </div>

        {/* CATEGORY TABS */}
        <div className="py-6 border-b border-stone-800 flex gap-1 flex-wrap">
          {categories.map((category, i) => (
            <motion.button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 text-sm font-medium tracking-wide transition-all ${
                selectedCategory === category.id
                  ? 'bg-amber-400 text-stone-950'
                  : 'bg-stone-900 text-stone-400 border border-stone-700 hover:border-stone-500 hover:text-stone-200'
              }`}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <span className="mr-1">{category.emoji}</span>
              {category.name}
            </motion.button>
          ))}
        </div>

        {/* RESULTS COUNT + SORT */}
        <div className="py-4 flex items-center justify-between border-b border-stone-800/50 mb-8 gap-4">
          <span className="text-stone-600 text-sm">
            <span className="text-stone-300 font-semibold">{filteredProducts.length}</span> products from {regionLabel}
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort products"
            className="bg-stone-900 border border-stone-700 text-stone-300 text-xs px-3 py-2 focus:outline-none focus:border-amber-400"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="rating">Top rated</option>
          </select>
        </div>

        {/* PRODUCT GRID */}
        {filteredProducts.length === 0 ? (
          <motion.div className="text-center py-24" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Store className="mx-auto text-stone-700 mb-4" size={44} />
            <h3 className="text-stone-300 text-xl font-bold mb-2">
              {products.length === 0 && (region.state || region.city) ? `No artisans in ${regionLabel} yet` : 'No products found'}
            </h3>
            <p className="text-stone-600 mb-6">
              {products.length === 0 && (region.state || region.city)
                ? 'Try a wider area - or know a local maker? Invite them to join BaskIt.'
                : 'Try adjusting your search or category filters.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {region.city && (
                <button onClick={() => changeRegion({ state: region.state, city: '' })} className="px-5 py-2.5 border border-stone-700 text-stone-300 text-xs font-bold uppercase tracking-widest hover:border-amber-400 hover:text-amber-400">
                  Show all of {region.state}
                </button>
              )}
              {(region.state || region.city) && (
                <button onClick={() => changeRegion({ state: '', city: '' })} className="px-5 py-2.5 bg-amber-400 text-stone-950 text-xs font-bold uppercase tracking-widest hover:bg-amber-300">
                  Show all of India
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-stone-800" layout>
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product._id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.3 }}
                  className="bg-stone-950 group cursor-pointer"
                  onHoverStart={() => setHoveredProduct(product._id)}
                  onHoverEnd={() => setHoveredProduct(null)}
                  onClick={() => navigate(`/product/${product._id}`)}
                >
                  <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
                    <motion.img
                      src={product.images?.[0] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=600&fit=crop'}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.5 }}
                    />

                    {product.quantity === 0 && (
                      <div className="absolute top-3 left-3 bg-stone-950 text-stone-300 px-2 py-1 text-xs font-bold tracking-widest uppercase border border-stone-700">Out of Stock</div>
                    )}

                    {type !== 'seller' && (
                      <motion.button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(product._id); }}
                        className="absolute top-3 right-3 p-2 bg-stone-950/80 border border-stone-700 hover:border-amber-400 transition-all"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label={isFavorite(product._id) ? 'Remove from saved' : 'Save for later'}
                      >
                        <Heart size={14} className={isFavorite(product._id) ? 'fill-amber-400 text-amber-400' : 'text-stone-400'} />
                      </motion.button>
                    )}

                    <AnimatePresence>
                      {hoveredProduct === product._id && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-950/70 flex items-end p-4 pointer-events-none">
                          <div>
                            <p className="text-stone-200 text-sm leading-relaxed line-clamp-2">{product.description}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-stone-500">
                              <span>📦 {product.quantity} in stock</span>
                              {product.tags.length > 0 && <span>🏷 {product.tags.slice(0, 2).join(', ')}</span>}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="p-5 border-t border-stone-800">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-stone-100 font-bold text-base leading-tight truncate group-hover:text-amber-400 transition-colors">{product.title}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <Link
                            to={`/seller/${product.seller?._id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-stone-500 hover:text-amber-400 text-xs transition-colors truncate"
                          >
                            {product.seller?.businessName}
                          </Link>
                          {product.seller?.verified && <span className="text-amber-400 text-xs">✓</span>}
                        </div>
                        {(product.city || product.seller?.city) && (
                          <div className="flex items-center gap-1 mt-1 text-stone-600 text-xs">
                            <MapPin size={10} /> {product.city || product.seller?.city}, {product.state || product.seller?.state}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-3">
                        <div className="text-stone-100 font-black text-lg">{inr(product.price)}</div>
                        <div className="flex items-center gap-1 justify-end">
                          <Star className="fill-amber-400 text-amber-400" size={10} />
                          <span className="text-stone-500 text-xs">{product.rating > 0 ? product.rating : 'New'}</span>
                        </div>
                      </div>
                    </div>

                    {product.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {product.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="text-stone-600 text-xs px-2 py-0.5 border border-stone-800 bg-stone-900">{tag}</span>
                        ))}
                      </div>
                    )}

                    {type !== 'seller' && (
                      <motion.button
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(product._id); }}
                        className={`w-full py-2.5 text-xs font-bold tracking-widest uppercase transition-all ${
                          product.quantity > 0
                            ? 'bg-stone-900 text-stone-200 border border-stone-700 hover:bg-amber-400 hover:text-stone-950 hover:border-amber-400'
                            : 'bg-stone-900 text-stone-600 border border-stone-800 cursor-not-allowed'
                        }`}
                        whileHover={product.quantity > 0 ? { scale: 1.01 } : {}}
                        whileTap={product.quantity > 0 ? { scale: 0.98 } : {}}
                        disabled={product.quantity === 0}
                      >
                        {product.quantity > 0 ? '+ Add to Cart' : 'Out of Stock'}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        <div className="py-12" />
      </div>
    </div>
  );
}
