import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ShoppingBag, Star, MapPin, Users, Share2, Calendar, ArrowLeft, Package } from 'lucide-react';
import useAuthUser from '../hooks/useAuthUser';
import { getPublicSeller, getSellerProducts, followSeller, unfollowSeller } from '../lib/api';
import { errMsg, inr } from '../lib/errors';
import { BouncingDotsLoader } from '../components/Loading';

export default function SellerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { authUser, type } = useAuthUser();

  const { data: seller, isLoading, error } = useQuery({
    queryKey: ['publicSeller', id, authUser?._id],
    queryFn: () => getPublicSeller(id),
  });
  const { data: products = [] } = useQuery({
    queryKey: ['sellerProductsPublic', id],
    queryFn: () => getSellerProducts(id),
  });

  const followMutation = useMutation({
    mutationFn: () => (seller.isFollowing ? unfollowSeller(id) : followSeller(id)),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['publicSeller', id] });
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
    },
    onError: (e) => toast.error(errMsg(e, 'Could not update follow')),
  });

  const handleFollow = () => {
    if (!authUser) { toast('Log in as a buyer to follow artisans'); navigate('/user/login'); return; }
    if (type !== 'user') { toast('Only buyer accounts can follow artisans'); return; }
    followMutation.mutate();
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: seller.businessName, url });
      else { await navigator.clipboard.writeText(url); toast.success('Link copied'); }
    } catch { /* user dismissed the share sheet */ }
  };

  if (isLoading) return <BouncingDotsLoader />;
  if (error || !seller) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center gap-4 text-stone-400">
        <p>We couldn't find that artisan.</p>
        <Link to="/market" className="text-amber-400 text-sm uppercase tracking-widest font-bold">Back to marketplace →</Link>
      </div>
    );
  }

  const location = [seller.city, seller.state].filter(Boolean).join(', ');
  const isOwnPage = type === 'seller' && authUser?._id === seller._id;

  const stats = [
    { label: 'Followers', value: seller.followersCount.toLocaleString('en-IN'), icon: Users },
    { label: 'Rating', value: seller.rating > 0 ? seller.rating.toFixed(1) : 'New', icon: Star },
    { label: 'Products', value: seller.productsCount, icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen bg-stone-950">
      <header className="sticky top-0 z-40 bg-stone-950/95 backdrop-blur-sm border-b border-stone-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 text-stone-500 hover:text-stone-200 border border-stone-800 hover:border-stone-600 transition-all" aria-label="Go back">
              <ArrowLeft size={16} />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-400 rounded-sm" />
              <span className="text-stone-100 font-black tracking-widest text-sm uppercase">BaskIt</span>
            </Link>
          </div>
          <button onClick={handleShare} className="p-2 text-stone-500 hover:text-stone-200 border border-stone-800 hover:border-stone-600 transition-all" aria-label="Share this artisan">
            <Share2 size={16} />
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <motion.div className="border border-stone-800 mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="h-1 bg-amber-400 w-full" />
          <div className="p-8 flex flex-col sm:flex-row items-start gap-8">
            <img src={seller.profilePic} alt={seller.businessName} className="w-24 h-24 object-cover border border-stone-700 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h1 className="text-stone-100 font-black text-2xl">{seller.businessName}</h1>
                    {seller.verified && (
                      <span className="text-amber-400 text-xs border border-amber-400/30 px-2 py-0.5 uppercase tracking-widest font-bold">Verified</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-stone-600 text-sm">
                    {location && <span className="flex items-center gap-1"><MapPin size={12} /> {location}</span>}
                    <span className="flex items-center gap-1"><Calendar size={12} /> Since {new Date(seller.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
                  </div>
                  <p className="text-stone-600 text-xs mt-1">Run by {seller.fullName}</p>
                </div>
                {!isOwnPage && (
                  <button
                    onClick={handleFollow}
                    disabled={followMutation.isPending}
                    className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest border transition-all flex-shrink-0 disabled:opacity-50 ${
                      seller.isFollowing
                        ? 'border-amber-400 text-amber-400 bg-amber-400/10'
                        : 'border-stone-600 text-stone-300 hover:border-amber-400 hover:text-amber-400'
                    }`}
                  >
                    {seller.isFollowing ? '✓ Following' : '+ Follow'}
                  </button>
                )}
              </div>
              <p className="text-stone-400 text-sm leading-relaxed max-w-lg">
                {seller.description || 'This artisan hasn\'t written their story yet.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-px bg-stone-800 border-t border-stone-800">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-stone-950 py-4 text-center">
                <div className="text-stone-100 font-black text-xl mb-0.5">{value}</div>
                <div className="text-stone-600 text-xs uppercase tracking-widest flex items-center justify-center gap-1"><Icon size={10} /> {label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <section>
          <div className="mb-6">
            <span className="text-amber-400 text-xs tracking-[0.3em] uppercase font-medium block mb-1">Shop</span>
            <h2 className="text-stone-100 font-black text-xl">Products by {seller.businessName}</h2>
          </div>

          {products.length === 0 ? (
            <div className="border border-dashed border-stone-800 py-20 text-center">
              <Package size={36} className="mx-auto text-stone-700 mb-3" />
              <p className="text-stone-500 text-sm">No products listed yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-stone-800">
              {products.map((p) => (
                <Link key={p._id} to={`/product/${p._id}`} className="bg-stone-950 group block">
                  <div className="overflow-hidden" style={{ aspectRatio: '1/1' }}>
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-700"><Package size={32} /></div>
                    )}
                  </div>
                  <div className="p-5 border-t border-stone-800">
                    <h3 className="text-stone-100 font-bold text-base mb-1 truncate group-hover:text-amber-400 transition-colors">{p.title.replace(/"/g, '').trim()}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400 font-black text-lg">{inr(p.price)}</span>
                      <span className={`text-xs ${p.quantity === 0 ? 'text-red-400' : 'text-stone-600'}`}>{p.quantity === 0 ? 'Sold out' : `${p.quantity} left`}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
