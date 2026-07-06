export default function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center leading-none select-none ${className}`}>
      <svg viewBox="0 0 100 16" className="w-14 h-[9px]" aria-hidden>
        <path d="M2 14 L50 3 L98 14" fill="none" stroke="currentColor" strokeWidth={5} />
      </svg>
      <div className="font-extrabold tracking-tight text-[13px] mt-0.5">MIRADOR</div>
      <div className="font-extrabold tracking-tight text-[13px] -mt-[2px]">WAIKIKI</div>
      <svg viewBox="0 0 100 12" className="w-14 h-[7px] mt-[2px]" aria-hidden>
        <path d="M2 6 Q26 0 50 6 T98 6" fill="none" stroke="currentColor" strokeWidth={5} strokeLinecap="round" />
      </svg>
    </div>
  )
}
