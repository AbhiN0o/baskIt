import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift } from "lucide-react";

const PrizeGrid = ({ onWin, onClose }) => {
  const prizes = [
    { type: "none", description: "Better Luck Next Time" },
    { type: "shipping", description: "Free Shipping!" },
    { type: "percentage", value: 5, description: "Flat 5% Off" },
    { type: "none", description: "Almost — Try Again!" },
  ];

  const [revealedIndex, setRevealedIndex] = useState(null);
  const [jumbledPrizes, setJumbledPrizes] = useState([]);

  useEffect(() => {
    setJumbledPrizes([...prizes].sort(() => Math.random() - 0.5));
  }, []);

  const handleClick = (index) => {
    if (revealedIndex !== null) return;
    setRevealedIndex(index);
    const prize = jumbledPrizes[index];
    if (prize.type !== "none") onWin(prize);
  };

  const won = revealedIndex !== null && jumbledPrizes[revealedIndex]?.type !== "none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90 p-4">
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #f5f0e8 1px, transparent 1px), linear-gradient(to bottom, #f5f0e8 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <motion.div
        className="relative z-10 w-full max-w-md border border-stone-800 bg-stone-950 shadow-2xl"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        {/* Amber top strip */}
        <div className="h-0.5 bg-amber-400 w-full" />

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-stone-800">
          <div>
            <span className="text-amber-400 text-xs tracking-[0.3em] uppercase font-medium block mb-1">
              ✦ Lucky Draw
            </span>
            <h2 className="text-stone-100 font-black text-xl">
              Reveal Your Prize
            </h2>
            <p className="text-stone-500 text-xs mt-1">
              {revealedIndex === null
                ? "Tap any tile to see what you've won"
                : won
                ? "Congratulations — prize applied!"
                : "Unlucky this time. Better luck next order!"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-600 hover:text-stone-200 border border-stone-800 hover:border-stone-600 transition-all ml-4 flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        {/* Prize Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-px bg-stone-800">
            {jumbledPrizes.map((prize, index) => {
              const isRevealed = revealedIndex === index;
              const isWinner = isRevealed && prize.type !== "none";
              const isLoser = isRevealed && prize.type === "none";

              return (
                <motion.button
                  key={index}
                  onClick={() => handleClick(index)}
                  disabled={revealedIndex !== null}
                  className={`relative aspect-square flex flex-col items-center justify-center p-4 transition-all
                    ${revealedIndex === null
                      ? "bg-stone-900 hover:bg-stone-800 cursor-pointer group"
                      : isRevealed
                      ? isWinner
                        ? "bg-amber-400 cursor-default"
                        : "bg-stone-900 cursor-default"
                      : "bg-stone-900/50 cursor-not-allowed opacity-40"
                    }`}
                  whileHover={revealedIndex === null ? { scale: 1.02 } : {}}
                  whileTap={revealedIndex === null ? { scale: 0.97 } : {}}
                  layout
                >
                  {!isRevealed ? (
                    /* Unrevealed state */
                    <>
                      {/* Hidden label */}
                      <div className="w-8 h-8 border-2 border-stone-700 group-hover:border-amber-400 transition-colors flex items-center justify-center mb-2">
                        <Gift size={16} className="text-stone-600 group-hover:text-amber-400 transition-colors" />
                      </div>
                      <span className="text-stone-700 text-xs uppercase tracking-widest font-bold">Tap</span>
                    </>
                  ) : isWinner ? (
                    /* Winner */
                    <motion.div
                      className="text-center"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="text-2xl mb-2">🎉</div>
                      <span className="text-stone-950 font-black text-sm uppercase tracking-wide">
                        {prize.description}
                      </span>
                    </motion.div>
                  ) : (
                    /* Loser */
                    <motion.div
                      className="text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="text-stone-600 text-xs uppercase tracking-widest font-bold leading-relaxed">
                        {prize.description}
                      </span>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Result Footer */}
        <AnimatePresence>
          {revealedIndex !== null && (
            <motion.div
              className="border-t border-stone-800 p-6 flex items-center justify-between"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
            >
              <div>
                {won ? (
                  <div>
                    <div className="text-amber-400 font-black text-sm uppercase tracking-widest mb-0.5">
                      Prize Applied ✓
                    </div>
                    <div className="text-stone-500 text-xs">
                      {jumbledPrizes[revealedIndex].description} added to your order
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-stone-400 font-bold text-sm mb-0.5">No prize this time</div>
                    <div className="text-stone-600 text-xs">Spend over $50 on your next order to play again</div>
                  </div>
                )}
              </div>

              <motion.button
                onClick={onClose}
                className={`px-5 py-3 font-bold text-xs uppercase tracking-widest transition-all flex-shrink-0 ${
                  won
                    ? "bg-amber-400 text-stone-950 hover:bg-amber-300"
                    : "border border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {won ? "Continue →" : "Close"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default PrizeGrid;
