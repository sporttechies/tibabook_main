const logoUrl = "logo.jpg";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <a
      className={`brand ${compact ? "brand-compact" : ""}`}
      href="/"
      aria-label="TibaBook home"
    >
      <img className="brand-mark" src={logoUrl} alt="" />
      <span className="brand-word">
        Tiba<span>Book</span>
      </span>
    </a>
  );
}
