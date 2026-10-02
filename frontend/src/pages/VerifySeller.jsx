import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { verifySellerEmail } from "../lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function VerifySeller() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(null); // null = pending, true/false = result

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      toast.error("Invalid verification link.");
      setSuccess(false);
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const res = await verifySellerEmail(token);
        toast.success(res.message || "Seller verified successfully!");
        await queryClient.invalidateQueries({ queryKey: ["authUser"] });
        setSuccess(true);
      } catch (err) {
        toast.error(err.response?.data?.message || "Verification failed.");
        setSuccess(false);
      } finally {
        setLoading(false);
        setTimeout(() => navigate("/sellermarket"), 1500);
      }
    };

    verify();
  }, [searchParams, navigate, queryClient]);

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-6">
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #f5f0e8 1px, transparent 1px), linear-gradient(to bottom, #f5f0e8 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <motion.div
        className="relative z-10 w-full max-w-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-12">
          <div className="w-5 h-5 bg-amber-400 rounded-sm" />
          <span className="text-stone-100 font-black tracking-widest text-sm uppercase">BaskIt</span>
        </div>

        {loading ? (
          /* Loading state */
          <div className="border border-stone-800 p-10 text-center">
            <div className="flex items-end gap-1.5 mb-6 justify-center">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-0.5 bg-amber-400"
                  animate={{ height: ["8px", "28px", "8px"] }}
                  transition={{
                    duration: 0.9,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
            <p className="text-stone-500 text-xs tracking-[0.3em] uppercase font-medium">
              Verifying your account...
            </p>
          </div>
        ) : success ? (
          /* Success state */
          <motion.div
            className="border border-stone-800 p-10 text-center"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Amber top strip */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-400" style={{ position: 'relative', marginBottom: '24px', height: '2px', background: '#d97706' }} />

            <div className="w-14 h-14 border-2 border-green-400 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="text-green-400" size={28} />
            </div>

            <span className="text-amber-400 text-xs tracking-[0.3em] uppercase font-medium block mb-3">
              ✦ Verified
            </span>
            <h1 className="text-stone-100 font-black text-2xl mb-3">
              Account Verified
            </h1>
            <p className="text-stone-500 text-sm leading-relaxed">
              Your seller account is now active. Redirecting to your dashboard...
            </p>

            <div className="mt-6 border-t border-stone-800 pt-5">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 bg-amber-400 rounded-sm"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
              <p className="text-stone-700 text-xs uppercase tracking-widest">Redirecting</p>
            </div>
          </motion.div>
        ) : (
          /* Error state */
          <motion.div
            className="border border-red-500/20 bg-red-500/5 p-10 text-center"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="w-14 h-14 border-2 border-red-400/50 flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="text-red-400" size={28} />
            </div>
            <h1 className="text-stone-100 font-black text-2xl mb-3">
              Verification Failed
            </h1>
            <p className="text-stone-500 text-sm leading-relaxed mb-6">
              The verification link is invalid or has expired. Please request a new one from your dashboard.
            </p>
            <motion.button
              onClick={() => navigate("/sellermarket")}
              className="px-6 py-3 bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-widest hover:bg-amber-300 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Go to Dashboard →
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
