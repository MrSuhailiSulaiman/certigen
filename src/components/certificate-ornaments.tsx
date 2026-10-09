export function CornerRibbons() {
  return (
    <>
      <svg
        className="pointer-events-none absolute top-0 left-0 h-[38%] w-[46%]"
        viewBox="0 0 220 240"
        aria-hidden
      >
        <g transform="rotate(-42 30 40)">
          <rect x="-80" y="18" width="340" height="22" fill="#7a141c" />
          <rect x="-80" y="44" width="330" height="16" fill="#e2a30b" />
          <rect x="-70" y="64" width="300" height="18" fill="#f3c533" />
          <rect x="-60" y="86" width="270" height="14" fill="#9a1c24" />
        </g>
      </svg>
      <svg
        className="pointer-events-none absolute right-0 bottom-0 h-[28%] w-[42%]"
        viewBox="0 0 240 260"
        aria-hidden
      >
        <g transform="rotate(-42 200 210)">
          <rect x="20" y="120" width="320" height="22" fill="#7a141c" />
          <rect x="34" y="146" width="300" height="16" fill="#e2a30b" />
          <rect x="50" y="166" width="270" height="18" fill="#f3c533" />
          <rect x="66" y="188" width="240" height="14" fill="#9a1c24" />
        </g>
      </svg>
    </>
  )
}

export function GoldSeal({ className }: { className?: string }) {
  const points = Array.from({ length: 20 }, (_, index) => {
    const angle = (index / 20) * Math.PI * 2 - Math.PI / 2
    const radius = index % 2 === 0 ? 48 : 40
    const x = 50 + Math.cos(angle) * radius
    const y = 50 + Math.sin(angle) * radius
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(" ")

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <radialGradient id="certificateSealGold" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#fff6d2" />
          <stop offset="42%" stopColor="#e6b422" />
          <stop offset="100%" stopColor="#9a6812" />
        </radialGradient>
      </defs>
      <polygon points={points} fill="url(#certificateSealGold)" />
      <circle cx="50" cy="50" r="27" fill="none" stroke="#fff3cc" strokeWidth="1.6" />
      <circle cx="50" cy="50" r="18" fill="none" stroke="#c89216" strokeWidth="0.8" />
      <circle cx="50" cy="50" r="5" fill="#f8e7b0" />
    </svg>
  )
}

export function EventMedallion({ year }: { year: string }) {
  return (
    <div className="relative grid size-24 place-items-center sm:size-28">
      <svg viewBox="0 0 120 120" className="absolute inset-0" aria-hidden>
        <circle cx="60" cy="60" r="56" fill="none" stroke="#e2a30b" strokeWidth="5" />
        <circle cx="60" cy="60" r="46" fill="#fffaf2" stroke="#e2a30b" strokeWidth="1.2" />
      </svg>
      <span className="relative z-10 font-serif text-2xl leading-none font-bold text-[#8d1c24] sm:text-3xl">
        {year}
      </span>
    </div>
  )
}
