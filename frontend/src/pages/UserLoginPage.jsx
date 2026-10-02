import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userLogin } from "../lib/api";

export default function UserLoginPage() {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [focused, setFocused] = useState(null);

  const queryClient = useQueryClient();
  const { mutate: loginMutation, isPending, error } = useMutation({
    mutationFn: userLogin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
  });

  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation(loginData);
  };

  return (
    <div className="min-h-screen bg-stone-950 flex">
      {/* Left Panel — editorial copy */}
      <div className="hidden lg:flex w-1/2 flex-col border-r border-stone-800 relative overflow-hidden">
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(to right, #f5f0e8 1px, transparent 1px), linear-gradient(to bottom, #f5f0e8 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />
        {/* Ambient glow */}
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(202,138,4,0.05) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 flex flex-col justify-between h-full p-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-amber-400 rounded-sm" />
            <span className="text-stone-100 font-black tracking-widest text-sm uppercase">BaskIt</span>
          </div>

          {/* Big copy */}
          <div>
            <span className="text-amber-400 text-xs tracking-[0.3em] uppercase font-medium block mb-5">
              ✦ Buyer Login
            </span>
            <h1 className="text-6xl font-black text-stone-100 leading-[0.9] tracking-tight mb-6">
              Welcome<br />
              Back to<br />
              <span className="text-transparent" style={{ WebkitTextStroke: '2px #d97706' }}>BaskIt.</span>
            </h1>
            <p className="text-stone-500 text-lg max-w-sm leading-relaxed">
              Explore artisan products, manage your cart, and connect with makers directly.
            </p>
          </div>

          {/* Bottom tagline */}
          <div className="flex items-center gap-4">
            {['Handcrafted', 'Verified', 'Secure'].map((t) => (
              <span key={t} className="text-stone-700 text-xs tracking-widest">✦ {t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-12 lg:hidden">
            <div className="w-5 h-5 bg-amber-400 rounded-sm" />
            <span className="text-stone-100 font-black tracking-widest text-sm uppercase">BaskIt</span>
          </div>

          <div className="mb-10">
            <span className="text-amber-400 text-xs tracking-[0.3em] uppercase font-medium block mb-3">Account</span>
            <h2 className="text-3xl font-black text-stone-100">Sign In</h2>
            <p className="text-stone-600 text-sm mt-1">Enter your credentials to continue</p>
          </div>

          {error && (
            <div className="border border-red-500/30 bg-red-500/5 px-4 py-3 mb-6 text-red-400 text-sm">
              {error.response?.data?.message || "Login failed. Please try again."}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-0 border border-stone-800">
            {/* Email */}
            <div className={`border-b border-stone-800 transition-colors ${focused === 'email' ? 'bg-stone-900/60' : ''}`}>
              <label className="flex items-center gap-2 text-stone-600 text-xs uppercase tracking-widest px-5 pt-4 pb-1">
                <Mail size={10} /> Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                className="w-full bg-transparent px-5 pb-4 pt-1 text-stone-100 focus:outline-none placeholder-stone-700 text-base"
                required
              />
            </div>

            {/* Password */}
            <div className={`transition-colors ${focused === 'password' ? 'bg-stone-900/60' : ''}`}>
              <label className="flex items-center gap-2 text-stone-600 text-xs uppercase tracking-widest px-5 pt-4 pb-1">
                <Lock size={10} /> Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                className="w-full bg-transparent px-5 pb-4 pt-1 text-stone-100 focus:outline-none placeholder-stone-700 text-base"
                required
              />
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isPending}
              className="w-full py-5 bg-amber-400 text-stone-950 font-black text-sm tracking-widest uppercase flex items-center justify-center gap-3 hover:bg-amber-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={!isPending ? { scale: 1.005 } : {}}
              whileTap={!isPending ? { scale: 0.998 } : {}}
            >
              {isPending ? 'Signing In...' : (
                <><span>Sign In</span><ArrowRight size={16} /></>
              )}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-stone-600 text-sm">
            Don't have an account?{" "}
            <a href="/user/signup" className="text-amber-400 hover:text-amber-300 font-bold transition-colors">
              Create account
            </a>
          </p>

          <div className="mt-4 text-center">
            <a href="/seller/login" className="text-stone-700 hover:text-stone-400 text-xs tracking-wide transition-colors">
              Are you a seller? →
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
