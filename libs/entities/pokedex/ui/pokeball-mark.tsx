export function PokeballMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 64 64">
      <circle cx="32" cy="32" fill="#ffffff" r="27" stroke="#0f172a" strokeWidth="3" />
      <path d="M5 32a27 27 0 0 1 54 0Z" fill="#ef4444" stroke="#0f172a" strokeWidth="3" />
      <path d="M5 32h54" stroke="#0f172a" strokeWidth="5" />
      <circle cx="32" cy="32" fill="#ffffff" r="9" stroke="#0f172a" strokeWidth="3" />
      <circle cx="32" cy="32" fill="#e2e8f0" r="4" />
    </svg>
  );
}
