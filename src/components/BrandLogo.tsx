import { motion } from 'framer-motion';

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <motion.div
      className="inline-flex items-center gap-2.5 select-none group"
      whileHover="hover"
      initial="rest"
    >
      {/* Símbolo solto diretamente no header, sem box/moldura */}
      <svg
        viewBox="0 0 64 64"
        className="h-11 w-11 shrink-0 overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Folha esquerda */}
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

        {/* Folha superior direita */}
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

        {/* Folha inferior direita */}
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

        {/* Colmo traseiro */}
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

        {/* Colmo frontal */}
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

      {!compact && (
        <div className="leading-none">
          <div className="font-display text-lg sm:text-[19px] font-extrabold tracking-[0.14em] text-[#211F1C]">
            DESTILARIA
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.26em] text-[#6B655B]">
            <span>RESEARCH GROUP</span>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#B7CC49] ring-1 ring-[#211F1C]" />
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function HeroCaneDoodle() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      className="hidden lg:block select-none"
      aria-hidden="true"
    >
      <svg viewBox="0 0 130 96" className="h-24 w-32 overflow-visible" fill="none">
        {/* Caderno / rascunho de artigo flutuando */}
        <motion.g
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <rect
            x="48"
            y="18"
            width="58"
            height="64"
            rx="12"
            fill="#FFFFFF"
            stroke="#211F1C"
            strokeWidth="2.2"
          />
          <path d="M60 34H94M60 45H88M60 56H80" stroke="#211F1C" strokeWidth="2.2" strokeLinecap="round" />
          <rect x="60" y="65" width="22" height="7" rx="3.5" fill="#B7CC49" stroke="#211F1C" strokeWidth="1.8" />
        </motion.g>

        {/* Broto de cana divertido à esquerda */}
        <motion.g
          animate={{ rotate: [0, -2, 0, 2, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '32px', originY: '82px' }}
        >
          <path d="M27 52C20 44 12 45 9 50C15 48 21 50 26 55Z" fill="#B7CC49" stroke="#211F1C" strokeWidth="2" strokeLinejoin="round" />
          <path d="M39 42C45 36 51 35 55 38C50 40 45 42 40 46Z" fill="#A2B933" stroke="#211F1C" strokeWidth="2" strokeLinejoin="round" />
          <rect x="28" y="28" width="9" height="52" rx="3.5" fill="#F3D2A2" stroke="#211F1C" strokeWidth="2.2" />
          <ellipse cx="32.5" cy="29.5" rx="4" ry="1.8" fill="#FAF0DC" stroke="#211F1C" strokeWidth="1.8" />
          <path d="M29 44H36.5M29 58H36.5M29 70H36.5" stroke="#211F1C" strokeWidth="2" />
        </motion.g>

        {/* Lupinha simpática */}
        <motion.g
          animate={{ x: [0, 3, 0], y: [0, 2, 0] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        >
          <circle cx="102" cy="64" r="12" fill="#FDF6E9" stroke="#211F1C" strokeWidth="2.2" />
          <path d="M97 64H107M102 59V69" stroke="#B7CC49" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M111 73L120 82" stroke="#211F1C" strokeWidth="3.2" strokeLinecap="round" />
        </motion.g>
      </svg>
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
