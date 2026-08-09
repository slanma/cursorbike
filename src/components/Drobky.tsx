import { Link } from "@tanstack/react-router";

export type Drobek = { label: string; to?: string; params?: Record<string, string> };

/**
 * Drobečková navigace — jednoduchý řádek „Kola › Author › …".
 * Poslední krok je zvýrazněn (aktuální stránka), předchozí jsou odkazy.
 */
export function Drobky({ items }: { items: Drobek[] }) {
  return (
    <nav aria-label="Drobečková navigace" className="mb-2 flex flex-wrap items-center gap-1 text-sm">
      {items.map((item, i) => {
        const posledni = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden className="text-muted-foreground/60">›</span>}
            {posledni || !item.to ? (
              <span className="font-semibold text-foreground">{item.label}</span>
            ) : (
              <Link
                to={item.to}
                {...(item.params ? { params: item.params } : {})}
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
