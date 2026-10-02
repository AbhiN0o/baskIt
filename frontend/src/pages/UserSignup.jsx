import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, MapPin, Calendar, ArrowRight } from "lucide-react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userSignup } from '../lib/api.js';

export default function UserSignupPage() {
  const [signupData, setSignupData] = useState({
    fullName: '', email: '', password: '', address: '', dob: '',
  });
  const [focused, setFocused] = useState(null);
  const [step, setStep] = useState(1); // 2-step form

  const queryClient = useQueryClient();
  const { mutate: signupMutation, isPending, error } = useMutation({
    mutationFn: userSignup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['authUser'] }),
  });

  const handleSignup = (e) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    signupMutation(signupData);
  };

  const fields1 = [
    { key: 'fullName', label: 'Full Name', icon: User, type: 'text', placeholder: 'John Doe' },
    { key: 'email', label: 'Email Address', icon: Mail, type: 'email', placeholder: 'you@example.com' },
    { key: 'password', label: 'Password', icon: Lock, type: 'password', placeholder: '••••••••' },
  ];

  const fields2 = [
    { key: 'address', label: 'Delivery Address', icon: MapPin, type: 'text', placeholder: '123 Artisan Lane, NY' },
    { key: 'dob', label: 'Date of Birth', icon: Calendar, type: 'date', placeholder: '' },
  ];

  const activeFields = step === 1 ? fields1 : fields2;

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
        <div className="absolute top-0 right-0 w-[400px] h-[400px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(202,138,4,0.05) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 flex flex-col justify-between h-full p-14">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-amber-400 rounded-sm" />
            <span className="text-stone-100 font-black tracking-widest text-sm uppercase">BaskIt</span>
          </div>

          <div>
            <span className="text-amber-400 text-xs tracking-[0.3em] uppercase font-medium block mb-5">
              ✦ New Account
            </span>
            <h1 className="text-6xl font-black text-stone-100 leading-[0.9] tracking-tight mb-6">
              Start Your<br />
              Artisan<br />
              <span className="text-transparent" style={{ WebkitTextStroke: '2px #d97706' }}>Journey.</span>
            </h1>
            <p className="text-stone-500 text-lg max-w-sm leading-relaxed">
              Discover authentic creations worldwide. Connect with artisans and find unique items just for you.
            </p>

            {/* Step indicators on left side */}
            <div className="flex items-center gap-4 mt-10">
              <div className={`flex items-center gap-2 text-xs uppercase tracking-widest font-bold ${step >= 1 ? 'text-amber-400' : 'text-stone-700'}`}>
                <div className={`w-5 h-5 border flex items-center justify-center text-xs font-black ${step >= 1 ? 'bg-amber-400 border-amber-400 text-stone-950' : 'border-stone-700 text-stone-700'}`}>1</div>
                Account
              </div>
              <div className="w-8 h-px bg-stone-800" />
              <div className={`flex items-center gap-2 text-xs uppercase tracking-widest font-bold ${step >= 2 ? 'text-amber-400' : 'text-stone-700'}`}>
                <div className={`w-5 h-5 border flex items-center justify-center text-xs font-black ${step >= 2 ? 'bg-amber-400 border-amber-400 text-stone-950' : 'border-stone-700 text-stone-700'}`}>2</div>
                Details
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {['Handcrafted', 'Verified', 'Secure'].map((t) => (
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

          {/* Step bar (mobile) */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            {[1, 2].map((s) => (
              <div key={s} className={`h-1 flex-1 transition-all ${s <= step ? 'bg-amber-400' : 'bg-stone-800'}`} />
            ))}
          </div>

          <div className="mb-10">
            <span className="text-amber-400 text-xs tracking-[0.3em] uppercase font-medium block mb-3">
              Step {step} of 2
            </span>
            <h2 className="text-3xl font-black text-stone-100">
              {step === 1 ? 'Create Account' : 'Your Details'}
            </h2>
            <p className="text-stone-600 text-sm mt-1">
              {step === 1 ? 'Set up your login credentials' : 'Add delivery and personal info'}
            </p>
          </div>

          {error && (
            <div className="border border-red-500/30 bg-red-500/5 px-4 py-3 mb-6 text-red-400 text-sm">
              {error.response?.data?.message || 'Signup failed. Try again.'}
            </div>
          )}

          <motion.form
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSignup}
            className="space-y-0 border border-stone-800"
          >
            {activeFields.map((field, i) => {
              const Icon = field.icon;
              return (
                <div
                  key={field.key}
                  className={`${i < activeFields.length - 1 ? 'border-b border-stone-800' : ''} transition-colors ${focused === field.key ? 'bg-stone-900/60' : ''}`}
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
                    required
                    className="w-full bg-transparent px-5 pb-4 pt-1 text-stone-100 focus:outline-none placeholder-stone-700 text-base"
                  />
                </div>
              );
            })}

            <motion.button
              type="submit"
              disabled={isPending}
              className="w-full py-5 bg-amber-400 text-stone-950 font-black text-sm tracking-widest uppercase flex items-center justify-center gap-3 hover:bg-amber-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={!isPending ? { scale: 1.005 } : {}}
              whileTap={!isPending ? { scale: 0.998 } : {}}
            >
              {isPending ? 'Creating Account...' : step === 1 ? (
                <><span>Continue</span><ArrowRight size={16} /></>
              ) : (
                <><span>Create Account</span><ArrowRight size={16} /></>
              )}
            </motion.button>
          </motion.form>

          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="mt-3 w-full text-center text-stone-600 hover:text-stone-400 text-xs uppercase tracking-widest transition-colors"
            >
              ← Back to step 1
            </button>
          )}

          <p className="mt-6 text-center text-stone-600 text-sm">
            Already have an account?{" "}
            <a href="/user/login" className="text-amber-400 hover:text-amber-300 font-bold transition-colors">
              Sign in
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
