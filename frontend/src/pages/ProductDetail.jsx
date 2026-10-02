import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Star, ShoppingBag, MapPin, Clock, Palette,
  Shield, Truck, ArrowLeft, Share2, ChevronLeft, ChevronRight,
  Send, Trash2, MessageCircle, TrendingUp, Loader
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProduct, getProductReviews, createReview, deleteReview,
  getProductReviewsSummary, generateProductDetails, generateCareGuide, addToCart
} from '../lib/api';
import { useNavigate, useParams } from 'react-router-dom';
import useAuthUser from '../hooks/useAuthUser.js';
import { axiosInstance } from '../lib/axios.js';
import { BouncingDotsLoader } from '../components/Loading.jsx';

export default function ProductDetailPage() {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('story');
  const [mounted, setMounted] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  const { isLoading: authUserLoading, authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const navigate = useNavigate();

  const toggleFollow = async () => {
    if (!authUser) { alert('Please login first'); return; }
    try {
      setLoadingFollow(true);
      if (isFollowing) {
        await axiosInstance.post(`/user/${data.seller._id}/unfollow`);
        setIsFollowing(false);
      } else {
        await axiosInstance.post(`/user/${data.seller._id}/follow`);
        setIsFollowing(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to follow/unfollow');
    } finally {
      setLoadingFollow(false);
    }
  };

  let change = true;
  const [quantityCart, setQC] = useState('-');
  useEffect(() => {
    const getQuantity = async () => {
      let temp = 0;
      const res = await axiosInstance.get('/cart');
      res.data.products.map((item) => { temp += item?.quantity; });
      setQC(temp);
    };
    getQuantity();
  }, [change]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading, error } = useQuery({ queryKey: ['product', id], queryFn: () => getProduct(id), enabled: !!id });
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({ queryKey: ['productReviews', id], queryFn: () => getProductReviews(id), enabled: !!id });
  const { data: reviewsSummary } = useQuery({ queryKey: ['productReviewsSummary', id], queryFn: () => getProductReviewsSummary(id), enabled: !!id && reviewsData && reviewsData.length > 0 });
  const { data: aiDetails, isLoading: detailsLoading } = useQuery({ queryKey: ['productDetails', id], queryFn: () => generateProductDetails(data), enabled: !!data && activeTab === 'details', staleTime: 24 * 60 * 60 * 1000 });
  const { data: aiCareGuide, isLoading: careGuideLoading } = useQuery({ queryKey: ['productCareGuide', id], queryFn: () => generateCareGuide(data), enabled: !!data && activeTab === 'care', staleTime: 24 * 60 * 60 * 1000 });

  const createReviewMutation = useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      queryClient.invalidateQueries(['productReviews', id]);
      queryClient.invalidateQueries(['product', id]);
      setShowReviewForm(false);
      setReviewForm({ rating: 5, comment: '' });
    },
    onError: (error) => { alert(error.message); }
  });

  const deleteReviewMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries(['productReviews', id]);
      queryClient.invalidateQueries(['product', id]);
    },
    onError: (error) => { alert(error.message); }
  });

  const addToCartMutation = useMutation({
    mutationFn: ({ productId, quantity }) => addToCart({ productId, quantity }),
    onSuccess: () => { alert('Product added to cart successfully!'); queryClient.invalidateQueries(['cart']); },
    onError: (error) => { alert(error.message || 'Failed to add product to cart'); }
  });

  const product = data ? {
    id: data._id,
    name: data.title?.replace(/"/g, '').trim() || 'Untitled Product',
    price: data.price || 0,
    originalPrice: null,
    rating: data.rating || 0,
    totalReviews: data.totalReviews || 0,
    inStock: data.quantity || 0,
    images: data.images && data.images.length > 0 ? data.images : ['https://via.placeholder.com/800x800'],
    category: data.category?.replace(/"/g, '').trim() || 'Uncategorized',
    artisan: {
      name: data.seller?.businessName?.trim() || 'Unknown Artisan',
      avatar: '🛍',
      location: 'Global',
      experience: '',
      speciality: data.tags ? data.tags.join(', ') : '',
      story: data.description?.replace(/"/g, '').trim() || 'No story available',
      totalProducts: 0,
      followers: 0,
      rating: data.rating || 0
    },
    description: data.description?.replace(/"/g, '').trim() || 'No description available',
    story: data.description?.replace(/"/g, '').trim() || 'No story available',
    details: aiDetails || {
      material: data.tags ? data.tags.join(', ') : 'Various materials',
      dimensions: 'Standard size',
      weight: 'Lightweight',
      careInstructions: 'Handle with care',
      origin: 'Handcrafted',
      craftTime: 'Made to order',
      uniqueFeatures: data.tags || []
    },
    sustainability: {
      ecofriendly: data.isActive,
      fairTrade: data.seller?.verified || false,
      carbonNeutral: false,
      packaging: aiDetails?.packaging || 'Eco-friendly packaging'
    }
  } : null;

  const reviews = reviewsData || [];

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!reviewForm.rating) { alert('Please select a rating'); return; }
    createReviewMutation.mutate({ productId: id, rating: reviewForm.rating, comment: reviewForm.comment });
  };

  const handleDeleteReview = (reviewId) => {
    if (window.confirm('Delete this review?')) deleteReviewMutation.mutate(reviewId);
  };

  const handleAddToCart = () => {
    if (!authUser) { alert('Please login to add items to cart'); return; }
    addToCartMutation.mutate({ productId: id, quantity });
  };

  const nextImage = () => setSelectedImageIndex((p) => (p + 1) % product.images.length);
  const prevImage = () => setSelectedImageIndex((p) => (p - 1 + product.images.length) % product.images.length);

  if (!mounted || isLoading) return <BouncingDotsLoader />;
  if (error || !product) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-400 text-xl">
        Error loading product: {error?.message || 'Product not found'}
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
          <div className="flex items-center gap-4">
            <motion.button
              className="p-2 text-stone-500 hover:text-stone-200 transition-colors border border-stone-800 hover:border-stone-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.history.back()}
            >
              <ArrowLeft size={16} />
            </motion.button>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-400 rounded-sm" />
                <span className="text-stone-100 font-black tracking-widest text-sm uppercase">BaskIt</span>
              </div>
              <p className="text-stone-600 text-xs">Product Details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              className="p-2 text-stone-500 hover:text-stone-200 transition-colors border border-stone-800 hover:border-stone-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Share2 size={16} />
            </motion.button>
            <motion.button
              className="relative p-2 bg-amber-400 text-stone-950 hover:bg-amber-300 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/cart')}
            >
              <ShoppingBag size={16} />
              <span className="absolute -top-1 -right-1 bg-stone-950 border border-stone-700 text-stone-200 text-xs w-4 h-4 flex items-center justify-center font-bold">{quantityCart}</span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Image Gallery */}
          <motion.div className="space-y-3" initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
            <div className="relative overflow-hidden border border-stone-800" style={{ aspectRatio: '1/1' }}>
              <motion.img
                key={selectedImageIndex}
                src={product.images[selectedImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
                initial={{ scale: 1.05, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
              />
              {product.images.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-stone-950/80 border border-stone-700 text-stone-300 hover:text-amber-400 hover:border-amber-400 transition-all">
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-stone-950/80 border border-stone-700 text-stone-300 hover:text-amber-400 hover:border-amber-400 transition-all">
                    <ChevronRight size={18} />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-stone-950/80 border border-stone-700 px-3 py-1">
                    <span className="text-stone-400 text-xs">{selectedImageIndex + 1} / {product.images.length}</span>
                  </div>
                </>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((image, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square overflow-hidden border-2 transition-all ${selectedImageIndex === index ? 'border-amber-400' : 'border-stone-800 hover:border-stone-600'}`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <img src={image} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div className="space-y-6" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.1 }}>
            {/* Category & Stock */}
            <div className="flex items-center justify-between">
              <span className="text-amber-400 text-xs font-bold uppercase tracking-widest border border-amber-400/30 px-3 py-1">
                {product.category}
              </span>
              <span className={`text-xs flex items-center gap-1 ${product.inStock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${product.inStock > 0 ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
                {product.inStock > 0 ? `${product.inStock} in stock` : 'Out of stock'}
              </span>
            </div>

            {/* Name & Rating */}
            <div>
              <h1 className="text-4xl font-black text-stone-100 leading-tight mb-3">{product.name}</h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className={i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-stone-700'} />
                  ))}
                </div>
                <span className="text-stone-400 text-sm">{product.rating.toFixed(1)}</span>
                <span className="text-stone-600 text-sm">({product.totalReviews} reviews)</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 border-y border-stone-800 py-4">
              <span className="text-5xl font-black text-stone-100">₹{product.price}</span>
              {product.originalPrice && (
                <span className="text-2xl text-stone-600 line-through">${product.originalPrice}</span>
              )}
            </div>

            {/* Description */}
            <p className="text-stone-400 leading-relaxed">{product.description}</p>

            {/* Quick Details */}
            <div className="grid grid-cols-2 gap-2">
              <div className="border border-stone-800 p-3 flex items-center gap-2">
                <Clock className="text-amber-400" size={16} />
                <div>
                  <p className="text-stone-600 text-xs uppercase tracking-widest">Craft Time</p>
                  <p className="text-stone-200 text-sm font-semibold">{product.details.craftTime}</p>
                </div>
              </div>
              <div className="border border-stone-800 p-3 flex items-center gap-2">
                <Palette className="text-amber-400" size={16} />
                <div>
                  <p className="text-stone-600 text-xs uppercase tracking-widest">Material</p>
                  <p className="text-stone-200 text-sm font-semibold truncate">{product.details.material}</p>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex gap-2 flex-wrap">
              {product.sustainability.ecofriendly && (
                <span className="flex items-center gap-1 px-3 py-1 border border-green-500/30 text-green-400 text-xs">
                  🌱 Eco-Friendly
                </span>
              )}
              {product.sustainability.fairTrade && (
                <span className="flex items-center gap-1 px-3 py-1 border border-blue-500/30 text-blue-400 text-xs">
                  🤝 Fair Trade
                </span>
              )}
            </div>

            {/* Quantity & Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-stone-400 text-sm uppercase tracking-widest">Qty:</span>
                <div className="flex items-center border border-stone-700">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-all text-lg font-bold">-</button>
                  <span className="px-5 py-2 text-stone-100 font-black border-x border-stone-700">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.inStock, quantity + 1))} className="px-4 py-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-all text-lg font-bold" disabled={quantity >= product.inStock}>+</button>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  onClick={handleAddToCart}
                  disabled={product.inStock === 0 || addToCartMutation.isLoading}
                  className={`flex-1 font-black py-4 uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all ${
                    product.inStock > 0 && !addToCartMutation.isLoading
                      ? 'bg-amber-400 text-stone-950 hover:bg-amber-300'
                      : 'bg-stone-800 text-stone-600 cursor-not-allowed'
                  }`}
                  whileHover={product.inStock > 0 && !addToCartMutation.isLoading ? { scale: 1.01 } : {}}
                  whileTap={product.inStock > 0 && !addToCartMutation.isLoading ? { scale: 0.98 } : {}}
                >
                  {addToCartMutation.isLoading ? (
                    <><Loader className="animate-spin" size={16} /> Adding...</>
                  ) : product.inStock > 0 ? `Add to Cart — ₹${(product.price * quantity).toFixed(2)}` : 'Out of Stock'}
                </motion.button>
                <motion.button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`p-4 border-2 transition-all ${isFavorite ? 'border-amber-400 text-amber-400' : 'border-stone-700 text-stone-500 hover:border-stone-500'}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Heart size={20} className={isFavorite ? 'fill-current' : ''} />
                </motion.button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center gap-6 pt-4 border-t border-stone-800">
              <div className="flex items-center gap-2 text-stone-500 text-xs">
                <Shield size={14} className="text-green-400" />
                <span>Authenticity Guaranteed</span>
              </div>
              <div className="flex items-center gap-2 text-stone-500 text-xs">
                <Truck size={14} className="text-blue-400" />
                <span>Free Worldwide Shipping</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Artisan Section */}
        <motion.section className="mb-12" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="border border-stone-800 bg-stone-900/20">
            <div className="px-8 py-5 border-b border-stone-800">
              <h2 className="text-stone-200 font-black uppercase tracking-widest text-sm">Meet the Artisan</h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center md:text-left">
                <div className="w-20 h-20 bg-stone-800 border border-stone-700 flex items-center justify-center text-4xl mb-4 mx-auto md:mx-0">{product.artisan.avatar}</div>
                <h3 className="text-stone-100 font-black text-lg mb-1">{product.artisan.name}</h3>
                <p className="text-stone-600 flex items-center gap-1 justify-center md:justify-start text-sm mb-2">
                  <MapPin size={12} /> {product.artisan.location}
                </p>
                <div className="flex items-center gap-1 justify-center md:justify-start mb-4">
                  <Star className="fill-amber-400 text-amber-400" size={12} />
                  <span className="text-stone-400 text-sm">{product.artisan.rating.toFixed(1)}</span>
                </div>
                <motion.button
                  onClick={toggleFollow}
                  disabled={loadingFollow}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-all ${
                    isFollowing
                      ? 'border-amber-400 text-amber-400 bg-amber-400/10'
                      : 'border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {loadingFollow ? '...' : isFollowing ? '✓ Following' : '+ Follow'}
                </motion.button>
              </div>
              <div className="md:col-span-2 space-y-4">
                <div>
                  <h4 className="text-stone-500 text-xs uppercase tracking-widest mb-2">Story</h4>
                  <p className="text-stone-400 leading-relaxed">{product.artisan.story}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-stone-800 pt-4">
                  <div>
                    <p className="text-stone-600 text-xs uppercase tracking-widest mb-1">Experience</p>
                    <p className="text-stone-200 font-semibold">{product.artisan.experience || 'Experienced craftsperson'}</p>
                  </div>
                  <div>
                    <p className="text-stone-600 text-xs uppercase tracking-widest mb-1">Specialty</p>
                    <p className="text-stone-200 font-semibold">{product.artisan.speciality || 'Quality crafts'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Detail Tabs */}
        <motion.section className="mb-12" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
          <div className="border border-stone-800">
            {/* Tab Headers */}
            <div className="flex border-b border-stone-800">
              {[
                { id: 'story', label: 'Craft Story' },
                { id: 'details', label: 'Specifications' },
                { id: 'care', label: 'Care Guide' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-amber-400 text-stone-950'
                      : 'text-stone-500 hover:text-stone-300 hover:bg-stone-900'
                  }`}
                >
                  {tab.label}
                  {((tab.id === 'details' && detailsLoading) || (tab.id === 'care' && careGuideLoading)) && (
                    <Loader className="animate-spin" size={12} />
                  )}
                </button>
              ))}
            </div>

            <div className="p-8">
              <AnimatePresence mode="wait">
                {activeTab === 'story' && (
                  <motion.div key="story" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <p className="text-stone-400 leading-relaxed text-lg mb-6">{product.story}</p>
                    {product.details.uniqueFeatures?.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {product.details.uniqueFeatures.map((feature, i) => (
                          <div key={i} className="border border-stone-800 p-3 flex items-center gap-2">
                            <span className="text-amber-400">✦</span>
                            <span className="text-stone-400 text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'details' && (
                  <motion.div key="details" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    {detailsLoading ? (
                      <div className="text-stone-600 text-sm">Generating specifications...</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-stone-800">
                        {[
                          ['Material', product.details.material],
                          ['Dimensions', product.details.dimensions],
                          ['Weight', product.details.weight],
                          ['Origin', product.details.origin],
                          ['Craft Time', product.details.craftTime],
                          ['Packaging', product.sustainability.packaging],
                        ].map(([key, val], i) => (
                          <div key={i} className="flex border-b border-r border-stone-800 last:border-b-0">
                            <span className="text-stone-600 text-xs uppercase tracking-widest px-4 py-3 w-32 flex-shrink-0 border-r border-stone-800">{key}</span>
                            <span className="text-stone-300 text-sm px-4 py-3">{val}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'care' && (
                  <motion.div key="care" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    {careGuideLoading ? (
                      <div className="text-stone-600 text-sm">Generating care instructions...</div>
                    ) : aiCareGuide ? (
                      <div className="space-y-3">
                        <p className="text-stone-400 leading-relaxed mb-4">{aiCareGuide.generalCare}</p>
                        {[
                          { icon: '💧', data: aiCareGuide.cleaning },
                          { icon: '📦', data: aiCareGuide.storage },
                          { icon: '🔧', data: aiCareGuide.maintenance },
                        ].map(({ icon, data }, i) => (
                          <div key={i} className="border border-stone-800 p-4 flex items-start gap-3">
                            <span className="text-xl">{icon}</span>
                            <div>
                              <h4 className="text-stone-200 font-bold text-sm mb-1">{data?.title}</h4>
                              <p className="text-stone-500 text-sm">{data?.description}</p>
                            </div>
                          </div>
                        ))}
                        <div className="border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3">
                          <span className="text-xl">⚠️</span>
                          <div>
                            <h4 className="text-red-400 font-bold text-sm mb-1">{aiCareGuide.warnings?.title}</h4>
                            <p className="text-red-400/70 text-sm">{aiCareGuide.warnings?.description}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {[{ icon: '💧', title: 'Gentle Cleaning', desc: 'Use mild detergents and avoid harsh chemicals' }, { icon: '🌡️', title: 'Temperature Care', desc: 'Store in moderate temperature, avoid extreme conditions' }, { icon: '📦', title: 'Storage', desc: 'Keep in original packaging when not in use' }].map((c, i) => (
                          <div key={i} className="border border-stone-800 p-4 flex items-start gap-3">
                            <span className="text-xl">{c.icon}</span>
                            <div>
                              <h4 className="text-stone-200 font-bold text-sm mb-1">{c.title}</h4>
                              <p className="text-stone-500 text-sm">{c.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.section>

        {/* Reviews */}
        <motion.section className="mb-16" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
          <div className="border border-stone-800">
            <div className="px-8 py-5 border-b border-stone-800 flex items-center justify-between">
              <h2 className="text-stone-200 font-black uppercase tracking-widest text-sm flex items-center gap-2">
                <MessageCircle size={16} className="text-amber-400" />
                Reviews <span className="text-amber-400">({reviews.length})</span>
              </h2>
              {authUser && (
                <motion.button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="px-4 py-2 bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-widest hover:bg-amber-300 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {showReviewForm ? 'Cancel' : 'Write Review'}
                </motion.button>
              )}
            </div>

            {/* AI Summary */}
            {reviewsSummary && (
              <div className="mx-8 my-5 border border-amber-400/20 bg-amber-400/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="text-amber-400" size={14} />
                  <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">AI Summary</span>
                </div>
                <p className="text-stone-400 text-sm">{reviewsSummary.summary}</p>
              </div>
            )}

            {/* Review Form */}
            <AnimatePresence>
              {showReviewForm && authUser && (
                <motion.form
                  onSubmit={handleSubmitReview}
                  className="mx-8 my-5 border border-stone-700 p-6"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <h3 className="text-stone-200 font-bold uppercase tracking-widest text-xs mb-4">Your Review</h3>
                  <div className="mb-4">
                    <label className="text-stone-600 text-xs uppercase tracking-widest block mb-2">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button key={star} type="button" onClick={() => setReviewForm(p => ({ ...p, rating: star }))} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-1">
                          <Star size={22} className={star <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-700 hover:text-amber-400'} />
                        </motion.button>
                      ))}
                      <span className="ml-2 text-stone-500 self-center text-sm">{reviewForm.rating} star{reviewForm.rating !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="text-stone-600 text-xs uppercase tracking-widest block mb-2">Comment (Optional)</label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                      placeholder="Share your experience..."
                      className="w-full bg-stone-900 border border-stone-700 px-4 py-3 text-stone-200 placeholder-stone-700 focus:outline-none focus:border-amber-400 transition-colors text-sm resize-none"
                      rows={4}
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={createReviewMutation.isLoading}
                    className="px-6 py-2.5 bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-widest hover:bg-amber-300 transition-all disabled:opacity-50 flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Send size={14} />
                    {createReviewMutation.isLoading ? 'Submitting...' : 'Submit Review'}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Reviews List */}
            <div className="p-8">
              {reviewsLoading ? (
                <div className="text-stone-600 text-center py-8 text-sm">Loading reviews...</div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">💬</div>
                  <h3 className="text-stone-400 font-bold mb-1">No reviews yet</h3>
                  <p className="text-stone-600 text-sm">Be the first to share your experience!</p>
                </div>
              ) : (
                <div className="space-y-0 border border-stone-800">
                  {reviews.map((review, index) => (
                    <motion.div
                      key={review._id}
                      className="p-6 border-b border-stone-800 last:border-b-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-amber-400 flex items-center justify-center text-stone-950 font-black text-sm flex-shrink-0">
                          {review.user?.fullName ? review.user.fullName[0].toUpperCase() : '?'}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <div>
                              <h4 className="text-stone-200 font-bold text-sm">{review.user?.fullName || 'Anonymous'}</h4>
                              <div className="flex items-center gap-1 mt-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} size={11} className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-700'} />
                                ))}
                                <span className="ml-1 text-stone-600 text-xs">{new Date(review.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            {review.user?._id === authUser?._id && (
                              <motion.button onClick={() => handleDeleteReview(review._id)} className="p-1 text-stone-700 hover:text-red-400 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Trash2 size={13} />
                              </motion.button>
                            )}
                          </div>
                          {review.comment && <p className="text-stone-500 text-sm leading-relaxed mt-2">{review.comment}</p>}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
