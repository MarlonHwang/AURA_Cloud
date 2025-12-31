import React from 'react';
import { motion } from 'framer-motion';
import { useSequencerStore } from '../../../stores/sequencerStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const StepToggleBtn: React.FC = () => {
    const { stepCount, toggleStepCount } = useSequencerStore();
    const is32 = stepCount === 32;

    return (
        <div className="relative flex items-center justify-center w-[85px] h-[36px]">
            {/* Container for Perspective/Curve Effect */}
            <motion.button
                onClick={toggleStepCount}
                whileHover={{ scale: 1.05, filter: 'brightness(1.2)' }}
                whileTap={{ scale: 0.95 }}
                className={twMerge(
                    "relative w-full h-full overflow-hidden transition-all duration-300 ease-out",
                    "flex items-center justify-center",
                    // Shape: Custom border radius to mimic curved pill
                    "rounded-[18px/50%]",
                    // Border
                    "border border-[#B5D948]/30",
                    // Initial State Colors
                    is32
                        ? "shadow-[0_0_15px_rgba(181,217,72,0.4)]"
                        : "opacity-60 grayscale-[0.3]"
                )}
                style={{
                    // Glassmorphism Background with Curved Gradient
                    background: is32
                        ? 'linear-gradient(180deg, rgba(181,217,72,0.1) 0%, rgba(181,217,72,0.3) 50%, rgba(181,217,72,0.1) 100%)'
                        : 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: is32
                        ? 'inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.2), 0 0 10px rgba(181,217,72,0.3)'
                        : 'inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.3)',
                }}
            >
                {/* Inner Glossy Reflection (Top Curve) */}
                <div className="absolute top-0 left-[10%] right-[10%] h-[40%] bg-gradient-to-b from-white/30 to-transparent rounded-[50%] blur-[1px]" />

                {/* Text Content */}
                <motion.span
                    layout
                    className={clsx(
                        "relative z-10 text-[11px] font-black tracking-widest uppercase font-sans",
                        is32 ? "text-[#B5D948] drop-shadow-[0_0_5px_rgba(181,217,72,0.8)]" : "text-[#B5D948]/70"
                    )}
                >
                    {stepCount} STEPS
                </motion.span>

                {/* Bottom Accent Highlight */}
                <div className={clsx(
                    "absolute bottom-0 left-[15%] right-[15%] h-[2px] rounded-full blur-[2px]",
                    is32 ? "bg-[#B5D948]" : "bg-transparent"
                )} />

            </motion.button>
        </div>
    );
};
