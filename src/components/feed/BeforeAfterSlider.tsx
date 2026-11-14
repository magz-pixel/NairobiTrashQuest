import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

/**
 * One frame, two states. Drag the handle (or tap anywhere) to move the split:
 * left of the line is BEFORE, right is AFTER. Drag fully left = 100% after.
 */
export function BeforeAfterSlider({ before, after }: { before?: string; after?: string }) {
  const [pos, setPos] = useState(50)
  const frame = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const moveTo = (clientX: number) => {
    const box = frame.current?.getBoundingClientRect()
    if (!box) return
    setPos(Math.min(100, Math.max(0, ((clientX - box.left) / box.width) * 100)))
  }
  const down = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    moveTo(e.clientX)
  }
  const move = (e: PointerEvent<HTMLDivElement>) => dragging.current && moveTo(e.clientX)
  const up = () => (dragging.current = false)
  const key = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setPos((p) => Math.max(0, p - 5))
    if (e.key === 'ArrowRight') setPos((p) => Math.min(100, p + 5))
  }

  return (
    <div
      ref={frame}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      // pan-y keeps vertical page scroll working; horizontal drags go to the slider, not the carousel.
      className="relative h-full w-full cursor-ew-resize select-none overflow-hidden"
      style={{ touchAction: 'pan-y' }}
      data-no-swipe
    >
      <Layer src={after} kind="after" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Layer src={before} kind="before" />
      </div>

      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-extrabold tracking-[.14em] text-white" style={{ opacity: pos > 12 ? 1 : 0 }}>
        BEFORE
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-[#0b8c76]/90 px-2.5 py-1 text-[10px] font-extrabold tracking-[.14em] text-white" style={{ opacity: pos < 88 ? 1 : 0 }}>
        AFTER
      </span>

      <div className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_12px_rgba(0,0,0,.4)]" style={{ left: `${pos}%` }} />
      <div
        role="slider"
        tabIndex={0}
        aria-label="Compare before and after"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        onKeyDown={key}
        className="absolute top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-[#fbbf24] text-sm font-extrabold text-[#063b32] shadow-lg outline-none focus-visible:ring-4 focus-visible:ring-white/60"
        style={{ left: `${pos}%` }}
      >
        ⇆
      </div>
    </div>
  )
}

function Layer({ src, kind }: { src?: string; kind: 'before' | 'after' }) {
  if (src) return <img src={src} alt={kind === 'before' ? 'Before the cleanup' : 'After the cleanup'} draggable={false} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
  return kind === 'before' ? <BeforeArt /> : <AfterArt />
}

/* Lightweight illustrated placeholders (no image download) until real photos exist. */
function BeforeArt() {
  return (
    <svg viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <rect width="300" height="300" fill="#6b5a45" />
      <rect y="0" width="300" height="110" fill="#9aa3a0" />
      <rect x="20" y="40" width="70" height="70" fill="#7c8582" />
      <rect x="200" y="25" width="80" height="85" fill="#868f8c" />
      <path d="M0 110 Q150 95 300 110 V300 H0Z" fill="#5c4b38" />
      {[
        [40, 170, '#3d3d3d'], [90, 200, '#2f6fb0'], [140, 165, '#c94b3b'], [180, 215, '#e6e2d3'],
        [230, 180, '#2c2c2c'], [70, 240, '#d7b13a'], [200, 250, '#3a7d55'], [120, 230, '#ece9e0'], [260, 230, '#444'],
      ].map(([x, y, c], i) => (
        <ellipse key={i} cx={x as number} cy={y as number} rx={22 + (i % 3) * 6} ry={13 + (i % 2) * 5} fill={c as string} opacity="0.92" />
      ))}
    </svg>
  )
}
function AfterArt() {
  return (
    <svg viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <rect width="300" height="300" fill="#bfe3f2" />
      <rect x="20" y="40" width="70" height="70" fill="#d7dedc" />
      <rect x="200" y="25" width="80" height="85" fill="#e1e7e5" />
      <path d="M0 110 Q150 95 300 110 V300 H0Z" fill="#7cb46b" />
      <path d="M0 200 Q150 185 300 200 V300 H0Z" fill="#5f9e55" />
      <rect x="146" y="120" width="8" height="50" fill="#6b4a2f" />
      <circle cx="150" cy="115" r="30" fill="#2f8f5b" />
      <rect x="235" y="160" width="22" height="30" rx="3" fill="#0b8c76" />
      <rect x="232" y="155" width="28" height="6" rx="2" fill="#063b32" />
    </svg>
  )
}
