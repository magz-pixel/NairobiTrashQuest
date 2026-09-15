export function FixNairobiMark({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" width={28} height={28} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#063b32" />
      <path d="M4 24 L10 18 L16 21 L22 15 L28 20 V28 H4 Z" fill="#0b8c76" />
      <path d="M16 6c-2.8 0-5 2.1-5 4.8 0 3.6 5 9.2 5 9.2s5-5.6 5-9.2C21 8.1 18.8 6 16 6z" fill="#fbbf24" />
      <circle cx="16" cy="10.2" r="1.6" fill="#063b32" />
    </svg>
  )
}
