import { motion } from 'framer-motion';

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <motion.div
      className="inline-flex items-center gap-3 select-none group"
      whileHover="hover"
      initial="rest"
    >
      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#E6E0D5] bg-[#FFFFFF] shadow-xs transition-colors duration-200 group-hover:border-[#CFC7B8]">
        <svg
          viewBox="0 0 64 64"
          className="h-7 w-7 overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <motion.path
            d="M24 31C18.5 23 11.5 22 8 26.5C13.5 25.5 19 27.5 23.5 34Z"
            fill="#8E9F63"
            stroke="#2A2723"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ originX: '24px', originY: '32px' }}
            animate={{ rotate: [0, -1.8, 0, 1.2, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            variants={{
              hover: { rotate: -5, transition: { type: 'spring', stiffness: 220, damping: 20 } },
            }}
          />

          <motion.path
            d="M40 26.5C44.5 20 50 16.5 54.5 16.5C50 20 45.5 23.5 41 29Z"
            fill="#8E9F63"
            stroke="#2A2723"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ originX: '40px', originY: '27px' }}
            animate={{ rotate: [0, 1.8, 0, -1.2, 0] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            variants={{
              hover: { rotate: 5, transition: { type: 'spring', stiffness: 220, damping: 20 } },
            }}
          />

          <motion.path
            d="M41 37C46.5 32.5 52.5 33.5 55.5 38.5C51 36.8 45.8 36.8 41 40.5Z"
            fill="#76884D"
            stroke="#2A2723"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ originX: '41px', originY: '39px' }}
            animate={{ rotate: [0, 1.4, 0, -1.4, 0] }}
            transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
            variants={{
              hover: { rotate: 4, transition: { type: 'spring', stiffness: 220, damping: 20 } },
            }}
          />

          <rect
            x="25.5"
            y="10"
            width="6.8"
            height="42"
            rx="2.6"
            fill="#DEC69D"
            stroke="#2A2723"
            strokeWidth="1.6"
          />
          <ellipse cx="28.9" cy="11.3" rx="3" ry="1.4" fill="#F4EAD7" stroke="#2A2723" strokeWidth="1.3" />
          <path d="M26 23H31.8M26 34H31.8M26 44H31.8" stroke="#2A2723" strokeWidth="1.4" strokeLinecap="round" />

          <rect
            x="34.5"
            y="16"
            width="6.8"
            height="39"
            rx="2.6"
            fill="#D5B988"
            stroke="#2A2723"
            strokeWidth="1.6"
          />
          <ellipse cx="37.9" cy="17.3" rx="3" ry="1.4" fill="#F4EAD7" stroke="#2A2723" strokeWidth="1.3" />
          <path d="M35 28H40.8M35 38.5H40.8M35 48H40.8" stroke="#2A2723" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>

      {!compact && (
        <div className="leading-none">
          <div className="font-display text-base sm:text-[17px] font-bold tracking-[0.18em] text-[#1F1D1A]">
            DESTILARIA
          </div>
          <div className="mt-1 text-[10px] font-semibold tracking-[0.26em] text-[#5E584F]">
            RESEARCH GROUP
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function EmptyCaneIllustration() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#E6E0D5] bg-[#F8F6F1]"
    >
      <svg viewBox="0 0 64 64" className="h-10 w-10" fill="none">
        <path
          d="M23 41C17.5 34.5 11.5 34.5 9 38.5C13.8 37.8 18.5 38.8 22.2 43.5Z"
          fill="#8E9F63"
          stroke="#2A2723"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="25" y="18" width="7" height="33" rx="2.8" fill="#DEC69D" stroke="#2A2723" strokeWidth="1.6" />
        <path d="M25.5 27.5H31.5M25.5 38H31.5" stroke="#2A2723" strokeWidth="1.4" />
        <circle cx="42" cy="27" r="8.5" fill="#FFFFFF" stroke="#2A2723" strokeWidth="1.6" />
        <path d="M48 33L54 39" stroke="#2A2723" strokeWidth="2" strokeLinecap="round" />
        <path d="M39 27H45" stroke="#8F6B3A" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
}
