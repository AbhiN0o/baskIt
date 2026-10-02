import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, Building, FileText, ArrowRight } from "lucide-react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerSignup } from '../lib/api';

export default function SellerSignupPage() {
  const [signupData, setSignupData] = useState({
    fullName: '', email: '', password: '', businessName: '', description: ''
  });
  const [focused, setFocused] = useState(null);

  const queryClient = useQueryClient();
  const { mutate: signupMutation, isPending, error } = useMutation({
    mutationFn: sellerSignup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['authUser'] }),
  });

  const handleSignup = (e) => {
    e.preventDefault();
    signupMutation(signupData);
  };

  const fields = [
    { key: 'fullName', label: 'Full Name', icon: User, type: 'text', placeholder: 'Jane Doe', required: true },
    { key: 'email', label: 'Business Email', icon: Mail, type: 'email', placeholder: 'you@business.com', required: true },
    { key: 'password', label: 'Password', icon: Lock, type: 'password', placeholder: '••••••••', required: true },
    { key: 'businessName', label: 'Business Name', icon: Building, type: 'text', placeholder: 'Artisan Crafts Co.', required: true },
  ];

  return (
    <div className="min-h-screen bg-stone-950 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 flex-col border-r border-stone-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(to right, #f5f0e8 1px, transparent 1px), linear-gradient(to bottom, #f5f0e8 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(202,138,4,0.05) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 flex flex-col justify-between h-full p-14">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-amber-400 rounded-sm" />
            <span className="text-stone-100 font-black tracking-widest text-sm uppercase">BaskIt</span>
            <span className="text-stone-700 text-xs ml-2 uppercase tracking-widest border border-stone-800 px-2 py-0.5">Seller</span>
          </div>

          <div>
            <span className="text-amber-400 text-xs tracking-[0.3em] uppercase font-medium block mb-5">
              ✦ Open Your Store
            </span>
            <h1 className="text-6xl font-black text-stone-100 leading-[0.9] tracking-tight mb-6">
              Start Your<br />
              Artisan<br />
              <span className="text-transparent" style={{ WebkitTextStroke: '2px #d97706' }}>Business.</span>
            </h1>
            <p className="text-stone-500 text-lg max-w-sm leading-relaxed">
              Showcase your crafts to the world. Connect with buyers and grow your artisan business.
            </p>

            {/* Benefits */}
            <div className="mt-10 grid grid-cols-2 gap-px bg-stone-800">
              {[
                { num: 'Free', label: 'To List' },
                { num: '12K+', label: 'Active Buyers' },
                { num: '190+', label: 'Countries' },
                { num: '24/7', label: 'Support' },
              ].map((b) => (
                <div key={b.label} className="bg-stone-950 p-5">
                  <div className="text-amber-400 font-black text-xl mb-0.5">{b.num}</div>
                  <div className="text-stone-600 text-xs uppercase tracking-widest">{b.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {['Zero Fees', 'Direct Sales', 'Your Brand'].map((t) => (
              <span key={t} className="text-stone-700 text-xs tracking-widest">✦ {t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-12 lg:hidden">
            <div className="w-5 h-5 bg-amber-400 rounded-sm" />
            <span className="text-stone-100 font-black tracking-widest text-sm uppercase">BaskIt</span>
          </div>

          <div className="mb-10">
            <span className="text-amber-400 text-xs tracking-[0.3em] uppercase font-medium block mb-3">New Seller</span>
            <h2 className="text-3xl font-black text-stone-100">Open Your Store</h2>
            <p className="text-stone-600 text-sm mt-1">Fill in your details to start selling</p>
          </div>

          {error && (
            <div className="border border-red-500/30 bg-red-500/5 px-4 py-3 mb-6 text-red-400 text-sm">
              {error.response?.data?.message || 'Signup failed. Try again.'}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-0 border border-stone-800">
            {fields.map((field, i) => {
              const Icon = field.icon;
              return (
                <div
                  key={field.key}
                  className={`border-b border-stone-800 transition-colors ${focused === field.key ? 'bg-stone-900/60' : ''}`}
                >
                  <label className="flex items-center gap-2 text-stone-600 text-xs uppercase tracking-widest px-5 pt-4 pb-1">
                    <Icon size={10} /> {field.label}
                  </label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={signupData[field.key]}
                    onChange={(e) => setSignupData({ ...signupData, [field.key]: e.target.value })}
                    onFocus={() => setFocused(field.key)}
                    onBlur={() => setFocused(null)}
                    required={field.required}
                    className="w-full bg-transparent px-5 pb-4 pt-1 text-stone-100 focus:outline-none placeholder-stone-700 text-base"
                  />
                </div>
              );
            })}

            {/* Description — textarea special case */}
            <div className={`border-b border-stone-800 transition-colors ${focused === 'description' ? 'bg-stone-900/60' : ''}`}>
              <label className="flex items-center gap-2 text-stone-600 text-xs uppercase tracking-widest px-5 pt-4 pb-1">
                <FileText size={10} /> About Your Business
                <span className="text-stone-700 ml-1 normal-case">(optional)</span>
              </label>
              <textarea
                placeholder="Tell buyers about your craft and story..."
                value={signupData.description}
                onChange={(e) => setSignupData({ ...signupData, description: e.target.value })}
                onFocus={() => setFocused('description')}
                onBlur={() => setFocused(null)}
                rows={3}
                className="w-full bg-transparent px-5 pb-4 pt-1 text-stone-100 focus:outline-none placeholder-stone-700 text-base resize-none"
              />
            </div>

            <motion.button
              type="submit"
              disabled={isPending}
              className="w-full py-5 bg-amber-400 text-stone-950 font-black text-sm tracking-widest uppercase flex items-center justify-center gap-3 hover:bg-amber-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={!isPending ? { scale: 1.005 } : {}}
              whileTap={!isPending ? { scale: 0.998 } : {}}
            >
              {isPending ? 'Creating Store...' : (
                <><span>Open My Store</span><ArrowRight size={16} /></>
              )}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-stone-600 text-sm">
            Already have an account?{" "}
            <a href="/seller/login" className="text-amber-400 hover:text-amber-300 font-bold transition-colors">
              Sign in
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
