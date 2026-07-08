/**
 * Marca da loja: silhueta de telhado (com chaminé) que se funde numa linha de
 * horizonte/onda, baseada na logo oficial "Thiago Casa & Construção". Usa
 * currentColor para se adaptar ao contexto (branco na sidebar escura, tinta
 * escura no login).
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M50 8L94 46.5H84.5L50 17.5L28 36.5V22H20V43L15.5 46.5H6L50 8Z"
      />
      <path
        fill="currentColor"
        d="M4 62C16 51 32 45.5 50 45.5C68 45.5 84 51 96 62L94.5 65.5C82 55.5 66.5 50.5 50 50.5C33.5 50.5 18 55.5 5.5 65.5L4 62Z"
      />
    </svg>
  );
}
