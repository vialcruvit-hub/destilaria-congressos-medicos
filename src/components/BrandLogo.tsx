import { motion } from 'framer-motion';

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <motion.div
      className="inline-flex items-center gap-3.5 select-none group"
      whileHover="hover"
      initial="rest"
    >
      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#211F1C] bg-[#FDF6E9] shadow-[3px_3px_0px_#211F1C] transition-transform duration-200 group-hover:-translate-y-0.5">
        <svg
          viewBox="0 0 64 64"
          className="h-9 w-9 overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Left curved leaf */}
          <motion.path
            d="M24 31C18 22 10 21 6 26C12 25 18 27 23 34Z"
            fill="#B7CC49"
            stroke="#211F1C"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ originX: '24px', originY: '32px' }}
            animate={{ rotate: [0, -4, 0, 2, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
            variants={{
              hover: { rotate: -10, transition: { type: 'spring', stiffness: 260, damping: 12 } },
            }}
          />

          {/* Right upper leaf */}
          <motion.path
            d="M40 26C45 19 51 15 56 15C51 19 46 23 41 29Z"
            fill="#B7CC49"
            stroke="#211F1C"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ originX: '40px', originY: '27px' }}
            animate={{ rotate: [0, 4, 0, -2, 0] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            variants={{
              hover: { rotate: 11, transition: { type: 'spring', stiffness: 260, damping: 12 } },
            }}
          />

          {/* Right lower leaf */}
          <motion.path
            d="M41 37C47 32 54 33 57 39C52 37 46 37 41 41Z"
            fill="#A2B933"
            stroke="#211F1C"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ originX: '41px', originY: '39px' }}
            animate={{ rotate: [0, 3, 0, -3, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
            variants={{
              hover: { rotate: 8, transition: { type: 'spring', stiffness: 260, damping: 12 } },
            }}
          />

          {/* Taller back stalk */}
          <motion.g
            variants={{
              hover: { y: -1.5, transition: { type: 'spring', stiffness: 300, damping: 15 } },
            }}
          >
            <rect
              x="25"
              y="10"
              width="7.5"
              height="42"
              rx="3"
              fill="#F3D2A2"
              stroke="#211F1C"
              strokeWidth="2.2"
            />
            <ellipse cx="28.75" cy="11.5" rx="3.4" ry="1.8" fill="#FAF0DC" stroke="#211F1C" strokeWidth="1.8" />
            <path d="M25.5 23H32M25.5 34H32M25.5 44H32" stroke="#211F1C" strokeWidth="2" strokeLinecap="round" />
          </motion.g>

          {/* Shorter front stalk */}
          <motion.g
            variants={{
              hover: { y: -0.5, transition: { type: 'spring', stiffness: 300, damping: 15 } },
            }}
          >
            <rect
              x="34.5"
              y="16"
              width="7.5"
              height="39"
              rx="3"
              fill="#EFC588"
              stroke="#211F1C"
              strokeWidth="2.2"
            />
            <ellipse cx="38.25" cy="17.5" rx="3.4" ry="1.8" fill="#FAF0DC" stroke="#211F1C" strokeWidth="1.8" />
            <path d="M35 28H41.5M35 38.5H41.5M35 48H41.5" stroke="#211F1C" strokeWidth="2" strokeLinecap="round" />
          </motion.g>
        </svg>
      </div>

      {!compact && (
        <div className="leading-none">
          <div className="font-display text-lg sm:text-xl font-extrabold tracking-[0.14em] text-[#211F1C]">
            DESTILARIA
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold tracking-[0.26em] text-[#6B655B]">
            <span>RESEARCH GROUP</span>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#B2C842] ring-1 ring-[#211F1C]" />
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function EmptyCaneIllustration() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-3xl border-2 border-[#211F1C] bg-[#FDF6E9] shadow-[4px_4px_0px_#211F1C]"
    >
      <svg viewBox="0 0 80 80" className="h-16 w-16" fill="none">
        <motion.path
          d="M28 52C21 44 13 44 10 49C16 48 22 49 27 55Z"
          fill="#B7CC49"
          stroke="#211F1C"
          strokeWidth="2.2"
          animate={{ rotate: [0, -6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '28px', originY: '53px' }}
        />
        <rect x="31" y="22" width="9" height="42" rx="3.5" fill="#F3D2A2" stroke="#211F1C" strokeWidth="2.4" />
        <path d="M31.5 34H39.5M31.5 47H39.5" stroke="#211F1C" strokeWidth="2.2" />
        <motion.g
          animate={{ x: [0, 3, 0], y: [0, -2, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <circle cx="52" cy="34" r="11" fill="#FFFFFF" stroke="#211F1C" strokeWidth="2.4" />
          <path d="M60 42L68 50" stroke="#211F1C" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M48 34H56" stroke="#D49A4A" strokeWidth="2.4" strokeLinecap="round" />
        </motion.g>
      </svg>
    </motion.div>
  );
}
