import React from 'react';
import { motion } from 'framer-motion';

export const BouncingDotsLoader = ({ text = "Loading..." }) => {
  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center">
      <div className="text-center">
        {/* Architectural tick marks instead of blobs */}
        <div className="flex items-end gap-1.5 mb-6 justify-center">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="w-0.5 bg-amber-400"
              animate={{ height: ['8px', '28px', '8px'] }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                delay: i * 0.1,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 justify-center">
          <div className="w-3 h-3 bg-amber-400 rounded-sm" />
          <p className="text-stone-500 text-xs tracking-[0.3em] uppercase font-medium">{text}</p>
        </div>
      </div>
    </div>
  );
};
