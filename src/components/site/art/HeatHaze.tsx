import { useReducedMotion } from 'framer-motion'

/** Soft heat blobs under the map plane — orange active / teal cleared language. */
export function HeatHaze({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion()

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div
        className={`absolute -left-[10%] top-[35%] h-[55%] w-[55%] rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.35)_0%,transparent_68%)] blur-2xl ${
          reduce ? '' : 'animate-[fn-haze_14s_ease-in-out_infinite]'
        }`}
      />
      <div
        className={`absolute right-[-5%] top-[25%] h-[50%] w-[45%] rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.22)_0%,transparent_70%)] blur-2xl ${
          reduce ? '' : 'animate-[fn-haze_18s_ease-in-out_infinite_reverse]'
        }`}
      />
      <div className="absolute bottom-[10%] left-[30%] h-[40%] w-[40%] rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.12)_0%,transparent_65%)] blur-3xl" />
    </div>
  )
}
