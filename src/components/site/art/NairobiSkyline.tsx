import { motion, useReducedMotion } from 'framer-motion'

/** Stylized Nairobi night skyline — KICC, GTC twins, Times Tower cues. */
export function NairobiSkyline({
  className = '',
  parallaxY = 0,
}: {
  className?: string
  parallaxY?: number
}) {
  const reduce = useReducedMotion()

  return (
    <motion.svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox="0 0 1200 700"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
      style={reduce ? undefined : { y: parallaxY }}
    >
      <defs>
        <linearGradient id="fn-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a192f" />
          <stop offset="40%" stopColor="#0c1f2e" />
          <stop offset="100%" stopColor="#071613" />
        </linearGradient>
        <linearGradient id="fn-haze-sky" x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0%" stopColor="#ff6b00" stopOpacity="0.12" />
          <stop offset="45%" stopColor="#00f2fe" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ff6b00" stopOpacity="0.06" />
        </linearGradient>
        <linearGradient id="fn-building" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a3d4a" />
          <stop offset="100%" stopColor="#0d2428" />
        </linearGradient>
        <linearGradient id="fn-building-lit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#255060" />
          <stop offset="100%" stopColor="#123038" />
        </linearGradient>
      </defs>

      <rect width="1200" height="700" fill="url(#fn-sky)" />
      <rect width="1200" height="700" fill="url(#fn-haze-sky)" />

      <path
        d="M0 420 C120 400 180 390 280 395 C380 402 450 380 560 385 C680 392 760 375 880 388 C980 398 1080 390 1200 400 L1200 700 L0 700 Z"
        fill="#0a1520"
        opacity="0.95"
      />
      <path
        d="M0 460 C80 445 160 450 240 448 C340 445 400 430 500 438 C620 448 700 425 820 440 C940 455 1040 435 1200 450 L1200 700 L0 700 Z"
        fill="#0d1e28"
      />
      <rect x="0" y="520" width="1200" height="180" fill="#071613" />

      <g stroke="#00f2fe" strokeOpacity="0.08" strokeWidth="1">
        <path d="M0 560 L1200 560" />
        <path d="M0 600 L1200 600" />
        <path d="M0 640 L1200 640" />
        <path d="M150 520 L80 700" />
        <path d="M350 520 L300 700" />
        <path d="M550 520 L550 700" />
        <path d="M750 520 L820 700" />
        <path d="M950 520 L1050 700" />
      </g>

      {/* Left cluster */}
      <g fill="url(#fn-building)">
        <rect x="60" y="380" width="48" height="140" />
        <rect x="118" y="350" width="36" height="170" />
        <rect x="164" y="400" width="55" height="120" />
        <rect x="230" y="365" width="42" height="155" />
      </g>

      {/* Times Tower–like tall slab */}
      <g>
        <rect x="300" y="250" width="70" height="270" fill="url(#fn-building-lit)" />
        <rect x="305" y="235" width="60" height="16" fill="#2a5564" />
        <g fill="#00f2fe" opacity="0.12">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <rect key={i} x="310" y={270 + i * 26} width="50" height="3" rx="1" />
          ))}
        </g>
      </g>

      {/* KICC cylindrical tower */}
      <g>
        <rect x="500" y="200" width="72" height="320" rx="34" fill="url(#fn-building-lit)" />
        <rect x="512" y="178" width="48" height="28" rx="4" fill="#2a5c64" />
        <rect x="524" y="150" width="24" height="32" fill="#356670" />
        <circle cx="536" cy="142" r="11" fill="#fbbf24" opacity="0.45" />
        <g fill="#fbbf24" opacity="0.18">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <rect key={i} x="512" y={230 + i * 30} width="48" height="4" rx="1" />
          ))}
        </g>
      </g>

      {/* GTC twin towers */}
      <g fill="url(#fn-building-lit)">
        <rect x="620" y="230" width="52" height="290" />
        <rect x="688" y="210" width="52" height="310" />
        <rect x="628" y="218" width="36" height="12" fill="#3a7080" />
        <rect x="696" y="198" width="36" height="12" fill="#3a7080" />
      </g>
      <g fill="#00f2fe" opacity="0.1">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <g key={i}>
            <rect x="628" y={260 + i * 32} width="36" height="3" />
            <rect x="696" y={250 + i * 32} width="36" height="3" />
          </g>
        ))}
      </g>

      {/* Right CBD midrises */}
      <g fill="url(#fn-building)">
        <rect x="780" y="330" width="55" height="190" />
        <rect x="850" y="300" width="48" height="220" />
        <rect x="915" y="350" width="70" height="170" />
        <rect x="1000" y="320" width="42" height="200" />
        <rect x="1055" y="360" width="58" height="160" />
        <rect x="420" y="340" width="50" height="180" />
      </g>

      <g fill="#fbbf24" opacity="0.22">
        <rect x="312" y="290" width="6" height="5" />
        <rect x="340" y="340" width="6" height="5" />
        <rect x="636" y="280" width="6" height="5" />
        <rect x="704" y="260" width="6" height="5" />
        <rect x="868" y="330" width="6" height="5" />
        <rect x="160" y="380" width="5" height="4" />
      </g>

      <ellipse cx="600" cy="530" rx="480" ry="28" fill="#ff6b00" opacity="0.1" />
    </motion.svg>
  )
}
